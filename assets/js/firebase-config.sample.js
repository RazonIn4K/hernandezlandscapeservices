// Copy this file to firebase-config.js and populate with your Firebase project
// configuration. The real file stays untracked so credentials remain private.
//
// Optionally provide allowedUploaders as E.164 phone numbers (e.g. +18155551234)
// to control who sees the admin upload interface. Firebase Storage security
// rules must still enforce the same restrictions.
window.firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

window.allowedUploaders = [
  "+18155551234",
  "+13315551234"
];
