/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
const { onRequest,HttpsError,onCall } = require("firebase-functions/v2/https");
const { onDocumentCreated,onDocumentUpdated}=require("firebase-functions/v2/firestore") ;
const logger = require("firebase-functions/logger");
const { getFirestore }= require("firebase-admin/firestore");
const admin = require("firebase-admin");
const axios = require("axios");
const { PubSub } = require('@google-cloud/pubsub');
const { onMessagePublished } = require("firebase-functions/v2/pubsub");
const https = require('https');
const pubsub = new PubSub();
admin.initializeApp();
const db = getFirestore();


function extractWilayaFromProvince(province){
  if (!province) return undefined;

  const match = province.match(/\d{2}/); // Looks for the first two consecutive digits
  return match ? match[0] : undefined;
}
function convertShopifyOrderToCustomFormat(shopifyOrder) {
  const rawProvince = shopifyOrder.billing_address?.city;
  const wilaya = extractWilayaFromProvince(rawProvince);
  const convertedOrder = {
    id: shopifyOrder.order_number ? shopifyOrder.order_number.toString() : "",
    date: shopifyOrder.created_at ? shopifyOrder.created_at.split('T')[0] : "",
    name: shopifyOrder.shipping_address?.name || "",
    phone: shopifyOrder.phone ? shopifyOrder.phone.replace('+213', '0') : "",
    articles: [],
    wilaya: wilaya|| "",
    commune: shopifyOrder.shipping_address?.city || "",
    deliveryType: "home-delivery", // Default value as per shipping method
    deliveryCompany: "", // Not available in Shopify data
    deliveryCenter:"", // Not available in Shopify data
    confirmationStatus: "En attente", // Default status
    pickupPoint: "",
    status: mapFinancialStatusToOrderStatus(shopifyOrder.financial_status),
    deliveryPrice: shopifyOrder.shipping_lines && shopifyOrder.shipping_lines.length > 0 ? 
                  `${shopifyOrder.shipping_lines[0].price} ${shopifyOrder.currency}` : undefined,
    address: formatAddress(shopifyOrder.shipping_address),
    additionalInfo: shopifyOrder.note || "",
    confirmatrice: "", // Not available in Shopify data
    totalPrice: `${shopifyOrder.total_price} ${shopifyOrder.currency}`,
    source: shopifyOrder.source_name || "Shopify",
    statusHistory: [
    ],
    createdAt: new Date()
  };

  // Process line items (articles)
  if (shopifyOrder.line_items && Array.isArray(shopifyOrder.line_items)) {
    shopifyOrder.line_items.forEach(item => {
      const variantTitle = item.variant_title || "";
      const variantParts = variantTitle.split(" / ");
      
      const article = {
        product_id: item.product_id,
        product_name: item.title,
        variant_id: item.variant_id,
        variant_title: item.variant_title,
        variant_options: {
          option1: variantParts[0] || undefined,
          option2: variantParts[1] || undefined
        },
        quantity: item.quantity,
        unit_price: item.price,
        product_sku: item.sku || "",
        variant_sku: item.sku || ""
      };
      
      convertedOrder.articles.push(article);
    });
  }

  return convertedOrder;
}

function mapFinancialStatusToOrderStatus(financialStatus) {
  const statusMap = {
    'pending': 'en-attente',
    'authorized': 'confirmée',
    'partially_paid': 'en-cours',
    'paid': 'confirmée',
    'partially_refunded': 'retournée',
    'refunded': 'annulée',
    'voided': 'annulée'
  };
  
  return statusMap[financialStatus] || 'en-attente';
}

function formatAddress(address) {
  if (!address) return undefined;
  
  const addressParts = [
    address.address1,
    address.address2,
    address.city,
    address.province,
    address.country
  ].filter(Boolean);
  
  return addressParts.join(', ');
}


