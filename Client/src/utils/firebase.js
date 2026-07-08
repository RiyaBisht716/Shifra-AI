import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider, signInWithPopup} from "firebase/auth"
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "shifraai-4da91.firebaseapp.com",
  projectId: "shifraai",
  storageBucket: "shifraai.firebasestorage.app",
  messagingSenderId: "1095099448118",
  appId: "1:1095099448118:web:6cbcb1b989228c5fc99197"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("Firebase Config Initialized:", {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 5)}...` : undefined
});


const auth = getAuth(app)
const provider = new GoogleAuthProvider()
provider.setCustomParameters({
  prompt: "select_account"
})

// Google login helper that handles popup auth
const googleLogin = () => signInWithPopup(auth, provider)

export {auth , provider, googleLogin}


