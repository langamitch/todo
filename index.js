// --- Firebase Configuration ---
// IMPORTANT: Replace with your actual Firebase project configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAvYU7SzoI_go75sMBW0_U-97x7zs8hmNI",
  authDomain: "todo-5a927.firebaseapp.com",
  projectId: "todo-5a927",
  storageBucket: "todo-5a927.firebasestorage.app",
  messagingSenderId: "774197916057",
  appId: "1:774197916057:web:be838f41ee1f4f515ae308",
  measurementId: "G-CTCKVYFVH4"
};

// --- Initialize Firebase ---
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- DOM Elements ---
const authOverlay = document.getElementById('auth-overlay');
const loginView = document.getElementById('login-view');
const signupView = document.getElementById('signup-view');
const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

const calendarContainer = document.getElementById('calendar-container');
const monthYearEl = document.getElementById('month-year');
const calendarEl = document.getElementById('calendar');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

const taskOverlay = document.getElementById('task-overlay');
const closeTaskOverlayBtn = taskOverlay.querySelector('.close-overlay-btn');
const selectedDateEl = document.getElementById('selected-date');
const taskListEl = document.getElementById('task-list');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');

// --- State ---
let currentDate = new Date();
let currentUser = null;
let selectedDay = null;

// --- Authentication ---
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        authOverlay.classList.remove('active');
        calendarContainer.style.display = 'block';
        renderCalendar();
    } else {
        currentUser = null;
        authOverlay.classList.add('active');
        calendarContainer.style.display = 'none';
        taskOverlay.classList.remove('active');
    }
});

showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginView.style.display = 'none';
    signupView.style.display = 'block';
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    signupView.style.display = 'none';
    loginView.style.display = 'block';
});

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    auth.createUserWithEmailAndPassword(email, password)
        .catch(error => {
            alert(error.message);
        });
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            alert(error.message);
        });
});


// --- Calendar Logic ---
const renderCalendar = () => {
    calendarEl.innerHTML = '';
    const date = new Date(currentDate);
    date.setDate(1);
    const firstDayIndex = date.getDay();
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const prevLastDay = new Date(date.getFullYear(), date.getMonth(), 0).getDate();

    monthYearEl.innerText = ${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()};

    // Previous month's days
    for (let i = firstDayIndex; i > 0; i--) {
        const dayEl = document.createElement('div');
        dayEl.classList.add('day', 'empty');
        dayEl.innerHTML = <div class="date-num">${prevLastDay - i + 1}</div>;
        calendarEl.appendChild(dayEl);
    }

    // Current month's days
    for (let i = 1; i <= lastDay; i++) {
        const dayEl = document.createElement('div');
        dayEl.classList.add('day');
        dayEl.innerHTML = <div class="date-num">${i}</div><div class="tasks-on-day"></div>;

        const today = new Date();
        if (i === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
            dayEl.classList.add('today');
        }

        dayEl.addEventListener('click', () => openTaskOverlay(i, date.getMonth(), date.getFullYear()));
        calendarEl.appendChild(dayEl);
    }
     fetchAndDisplayTasksForMonth(date.getFullYear(), date.getMonth());
};

prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});


// --- Task Logic ---
const openTaskOverlay = (day, month, year) => {
    selectedDay = new Date(year, month, day);
    selectedDateEl.innerText = selectedDay.toDateString();
    taskOverlay.classList.add('active');
    fetchTasksForDay();
};

closeTaskOverlayBtn.addEventListener('click', () => {
    taskOverlay.classList.remove('active');
    selectedDay = null;
});

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskText = taskInput.value.trim();
    if (taskText && selectedDay && currentUser) {
        db.collection('users').doc(currentUser.uid).collection('tasks').add({
            text: taskText,
            date: firebase.firestore.Timestamp.fromDate(selectedDay),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            taskInput.value = '';
            fetchTasksForDay();
            renderCalendar(); // To update task indicators
        }).catch(error => console.error("Error adding task: ", error));
    }
});

const fetchTasksForDay = () => {
    taskListEl.innerHTML = 'Loading...';
    if (!currentUser || !selectedDay) return;

    const startOfDay = new Date(selectedDay);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDay);
    endOfDay.setHours(23, 59, 59, 999);

    db.collection('users').doc(currentUser.uid).collection('tasks')
      .where('date', '>=', startOfDay)
      .where('date', '<=', endOfDay)
      .orderBy('date', 'desc')
      .get()
      .then(snapshot => {
          taskListEl.innerHTML = '';
          if (snapshot.empty) {
              taskListEl.innerHTML = '<p>No tasks for this day.</p>';
              return;
          }
          snapshot.forEach(doc => {
              const task = doc.data();
              const taskItem = document.createElement('div');
              taskItem.classList.add('task-item');
              taskItem.innerHTML = <span>${task.text}</span><button class="delete-task-btn" data-id="${doc.id}">&times;</button>;
              taskListEl.appendChild(taskItem);
          });
      }).catch(error => console.error("Error fetching tasks: ", error));
};

// Add event listener for deleting tasks
taskListEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-task-btn')) {
        const taskId = e.target.dataset.id;
        if (confirm("Are you sure you want to delete this task?")) {
            db.collection('users').doc(currentUser.uid).collection('tasks').doc(taskId).delete()
            .then(() => {
                fetchTasksForDay();
                renderCalendar();
            })
            .catch(error => console.error("Error deleting task:", error));
        }
    }
});

const fetchAndDisplayTasksForMonth = (year, month) => {
    if (!currentUser) return;

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    db.collection('users').doc(currentUser.uid).collection('tasks')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .get()
        .then(snapshot => {
            const taskCounts = {}; // { 'YYYY-MM-DD': count }
            snapshot.forEach(doc => {
                 const taskDate = doc.data().date.toDate();
                 const dateString = ${taskDate.getFullYear()}-${taskDate.getMonth() + 1}-${taskDate.getDate()};
                 taskCounts[dateString] = (taskCounts[dateString] || 0) + 1;
            });
            updateCalendarTaskIndicators(taskCounts);
        });
}

const updateCalendarTaskIndicators = (taskCounts) => {
    const dayElements = document.querySelectorAll('.day:not(.empty)');
    dayElements.forEach(dayEl => {
        const day = parseInt(dayEl.querySelector('.date-num').innerText);
        const dateString = ${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${day};
        const taskIndicator = dayEl.querySelector('.tasks-on-day');
        if (taskCounts[dateString]) {
            taskIndicator.innerText = ${taskCounts[dateString]} task(s);
        } else {
            taskIndicator.innerText = '';
        }
    });
};


// --- Initial Load ---
// Let the auth state change handle the initial render