function formatTimestamp(isoString) {
  if (!isoString) return undefined;
  
  const date = new Date(isoString);
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

exports.shopifyOrderCreated = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const orderData = req.body;
    let order = convertShopifyOrderToCustomFormat(orderData);
    logger.info("Order received", orderData);

    const normalizedPhone = order.phone?.trim();

    // Check for duplicate orders
    const duplicateQuerySnapshot = await db.collection("orders")
      .where("phone", "==", normalizedPhone)
      .where("status", "==", "en-attente")
      .limit(1)
      .get();

    if (!duplicateQuerySnapshot.empty) {
      order.confirmationStatus = "Double";
    }

    // Fetch and enrich each article with depot data
    const enrichedArticles = await Promise.all(
      order.articles.map(async (article) => {
        try {
          const variantRef = db
            .collection("Products")
            .doc(article.product_id.toString())
            .collection("variants")
            .doc(article.variant_id.toString());

          const variantSnap = await variantRef.get();

          if (variantSnap.exists) {
            const variantData = variantSnap.data();
            if (variantData.depot) {
              article.depot = variantData.depots[0]; // Add depot info to article
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch depot for variant ${article.variant_id}:`, err);
        }

        return article;
      })
    );

    // Update order with enriched articles
    order.articles = enrichedArticles;

    // Save to Firestore
    await db.collection("Orders").add(orderData); // raw shopify order
    await db.collection("orders").add(order);     // enriched order

    res.status(200).send("Order stored successfully");
  } catch (error) {
    logger.error("Error storing order", error);
    res.status(500).send("Internal Server Error");
  }
});
exports.handleAchatInvoices = onDocumentCreated("invoices/{invoiceId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const invoice = snapshot.data();
  if (!invoice || invoice.type !== "achat") return;

  const items = invoice.items || [];
  const batch = db.batch();

  for (const item of items) {
    const { productId, variantId, quantity, depot } = item;
    const depotId= depot
    if (!productId || !variantId || !quantity || !depotId) continue;

    // References
    const variantRef = db
      .collection("Products")
      .doc(productId)
      .collection("variants")
      .doc(String(variantId));

    const variantSnap = await variantRef.get();
    if (!variantSnap.exists) continue;

    const depotRef = db.collection("depots").doc(depotId);
    const depotSnap = await depotRef.get();
    if (!depotSnap.exists) continue;

    const depotData = depotSnap.data();
    const { name: depotName, type: depotType } = depotData;

    const currentQty = variantSnap.get("inventory_quantity") || 0;
    const existingDepots = variantSnap.get("depots") || [];

    // Update depots array
    const updatedDepots = [...existingDepots];
    const depotIndex = updatedDepots.findIndex((d) => d.id === depotId);

    if (depotIndex > -1) {
      updatedDepots[depotIndex].quantity += quantity;
    } else {
      updatedDepots.push({
        id: depotId,
        name: depotName,
        type: depotType,
        quantity,
      });
    }

    batch.update(variantRef, {
      inventory_quantity: currentQty + quantity,
      depots: updatedDepots,
    });
  }

  await batch.commit();
});

exports.handleAchatInvoiceUpdate = onDocumentUpdated("invoices/{invoiceId}", async (event) => {
  const beforeSnap = event.data?.before;
  const afterSnap = event.data?.after;

  if (!beforeSnap || !afterSnap) return;

  const before = beforeSnap.data();
  const after = afterSnap.data();

  if (!before || !after || after.type !== "achat") return;

  const beforeItems = before.items || [];
  const afterItems = after.items || [];

  const batch = db.batch();

  // Helper: Convert array to map for easier comparison
  const mapByKey = (items) =>
    items.reduce((acc, item) => {
      if (item.productId && item.variantId) {
        const key = `${item.productId}_${item.variantId}`;
        acc[key] = { quantity: item.quantity || 0, depotId: item.depot };
      }
      return acc;
    }, {});

  const beforeMap = mapByKey(beforeItems);
  const afterMap = mapByKey(afterItems);

  const keys = new Set([...Object.keys(beforeMap), ...Object.keys(afterMap)]);

  for (const key of keys) {
    const [productId, variantId] = key.split("_");

    const beforeQty = beforeMap[key]?.quantity || 0;
    const afterQty = afterMap[key]?.quantity || 0;
    const diff = afterQty - beforeQty;

    if (diff === 0) continue;

    const variantRef = db
      .collection("Products")
      .doc(productId)
      .collection("variants")
      .doc(variantId);

    const variantSnap = await variantRef.get();
    if (!variantSnap.exists) continue;

    const currentQty = variantSnap.get("inventory_quantity") || 0;
    const currentDepots = variantSnap.get("depots") || [];

    // Update general inventory
    batch.update(variantRef, {
      inventory_quantity: currentQty + diff,
    });

    // --- Depot update logic ---
    const depotId = afterMap[key]?.depotId;
    if (!depotId) continue;

    const depotSnap = await db.collection("depots").doc(depotId).get();
    if (!depotSnap.exists) continue;

    const depotData = depotSnap.data();
    const updatedDepots = [...currentDepots];

    const depotIndex = updatedDepots.findIndex((d) => d.id === depotId);

    if (depotIndex !== -1) {
      updatedDepots[depotIndex].quantity =
        (updatedDepots[depotIndex].quantity || 0) + diff;
    } else {
      updatedDepots.push({
        id: depotId,
        name: depotData.name,
        type: depotData.type,
        quantity: diff,
      });
    }

    batch.update(variantRef, {
      depots: updatedDepots,
    });
  }

  await batch.commit();
});



// Status mappings moved outside function for better performance
const STATUS_MAPPINGS = {
  blue: {
    Transfert: "Your package is being transferred between centers",
    Expédié: "Your package has been shipped",
    Centre: "Your package has arrived at a distribution center",
    "Reçu à Wilaya": "Your package has arrived in your wilaya",
    "En attente du client": "Your package is ready for pickup",
    "Sorti en livraison": "Your package is out for delivery",
    Livré: "Your package has been delivered",
  },
  alert: {
    "En alerte": "There is an alert with your package",
    "Tentative échouée": "The delivery attempt was unsuccessful",
    "Échec livraison": "The delivery has failed",
  },
  return: {
    "Retour vers centre":
      "Your package is being returned to the distribution center",
    "Retourné au centre":
      "Your package has been returned to the distribution center",
    "Échange échoué": "The exchange attempt has failed",
  },
};

const STATUS_TRANSLATIONS = {
  Transfert: "transfer",
  Expédié: "shipped",
  Centre: "distribution-center",
  "Reçu à Wilaya": "arrived-at-region",
  "En attente du client": "ready-for-pickup",
  "Sorti en livraison": "out-for-delivery",
  Livré: "delivered",
  "En alerte": "alert",
  "Tentative échouée": "delivery-attempt-failed",
  "Échec livraison": "delivery-failed",
  "Retour vers centre": "returning-to-center",
  "Retourné au centre": "returned-to-center",
  "Échange échoué": "exchange-failed",
};

async function sendSMS(sms, phoneNumber, senderId, smsToken) {
  try {
    const response = await axios.get(
      "https://smspro-plus.com/playsms/index.php",
      {
        params: {
          app: "ws",
          u: senderId,
          h: smsToken,
          op: "pv",
          to: phoneNumber.toString(),
          msg: sms,
          unicode: 1,
        },
      }
    );
    logger.info("SMS sent successfully:", response.data);
    return response;
  } catch (error) {
    logger.error("Error sending SMS:", error.message);
    throw error;
  }
}

// Helper function to get Yalidine status
async function getYalidineStatus(tracking,apiId,apiToken,company) {
  const response = await axios.get(
    `https://api.${company}/v1/parcels/${tracking}`,
    {
      headers: {
        "X-API-ID": apiId,
        "X-API-TOKEN":
         apiToken,
      },
    }
  );

  return response.data.data[0];
}

// Helper function to create shipment track entry
function createShipmentTrackEntry(
  event,
  status,
  title,
  description,
  statusCode,
  isIssue = false,
  deliveryAttempts = []
) {
  return {
    title,
    description,
    date: event.occurred_at,
    location: `${status.current_center_name} ${status.current_commune_name} ${status.current_wilaya_name}`,
    status: statusCode,
    deliveryAttempts,
    ...(isIssue && { isIssue }),
    ...(status.contact_phone && { driver_phone: status.contact_phone }),
  };
}

// Helper function to update tracking documents
async function updateTrackingDocs(
  tracking,
  deliveryCompany,
  entry,
  company,
  status = null
) {
  const batch = db.batch();
  const mainRef = db.collection("Tracking").doc(tracking);
  const shopRef = db
    .collection("Shops")
    .doc(deliveryCompany)
    .collection("Tracking")
    .doc(tracking);

  // Check if the main tracking document exists
  const mainDoc = await mainRef.get();
  if (!mainDoc.exists) {
    // If it doesn't exist, create it with an empty shipmentTrack array
    batch.set(mainRef, {
      shippmentTrack: [],
      trackingId: tracking,
      deliveryCompany: company,
      lastStatus: entry.status,
    });
  }

  // Update main tracking document
  batch.update(mainRef, {
    shippmentTrack: admin.firestore.FieldValue.arrayUnion(entry),
    lastStatus: entry.status,
  });

  const shopUpdate = {
    shippmentTrack: admin.firestore.FieldValue.arrayUnion(entry),
    lastStatus: entry.status,
    ...(status !== null && { data: status }), // Conditionally add data if status is defined
    lastUpdated:new Date()
  };

  // Check if the shop tracking document exists
  const shopDoc = await shopRef.get();
  if (!shopDoc.exists) {
    // If it doesn't exist, create it with an empty shipmentTrack array
    batch.set(shopRef, {
      trackingId: tracking,
      deliveryCompany: company,
      shippmentTrack: [],
      data: status || {},
      lastStatus: entry.status,
      lastUpdated:new Date()
    });
  }

  // Update shop tracking document
  batch.update(shopRef, shopUpdate);
  await batch.commit();
}  


exports.processStatusUpdateTask = onMessagePublished(
  "statusUpdateTopic",
  async (event) => {
    const message = event.data.message;
    if (!message) {
      logger.warn("Received empty message");
      return;
    }

    const {deliveryCompany,events,companyData} = JSON.parse(Buffer.from(message.data, "base64").toString());
    logger.info(`Processing status updates for shop: ${deliveryCompany}`);

    try {
     

      for (const event of events) {
        // Check if event.data and tracking exist
        if (
          !event.data ||
          !event.data.tracking ||
          event.data.tracking === "yal-222BBB" ||
          event.data.tracking === "yal-111AAA"
        ) {
          logger.warn("Event data or tracking is undefined:", event);
          continue; //Skip this event if tracking is not defined
        }


        const apiId= companyData.apiId
        const apiToken=companyData.apiToken
        const company ='yalidine.app'
        const status = await getYalidineStatus(event.data.tracking,apiId,apiToken,company);
        const currentDate = new Date();
         const mainRef = db.collection("Tracking").doc(event.data.tracking);
           const ref= await db
  .collection("orders")
  .where("trackingId", "==", event.data.tracking)
  .limit(1)
  .get();

            const shopRef =  ref.docs[0].ref;  

        switch (event.data.status) {
          case "En préparation": {
            const initialEntry = createShipmentTrackEntry(
              event,
              status,
              "En préparation",
              "Your package is being prepared for shipping",
              "in-preparation"
            );

            const batch = db.batch();
           
            const initialData = {
              shippmentTrack: [initialEntry],
              trackingId: event.data.tracking,
              deliveryCompany: "Yalidine",
              lastStatus: initialEntry.status,
            };

            batch.set(mainRef, {
              ...initialData,
              deliveryCompany: deliveryCompany,
            });

            batch.set(shopRef, {
              ...initialData,
              data: { ...status },
              lastUpdated:new Date()
            });
            
            await batch.commit();
            console.log(`New order created for tracking: ${event.data.tracking}`);
            break;
          }
          case "Vers Wilaya": {
           
            const entry = createShipmentTrackEntry(
              event,
              status,
              event.data.status,
            "Your package is en route to your wilaya",
              "en-route-to-region"
            );
            await updateTrackingDocs(
              event.data.tracking,
              deliveryCompany,
              entry,
              "Yalidine",
              status
            );
            break;
          }

          case Object.keys(STATUS_MAPPINGS.blue).find(
            (key) => key === event.data.status
          ): {
            const entry = createShipmentTrackEntry(
              event,
              status,
              event.data.status,
              STATUS_MAPPINGS.blue[event.data.status],
              STATUS_TRANSLATIONS[event.data.status]
            );
            await updateTrackingDocs(
              event.data.tracking,
              deliveryCompany,
              entry,
              "Yalidine",
              status
            );
            break;
          }

          case Object.keys(STATUS_MAPPINGS.alert).find(
            (key) => key === event.data.status
          ): {
            
            const updateTrackingDoc = async (docRef) => {
              const doc = await docRef.get();
              const data = doc.data();
              const tracks = data?.shippmentTrack || []; // Use optional chaining
              const lastTrack = tracks[tracks.length - 1];

              if (lastTrack?.status === "delivery-failed") {
                const updatedTracks = [...tracks];
                updatedTracks[tracks.length - 1].deliveryAttempts.push({
                  date: event.occurred_at,
                  result: event.data.status,
                  notes: event.data.reason,
                });

                await docRef.update({
                  shippmentTrack: updatedTracks,
                  lastStatus: "delivery-failed",
                  lastUpdated:new Date()
                });
              } else {
                const entry = createShipmentTrackEntry(
                  event,
                  status,
                  "Failed Delivery",
                  "Unable to complete delivery",
                  "delivery-failed",
                  true,
                  [
                    {
                      date: event.occurred_at,
                      result: event.data.status,
                      notes: event.data.reason,
                    },
                  ]
                );
                await docRef.update({
                  shippmentTrack: admin.firestore.FieldValue.arrayUnion(entry),
                  lastStatus: "delivery-failed",
                  lastUpdated:new Date()
                });
              }
            };

            await Promise.all([
              updateTrackingDoc(mainRef),
              updateTrackingDoc(shopRef),
            ]);

            break;
          }

          case Object.keys(STATUS_MAPPINGS.return).find(
            (key) => key === event.data.status
          ): {
            const entry = createShipmentTrackEntry(
              event,
              status,
              event.data.status,
              STATUS_MAPPINGS.return[event.data.status],
              STATUS_TRANSLATIONS[event.data.status],
              true
            );

            await updateTrackingDocs(
              event.data.tracking,
              deliveryCompany,
              entry,
              "Yalidine",
              status
            );
            break;
          }
        }
      }
    } catch (error) {
      logger.error("Error in async webhook processing:", error);
    }
  }
);

exports.statusUpdate  = onRequest(async (req, res) => {
  try {
    if (req.method === "GET" && req.query.subscribe && req.query.crc_token) {
      console.log("toem", req.path.split("/").pop())
      return res.status(200).send(req.query.crc_token);
    }
    await fetch('https://samsarashoes.leaderscod.com/tenants/api/yalidine/webhooks?token=CZWPAmDc1U', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });
    console.log("Successfully forwarded to WordPress");
   // Extract shop name from the request path (assumes the shop name is at the end of the path)
   const deliveryCompany = req.path.split("/").pop();

   // Verify that the shop exists
   const shopDoc = await db.collection("deliveryCompanies").doc(deliveryCompany).get();
   if (!shopDoc.exists) {
     return;
   }

   // Create the task payload
   const payload = {
     deliveryCompany,
     events: req.body.events,
     companyData: shopDoc.data(),
   };

   // Publish the payload to a Pub/Sub topic.
   // Make sure you create a Pub/Sub topic named 'statusUpdateTopic' (or update the name here)
   const topicName = "statusUpdateTopic";
   const dataBuffer = Buffer.from(JSON.stringify(payload));
   await pubsub.topic(topicName).publishMessage({
     data: dataBuffer,
   });
   
   logger.info(`Task enqueued for shop: ${deliveryCompany}`);
   return res.status(200).send("Webhook received and queued for processing");
    
  } catch (error) {
    console.error("Error in webhook forwarder:", error);
    // We've already sent a response, so we don't need to send another one
  }
});
  async function processYalidineOrders(orders) {

    const processed = orders.map((order) => {


      const productNames = order.articlesNames.join(", ");
  
      const totalPrice = order.totalPrice;
  

  
      return {
        to_commune_name: order.commune,
        code_wilaya: Number(order.wilayaCode || 0),
        from_wilaya_name:'Alger',
        to_wilaya_name:order.wilayaName,
        firstname: order.name,
        familyname: order.name,
        contact_phone:order.phone || 0,
        address: order.address,
        product_list: productNames,
        order_id: order.ref,
       do_insurance:false,
       declared_value:Number(totalPrice || 0),
       Length:0,
       Width:0,
       Height:0,
       Weight:0,
       freeshipping:true,
       price: Number(totalPrice || 0),
        is_stopdesk: order.deliveryType === "stopdesk" ? true : false,
        ...(order.deliveryType === "stopdesk" && { station_code: order.deliveryCenter}),
        has_exchange:false
      };
    });
  console.log("proccess",processed);
  
    return processed;
  }
  exports.uploadYalidineOrders =onCall(async ({ data, auth }) => {

    const {
      rawOrders,
      apiKey,apiToken,
    } = data;
    try {


      // Assume these functions are defined somewhere in your code
      const decryptedKey= apiKey
      const decryptedToken=apiToken
      const processed = await processYalidineOrders(rawOrders);
      const url = 'https://api.yalidine.app/v1/parcels/';

      const payload = processed;
    
      const response = await axios.post(url, payload, {
        headers: {
          'X-API-ID': decryptedKey,
          'X-API-TOKEN': decryptedToken,
          'Content-Type': 'application/json'
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false // like PHP's curl_setopt for SSL
        })
      })
  
      const results = response.data;
      console.log(results);
      
      const failed = [];
      const confirmedOrders = [];
  
      for (const reference in results) {
        const result = results[reference];
  
        if (!result.success) {
          const failedOrder = rawOrders.find(
            (order) => order.ref === reference
          );
          if (failedOrder) failed.push(failedOrder);
        } else {
          const confirmedOrder = rawOrders.find(
            (order) => order.ref === reference
          );
          if (confirmedOrder) confirmedOrders.push({...confirmedOrder,trackingId:result.tracking,label:result.label});
        }
      }
  
      // Upload confirmed orders to Firestore
      const batch = db.batch();
      confirmedOrders.forEach((order) => {
        const docRef = db.collection("orders")
          .doc(order.id);

          batch.update(docRef, {
            status: "en-livraison",
            trackingId: order.trackingId,
            label:order.label
          });
      });
  
      await batch.commit();
  
      return {
        success: failed.length === 0,
        confirmedOrders: confirmedOrders,
      };
    } catch (error) {
      console.error("Upload error:", error.response?.data || error.message);
      throw new HttpsError(
        "internal",
        error.response?.data?.message || "An error occurred while uploading orders."
      );
    }
  });
  exports.deleteParcels = onCall(async ({ data, auth }) => {

  
    const { trackingIds, apiId, apiToken } = data;
  
    if (!apiId || !apiToken || !trackingIds) {
      return { error: "Missing apiId, apiToken, or trackingIds." };
    }
  
    const trackingParam = Array.isArray(trackingIds)
      ? trackingIds.join(",")
      : trackingIds;
  
    try {
      const response = await axios.delete("https://api.yalidine.app/v1/parcels", {
        params: {
          tracking: trackingParam,
        },
        headers: {
          'X-API-ID': apiId,
          'X-API-TOKEN': apiToken,
        },
      });
  
      return {
        message: "Parcels deleted successfully",
        result: response.data,
      };
    } catch (error) {
      console.error("Error deleting parcels:", error.response?.data || error.message);
      return {
        error: "Failed to delete parcels",
        details: error.response?.data || error.message,
      };
    }
  });
  exports.createWorkerUser =onCall(async ({data, auth}) => {
  const { email, password } = data;

  if (!email || !password) {
    throw new HttpsError("invalid-argument", "Email and password are required.");
  }

  try {
    // 1. Create Firebase Auth user
    const userRecord = await admin.auth().createUser({ email, password });

    // 2. Assign custom claim (role)
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: "worker" });
    return { uid: userRecord.uid, message: "Worker user created successfully" };
  } catch (error) {
    console.error("Error creating user:", error);
    throw new HttpsError("internal", error.message);
  }
});