# genAI Text Editor

This project is a simple web- and grid-based text editor that transforms user input text using OpenAI's GPT API. The editor allows you to input text in one column, and see the transformed text in another column. It also includes an editable prompt that guides the transformation process, as well as an input field for the API key.

## Features

- **Live Text Transformation**: As you type, your text is automatically transformed using the GPT API and displayed in a separate column.
- **Grid-Based Layout**: Allows you to see your outline and the AI-generated text on the same page.
- **Custom Prompt**: Edit the transformation prompt to customize how your text is processed.
- **API Key Input**: Securely enter your OpenAI API key directly in the web interface.

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
   - Modify the prompt in the second row to change how the text is transformed. The default prompt is set for a ghostwriting scenario, but you can adjust it as needed.

5. **Start Typing**
   - In the left text area, start typing your text. The transformed text will appear on the right side.

## Usage

1. **Input Your Text**
   - In the left column, enter the text you want to transform.

2. **View Transformed Text**
   - As you type, the transformed text will be displayed in the right column. This text is generated based on the prompt and the OpenAI GPT model specified in the code.

3. **Add new rows as you go**
   - You can add new rows by holding `Shift` and pressing `Arrow Down`. Each new row allows you to transform additional pieces of text.
  
4. **Modifying the Prompt**
- The prompt used for transformation is editable directly in the web interface. This allows you to experiment with different prompts to achieve various text transformation outcomes.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.

## Copyright

Copyright by Matthias Röder. All rights reserved.
