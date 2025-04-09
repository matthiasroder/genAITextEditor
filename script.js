let typingTimer;
let autoSaveTimer;
const typingInterval = 1000;
const autoSaveInterval = 60000; // 1 minute

// Window and document management
const windowId = crypto.randomUUID();
let activeDocument = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', initializeApplication);

// Document model structures
function createNewDocument(name = 'Untitled') {
    return {
        id: crypto.randomUUID(),
        name: name,
        created: Date.now(),
        updated: Date.now(),
        versions: [],
        currentVersionIndex: -1,
        activeWindow: windowId
    };
}

// Document registry management
function getDocumentRegistry() {
    const registry = localStorage.getItem('textEditorDocuments') || '{}';
    return JSON.parse(registry);
}

function updateDocumentRegistry(docId, metadata) {
    const registry = getDocumentRegistry();
    registry[docId] = {...(registry[docId] || {}), ...metadata, updated: Date.now()};
    localStorage.setItem('textEditorDocuments', JSON.stringify(registry));
}

// Initialize application with document handling
function initializeApplication() {
    // Get URL parameters to see if a specific document is requested
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('doc');
    
    if (docId) {
        loadExistingDocument(docId);
    } else {
        createAndLoadNewDocument();
    }
    
    // Listen for changes from other windows
    window.addEventListener('storage', handleStorageEvent);
    
    // Initialize all event listeners
    initializeEventListeners();
}

async function handlePromptChange() {
    clearTimeout(typingTimer);

    typingTimer = setTimeout(async () => {
        const rows = document.querySelectorAll('#editorTable tbody tr:nth-child(n+3)');

        for (let row of rows) {
            const leftTextArea = row.querySelector('.leftText');
            const rightTextArea = row.querySelector('.rightText');

            if (leftTextArea && leftTextArea.value.trim()) {
                const concatenatedText = concatenateRightTextsBefore(rightTextArea);
                const transformedText = await transformTextWithOpenAI(leftTextArea.value, concatenatedText);
                rightTextArea.value = transformedText;
                adjustTextAreaHeight(rightTextArea);
            }
        }
    }, typingInterval);
}

