import { initializeApp } from "firebase/app";
import { initializeAuth,browserLocalPersistence, signInWithEmailAndPassword } from "firebase/auth";
import {getFirestore} from 'firebase/firestore'
import { getStorage } from "firebase/storage";
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
const firebaseConfig = {
    apiKey: "AIzaSyDf8fWEqcsW4MW5xUj-jXIUiSRKib06GpQ",
    authDomain: "tullin-ecce0.firebaseapp.com",
    projectId: "tullin-ecce0",
    storageBucket: "tullin-ecce0.firebasestorage.app",
    messagingSenderId: "731579369642",
    appId: "1:731579369642:web:cb2267044a6f3d34e6e8d3"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app,{ persistence: [browserLocalPersistence,browserLocalPersistence]});

const db = getFirestore(app)
const storage = getStorage(app);
const functions = getFunctions(app);
// connectFunctionsEmulator(functions, "127.0.0.1", 5001);
export {db , storage,functions}
export default app 