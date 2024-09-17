let typingTimer;  // Timer identifier
const typingInterval = 1000;  // Time in ms (1 second)

// Add event listener to the prompt textarea
document.getElementById('promptText').addEventListener('input', handlePromptChange);

async function handlePromptChange() {
    clearTimeout(typingTimer);  // Clear the previous timer if it exists

    typingTimer = setTimeout(async () => {  // Set a new timer
        // Select all rows except the first two
        const rows = document.querySelectorAll('#editorTable tbody tr:nth-child(n+3)');

        for (let row of rows) {
            const leftTextArea = row.querySelector('.leftText');
            const rightTextArea = row.querySelector('.rightText');

            if (leftTextArea && leftTextArea.value.trim()) {  // Check if leftTextArea exists and has content
                const transformedText = await transformTextWithOpenAI(leftTextArea.value);
                rightTextArea.value = transformedText;

                // Adjust textarea height to fit content
                adjustTextAreaHeight(rightTextArea);
            }
        }
    }, typingInterval);  // Execute the function after the typing interval
}

async function transformTextWithOpenAI(inputText, summaryText = '') {
    const apiKey = document.getElementById('apiKey').value.trim();  // Get the API key from the input field

    const prompt = document.getElementById('promptText').value.trim();

    if (!apiKey) {
        console.error("API key is missing.");
        return "Error: API key is required.";
    }

    try {
        console.log("Sending request to OpenAI API...");

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
                        content: prompt  // Use the prompt from the editable textarea
                    },
                    {
                        role: "user",
                        content: `Summary: ${summaryText}\n\nCurrent text: ${inputText}`
                    }
                ],
                max_tokens: 500  // Adjust as necessary
            })
        });

        console.log("Response received from OpenAI API...");

        if (!response.ok) {
            console.error(`API request failed with status ${response.status}`);
            return `Error: API request failed with status ${response.status}`;
        }

        const data = await response.json();
        console.log("Response data:", data);  // Inspect the response data

        return data.choices[0].message.content;
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
        handleInput(event);  // Process the input event for typing delay
    }
}

function addNewRow(currentRow) {
    const newRow = document.createElement('tr');

    const leftCell = document.createElement('td');
    const rightCell = document.createElement('td');

    const leftTextArea = document.createElement('textarea');
    leftTextArea.classList.add('leftText');
    leftTextArea.placeholder = "Type here...";
    leftTextArea.addEventListener('keydown', handleKeyDown);  // Attach event listener

    const rightTextArea = document.createElement('textarea');
    rightTextArea.classList.add('rightText');
    rightTextArea.placeholder = "Transformed text appears here...";
    rightTextArea.readOnly = true;

    leftCell.appendChild(leftTextArea);
    rightCell.appendChild(rightTextArea);

    newRow.appendChild(leftCell);
    newRow.appendChild(rightCell);

    // Insert the new row after the current row
    currentRow.parentNode.insertBefore(newRow, currentRow.nextSibling);

    // Attach event listeners to the new row
    attachEventListenersToNewRows();
}


// Adjust the height of the textarea to fit its content
function adjustTextAreaHeight(textarea) {
    textarea.style.height = 'auto';  // Reset the height
    textarea.style.height = textarea.scrollHeight + 'px';  // Set it to scrollHeight
}

// Attach event listeners to the initial textarea
document.querySelectorAll('.leftText').forEach(textarea => {
    textarea.addEventListener('keydown', handleKeyDown);
});

// Attach event listeners to new rows
attachEventListenersToNewRows();

function attachEventListenersToNewRows() {
    document.querySelectorAll('.leftText').forEach(textarea => {
        textarea.removeEventListener('keydown', handleKeyDown); // Remove previous listeners to prevent duplication
        textarea.addEventListener('keydown', handleKeyDown);
    });
}

document.getElementById('downloadBtn').addEventListener('click', function() {
    var filename = document.getElementById('docName').value.trim() || 'default_filename.txt'; // Ensure filename is trimmed of whitespace
    var allText = concatenateRightTextFields(); // Use the existing function to get concatenated text from rightText elements

    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(allText));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
});

