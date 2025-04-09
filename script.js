let typingTimer;
let autoSaveTimer;
const typingInterval = 1000;
const autoSaveInterval = 60000; // 1 minute

// Initialize version control
let textHistory = [];
let currentVersionIndex = -1;

// Load saved versions if available
document.addEventListener('DOMContentLoaded', loadVersions);

document.getElementById('promptText').addEventListener('input', handlePromptChange);

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

// Version control event listeners
document.getElementById('saveVersionBtn').addEventListener('click', saveVersion);

document.getElementById('versionSelector').addEventListener('change', function() {
    const selectedIndex = parseInt(this.value);
    loadVersion(selectedIndex);
});

document.getElementById('prevVersionBtn').addEventListener('click', function() {
    if (currentVersionIndex > 0) {
        loadVersion(currentVersionIndex - 1);
    }
});

document.getElementById('nextVersionBtn').addEventListener('click', function() {
    if (currentVersionIndex < textHistory.length - 1) {
        loadVersion(currentVersionIndex + 1);
    }
});

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
            const autoVersion = captureCurrentState();
            autoVersion.isAutoSave = true;
            
            // If we're already at the latest version, just update it
            if (currentVersionIndex === textHistory.length - 1) {
                textHistory.push(autoVersion);
                currentVersionIndex = textHistory.length - 1;
                trimAutoSaves();
                localStorage.setItem('textEditorHistory', JSON.stringify(textHistory));
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

// Version control functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
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
    const currentVersion = captureCurrentState();
    
    // If auto-saved versions exist at the end, remove them
    if (currentVersionIndex >= 0 && currentVersionIndex < textHistory.length - 1) {
        textHistory = textHistory.slice(0, currentVersionIndex + 1);
    }
    
    textHistory.push(currentVersion);
    currentVersionIndex = textHistory.length - 1;
    
    localStorage.setItem('textEditorHistory', JSON.stringify(textHistory));
    updateVersionSelector();
    
    // Show confirmation
    const versionInfo = document.getElementById('versionInfo');
    versionInfo.textContent = `Saved at ${formatDate(currentVersion.timestamp)}`;
    setTimeout(() => {
        versionInfo.textContent = formatDate(currentVersion.timestamp);
    }, 2000);
}

function loadVersions() {
    const saved = localStorage.getItem('textEditorHistory');
    if (saved) {
        textHistory = JSON.parse(saved);
        currentVersionIndex = textHistory.length - 1;
        updateVersionSelector();
        if (currentVersionIndex >= 0) {
            document.getElementById('versionInfo').textContent = formatDate(textHistory[currentVersionIndex].timestamp);
        }
    }
}

function updateVersionSelector() {
    const selector = document.getElementById('versionSelector');
    selector.innerHTML = '';
    
    textHistory.forEach((version, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `Version ${index + 1} - ${formatDate(version.timestamp)}`;
        if (index === currentVersionIndex) {
            option.selected = true;
        }
        selector.appendChild(option);
    });
}

function loadVersion(index) {
    if (index < 0 || index >= textHistory.length) return;
    
    const version = textHistory[index];
    
    // Save current state as an auto-save if we're moving away from latest version
    if (currentVersionIndex === textHistory.length - 1 && index !== currentVersionIndex) {
        const autoVersion = captureCurrentState();
        autoVersion.isAutoSave = true;
        autoVersion.timestamp = Date.now();
        textHistory.push(autoVersion);
        localStorage.setItem('textEditorHistory', JSON.stringify(textHistory));
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
    currentVersionIndex = index;
    updateVersionSelector();
    
    // Adjust heights of all textareas
    document.querySelectorAll('textarea').forEach(adjustTextAreaHeight);
}

function trimAutoSaves() {
    // Keep only the last 5 auto-saves to prevent too much storage usage
    const autoSaves = textHistory.filter(v => v.isAutoSave);
    if (autoSaves.length > 5) {
        const toRemove = autoSaves.length - 5;
        for (let i = 0; i < textHistory.length && toRemove > 0; i++) {
            if (textHistory[i].isAutoSave) {
                textHistory.splice(i, 1);
                i--;
                toRemove--;
            }
        }
    }
}