async function transformTextWithOpenAI(inputText, concatenatedText) {
    const apiKey = document.getElementById('apiKey').value.trim();
    const prompt = document.getElementById('promptText').value.trim();
    const systemPromptRaw = document.getElementById('systemPromptText').value.trim();

    if (!apiKey) {
        console.error("API key is missing.");
        return "Error: API key is required.";
    }

    try {
        const systemPrompt = `${systemPromptRaw} INSTRUCTIONS: ${prompt} CONCATENATED TEXT: ${concatenatedText}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: inputText
                    }
                ],
                max_tokens: 500
            })
        });

        if (!response.ok) {
            console.error(`API request failed with status ${response.status}`);
            return `Error: API request failed with status ${response.status}`;
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error with OpenAI API request:', error);
        return 'Error: Could not process request.';
    }
}

function handleKeyDown(event) {
    if (event.shiftKey && event.key === 'ArrowDown') {
        event.preventDefault();
        const currentRow = event.target.closest('tr');
        addNewRow(currentRow);
    } else {
        handleInput(event);
    }
}

function addNewRow(currentRow) {
    const newRow = document.createElement('tr');

    const leftCell = document.createElement('td');
    const rightCell = document.createElement('td');

    const leftTextArea = document.createElement('textarea');
    leftTextArea.classList.add('leftText');
    leftTextArea.placeholder = "Type here...";
    leftTextArea.addEventListener('keydown', handleKeyDown);

    const rightTextArea = document.createElement('textarea');
    rightTextArea.classList.add('rightText');
    rightTextArea.placeholder = "Transformed text appears here...";
    rightTextArea.readOnly = true;

    leftCell.appendChild(leftTextArea);
    rightCell.appendChild(rightTextArea);

    newRow.appendChild(leftCell);
    newRow.appendChild(rightCell);

    currentRow.parentNode.insertBefore(newRow, currentRow.nextSibling);

    attachEventListenersToNewRows();
}

function adjustTextAreaHeight(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

document.querySelectorAll('.leftText').forEach(textarea => {
    textarea.addEventListener('keydown', handleKeyDown);
});

attachEventListenersToNewRows();

function attachEventListenersToNewRows() {
    document.querySelectorAll('.leftText').forEach(textarea => {
        textarea.removeEventListener('keydown', handleKeyDown);
        textarea.addEventListener('keydown', handleKeyDown);
    });
}

// Initialize event listeners
function initializeEventListeners() {
    // Document name change - hidden field keeps working for backwards compatibility
    document.getElementById('docName').addEventListener('change', function() {
        if (!activeDocument) return;
        
        const newName = this.value.trim() || 'Untitled';
        updateDocumentName(newName);
    });
    
    // Make document name in header editable
    const currentDocName = document.getElementById('currentDocName');
    const editIndicator = document.getElementById('editIndicator');
    
    // Show edit hint when hovering
    currentDocName.addEventListener('mouseenter', function() {
        if (activeDocument) {
            editIndicator.classList.remove('hidden');
        }
    });
    
    currentDocName.addEventListener('mouseleave', function() {
        editIndicator.classList.add('hidden');
    });
    
    // Handle editing of document name
    currentDocName.addEventListener('focus', function() {
        // Store original value in case of cancel
        this.dataset.originalValue = this.textContent;
    });
    
    currentDocName.addEventListener('blur', function() {
        if (!activeDocument) return;
        
        const newName = this.textContent.trim() || 'Untitled';
        this.textContent = newName; // Update display
        
        // Update all places where name is stored
        updateDocumentName(newName);
    });
    
    // Handle Enter key to save and escape to cancel
    currentDocName.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.blur(); // Trigger the blur handler
        } else if (e.key === 'Escape') {
            // Restore original value
            this.textContent = this.dataset.originalValue || '';
            e.preventDefault();
            this.blur();
        }
    });
    
    // Document management
    document.getElementById('newDocBtn').addEventListener('click', function() {
        const name = prompt('Enter a name for the new document:', 'Untitled');
        if (name !== null) {
            createAndLoadNewDocument(name);
        }
    });
    
    document.getElementById('openDocBtn').addEventListener('click', function() {
        showDocumentList();
    });
    
    document.getElementById('closeModalBtn').addEventListener('click', function() {
        document.getElementById('documentListModal').classList.add('hidden');
    });
    
    // Version control listeners
    document.getElementById('saveVersionBtn').addEventListener('click', saveVersion);
    
    document.getElementById('versionSelector').addEventListener('change', function() {
        const selectedIndex = parseInt(this.value);
        loadVersion(selectedIndex);
    });
    
    document.getElementById('prevVersionBtn').addEventListener('click', function() {
        if (activeDocument && activeDocument.currentVersionIndex > 0) {
            loadVersion(activeDocument.currentVersionIndex - 1);
        }
    });
    
    document.getElementById('nextVersionBtn').addEventListener('click', function() {
        if (activeDocument && 
            activeDocument.currentVersionIndex < activeDocument.versions.length - 1) {
            loadVersion(activeDocument.currentVersionIndex + 1);
        }
    });
    
    // Download functionality
    const downloadBtn = document.getElementById('downloadBtn');
    const downloadMenu = document.getElementById('downloadMenu');
    
    // Toggle download menu
    downloadBtn.addEventListener('click', function (event) {
        event.stopPropagation();
        downloadMenu.classList.toggle('hidden');
    });
    
    // Close menu when clicking elsewhere
    document.addEventListener('click', function () {
        downloadMenu.classList.add('hidden');
    });
    
    // Prevent menu from closing when clicking inside it
    downloadMenu.addEventListener('click', function (event) {
        event.stopPropagation();
    });
    
    // Prompt handling
    document.getElementById('promptText').addEventListener('input', handlePromptChange);
    
    // First-run attachments
    document.querySelectorAll('.leftText').forEach(textarea => {
        textarea.addEventListener('keydown', handleKeyDown);
    });
    
    // Feedback handling
    document.getElementById('feedbackText').addEventListener('focus', handleFeedbackFocus);
}

// Download functions for different content
function downloadText(text, filename) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    // Save version when downloading
    saveVersion();
    
    // Hide menu after download
    downloadMenu.classList.add('hidden');
}

// Function to get all left text
function concatenateLeftTextFields() {
    const leftTextElements = document.getElementsByClassName('leftText');
    let concatenatedText = '';
    
    for (let i = 0; i < leftTextElements.length; i++) {
        if (leftTextElements[i].value.trim()) {
            concatenatedText += leftTextElements[i].value + "\n\n";
        }
    }
    
    return concatenatedText;
}

// Function to combine both sides with labels
function concatenateBothTextFields() {
    const rows = document.querySelectorAll('#editorTable tbody tr:nth-child(n+6)');
    let combinedText = '';
    
    rows.forEach((row, index) => {
        const leftText = row.querySelector('.leftText')?.value;
        const rightText = row.querySelector('.rightText')?.value;
        
        if (leftText?.trim() || rightText?.trim()) {
            combinedText += '--- Paragraph ' + (index + 1) + ' ---\n';
            if (leftText?.trim()) {
                combinedText += 'Outline:\n' + leftText + '\n\n';
            }
            if (rightText?.trim()) {
                combinedText += 'Generated:\n' + rightText + '\n\n';
            }
            combinedText += '\n';
        }
    });
    
    return combinedText;
}

// Download right side (generated text)
document.getElementById('downloadRightBtn').addEventListener('click', function () {
    const filename = document.getElementById('docName').value.trim() || 'generated_text.txt';
    const text = concatenateRightTextFields();
    downloadText(text, filename);
});

// Download left side (outline)
document.getElementById('downloadLeftBtn').addEventListener('click', function () {
    const filename = document.getElementById('docName').value.trim() || 'outline_text.txt';
    const text = concatenateLeftTextFields();
    downloadText(text, filename);
});

// Download both sides with formatting
document.getElementById('downloadBothBtn').addEventListener('click', function () {
    const filename = document.getElementById('docName').value.trim() || 'complete_document.txt';
    const text = concatenateBothTextFields();
    downloadText(text, filename);
});

// Document management functions
function showDocumentList() {
    const registry = getDocumentRegistry();
    const docList = document.getElementById('documentList');
    docList.innerHTML = '';
    
    // Create document list
    const docs = Object.keys(registry).map(id => ({
        id,
        ...registry[id]
    })).sort((a, b) => b.updated - a.updated); // Sort by last updated
    
    if (docs.length === 0) {
        docList.innerHTML = '<p>No documents found. Create a new one to get started.</p>';
    } else {
        docs.forEach(doc => {
            const docElement = document.createElement('div');
            docElement.className = 'document-item';
            docElement.dataset.docId = doc.id;
            
            // Document info
            const docInfo = document.createElement('div');
            docInfo.style.flexGrow = '1';
            docInfo.innerHTML = `
                <span class="doc-name">${doc.name}</span>
                <span class="doc-date">${formatDate(doc.updated)}</span>
            `;
            docInfo.addEventListener('click', (e) => {
                // Don't process click if we're in delete confirmation mode
                if (docElement.querySelector('.confirm-delete')) return;
                
                loadExistingDocument(doc.id);
                document.getElementById('documentListModal').classList.add('hidden');
            });
            docElement.appendChild(docInfo);
            
            // Document actions
            const docActions = document.createElement('div');
            docActions.className = 'document-actions';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-doc-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent document open
                showDeleteConfirmation(docElement, doc);
            });
            
            docActions.appendChild(deleteBtn);
            docElement.appendChild(docActions);
            
            docList.appendChild(docElement);
        });
    }
    
    // Show the modal
    document.getElementById('documentListModal').classList.remove('hidden');
}

function showDeleteConfirmation(docElement, doc) {
    // Remove any existing confirmation dialogs
    document.querySelectorAll('.confirm-delete').forEach(el => el.remove());
    
    const confirmDelete = document.createElement('div');
    confirmDelete.className = 'confirm-delete';
    confirmDelete.innerHTML = `
        <span>Delete "${doc.name}"?</span>
        <button id="cancel-delete">Cancel</button>
        <button id="confirm-delete" class="delete-doc-btn">Delete</button>
    `;
    
    // Add event listeners for the confirmation buttons
    confirmDelete.querySelector('#cancel-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        confirmDelete.remove();
    });
    
    confirmDelete.querySelector('#confirm-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteDocument(doc.id);
        docElement.remove();
        confirmDelete.remove();
    });
    
    docElement.appendChild(confirmDelete);
}

function deleteDocument(docId) {
    // Remove from document registry
    const registry = getDocumentRegistry();
    delete registry[docId];
    localStorage.setItem('textEditorDocuments', JSON.stringify(registry));
    
    // Remove document data
    const storageKey = `textEditor_doc_${docId}`;
    localStorage.removeItem(storageKey);
    
    console.log(`Deleted document: ${docId}`);
    
    // If current document was deleted, create a new one
    if (activeDocument && activeDocument.id === docId) {
        createAndLoadNewDocument();
    }
}

function concatenateRightTextFields() {
    const rightTextElements = document.getElementsByClassName('rightText');
    let concatenatedText = '';

    for (let i = 0; i < rightTextElements.length; i++) {
        concatenatedText += rightTextElements[i].value + "\n";
    }

    return concatenatedText;
}

document.getElementById('feedbackText').addEventListener('focus', handleFeedbackFocus);

async function handleFeedbackFocus() {
    const concatenatedText = concatenateRightTextFields();
    const feedbackPrompt = "Read the following text and find a simple and direct question that might help the author to improve the text. Act as if you are a grade school teacher.";

    const feedbackText = await getFeedbackFromOpenAI(concatenatedText, feedbackPrompt);
    document.getElementById('feedbackText').value = feedbackText;

    adjustTextAreaHeight(document.getElementById('feedbackText'));
}

async function getFeedbackFromOpenAI(inputText, prompt) {
    const apiKey = document.getElementById('apiKey').value.trim();

    if (!apiKey) {
        console.error("API key is missing.");
        return "Error: API key is required.";
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: prompt
                    },
                    {
                        role: "user",
                        content: inputText
                    }
                ],
                max_tokens: 100
            })
        });

        if (!response.ok) {
            console.error(`API request failed with status ${response.status}`);
            return `Error: API request failed with status ${response.status}`;
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error with OpenAI API request:', error);
        return 'Error: Could not process request.';
    }
}

async function handleInput(event) {
    const leftText = event.target;
    const rightText = leftText.parentElement.nextElementSibling.querySelector('.rightText');

    clearTimeout(typingTimer);
    clearTimeout(autoSaveTimer);

    typingTimer = setTimeout(async () => {
        const concatenatedText = concatenateRightTextsBefore(rightText);
        const transformedText = await transformTextWithOpenAI(leftText.value, concatenatedText);
        rightText.value = transformedText;
        adjustTextAreaHeight(rightText);
        
        // Set auto-save timer after content changes
        autoSaveTimer = setTimeout(() => {
            if (!activeDocument) return;
            
            const autoVersion = captureCurrentState();
            autoVersion.isAutoSave = true;
            autoVersion.editorWindow = windowId;
            
            // If we're already at the latest version, add a new one
            if (activeDocument.currentVersionIndex === activeDocument.versions.length - 1) {
                activeDocument.versions.push(autoVersion);
                activeDocument.currentVersionIndex = activeDocument.versions.length - 1;
                activeDocument.updated = Date.now();
                trimAutoSaves();
                saveDocumentToStorage();
                updateDocumentRegistry(activeDocument.id, {
                    updated: activeDocument.updated,
                    versionCount: activeDocument.versions.length
                });
                updateVersionSelector();
            }
        }, autoSaveInterval);
    }, typingInterval);
}

function concatenateRightTextsBefore(currentRightTextArea) {
    const rightTextAreas = document.querySelectorAll('.rightText');
    let concatenatedText = '';

    for (let i = 0; i < rightTextAreas.length; i++) {
        if (rightTextAreas[i] === currentRightTextArea) break;
        concatenatedText += rightTextAreas[i].value + "\n";
    }

    return concatenatedText.trim();
}

// Helper functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

function resetEditor() {
    // Clear prompt settings to defaults
    document.getElementById('systemPromptText').value = "You are an editor. You help the user write a text. Based on the user input, write the next paragraph as a continuation of the CONCATENATED TEXT. Follow the INSTRUCTIONS in doing so. Output only the paragraph.";
    document.getElementById('promptText').value = "Don't be Shakespeare! Don't sound like ChatGPT.";
    
    // Clear existing rows except for the first 5 rows (header rows)
    const tbody = document.querySelector('#editorTable tbody');
    while (tbody.children.length > 5) {
        tbody.removeChild(tbody.lastChild);
    }
    
    // Make sure we have at least one empty content row
    const hasContentRow = document.querySelector('#editorTable tbody tr:nth-child(6)');
    if (!hasContentRow) {
        const lastHeaderRow = document.querySelector('#editorTable tbody tr:nth-child(5)');
        addNewRow(lastHeaderRow);
    } else {
        // Clear the first content row
        const firstRow = document.querySelector('#editorTable tbody tr:nth-child(6)');
        if (firstRow) {
            const leftText = firstRow.querySelector('.leftText');
            const rightText = firstRow.querySelector('.rightText');
            if (leftText) leftText.value = '';
            if (rightText) rightText.value = '';
        }
    }
    
    document.getElementById('versionInfo').textContent = '';
    
    // Clear feedback
    document.getElementById('feedbackText').value = '';
    
    // Adjust textarea heights with a slight delay to ensure rendering
    setTimeout(() => {
        document.querySelectorAll('textarea').forEach(adjustTextAreaHeight);
    }, 10);
}

// Handle external changes from other windows
function handleStorageEvent(event) {
    if (!activeDocument) return;
    
    // Check if the change is for our current document
    const docStorageKey = `textEditor_doc_${activeDocument.id}`;
    if (event.key === docStorageKey) {
        // Another window has modified our document
        const newData = JSON.parse(event.newValue);
        const lastVersion = newData.versions[newData.versions.length - 1];
        
        // Only react if the change was from a different window
        if (lastVersion && lastVersion.editorWindow !== windowId) {
            showExternalChangeNotification();
        }
    } else if (event.key === 'textEditorDocuments') {
        // Document registry was updated, could be a name change
        const registry = JSON.parse(event.newValue);
        if (activeDocument && registry[activeDocument.id]) {
            // Update document name if it changed
            const newName = registry[activeDocument.id].name;
            if (newName !== activeDocument.name) {
                activeDocument.name = newName;
                document.getElementById('docName').value = newName;
                document.getElementById('currentDocName').textContent = newName;
            }
        }
    }
}

function showExternalChangeNotification() {
    const notification = document.createElement('div');
    notification.className = 'external-change-notification';
    notification.innerHTML = `
        <p>This document was modified in another window.</p>
        <button id="reload-changes">Load Changes</button>
        <button id="keep-current">Keep My Version</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Load the changes
    document.getElementById('reload-changes').addEventListener('click', () => {
        loadExistingDocument(activeDocument.id);
        notification.remove();
    });
    
    // Keep the current version and force-save it
    document.getElementById('keep-current').addEventListener('click', () => {
        saveVersion();
        notification.remove();
    });
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.remove();
        }
    }, 10000);
}

