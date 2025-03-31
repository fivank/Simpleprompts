// ------------------------------
// Firebase + Global Variables
// ------------------------------
let data;
let currentCategory;
let currentPrompt;
let currentUser = null;

// REPLACE THIS CONFIG WITH YOUR ACTUAL FIREBASE CONFIG
    // Firebase configuration (paste yours here)
    const firebaseConfig = {
        apiKey: "AIzaSyB-XxxaGSWNKRxwI45SA9-MJ2Eps6Cywfw",
        authDomain: "simpleprompts.firebaseapp.com",
        projectId: "simpleprompts",
        storageBucket: "simpleprompts.firebasestorage.app",
        messagingSenderId: "19366457023",
        appId: "1:19366457023:web:a0b6fa3546833d8734600a"
        };


// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Observe auth state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    showPopup(`Signed in as ${user.displayName}`);
    document.getElementById('googleSignInButton').classList.add('hidden');
    document.getElementById('googleSignOutButton').classList.remove('hidden');
    document.getElementById('loadFromFirebaseButton').classList.remove('hidden');
    document.getElementById('saveToFirebaseButton').classList.remove('hidden');
  } else {
    currentUser = null;
    document.getElementById('googleSignInButton').classList.remove('hidden');
    document.getElementById('googleSignOutButton').classList.add('hidden');
    document.getElementById('loadFromFirebaseButton').classList.add('hidden');
    document.getElementById('saveToFirebaseButton').classList.add('hidden');
  }
});

// ------------------------------
// Google Authentication
// ------------------------------
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(() => {
      // Signed in
    })
    .catch((error) => {
      console.error('Error during Google Sign-In:', error);
      showPopup('Google Sign-In failed.');
    });
}

function signOutFromGoogle() {
  auth.signOut().then(() => {
    showPopup('Signed out successfully.');
  }).catch((error) => {
    console.error('Error during sign out:', error);
    showPopup('Sign out failed.');
  });
}

// ------------------------------
// Firebase Load/Save
// ------------------------------
async function loadFromFirebase() {
  if (!currentUser) {
    showPopup('Please sign in first.');
    return;
  }
  try {
    const docRef = db.collection('users').doc(currentUser.uid);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      data = docSnap.data().promptsData;
      if (!data) {
        showPopup('No valid data found in Firebase.');
        return;
      }
      renderCategories();
      showElement('addCategoryButton');
      showElement('saveFileButton');
      showPopup('Prompts loaded from Firebase successfully!');
    } else {
      showPopup('No data found in Firebase for this user.');
    }
  } catch (error) {
    console.error('Error loading from Firebase:', error);
    showPopup('Failed to load data from Firebase.');
  }
}

async function saveToFirebase() {
  if (!currentUser) {
    showPopup('Please sign in first.');
    return;
  }
  try {
    await db.collection('users').doc(currentUser.uid).set({
      promptsData: data
    });
    showPopup('Prompts saved to Firebase successfully!');
  } catch (error) {
    console.error('Error saving to Firebase:', error);
    showPopup('Failed to save data to Firebase.');
  }
}

// ------------------------------
// Load default data.json on page load
// ------------------------------
document.addEventListener('DOMContentLoaded', () => {
  fetch('./data.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(json => {
      data = json;
      renderCategories();
      showElement('addCategoryButton');
      showElement('saveFileButton');
      showPopup('Default prompts loaded successfully!');
    })
    .catch(error => {
      console.error('Error loading default data.json:', error);
      showPopup('Failed to load default prompts.');
    });
});

// ------------------------------
// Local File Load
// ------------------------------
function loadFile(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        data = JSON.parse(e.target.result);
        renderCategories();
        showElement('addCategoryButton');
        showElement('saveFileButton');
        showPopup('Prompts loaded successfully!');
      } catch (error) {
        console.error('Error parsing JSON:', error);
        showPopup('Error parsing JSON file');
      }
    };
    reader.readAsText(file);
  }
}

// ------------------------------
// Local File Save
// ------------------------------
function saveFile() {
  const filename = prompt('Enter filename for the prompts (e.g., prompts.json):', 'prompts.json');
  if (!filename) {
    showPopup('Save operation cancelled');
    return;
  }
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showPopup('Prompts file saved successfully!');
}

// ------------------------------
// UI Helpers
// ------------------------------
function showElement(elementId) {
  document.getElementById(elementId).classList.remove('hidden');
}

function hideElement(elementId) {
  document.getElementById(elementId).classList.add('hidden');
}

function enableElement(elementId) {
  document.getElementById(elementId).classList.remove('disabled');
}

function disableElement(elementId) {
  document.getElementById(elementId).classList.add('disabled');
}

function updateTitle(newTitle) {
  document.getElementById('pageTitle').innerText = newTitle;
}

// ------------------------------
// Rendering Categories and Prompts
// ------------------------------
function renderCategories() {
  const categoriesContainer = document.getElementById('categories');
  categoriesContainer.innerHTML = ''; // Clear previous content
  data.categories.forEach(category => {
    const categoryButton = document.createElement('div');
    categoryButton.className = 'category';
    categoryButton.innerText = category.name;
    categoryButton.onclick = () => showPrompts(category);
    categoriesContainer.appendChild(categoryButton);
  });
}

