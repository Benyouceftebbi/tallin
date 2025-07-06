/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
const { onRequest, onCall } = require("firebase-functions/v2/https");
const { HttpsError } = require("firebase-functions/v2");
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
    deliveryType:shopifyOrder?.shipping_lines[0]?.code==="التوصيل للمكتب" ?"stopdesk":"domicile", // Default value as per shipping method
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
    createdAt: new Date(),
    updatedAt: new Date()
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
    option1: variantParts[0] ?? null,
  option2: variantParts[1] ?? null,
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

// Utility to generate a reference string
function generateReferenceFromDepots(depots) {
  if (!Array.isArray(depots) || depots.length === 0) return "";

  const allSameDepot = depots.every((d) => d.id === depots[0].id);
  let prefix = allSameDepot
    ? (depots[0].name || "DEPOT").substring(0, 5).toUpperCase()
    : "DEPOTD";

  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString().substring(9, 13);

  return `${prefix}-${randomStr}${timestamp}`;
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

    // Enrich each article with depot info
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
            if (Array.isArray(variantData.depots) && variantData.depots.length > 0) {
              article.depot = variantData.depots[0];
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch depot for variant ${article.variant_id}:`, err);
        }

        return article;
      })
    );

    order.articles = enrichedArticles;

    // 🧠 Generate order reference based on depot info in articles
    const depots = enrichedArticles
      .map((a) => a.depot)
      .filter((d) => d && d.id); // Filter valid depots

    order.orderReference = generateReferenceFromDepots(depots);

    // Save to Firestore
    await db.collection("Orders").add(orderData); // raw Shopify order
    await db.collection("orders").add(order);     // enriched internal order

    res.status(200).send("Order stored successfully");
  } catch (error) {
    logger.error("Error storing order", error);
    res.status(500).send("Internal Server Error");
  }
});
exports.landingPageOrderCreated = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
      const { orderData } = req.body
      let order=orderData
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

    // Enrich each article with depot info
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
            if (Array.isArray(variantData.depots) && variantData.depots.length > 0) {
              article.depot = variantData.depots[0];
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch depot for variant ${article.variant_id}:`, err);
        }

        return article;
      })
    );

    order.articles = enrichedArticles;

    // 🧠 Generate order reference based on depot info in articles
    const depots = enrichedArticles
      .map((a) => a.depot)
      .filter((d) => d && d.id); // Filter valid depots

    order.orderReference = generateReferenceFromDepots(depots);

    // Save to Firestore
    await db.collection("Orders").add(orderData); // raw Shopify order
    await db.collection("orders").add(order);     // enriched internal order

     return res.status(200).send({ success: true })
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
exports.onVariantQuantityChange = onDocumentUpdated(
  "Products/{productId}/variants/{variantId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    const prevQty = before.depots?.[0]?.quantity ?? 0;
    let availableQty = after.depots?.[0]?.quantity ?? 0;

    if (availableQty <= prevQty || availableQty <= 0) return;

    const variantId = event.params.variantId;
    const variantRef = event.data.after.ref;

    const ordersSnap = await db
      .collection("orders")
      .where("status", "==", "Repture")
      .get();

    const batch = db.batch();
    let totalDeducted = 0;

    for (const doc of ordersSnap.docs) {
      const order = doc.data();
      let changed = false;

      const updatedArticles = order.articles?.map((article) => {
        const articleVariantId = String(article.variant_id);

        if (
          articleVariantId === variantId &&
          article.isRepture &&
          article.quantity <= availableQty
        ) {
          availableQty -= article.quantity;
          totalDeducted += article.quantity;
          article.isRepture = false;
          changed = true;
        }

        return article;
      });

      const stillHasRepture = updatedArticles.some((a) => a.isRepture);

      if (changed && !stillHasRepture) {
        batch.update(doc.ref, {
          articles: updatedArticles,
          status: "Confirmé",
          ruptureStatus: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      if (availableQty <= 0) break; // stop if no more stock
    }

    // ✅ Deduct total used quantity from variant
    if (totalDeducted > 0) {
      const updatedDepots = [...after.depots];
      updatedDepots[0].quantity = Math.max(0, updatedDepots[0].quantity - totalDeducted);

      batch.update(variantRef, {
        depots: updatedDepots,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(
        `✅ Deducted ${totalDeducted} from variant ${variantId} after confirming orders.`
      );
    }

    await batch.commit();
  }
);


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
    const ref= await db
  .collection("orders")
  .where("trackingId", "==",tracking)
  .limit(1)
  .get();

            const shopRef =  ref.docs[0].ref;  

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
    updatedAt:new Date(),
    status:entry.status==="delivered"?"Livrés":"En livraison"
  };

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

            batch.update(shopRef, {
                shippmentTrack: [initialEntry],
                lastStatus: initialEntry.status,
                updatedAt:new Date(),
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
                  lastStatus: event.data.status,
                  updatedAt:new Date()
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
                  lastStatus: event.data.status,
                  updatedAt:new Date()
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

exports.statusUpdate2 = onRequest(async (req, res) => {
  try {
    if (req.method === "GET" && req.query.subscribe && req.query.crc_token) {
      console.log("toem", req.path.split("/").pop())
      return res.status(200).send(req.query.crc_token);
    }
   
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

    const isExchange = order.isExchange === true;
    const exchangeProducts = isExchange && Array.isArray(order.exchangeArticlesNames)
      ? order.exchangeArticlesNames.join(", ")
      : "";

    return {
      to_commune_name: order.commune,
      code_wilaya: Number(order.wilayaCode || 0),
      from_wilaya_name: "Alger",
      to_wilaya_name: order.wilayaName,
      firstname: order.name,
      familyname: " ",
      contact_phone: order.phone || 0,
      address: order.address,
      product_list: productNames,
      order_id: order.ref,
      do_insurance: false,
      declared_value: Number(totalPrice || 0),
      Length: 0,
      Width: 0,
      Height: 0,
      Weight: 0,
      freeshipping: true,
      price: Number(totalPrice || 0),
      is_stopdesk: order.deliveryType === "stopdesk",
      ...(order.deliveryType === "stopdesk" && { stopdesk_id: order.deliveryCenter }),
      has_exchange: isExchange,
      ...(isExchange && { product_to_collect: exchangeProducts })
    };
  });

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
    console.log("pro",processed);
    
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

  if (!Array.isArray(trackingIds) || trackingIds.length === 0) {
    return { error: "trackingIds must be a non-empty array." };
  }

  const trackingParam = trackingIds.join(",");

  try {
    const response = await axios.delete("https://api.yalidine.app/v1/parcels", {
      params: {
        tracking: trackingParam,
      },
      headers: {
        "X-API-ID": apiId,
        "X-API-TOKEN": apiToken,
      },
    });

    console.log("✅ Delete response:", response.data);

    return {
      message: "Parcels deleted successfully",
      result: response.data,
    };
  } catch (error) {
    console.error("❌ Error deleting parcels:", error.response?.data || error.message);
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
exports.onOrderStatusConfirmed =onDocumentUpdated("orders/{orderId}", async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
console.log(before,after);

    if (!before || !after) return;

    const wasEnAttente = before.status === "en-attente";
    const isConfirmed = after.status === "Confirmé";

    if (!wasEnAttente || !isConfirmed) {
      return;
    }

    const articles = after.articles || [];

    const batch = db.batch();

    for (const article of articles) {
      const { product_id, variant_id, quantity } = article;

      if (!product_id || !variant_id || !quantity) continue;

      const variantRef = db
        .collection("Products")
        .doc(product_id.toString())
        .collection("variants")
        .doc(variant_id.toString());

      const variantSnap = await variantRef.get();

      if (!variantSnap.exists) {
        console.warn(`Variant not found: ${product_id}/${variant_id}`);
        continue;
      }

      const variantData = variantSnap.data();
      const depots = variantData.depots || [];

      if (!Array.isArray(depots) || depots.length === 0) {
        console.warn(`No depot data for variant: ${product_id}/${variant_id}`);
        continue;
      }

      const updatedDepot = {
        ...depots[0],
      quantity: (depots[0].quantity || 0) - quantity,
      };

      const updatedDepots = [...depots];
      updatedDepots[0] = updatedDepot;

      batch.update(variantRef, { depots: updatedDepots });
    }

    await batch.commit();
    console.log("✅ Depots updated after confirmation");
  });
  exports.onOrderCreatedConfirmed = onDocumentCreated("orders/{orderId}", async (event) => {
  const order = event.data?.data();
  if (!order) return;

  // ✅ Only proceed if the order status is "Confirmé"
  if (order.status !== "Confirmé") {
    return;
  }

  const articles = order.articles || [];

  const batch = db.batch();

  for (const article of articles) {
    const { product_id, variant_id, quantity } = article;

    if (!product_id || !variant_id || !quantity) continue;

    const variantRef = db
      .collection("Products")
      .doc(product_id.toString())
      .collection("variants")
      .doc(variant_id.toString());

    const variantSnap = await variantRef.get();

    if (!variantSnap.exists) {
      console.warn(`Variant not found: ${product_id}/${variant_id}`);
      continue;
    }

    const variantData = variantSnap.data();
    const depots = variantData.depots || [];

    if (!Array.isArray(depots) || depots.length === 0) {
      console.warn(`No depot data for variant: ${product_id}/${variant_id}`);
      continue;
    }

    const updatedDepot = {
      ...depots[0],
      quantity: (depots[0].quantity || 0) - quantity, // allow going below 0
    };

    const updatedDepots = [...depots];
    updatedDepots[0] = updatedDepot;

    batch.update(variantRef, { depots: updatedDepots });
  }

  await batch.commit();
  console.log("✅ Depots updated for new confirmed order");
});
exports.onOrderStatusUnconfirmed =onDocumentUpdated("orders/{orderId}", async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (!before || !after) return;

    const wasConfirmed = before.status === "Confirmé";
    const isNowEnAttente = after.status === "en-attente";

    if (!wasConfirmed || !isNowEnAttente) {
      return;
    }

    const articles = after.articles || [];
    const batch = db.batch();

    for (const article of articles) {
      const { product_id, variant_id, quantity } = article;

      if (!product_id || !variant_id || !quantity) continue;

      const variantRef = db
        .collection("Products")
        .doc(product_id.toString())
        .collection("variants")
        .doc(variant_id.toString());

      const variantSnap = await variantRef.get();

      if (!variantSnap.exists) {
        console.warn(`Variant not found: ${product_id}/${variant_id}`);
        continue;
      }

      const variantData = variantSnap.data();
      const depots = variantData.depots || [];

      if (!Array.isArray(depots) || depots.length === 0) {
        console.warn(`No depot data for variant: ${product_id}/${variant_id}`);
        continue;
      }

      const updatedDepot = {
        ...depots[0],
        quantity: (depots[0].quantity || 0) + quantity, // ➕ Add back quantity
      };

      const updatedDepots = [...depots];
      updatedDepots[0] = updatedDepot;

      batch.update(variantRef, { depots: updatedDepots });
    }

    await batch.commit();
    console.log("✅ Depot quantities restored due to status reverting to en-attente");
  });
  function formatWooAddress(address) {
  if (!address) return undefined;

  const parts = [
    address.address_1,
    address.address_2,
    address.city,
    address.state,
    address.country
  ].filter(Boolean);

  return parts.join(', ');
}

  function convertWooOrderToCustomFormat(order) {
  const rawProvince = order.billing?.city || order.shipping?.city || "";
  const wilaya = extractWilayaFromProvince(rawProvince);
 const wilayaNumber = order.billing?.state.split("-")[1];
  const convertedOrder = {
    id: order.number?.toString() || order.id?.toString() || "",
    date: order.date_created?.split("T")[0] || "",
    name: `${order.shipping?.first_name || ""} ${order.shipping?.last_name || ""}`.trim(),
    phone: order.billing?.phone?.replace('+213', '0') || "",
    articles: [],
    wilaya: wilayaNumber || "",
    commune: order.billing?.city || "",
    deliveryType: order.shipping_lines?.[0]?.method_title?.includes("A Domicile") ? "domicile" : "stopdesk",
    deliveryCompany: "",
    deliveryCenter: "", // You can extract this from `method_title` with regex if needed
    confirmationStatus: "En attente",
    pickupPoint: "",
    status: "en-attente", // WooCommerce doesn't have financial_status directly
    deliveryPrice: order.shipping_total ? `${order.shipping_total} ${order.currency}` : undefined,
    address: formatWooAddress(order.shipping),
    additionalInfo: order.customer_note || "",
    confirmatrice: "",
    totalPrice: `${order.total} ${order.currency}`,
    source: "WooCommerce",
    statusHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Line items to articles
  for (const item of order.line_items || []) {
    const option1 = item.meta_data?.find(meta => meta.display_key === "Couleur")?.display_value || null;
    const option2 = item.meta_data?.find(meta => meta.display_key === "Pointure")?.display_value || null;

    const article = {
      woocommerceId: item.product_id,
      product_id:"9604777640214",
      product_name: item.parent_name,
      variant_id: "48776763277590",
      variant_title: `${item.parent_name} ${option1 || ""}, ${option2 || ""}`.trim(),
      variant_options: {
        option1,
        option2,
      },
      quantity: item.quantity,
      unit_price: item.price,
      product_sku: item.sku || "",
      variant_sku: item.sku || "",
    };

    convertedOrder.articles.push(article);
  }

  return convertedOrder;
}

exports.woocommerceWebhook =onRequest(async (req, res) => {
  // Accept only POST requests
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const orderData = req.body;
 let order =convertWooOrderToCustomFormat(orderData);
    // Optional: Validate payload or verify WooCommerce signature here
const enrichedArticles = await Promise.all(
  order.articles.map(async (article) => {
    try {
      const option1 = article.variant_options?.option1 || "";
      const option2 = article.variant_options?.option2 || "";

      // 1. Find the matching product
      const productSnap = await db
        .collection("Products")
        .where("woocommerceId", "==", article.woocommerceId)
        .limit(1)
        .get();

      if (productSnap.empty) return article;

      const productDoc = productSnap.docs[0];
      const productId = productDoc.id;

      let matchedVariantDoc = null;

      // 2. Try exact match: option1 == A && option2 == B
      const exactSnap = await db
        .collection("Products")
        .doc(productId)
        .collection("variants")
        .where("option1", "==", option1)
        .where("option2", "==", option2)
        .limit(1)
        .get();

      if (!exactSnap.empty) {
        matchedVariantDoc = exactSnap.docs[0];
      } else {
        // 3. Try reversed: option1 == B && option2 == A
        const reversedSnap = await db
          .collection("Products")
          .doc(productId)
          .collection("variants")
          .where("option1", "==", option2)
          .where("option2", "==", option1)
          .limit(1)
          .get();

        if (!reversedSnap.empty) {
          matchedVariantDoc = reversedSnap.docs[0];
        }
      }

      if (matchedVariantDoc) {
        const variantData = matchedVariantDoc.data();

        if (Array.isArray(variantData.depots) && variantData.depots.length > 0) {
          article.depot = variantData.depots[0];
        }

        article.product_id = productId;
        article.variant_id = matchedVariantDoc.id;
      }
    } catch (err) {
      console.warn(`⚠️ Failed to enrich article ${article.woocommerceId}:`, err);
    }

    return article;
  })
);

    order.articles = enrichedArticles;
    // Save the data in Firestore under collection "WoocommerceOrders"
    const docRef = await db.collection("orders").add(order);

    console.log(`Saved WooCommerce order with ID: ${docRef.id}`);

    return res.status(200).json({ status: "success", id: docRef.id });
  } catch (error) {
    console.error("Error saving WooCommerce order:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
});