function captureCurrentState() {
    const paragraphs = [];
    const rows = document.querySelectorAll('#editorTable tbody tr');
    
    // Start from the sixth row which contains the first paragraph
    for (let i = 5; i < rows.length; i++) {
        const leftText = rows[i].querySelector('.leftText')?.value || '';
        const rightText = rows[i].querySelector('.rightText')?.value || '';
        if (leftText || rightText) {
            paragraphs.push({ input: leftText, output: rightText, id: generateId() });
        }
    }
    
    return {
        timestamp: Date.now(),
        paragraphs: paragraphs,
        promptSettings: {
            systemPrompt: document.getElementById('systemPromptText').value,
            instructions: document.getElementById('promptText').value
        }
    };
}

function saveVersion() {
    if (!activeDocument) return;
    
    const currentVersion = captureCurrentState();
    currentVersion.timestamp = Date.now();
    currentVersion.editorWindow = windowId;
    
    // If we're not at the latest version, remove versions after current index
    if (activeDocument.currentVersionIndex < activeDocument.versions.length - 1) {
        activeDocument.versions = activeDocument.versions.slice(0, activeDocument.currentVersionIndex + 1);
    }
    
    // Add new version
    activeDocument.versions.push(currentVersion);
    activeDocument.currentVersionIndex = activeDocument.versions.length - 1;
    activeDocument.updated = Date.now();
    
    // Save to localStorage
    saveDocumentToStorage();
    updateVersionSelector();
    
    // Update document registry
    updateDocumentRegistry(activeDocument.id, {
        name: activeDocument.name,
        updated: activeDocument.updated,
        versionCount: activeDocument.versions.length
    });
    
    // Show confirmation
    const versionInfo = document.getElementById('versionInfo');
    versionInfo.textContent = `Saved at ${formatDate(currentVersion.timestamp)}`;
    setTimeout(() => {
        versionInfo.textContent = formatDate(currentVersion.timestamp);
    }, 2000);
}

