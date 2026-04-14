import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCxuXIdHcjxMflUxN5JR9VKCZdU5cUQEFo",
    authDomain: "wobble-one-crm-a.firebaseapp.com",
    projectId: "wobble-one-crm-a",
    storageBucket: "wobble-one-crm-a.firebasestorage.app",
    messagingSenderId: "543691399169",
    appId: "1:543691399169:web:83463a71d7b39972822000",
    measurementId: "G-G7TYLZTN4C"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);