# Shingane VS Code Extension

Shingane is a VS Code extension that provides an AI assistant integrated directly into the editor's chat interface. It leverages LangChain and OpenAI to understand user requests within the context of the currently open file, allowing for intelligent code refactoring, explanation, and modification.

## TODO

- [x] Register the `@shingane` command and activation logic
- [x] Capture user prompt and active editor file content
- [x] Construct a LangChain prompt combining file context and user instruction
- [x] Integrate OpenAI via LangChain (configurable API key)
- [x] Display AI response in VS Code (output channel or message)

- [x] Make the model to be able to edit the files and only write summary in the chat
- [x] Add basic error handling (missing API key, no active editor)
- [x] Document setup and usage instructions
- [ ] Review and refactor the code and docs
- [ ] Finilize error handling

### Additional TODO
- [ ] Add the multiple files editing
- [ ] Add tests
- [ ] Update the Additional TODO

## Features

- **In-Editor AI Assistant**: Activate the assistant by mentioning `@shingane` in any chat window.
- **Context-Aware**: Automatically includes the content of your active file in its analysis.
- **Structured Edits**: The AI proposes changes as precise file edits.
- **Secure API Key Storage**: Your OpenAI API key is stored securely in VS Code's SecretStorage.
- **Error Handling**: Provides clear feedback for common issues like missing API keys or network errors.
- **Diff Preview**: Review all proposed changes in a standard diff view before accepting. 

## Requirements

- [Visual Studio Code](https://code.visualstudio.com/) (version 1.108.0 or newer)
- [Node.js](https://nodejs.org/) (version 20.x or newer)
- An [OpenAI API Key](https://platform.openai.com/api-keys)

## Getting Started


### 1. Setup

First, clone the repository and install the necessary dependencies.

```bash
git clone <repository-url>
cd shingane-ai
npm install
```

### 2. Running the Extension

You can run the extension in a new "Extension Development Host" window directly from VS Code. (note that the version of VS Code should be strictly version 1.108.0 or newer)

1.  Open the project in VS Code.
2.  Press `F5` to launch the Extension Development Host. This will open a new VS Code window with the Shingane AI extension loaded.

## How to Use

### 1. Configure the API Key

The first time you activate the extension, it will prompt you to enter your OpenAI API key.

If you need to configure it later, you can run the command:
`Shingane AI: Configure OpenAI API Key` from the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).

### 2. Interact with the AI

1.  Open any file you wish to work on.
2.  Open the Chat view in VS Code
3.  In the chat input box, type `@shingane` followed by your request. For example:

    > @shingane refactor this function to be async/await
4.  The assistant will analyze your file and your prompt, then provide a summary of the proposed changes.
5.  If the AI proposes an edit, you will be shown a diff view to approve or reject the changes.
