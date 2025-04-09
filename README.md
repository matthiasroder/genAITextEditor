# genAI Text Editor

This project is a web-based text editor that transforms user input text using OpenAI's GPT API. The editor allows you to input text outlines in one column and see the AI-generated text in another column. It includes an editable system prompt and instructions that guide the transformation process, as well as a feedback feature for improving your text.

## Features

- **Live Text Transformation**: As you type, your text is automatically transformed using the GPT API and displayed in a separate column.
- **Version Control**: Save, browse, and restore different versions of your document with automatic and manual saving options.
- **AI Feedback**: Receive feedback on your text as you write to help improve your content.
- **Grid-Based Layout**: Allows you to see your outline and the AI-generated text on the same page.
- **Custom Prompt**: Edit the transformation prompt to customize how your text is processed.
- **API Key Input**: Securely enter your OpenAI API key directly in the web interface.
- **Flexible Download Options**: Choose to download just the outlines, just the generated text, or both together.

## Installation

### Prerequisites

- A modern web browser (e.g., Chrome, Firefox, Edge)
- An active OpenAI API key (You can obtain one by signing up on the [OpenAI website](https://beta.openai.com/signup/))

### Step-by-Step Installation

1. **Download the Files**
   - Clone this repository or download the ZIP file and extract it to your desired location:
     ```bash
     git clone https://github.com/yourusername/mirrored-text-editor.git
     ```
     or [Download the ZIP](https://github.com/yourusername/mirrored-text-editor/archive/refs/heads/main.zip).

2. **Open the `index.html` File**
   - Navigate to the directory where you extracted the files.
   - Open the `index.html` file in your web browser.

3. **Enter Your API Key**
   - At the top of the editor, you will see a field labeled "API Key". Enter your OpenAI API key here.

4. **Customize the Prompt**
   - Modify the system prompt and instructions to change how the text is transformed. The default is set for continuing text based on previous paragraphs.

5. **Start Typing**
   - In the left text area, start typing your text outline. The transformed text will appear on the right side.

## Usage

1. **Input Your Text**
   - In the left column, enter the outline or notes for the text you want to transform.

2. **View Transformed Text**
   - As you type, the AI-generated text will be displayed in the right column, based on your outline and previously generated paragraphs.

3. **Add New Rows**
   - You can add new rows by holding `Shift` and pressing `Arrow Down`. Each new row allows you to transform additional pieces of text.
  
4. **Modify the Prompt**
   - The system prompt and instructions are editable directly in the web interface. This allows you to experiment with different prompts to achieve various text transformation outcomes.

5. **Get AI Feedback**
   - Click in the yellow feedback textarea to receive suggestions for improving your text.

6. **Version Control**
   - Use the version control bar at the top of the page to:
     - Save versions manually with the "Save Version" button
     - Navigate between versions using the dropdown or arrow buttons
     - Automatically save versions after content changes (happens automatically)

7. **Download Options**
   - Click the "Download" button to access download options:
     - **Generated Text**: Download only the AI-generated content (right side)
     - **Outline Text**: Download only your outlines/notes (left side)
     - **Both Sides**: Download both sides with paragraph labels and formatting

## Technical Notes

- The application uses the OpenAI API with the gpt-4o-mini model
- Version history is stored in the browser's localStorage
- No server-side components are required to run this application

## Copyright

Copyright by Matthias Röder. All rights reserved.