import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// HINWEIS: Fügen Sie hier Ihre Firebase-Konfiguration ein.
// Sie finden diese in Ihrer Firebase-Projektkonsole unter Projekteinstellungen.
const firebaseConfig = {
  apiKey: "AIzaSyCiTMUjy-sYH30YLBk42wwzthEuHUvlx4o",
  authDomain: "songwriter-bed4a.firebaseapp.com",
  projectId: "songwriter-bed4a",
  storageBucket: "songwriter-bed4a.firebasestorage.app",
  messagingSenderId: "514102734071",
  appId: "1:514102734071:web:10f81baaa6609a25d437f2",
  measurementId: "G-MT4WYCYBX5"
};

// Firebase-Initialisierung
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exportieren der Instanzen zur Verwendung in der gesamten App
export { app, auth, db };
