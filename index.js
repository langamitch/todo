// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    updateProfile,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Your web app's Firebase configuration
// PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "...",
  appId: "1:..."
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- Helper function for button loading state ---
const toggleButtonLoading = (button, isLoading) => {
    button.disabled = isLoading;
    const buttonText = button.querySelector('.button-text');
    const loader = button.querySelector('.loader');

    if (isLoading) {
        buttonText.classList.add('hidden');
        loader.classList.remove('hidden');
    } else {
        buttonText.classList.remove('hidden');
        loader.classList.add('hidden');
    }
};


// --- Page Routing and Auth State ---
const currentPage = window.location.pathname;

onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        if (currentPage.includes('index.html') || currentPage.includes('signup.html') || currentPage === '/') {
            window.location.href = 'home.html';
        } else if (currentPage.includes('home.html')) {
            const welcomeMessage = document.getElementById('welcome-message');
            // Use a fallback name if displayName is not set
            const name = user.displayName ? user.displayName.split(' ')[0] : 'there';
            welcomeMessage.textContent = `Halo ${name}`;
        }
    } else {
        // User is signed out
        if (currentPage.includes('home.html')) {
            window.location.href = 'index.html';
        }
    }
});

// --- Signup Logic ---
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const signupButton = document.getElementById('signup-button');
        const errorMsg = document.getElementById('signup-error');
        
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        toggleButtonLoading(signupButton, true);
        errorMsg.textContent = '';

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, {
                displayName: name
            });
            // The onAuthStateChanged observer will handle the redirect
        } catch (error) {
            errorMsg.textContent = error.message;
        } finally {
            toggleButtonLoading(signupButton, false);
        }
    });
}

// --- Login Logic ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loginButton = document.getElementById('login-button');
        const errorMsg = document.getElementById('login-error');

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        toggleButtonLoading(loginButton, true);
        errorMsg.textContent = '';
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // The onAuthStateChanged observer will handle the redirect
        } catch (error) {
            errorMsg.textContent = error.message;
        } finally {
            toggleButtonLoading(loginButton, false);
        }
    });
}


// --- Logout Logic ---
const logoutButton = document.getElementById('logout-button');
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            // The onAuthStateChanged observer will handle the redirect
        } catch (error) {
            console.error('Logout Error:', error);
            alert('Failed to log out.');
        }
    });
}
