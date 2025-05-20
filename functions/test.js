const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
// Initialize Firebase Admin
const firebaseConfig = {
 apiKey: "AIzaSyDf8fWEqcsW4MW5xUj-jXIUiSRKib06GpQ",
  authDomain: "tullin-ecce0.firebaseapp.com",
  projectId: "tullin-ecce0",
  storageBucket: "tullin-ecce0.firebasestorage.app",
  messagingSenderId: "731579369642",
  appId: "1:731579369642:web:cb2267044a6f3d34e6e8d3"
};
admin.initializeApp(firebaseConfig);
const db = getFirestore();
const addDepotsToBackend = async ()=> {
  try {
   

    const depots = [
    {
      id: "depot1",
      name: "Dépôt A",
      location: "Zone Industrielle, Alger",
      manager: "Mohamed Ali",
      capacity: "5000 m²",
      status: "active",
      priority: "principale",
      type: "principale",
      quantity: 500,
      productId: "prod1",
      productName: "T-Shirt",
    },
    {
      id: "depot2",
      name: "Dépôt B",
      location: "Centre Ville, Oran",
      type: "principale",
      manager: "Karim Benzema",
      capacity: "2500 m²",
      status: "active",
      priority: "principale",
      quantity: 300,
      productId: "prod2",
      productName: "Jeans",
    },
    {
      id: "depot3",
      name: "Dépôt C",
      location: "Port, Annaba",
      manager: "Sofiane Feghouli",
      capacity: "3000 m²",
      status: "maintenance",
      priority: "principale",
      type: "principale",
      quantity: 400,
      productId: "prod3",
      productName: "Chemise",
    },
    {
      id: "depot4",
      name: "Dépôt A2",
      location: "Zone Industrielle, Alger",
      manager: "Ahmed Benali",
      capacity: "2000 m²",
      status: "active",
      priority: "secondaire",
      quantity: 200,
      productId: "prod1",
      productName: "T-Shirt",
    },
    {
      id: "depot5",
      name: "Dépôt B2",
      location: "Centre Ville, Oran",
      manager: "Yacine Brahimi",
      capacity: "1500 m²",
      status: "active",
      priority: "secondaire",
      quantity: 150,
      productId: "prod2",
      productName: "Jeans",
    },
    {
      id: "depot6",
      name: "Dépôt C2",
      location: "Port, Annaba",
      manager: "Riyad Mahrez",
      capacity: "1800 m²",
      status: "active",
      priority: "secondaire",
      quantity: 180,
      productId: "prod3",
      productName: "Chemise",
    },
    // Add variant-specific depots
    {
      id: "depot-var1-main",
      name: "Dépôt T-Shirt Rouge S",
      location: "Zone Industrielle, Alger",
      manager: "Ismail Bennacer",
      capacity: "500 m²",
      status: "active",
      priority: "principale",
      quantity: 30,
      productId: "var1",
      productName: "T-Shirt Rouge S",
    },
    {
      id: "depot-var1-sec",
      name: "Dépôt Secondaire T-Shirt Rouge S",
      location: "Zone Industrielle, Alger",
      manager: "Islam Slimani",
      capacity: "300 m²",
      status: "active",
      priority: "secondaire",
      quantity: 15,
      productId: "var1",
      productName: "T-Shirt Rouge S",
    },
    {
      id: "depot-var2-main",
      name: "Dépôt T-Shirt Bleu M",
      location: "Centre Ville, Oran",
      manager: "Aissa Mandi",
      capacity: "400 m²",
      status: "active",
      priority: "principale",
      quantity: 25,
      productId: "var2",
      productName: "T-Shirt Bleu M",
    },
    {
      id: "depot-var2-sec",
      name: "Dépôt Secondaire T-Shirt Bleu M",
      location: "Centre Ville, Oran",
      manager: "Youcef Atal",
      capacity: "250 m²",
      status: "active",
      priority: "secondaire",
      quantity: 10,
      productId: "var2",
      productName: "T-Shirt Bleu M",
    },
  ]

    if (!Array.isArray(depots)) {
      return ;
    }

    const batch = db.batch();

    for (const depot of depots) {
      if (!depot.id) continue;

      const depotRef = db.collection("depots").doc(depot.id);
      batch.set(depotRef, depot, { merge: true });
    }

    await batch.commit();

  
  } catch (err) {
    console.error("Error adding depots:", err);
 
}
}
addDepotsToBackend()