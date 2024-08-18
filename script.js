async function transformTextWithOpenAI(inputText) {
    const apiKey = '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';  // Replace with your OpenAI API key

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
                        content: "You are a professional ghost writer. You take my ideas and transform them into well-written paragraphs for a book. You should expand my ideas where appropriate. I might add instructions for you in ALL CAPS, enclosed in square brackets, like so: [THIS IS AN INSTRUCTION]. Write for a normal kind of person but don’t be Shakespeare! Only return the finished text of the ghost writer."
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
            return;
        }

        const data = await response.json();
        console.log("Response data:", data);  // Inspect the response data

        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error with OpenAI API request:', error);
    }
}

async function handleInput(event) {
    const leftText = event.target;
    const rightText = leftText.parentElement.nextElementSibling.querySelector('.rightText');

    const transformedText = await transformTextWithOpenAI(leftText.value);
    rightText.value = transformedText;
}

function addNewRow() {
    const tableBody = document.querySelector('#editorTable tbody');
    const newRow = document.createElement('tr');

    const leftCell = document.createElement('td');
    const rightCell = document.createElement('td');

    const leftTextArea = document.createElement('textarea');
    leftTextArea.classList.add('leftText');
    leftTextArea.placeholder = "Type here...";
    leftTextArea.addEventListener('input', handleInput);

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

// Attach event listeners to the initial textarea
document.querySelectorAll('.leftText').forEach(textarea => {
    textarea.addEventListener('input', handleInput);
    textarea.addEventListener('keydown', function(event) {
        if (event.shiftKey && event.key === 'Enter') {
            event.preventDefault();  // Prevent the default behavior (adding a new line)
            addNewRow();
        }
    });
});

// Add similar event listeners to new text areas
function attachEventListenersToNewRows() {
    document.querySelectorAll('.leftText').forEach(textarea => {
        textarea.addEventListener('input', handleInput);
        textarea.addEventListener('keydown', function(event) {
            if (event.shiftKey && event.key === 'Enter') {
                event.preventDefault();
                addNewRow();
            }
        });
    });
}

// Call the function to attach event listeners initially
attachEventListenersToNewRows();