function saveDocumentToStorage() {
    if (!activeDocument) return;
    
    const storageKey = `textEditor_doc_${activeDocument.id}`;
    localStorage.setItem(storageKey, JSON.stringify({
        versions: activeDocument.versions,
        currentVersionIndex: activeDocument.currentVersionIndex
    }));
}

function updateDocumentName(newName) {
    if (!activeDocument) return;
    
    activeDocument.name = newName;
    
    // Update document registry
    updateDocumentRegistry(activeDocument.id, {
        name: newName
    });
    
    // Update UI in all places
    document.getElementById('docName').value = newName;
    document.getElementById('currentDocName').textContent = newName;
}

function createAndLoadNewDocument(name = 'Untitled') {
    const doc = createNewDocument(name);
    activeDocument = doc;
    
    // Update registry with new document
    updateDocumentRegistry(doc.id, {
        name: doc.name,
        created: doc.created,
        updated: doc.updated,
        versionCount: 0
    });
    
    // Update URL to include document ID
    window.history.pushState({}, '', `?doc=${doc.id}`);
    
    // Clear editor and initialize with empty state
    resetEditor();
    document.getElementById('docName').value = doc.name;
    document.getElementById('currentDocName').textContent = doc.name;
    updateVersionSelector();
    
    // Create an initial version
    saveVersion();
}

