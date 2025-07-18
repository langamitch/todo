const firebaseConfig = {
  apiKey: "AIzaSyAaH8a4yrRhObrHInRqC5HdVB52-hKWdLU",
  authDomain: "lucent-8cdaa.firebaseapp.com",
  projectId: "lucent-8cdaa",
  storageBucket: "lucent-8cdaa.firebasestorage.app",
  messagingSenderId: "85128436861",
  appId: "1:85128436861:web:dae41ae739b49c78c02514",
  //measurementId: "G-9N28JRSVEV"
};

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