function concatenateRightTextFields() {
    var rightTextElements = document.getElementsByClassName('rightText');
    var concatenatedText = '';

    for (var i = 0; i < rightTextElements.length; i++) {
        concatenatedText += rightTextElements[i].value + "\n"; // Adding a newline for separation
    }

    return concatenatedText;
}

document.getElementById('feedbackText').addEventListener('focus', handleFeedbackFocus);

async function handleFeedbackFocus() {
    const concatenatedText = concatenateRightTextFields();  // Concatenate all right text fields
    const feedbackPrompt = "Read the following text and find a simple and direct question that might help the author to improve the text. Act as if you are a grade school teacher.";

    const feedbackText = await getFeedbackFromOpenAI(concatenatedText, feedbackPrompt);
    document.getElementById('feedbackText').value = feedbackText;

    // Adjust textarea height to fit content
    adjustTextAreaHeight(document.getElementById('feedbackText'));
}

async function getFeedbackFromOpenAI(inputText, prompt) {
    const apiKey = document.getElementById('apiKey').value.trim();  // Get the API key from the input field

    if (!apiKey) {
        console.error("API key is missing.");
        return "Error: API key is required.";
    }

    try {
        console.log("Sending request to OpenAI API...");

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
                        content: prompt  // Use the provided prompt
                    },
                    {
                        role: "user",
                        content: inputText
                    }
                ],
                max_tokens: 100  // Adjust as necessary
            })
        });

        console.log("Response received from OpenAI API...");

        if (!response.ok) {
            console.error(`API request failed with status ${response.status}`);
            return `Error: API request failed with status ${response.status}`;
        }

        const data = await response.json();
        console.log("Response data:", data);  // Inspect the response data

        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error with OpenAI API request:', error);
        return 'Error: Could not process request.';
    }
}

async function summarizeLeftTexts(currentTextArea) {
    const apiKey = document.getElementById('apiKey').value.trim();  // Get the API key from the input field

    if (!apiKey) {
        console.error("API key is missing.");
        return "Error: API key is required.";
    }

    // Get all left-hand textareas up to the current one
    const leftTextAreas = document.querySelectorAll('.leftText');
    let textsToSummarize = '';

    for (let i = 0; i < leftTextAreas.length; i++) {
        if (leftTextAreas[i] === currentTextArea) break; // Stop once we reach the current textarea
        textsToSummarize += leftTextAreas[i].value + "\n"; // Concatenate all previous texts
    }

    if (!textsToSummarize.trim()) return ""; // If there's no text to summarize, return an empty string

    const prompt = "Summarize the following texts in a concise manner:";

    try {
        console.log("Sending summary request to OpenAI API...");

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
                        content: prompt  // Use the summary prompt
                    },
                    {
                        role: "user",
                        content: textsToSummarize
                    }
                ],
                max_tokens: 150  // Adjust as necessary for summary length
            })
        });

        console.log("Summary response received from OpenAI API...");

        if (!response.ok) {
            console.error(`API request failed with status ${response.status}`);
            return `Error: API request failed with status ${response.status}`;
        }

        const data = await response.json();
        console.log("Summary response data:", data);  // Inspect the response data

        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error with OpenAI API request:', error);
        return 'Error: Could not process summary request.';
    }
}

async function handleInput(event) {
    const leftText = event.target;
    const rightText = leftText.parentElement.nextElementSibling.querySelector('.rightText');

    clearTimeout(typingTimer);  // Clear the previous timer

    typingTimer = setTimeout(async () => {
        // Get the summary of all left-hand texts before the current one
        const summaryText = await summarizeLeftTexts(leftText);

        if (summaryText) {
            console.log("Summary:", summaryText);  // Display the summary in the console for debugging
            // Optionally, display the summary somewhere on the page
        }

        // Transform the current left-hand text using the summary
        const transformedText = await transformTextWithOpenAI(leftText.value, summaryText);
        rightText.value = transformedText;

        // Adjust textarea height to fit content
        adjustTextAreaHeight(rightText);
    }, typingInterval);
}