function loadExistingDocument(docId) {
    const registry = getDocumentRegistry();
    if (!registry[docId]) {
        // Handle not found case
        alert('Document not found');
        createAndLoadNewDocument();
        return;
    }
    
    const storageKey = `textEditor_doc_${docId}`;
    const docData = localStorage.getItem(storageKey);
    if (!docData) {
        alert('Document data corrupted');
        createAndLoadNewDocument();
        return;
    }
    
    const parsed = JSON.parse(docData);
    activeDocument = {
        id: docId,
        name: registry[docId].name,
        created: registry[docId].created,
        updated: registry[docId].updated,
        versions: parsed.versions || [],
        currentVersionIndex: parsed.currentVersionIndex || -1,
        activeWindow: windowId
    };
    
    // Update document name in UI first
    document.getElementById('docName').value = activeDocument.name;
    document.getElementById('currentDocName').textContent = activeDocument.name;
    
    // Update URL to include document ID
    window.history.pushState({}, '', `?doc=${docId}`);
    
    // Update version selector
    updateVersionSelector();
    
    // Ensure there's a valid version index
    if (activeDocument.currentVersionIndex < 0 && activeDocument.versions.length > 0) {
        activeDocument.currentVersionIndex = activeDocument.versions.length - 1;
    }
    
    // Load latest version if available
    if (activeDocument.versions.length > 0) {
        loadVersion(activeDocument.currentVersionIndex);
    } else {
        resetEditor();
    }
    
    console.log(`Loaded document: ${activeDocument.name} with ${activeDocument.versions.length} versions`);
}

