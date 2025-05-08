// firebase.js – Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBGlEpEF7421lbRm3YnxmPwoFWWW0ECbl4",
    authDomain: "cateringreservation2.firebaseapp.com",
    projectId: "cateringreservation2",
    storageBucket: "cateringreservation2.appspot.com",  // corrected domain
    messagingSenderId: "693667322874",
    appId: "1:693667322874:web:fe4b8db3a4ccbd0d6e2243"
  };
  firebase.initializeApp(firebaseConfig);
  
  // Firebase services
  const auth = firebase.auth();
  const db   = firebase.firestore();
  const storage = firebase.storage();
  