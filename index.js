document.addEventListener('DOMContentLoaded', () => {

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

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const ideasCollection = db.collection('ideas');

    // --- Local State Management ---
    let votedPosts = JSON.parse(localStorage.getItem('votedPosts')) || {};
    let savedPosts = JSON.parse(localStorage.getItem('savedPosts')) || [];

    // --- DOM Elements ---
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const searchBtn = document.getElementById('search-btn');
    const searchArea = document.getElementById('search-area');
    const addIdeaBtn = document.getElementById('add-idea-btn');
    const formOverlay = document.getElementById('form-overlay');
    const closeFormBtn = document.getElementById('close-form-btn');
    const postsContainer = document.getElementById('posts-container');

    const formSteps = document.querySelectorAll('.form-step');
    const nextBtns = document.querySelectorAll('.next-btn');
    const submitBtn = document.getElementById('submit-btn');

    const nameInput = document.getElementById('name-input');
    const profileLinkInput = document.getElementById('profile-link-input');
    const ideaInput = document.getElementById('idea-input');
    const greeting = document.getElementById('greeting');
    const snackbar = document.getElementById('snackbar');

    // --- Theme Management ---
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.add(`${currentTheme}-theme`);
    themeToggleBtn.querySelector('.material-symbols-outlined').textContent = currentTheme === 'light' ? 'dark_mode' : 'light_mode';

    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        document.body.classList.toggle('light-theme');
        let theme = 'light';
        if (document.body.classList.contains('dark-theme')) {
            theme = 'dark';
            themeToggleBtn.querySelector('.material-symbols-outlined').textContent = 'light_mode';
        } else {
            themeToggleBtn.querySelector('.material-symbols-outlined').textContent = 'dark_mode';
        }
        localStorage.setItem('theme', theme);
    });

    // --- Search Bar ---
    searchBtn.addEventListener('click', () => {
        searchArea.style.display = searchArea.style.display === 'block' ? 'none' : 'block';
    });

    // --- Form Logic ---
    addIdeaBtn.addEventListener('click', () => formOverlay.style.display = 'flex');
    closeFormBtn.addEventListener('click', () => formOverlay.style.display = 'none');

    let currentStep = 0;
    nextBtns.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep === 0 && nameInput.value.trim() === '') return alert('Please enter your name.');
            if (currentStep === 0) greeting.textContent = `Hi ${nameInput.value.trim()},`;
            formSteps[currentStep].classList.remove('active');
            currentStep++;
            if (formSteps[currentStep]) formSteps[currentStep].classList.add('active');
        });
    });

    submitBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        const profileLink = profileLinkInput.value.trim();
        const idea = ideaInput.value.trim();
        if (!name || !idea) return alert('Name and Idea fields are required.');

        try {
            await ideasCollection.add({
                name,
                profileLink,
                idea,
                upvotes: 0,
                downvotes: 0,
                saves: 0,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            formOverlay.style.display = 'none';
            resetForm();
        } catch (error) {
            console.error("Error adding document: ", error);
            alert('Failed to submit idea.');
        }
    });

    function resetForm() {
        formSteps[currentStep].classList.remove('active');
        currentStep = 0;
        formSteps[currentStep].classList.add('active');
        nameInput.value = '';
        profileLinkInput.value = '';
        ideaInput.value = '';
        greeting.textContent = '';
    }

    // --- Fetch and Display Posts ---
    function displayPost(doc) {
        const data = doc.data();
        const postHtml = `
            <div class="post" data-id="${doc.id}">
                <div class="post-header">
                    <strong class="username">${data.name}</strong>
                    ${data.profileLink ? `<a href="${data.profileLink}" target="_blank" class="profile-link">@profile</a>` : ''}
                </div>
                <div class="post-body">
                    <p>${data.idea}</p>
                </div>
                <div class="post-actions">
                    <button class="action-button" data-action="upvote">
                        <span class="material-symbols-outlined">thumb_up</span>
                        <span class="count">${data.upvotes || 0}</span>
                    </button>
                    <button class="action-button" data-action="downvote">
                        <span class="material-symbols-outlined">thumb_down</span>
                        <span class="count">${data.downvotes || 0}</span>
                    </button>
                    <button class="action-button" data-action="save">
                        <span class="material-symbols-outlined">bookmark</span>
                    </button>
                    <button class="action-button" data-action="share">
                        <span class="material-symbols-outlined">share</span>
                    </button>
                </div>
            </div>
        `;
        postsContainer.insertAdjacentHTML('afterbegin', postHtml);
        updatePostUI(doc.id);
    }
    
    // --- Update UI from Local State ---
    function updatePostUI(postId) {
        const postElement = document.querySelector(`.post[data-id='${postId}']`);
        if (!postElement) return;

        // Update vote status
        const voteStatus = votedPosts[postId];
        if (voteStatus === 'upvoted') {
            postElement.querySelector('[data-action="upvote"]').classList.add('active');
            postElement.querySelector('[data-action="downvote"]').classList.remove('active');
        } else if (voteStatus === 'downvoted') {
            postElement.querySelector('[data-action="downvote"]').classList.add('active');
            postElement.querySelector('[data-action="upvote"]').classList.remove('active');
        }
        
        // Update save status
        if (savedPosts.includes(postId)) {
            postElement.querySelector('[data-action="save"]').classList.add('active');
        } else {
             postElement.querySelector('[data-action="save"]').classList.remove('active');
        }
    }

    // --- Event Delegation for Post Actions ---
    postsContainer.addEventListener('click', e => {
        const button = e.target.closest('.action-button');
        if (!button) return;

        const action = button.dataset.action;
        const post = button.closest('.post');
        const postId = post.dataset.id;
        
        switch (action) {
            case 'upvote':
            case 'downvote':
                handleVote(postId, action);
                break;
            case 'save':
                handleSave(postId);
                break;
            case 'share':
                handleShare(post);
                break;
        }
    });
    
    // --- Action Handlers ---
    async function handleVote(postId, newVote) {
        const postRef = db.collection('ideas').doc(postId);
        const currentVote = votedPosts[postId];
        let voteChanges = { upvotes: 0, downvotes: 0 };
    
        if (currentVote === newVote) { // User is undoing their vote
            voteChanges[newVote + 's'] = -1;
            delete votedPosts[postId];
        } else { // New vote or changing vote
            voteChanges[newVote + 's'] = 1;
            if (currentVote) { // If there was a previous vote, undo it
                voteChanges[currentVote + 's'] = -1;
            }
            votedPosts[postId] = newVote;
        }
    
        // Update Firestore using a transaction
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(postRef);
            if (!doc.exists) throw "Document does not exist!";
            const newUpvotes = (doc.data().upvotes || 0) + voteChanges.upvotes;
            const newDownvotes = (doc.data().downvotes || 0) + voteChanges.downvotes;
            transaction.update(postRef, { upvotes: newUpvotes, downvotes: newDownvotes });
        });
    
        localStorage.setItem('votedPosts', JSON.stringify(votedPosts));
    }
    
    function handleSave(postId) {
        const button = document.querySelector(`.post[data-id='${postId}'] [data-action="save"]`);
        if (savedPosts.includes(postId)) {
            savedPosts = savedPosts.filter(id => id !== postId);
            button.classList.remove('active');
        } else {
            savedPosts.push(postId);
            button.classList.add('active');
        }
        localStorage.setItem('savedPosts', JSON.stringify(savedPosts));
    }

    async function handleShare(postElement) {
        const ideaText = postElement.querySelector('.post-body p').textContent;
        const shareData = {
            title: 'Website Idea',
            text: `Check out this website idea: "${ideaText}"`,
            url: window.location.href
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                throw new Error('Web Share API not supported');
            }
        } catch (err) {
            // Fallback: Copy link to clipboard
            navigator.clipboard.writeText(shareData.url).then(() => {
                showSnackbar('Link copied to clipboard!');
            });
        }
    }
    
    function showSnackbar(message) {
        snackbar.textContent = message;
        snackbar.className = "show";
        setTimeout(() => { snackbar.className = snackbar.className.replace("show", ""); }, 3000);
    }

    // --- Real-time Listener from Firestore ---
    ideasCollection.orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            const doc = change.doc;
            const postElement = document.querySelector(`.post[data-id='${doc.id}']`);
            if (change.type === 'added' && !postElement) {
                displayPost(doc);
            }
            if (change.type === 'modified') {
                // Update vote counts
                postElement.querySelector('[data-action="upvote"] .count').textContent = doc.data().upvotes || 0;
                postElement.querySelector('[data-action="downvote"] .count').textContent = doc.data().downvotes || 0;
                updatePostUI(doc.id); // Re-apply active states
            }
            if (change.type === 'removed' && postElement) {
                postElement.remove();
            }
        });
    });
});