function updateVersionSelector() {
    const selector = document.getElementById('versionSelector');
    selector.innerHTML = '';
    
    if (!activeDocument || !activeDocument.versions) return;
    
    activeDocument.versions.forEach((version, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `Version ${index + 1} - ${formatDate(version.timestamp)}`;
        if (index === activeDocument.currentVersionIndex) {
            option.selected = true;
        }
        selector.appendChild(option);
    });
}

function loadVersion(index) {
    if (!activeDocument || index < 0 || index >= activeDocument.versions.length) return;
    
    const version = activeDocument.versions[index];
    
    // Save current state as an auto-save if we're moving away from latest version
    if (activeDocument.currentVersionIndex === activeDocument.versions.length - 1 && 
        index !== activeDocument.currentVersionIndex) {
        const autoVersion = captureCurrentState();
        autoVersion.isAutoSave = true;
        autoVersion.timestamp = Date.now();
        autoVersion.editorWindow = windowId;
        activeDocument.versions.push(autoVersion);
        saveDocumentToStorage();
        updateVersionSelector();
    }
    
    // Load prompt settings
    document.getElementById('systemPromptText').value = version.promptSettings.systemPrompt;
    document.getElementById('promptText').value = version.promptSettings.instructions;
    
    // Clear existing rows except for the first 5 rows (header rows)
    const tbody = document.querySelector('#editorTable tbody');
    while (tbody.children.length > 5) {
        tbody.removeChild(tbody.lastChild);
    }
    
    // Recreate paragraphs
    version.paragraphs.forEach((para, idx) => {
        if (idx === 0) {
            // First paragraph goes in existing row
            const row = document.querySelector('#editorTable tbody tr:nth-child(6)');
            if (row) {
                row.querySelector('.leftText').value = para.input;
                row.querySelector('.rightText').value = para.output;
            } else {
                // Create first row if it doesn't exist
                const newRow = document.createElement('tr');
                const leftCell = document.createElement('td');
                const rightCell = document.createElement('td');
                
                const leftTextArea = document.createElement('textarea');
                leftTextArea.classList.add('leftText');
                leftTextArea.placeholder = "Type here...";
                leftTextArea.value = para.input;
                leftTextArea.addEventListener('keydown', handleKeyDown);
                
                const rightTextArea = document.createElement('textarea');
                rightTextArea.classList.add('rightText');
                rightTextArea.placeholder = "Transformed text appears here...";
                rightTextArea.readOnly = true;
                rightTextArea.value = para.output;
                
                leftCell.appendChild(leftTextArea);
                rightCell.appendChild(rightTextArea);
                
                newRow.appendChild(leftCell);
                newRow.appendChild(rightCell);
                
                tbody.appendChild(newRow);
            }
        } else {
            // Add new rows for additional paragraphs
            const lastRow = tbody.lastChild;
            addNewRow(lastRow);
            const newRow = tbody.lastChild;
            newRow.querySelector('.leftText').value = para.input;
            newRow.querySelector('.rightText').value = para.output;
        }
    });
    
    // If no paragraphs were loaded, make sure we have at least one empty row
    if (version.paragraphs.length === 0) {
        const hasContentRow = document.querySelector('#editorTable tbody tr:nth-child(6)');
        if (!hasContentRow) {
            const lastHeaderRow = document.querySelector('#editorTable tbody tr:nth-child(5)');
            addNewRow(lastHeaderRow);
        }
    }
    
    // Update UI
    document.getElementById('versionInfo').textContent = formatDate(version.timestamp);
    activeDocument.currentVersionIndex = index;
    updateVersionSelector();
    
    // Adjust heights of all textareas - need to do this with a slight delay to ensure rendering completes
    setTimeout(() => {
        document.querySelectorAll('textarea').forEach(adjustTextAreaHeight);
    }, 10);
}

function trimAutoSaves() {
    if (!activeDocument || !activeDocument.versions) return;
    
    // Keep only the last 5 auto-saves to prevent too much storage usage
    const autoSaves = activeDocument.versions.filter(v => v.isAutoSave);
    if (autoSaves.length > 5) {
        const toRemove = autoSaves.length - 5;
        for (let i = 0; i < activeDocument.versions.length && toRemove > 0; i++) {
            if (activeDocument.versions[i].isAutoSave) {
                activeDocument.versions.splice(i, 1);
                i--;
                toRemove--;
                
                // Adjust current version index if needed
                if (i < activeDocument.currentVersionIndex) {
                    activeDocument.currentVersionIndex--;
                }
            }
        }
    }
}
