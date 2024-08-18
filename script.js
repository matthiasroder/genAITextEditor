let typingTimer;  // Timer identifier
const typingInterval = 500;  // Time in ms (1 second)

// Add event listener to the prompt textarea
document.getElementById('promptText').addEventListener('input', handlePromptChange);

async function handlePromptChange() {
    const rows = document.querySelectorAll('#editorTable tbody tr:not(:first-child)');  // Select all rows except the first one

    for (let row of rows) {
        const leftTextArea = row.querySelector('.leftText');
        const rightTextArea = row.querySelector('.rightText');

        if (leftTextArea.value.trim()) {  // Only process if there's content to transform
            const transformedText = await transformTextWithOpenAI(leftTextArea.value);
            rightTextArea.value = transformedText;

            // Adjust textarea height to fit content
            adjustTextAreaHeight(rightTextArea);
        }
    }
}

async function transformTextWithOpenAI(inputText) {
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
                model: "gpt-4",  // Specify the model, e.g., gpt-4, gpt-3.5-turbo, etc.
                messages: [
                    {
                        role: "system",
                        content: prompt  // Use the prompt from the editable textarea
                    },
                    {
                        role: "user",
                        content: inputText
                    }
                ],
                max_tokens: 1000  // Adjust as necessary
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

function handleInput(event) {
    const leftText = event.target;
    const rightText = leftText.parentElement.nextElementSibling.querySelector('.rightText');

    clearTimeout(typingTimer);  // Clear the previous timer

    typingTimer = setTimeout(async () => {
        const transformedText = await transformTextWithOpenAI(leftText.value);
        rightText.value = transformedText;

        // Adjust textarea height to fit content
        adjustTextAreaHeight(rightText);
    }, typingInterval);
}

function handleKeyDown(event) {
    if (event.shiftKey && event.key === 'ArrowDown') {
        event.preventDefault();
        addNewRow();
    } else {
        handleInput(event);  // Process the input event for typing delay
    }
}

function addNewRow() {
    const tableBody = document.querySelector('#editorTable tbody');
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

    tableBody.appendChild(newRow);
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
