// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: process.env.APP_API_KEY,
    authDomain: process.env.APP_AUTH_DOMAIN,
    projectId: process.env.APP_PROJ_ID,
    storageBucket: process.env.APP_STORAGE_BUCKET,
    messagingSenderId: process.env.APP_FIREBASE_MSG_SENDER_ID,
    appId: process.env.APP_ID,
    measurementId: process.env.APP_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
import { getStorage } from "firebase/storage"
const storage = getStorage(app);