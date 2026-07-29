import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCwVG_naFG3yjP6HlgYUE8g4J4IpBnA3as",
  authDomain: "style-vault-c9d6e.firebaseapp.com",
  projectId: "style-vault-c9d6e",
  storageBucket: "style-vault-c9d6e.firebasestorage.app",
  messagingSenderId: "523467283109",
  appId: "1:523467283109:web:7d2c105f3e4aaa09c40b4c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();