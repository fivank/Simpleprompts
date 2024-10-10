let data;
let currentCategory;
let currentPrompt;

// Load default data.json on page load
document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
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

function confirmDeletePrompt(index) {
    const confirmation = confirm("Are you sure you want to delete this prompt?");
    if (confirmation) {
        currentCategory.prompts.splice(index, 1);
        showPrompts(currentCategory); // Re-render the prompts list
        showPopup('Prompt deleted successfully!');
    }
}

function deleteCategory() {
    // Find the index of the current category and remove it
    const index = data.categories.indexOf(currentCategory);
    if (index !== -1) {
        data.categories.splice(index, 1);
    }

    // Go back to categories view and re-render categories
    goBack();
    renderCategories();
    showPopup('Category deleted successfully!');
}

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
        currentCategory.prompts.push(promptData); // Add new prompt
    } else {
        currentCategory.prompts[currentPrompt] = promptData; // Update existing prompt
    }

    // Clear input fields
    document.getElementById('newPromptName').value = '';
    document.getElementById('newPromptInfo').value = '';
    document.getElementById('newPromptText').value = '';

    // Hide the add/edit prompt form and show the prompts list
    hideElement('addPrompt');
    showPrompts(currentCategory);

    showPopup(currentPrompt === null ? 'Prompt added successfully!' : 'Prompt updated successfully!');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showPopup('Prompt copied to clipboard!');
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
}

function showPopup(message) {
    const popup = document.getElementById('popupMessage');
    popup.innerText = message;
    popup.classList.add('show');
    setTimeout(() => {
        popup.classList.remove('show');
    }, 1000);
}

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
