# Shingane AI

A VS Code extension that demonstrates a simple AI assistant using LangChain and OpenAI.
The extension is triggered via the `@shingane` command and processes the current file
context together with the user’s prompt.

## TODO

- [x] Register the `@shingane` command and activation logic
- [x] Capture user prompt and active editor file content
- [ ] Construct a LangChain prompt combining file context and user instruction
- [ ] Integrate OpenAI via LangChain (configurable API key)
- [ ] Display AI response in VS Code (output channel or message)
- [ ] Document setup and usage instructions
- [ ] Add basic error handling (missing API key, no active editor)
