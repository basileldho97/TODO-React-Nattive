import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDS8sLbycYK7Q0RJRRVFUQkLe45cZnVdUk",
    authDomain: "todoapp-4e02d.firebaseapp.com",
    projectId: "todoapp-4e02d",
    storageBucket: "todoapp-4e02d.firebasestorage.app",
    messagingSenderId: "911205839362",
    appId: "1:911205839362:web:eac165b5cfb2c8ba306d1b"
  };

// Initialize Firebase
let app;
if (initializeApp.length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = initializeApp(firebaseConfig);
}

// Initialize Firebase Authentication and Firestore
export const auth = getAuth(app);
export const firestore = getFirestore(app);