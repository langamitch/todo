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
  apiKey: "AIzaSyAaH8a4yrRhObrHInRqC5HdVB52-hKWdLU",
  authDomain: "lucent-8cdaa.firebaseapp.com",
  projectId: "lucent-8cdaa",
  storageBucket: "lucent-8cdaa.firebasestorage.app",
  messagingSenderId: "85128436861",
  appId: "1:85128436861:web:dae41ae739b49c78c02514",
  measurementId: "G-9N28JRSVEV"
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


// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); // Get a Firestore instance
const tasksCollection = db.collection('tasks'); // Reference to the 'tasks' collection


// --- 2. DOM ELEMENT SELECTION ---
const taskList = document.getElementById('task-list');
const taskInput = document.getElementById('task-input');
const addTaskButton = document.getElementById('add-task-button');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebarClose = document.getElementById('sidebar-close');
const sidebarOverlay = document.getElementById('sidebar-overlay');


// --- 3. RENDER TASKS FROM FIREBASE ---
const renderTask = (doc) => {
    const task = doc.data();
    const li = document.createElement('li');
    li.className = 'task-item';
    li.setAttribute('data-id', doc.id);

    if (task.completed) {
        li.classList.add('completed');
    }

    // Checkbox with a checkmark if completed
    const checkboxIcon = task.completed ? '<span class="material-symbols-outlined">done</span>' : '';

    li.innerHTML = `
        <div class="checkbox">${checkboxIcon}</div>
        <p>${task.text}</p>
    `;

    taskList.appendChild(li);

    // Event listener to toggle completion status
    li.addEventListener('click', () => {
        tasksCollection.doc(doc.id).update({
            completed: !task.completed
        });
    });
};

// Listen for real-time updates from Firestore
tasksCollection.orderBy('createdAt', 'desc').onSnapshot(snapshot => {
    taskList.innerHTML = ''; // Clear the list before rendering
    snapshot.docs.forEach(doc => {
        renderTask(doc);
    });
});


// --- 4. ADD NEW TASK ---
addTaskButton.addEventListener('click', () => {
    const taskText = taskInput.value.trim();
    if (taskText) {
        tasksCollection.add({
            text: taskText,
            completed: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        taskInput.value = ''; // Clear the input field
    }
});
// Allow adding tasks by pressing Enter
taskInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        addTaskButton.click();
    }
});


// --- 5. SIDEBAR LOGIC ---
const toggleSidebar = () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('open');
}

sidebarToggle.addEventListener('click', toggleSidebar);
sidebarClose.addEventListener('click', toggleSidebar);
sidebarOverlay.addEventListener('click', toggleSidebar);


}
