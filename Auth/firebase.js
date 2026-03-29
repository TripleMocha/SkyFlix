<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
  import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyBeCgogR5-ZgaU9eD_XwzH_L5LkT0TOcPc",
    authDomain: "vnce-7b54c.firebaseapp.com",
    projectId: "vnce-7b54c",
    storageBucket: "vnce-7b54c.firebasestorage.app",
    messagingSenderId: "137661927526",
    appId: "1:137661927526:web:5a016a3e9de198b3945da7",
    measurementId: "G-3EQTYXT8W0"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Form submit
  const registerForm = document.getElementById('registerForm');

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Stop form from refreshing page

    const username = document.getElementById('username').value.trim();
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
      // Set document with username as ID
      await setDoc(doc(db, "users", username), {
        username: username,
        email: email,
        password: password // ⚠️ NEVER save raw password in real apps
      });

      alert("User registered successfully!");
      registerForm.reset(); // Clear form
    } catch (error) {
      console.error("Error writing document: ", error);
      alert("Error: " + error.message);
    }
  });
</script>
