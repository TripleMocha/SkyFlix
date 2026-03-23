import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ----------------------
// Firebase config
// ----------------------
const firebaseConfig = {
  apiKey: "AIzaSyBeCgogR5-ZgaU9eD_XwzH_L5LkT0TOcPc",
  authDomain: "vnce-7b54c.firebaseapp.com",
  databaseURL: "https://vnce-7b54c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "vnce-7b54c",
  storageBucket: "vnce-7b54c.appspot.com",
  messagingSenderId: "137661927526",
  appId: "1:137661927526:web:e649aceeb57126a2945da7",
  measurementId: "G-BBRNMV2ZG0"
};

// ----------------------
// Initialize Firebase
// ----------------------
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ----------------------
// DOM elements
// ----------------------
const container = document.getElementById("myListContainer");
const toastContainer = document.getElementById("toastContainer");
const signOutBtn = document.getElementById("signOutBtn");

// ----------------------
// Toast Notification
// ----------------------
function showToast(message) {
  const toastEl = document.createElement("div");
  toastEl.className = "toast align-items-center text-white px-3 py-2";
  toastEl.innerHTML = `<div>${message}</div>`;
  toastContainer.appendChild(toastEl);

  const toast = new bootstrap.Toast(toastEl, { delay: 2500 });
  toast.show();

  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}

function normalizePosterURL(movie) {
  // Use posterURL if it is defined and starts with http
  if (movie.posterURL && movie.posterURL.startsWith("http")) {
    return movie.posterURL;
  }

  // Use poster_path from TMDB if posterURL missing
  if (movie.poster_path && movie.poster_path.length > 0) {
    return `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
  }

  // Fallback
  return "img/logo.png";
}




// ----------------------
// Load My List
// ----------------------
async function loadMyList(user) {
  container.innerHTML = `<div class="text-secondary">Loading your list...</div>`;

  const listRef = collection(db, "users", user.uid, "mylist");
  const snapshot = await getDocs(listRef);

  if (snapshot.empty) {
    container.innerHTML = `<div class="text-center text-secondary">Your list is empty.</div>`;
    return;
  }

  // Left-aligned grid, smaller cards
  container.innerHTML = "";
  container.style.display = "grid";
  container.style.gridTemplateColumns = "repeat(auto-fill, minmax(120px, 160px))";
  container.style.gap = "12px";
  container.style.margin = "0";
  container.style.justifyContent = "start"; // left-align

  const movies = await Promise.all(snapshot.docs.map(async docSnap => {
    const movie = docSnap.data();
    movie.id = docSnap.id;
    return movie;
  }));

  let delay = 0;
  movies.forEach(movie => {
    const posterURL = normalizePosterURL(movie);

    const cardWrapper = document.createElement("div");
    cardWrapper.style.opacity = "0";
    cardWrapper.style.transform = "translateY(20px)";
    cardWrapper.style.transition = "opacity 0.5s ease, transform 0.5s ease";

    cardWrapper.innerHTML = `
      <div class="movie-card position-relative" 
           style="overflow: visible; transition: transform 0.3s ease, box-shadow 0.3s ease;">
        <button class="remove-btn position-absolute top-0 end-0 mt-1 me-1 btn btn-sm btn-danger rounded-circle"
                title="Remove from My List"
                data-bs-toggle="tooltip"
                style="z-index: 10; opacity: 0; transition: opacity 0.3s ease;">
          <i class="bx bx-x"></i>
        </button>
        <img src="${posterURL}" 
             alt="${movie.title || 'Untitled'}" 
             class="img-fluid rounded" 
             style="cursor:pointer;" 
             crossorigin="anonymous" 
             onerror="this.src='img/logo.png'">
      </div>
    `;

    const card = cardWrapper.querySelector(".movie-card");
    const removeBtn = cardWrapper.querySelector(".remove-btn");

    // Hover effects
    card.addEventListener("mouseenter", () => {
      card.style.transform = "scale(1.05)";
      card.style.boxShadow = "0 4px 12px rgba(255,0,0,0.6)";
      removeBtn.style.opacity = "1";
      removeBtn.style.transform = "scale(1.05)";
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "scale(1)";
      card.style.boxShadow = "none";
      removeBtn.style.opacity = "0";
      removeBtn.style.transform = "scale(1)";
    });

    // Navigate to movie details
    cardWrapper.querySelector("img").addEventListener("click", () => {
      window.location.href = `view_movie.html?id=${encodeURIComponent(movie.id)}`;
    });

    // Remove from My List
    removeBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await deleteDoc(doc(db, "users", user.uid, "mylist", movie.id));
      cardWrapper.remove();
      showToast(`Removed "${movie.title}" from your list`);
    });

    container.appendChild(cardWrapper);

    // Fade-in
    setTimeout(() => {
      cardWrapper.style.opacity = "1";
      cardWrapper.style.transform = "translateY(0)";
    }, delay);
    delay += 100;
  });

  // Initialize Bootstrap tooltips
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.map((el) => new bootstrap.Tooltip(el));
}

// ----------------------
// Auth listener
// ----------------------
onAuthStateChanged(auth, (user) => {
  if (!user) {
    container.innerHTML = `<div class="text-center text-danger">Please sign in to view your list.</div>`;
    return;
  }
  loadMyList(user);
});

// ----------------------
// Sign Out
// ----------------------
signOutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});