function showPrompts(category) {
  currentCategory = category;
  showElement('pageTitle');
  hideElement('categories');
  hideElement('addCategoryButton');
  hideElement('saveFileButton');
  hideElement('loadFileButton');
  showElement('prompts');
  updateTitle(category.name);

  // Check if category is empty to enable/disable delete button
  if (category.prompts.length === 0) {
    enableElement('deleteCategoryButton');
  } else {
    disableElement('deleteCategoryButton');
  }

  const promptsContainer = document.getElementById('promptsList');
  promptsContainer.innerHTML = ''; // Clear previous prompts

  category.prompts.forEach((promptData, index) => {
    const promptContainer = document.createElement('div');
    promptContainer.className = 'prompt-container';

    const promptButton = document.createElement('div');
    promptButton.className = 'prompt';
    promptButton.innerText = promptData.title;
    promptButton.title = promptData.shortExplanation;
    promptButton.onclick = () => copyToClipboard(promptData.prompt);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'prompt-buttons';

    const editButton = document.createElement('button');
    editButton.className = 'edit-button';
    editButton.innerHTML = '§';
    editButton.onclick = (e) => {
      e.stopPropagation();
      navigateToEditPrompt(promptData, index);
    };

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button-small';
    deleteButton.innerHTML = 'x';
    deleteButton.onclick = (e) => {
      e.stopPropagation();
      confirmDeletePrompt(index);
    };

    buttonsContainer.appendChild(editButton);
    buttonsContainer.appendChild(deleteButton);
    promptContainer.appendChild(promptButton);
    promptContainer.appendChild(buttonsContainer);

    promptsContainer.appendChild(promptContainer);
  });
}

// ------------------------------
// Prompt Deletion
// ------------------------------
function confirmDeletePrompt(index) {
  const confirmation = confirm("Are you sure you want to delete this prompt?");
  if (confirmation) {
    currentCategory.prompts.splice(index, 1);
    showPrompts(currentCategory); // Re-render the prompts list
    showPopup('Prompt deleted successfully!');
  }
}

// ------------------------------
// Category Deletion
// ------------------------------
function deleteCategory() {
  const index = data.categories.indexOf(currentCategory);
  if (index !== -1) {
    data.categories.splice(index, 1);
  }
  goBack();
  renderCategories();
  showPopup('Category deleted successfully!');
}

// ------------------------------
// Navigation for Add Prompt
// ------------------------------
function navigateToAddPrompt() {
  document.getElementById('currentCategoryName').innerText = currentCategory.name;
  hideElement('prompts');
  showElement('addPrompt');
  hideElement('pageTitle');
  currentPrompt = null; // Reset currentPrompt when adding a new prompt
}

function navigateToEditPrompt(promptData, index) {
  currentPrompt = index; // Store the index of the prompt being edited
  document.getElementById('newPromptName').value = promptData.title;
  document.getElementById('newPromptInfo').value = promptData.shortExplanation;
  document.getElementById('newPromptText').value = promptData.prompt;
  navigateToAddPrompt(); // Reuse the Add Prompt page for editing
}

// ------------------------------
// Save Prompt
// ------------------------------
function savePrompt() {
  const newPromptName = document.getElementById('newPromptName').value.trim();
  const newPromptInfo = document.getElementById('newPromptInfo').value.trim();
  const newPromptText = document.getElementById('newPromptText').value.trim();

  if (newPromptName === '' || newPromptText === '') {
    showPopup('Prompt name and text cannot be empty');
    return;
  }

  const promptData = {
    title: newPromptName,
    shortExplanation: newPromptInfo,
    prompt: newPromptText
  };

  if (currentPrompt === null) {
    // Add new prompt
    currentCategory.prompts.push(promptData);
  } else {
    // Update existing prompt
    currentCategory.prompts[currentPrompt] = promptData;
  }

  // Clear input fields
  document.getElementById('newPromptName').value = '';
  document.getElementById('newPromptInfo').value = '';
  document.getElementById('newPromptText').value = '';

  // Return to prompts view
  hideElement('addPrompt');
  showPrompts(currentCategory);

  showPopup(currentPrompt === null ? 'Prompt added successfully!' : 'Prompt updated successfully!');
}

// ------------------------------
// Clipboard
// ------------------------------
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showPopup('Prompt copied to clipboard!');
  }).catch(err => {
    console.error('Could not copy text: ', err);
  });
}

// ------------------------------
// Popup
// ------------------------------
function showPopup(message) {
  const popup = document.getElementById('popupMessage');
  popup.innerText = message;
  popup.classList.add('show');
  setTimeout(() => {
    popup.classList.remove('show');
  }, 1000);
}

// ------------------------------
// Go Back
// ------------------------------
function goBack() {
  showElement('pageTitle');
  showElement('categories');
  hideElement('prompts');
  hideElement('addCategory');
  hideElement('addPrompt');
  updateTitle('Categories');
  showElement('addCategoryButton');
  showElement('saveFileButton');
  showElement('loadFileButton');
}

// ------------------------------
// Add Category
// ------------------------------
function navigateToAddCategory() {
  hideElement('pageTitle');
  hideElement('categories');
  hideElement('addCategoryButton');
  hideElement('saveFileButton');
  hideElement('loadFileButton');
  showElement('addCategory');
}

function saveCategory() {
  const newCategoryName = document.getElementById('newCategoryInput').value.trim();
  if (newCategoryName === '') {
    showPopup('Category name cannot be empty');
    return;
  }

  data.categories.push({
    name: newCategoryName,
    prompts: []
  });

  renderCategories();
  goBack();
  showPopup('Category added successfully!');
}
