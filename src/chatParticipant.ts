/**
 * Chat Participant Handler for Shingane AI
 *
 * This module implements a VS Code Chat Participant that responds to @shingane mentions.
 *
 * References:
 * - Chat API: https://code.visualstudio.com/api/extension-guides/chat
 * - Chat Participant API: https://code.visualstudio.com/api/references/vscode-api#chat
 */

import * as vscode from 'vscode';
import { constructPrompt, generateResponse } from './langchainService';
import { ConfigurationManager } from './configurationManager';

/**
 * Creates and returns a chat participant for the Shingane AI extension.
 * The chat participant listens for @shingane mentions in VS Code's chat interface
 * and processes user requests.
 * @param context - Extension context
 * @param configManager - Configuration manager for API key handling
 * @see https://code.visualstudio.com/api/references/vscode-api#chat.createChatParticipant
 */
export function createShinganeParticipant(
	context: vscode.ExtensionContext,
	configManager: ConfigurationManager
): vscode.Disposable {

	// Create a chat participant with ID matching package.json contribution
	// https://code.visualstudio.com/api/references/vscode-api#chat.createChatParticipant
	const participant = vscode.chat.createChatParticipant(
		'shingane-ai.shingane',
		async (
			request: vscode.ChatRequest,
			context: vscode.ChatContext,
			stream: vscode.ChatResponseStream,
			token: vscode.CancellationToken
		) => {
			// 1. Capture user prompt from the request
			// Reference: https://code.visualstudio.com/api/references/vscode-api#ChatRequest
			const userPrompt = request.prompt;

			// 2. Capture active editor file content
			// Reference: https://code.visualstudio.com/api/references/vscode-api#window.activeTextEditor
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				stream.markdown('⚠️ **No active editor found.** Please open a file and try again.');
				return;
			}
			const document = editor.document;
			const fileContent = document.getText();
			const fileName = document.fileName;
			const languageId = document.languageId;

			// 3. Check for API key
			const apiKey = await configManager.getApiKey();
			if (!apiKey) {
				stream.markdown('⚠️ **OpenAI API key not configured.**\n\n');
				stream.markdown('Please configure your API key by running: `Developer: Reload Window` and entering your key when prompted.');
				return;
			}

			// 4. Construct LangChain prompt combining file context and user instruction
			const messages = constructPrompt(userPrompt, fileContent, fileName, languageId);

			// 5. Send to OpenAI and display response
			stream.markdown(`🤖 **Analyzing ${fileName}...**\n\n`);

			try {
				const aiResponse = await generateResponse(apiKey, messages);
				stream.markdown(aiResponse);

			} catch (error) {
				if (error instanceof Error) {
					if (error.message.includes('API key') || error.message.includes('credentials')) {
						stream.markdown('❌ **Invalid API key.** Please reconfigure your OpenAI API key.');
					} else if (error.message.includes('rate limit') || error.message.includes('429')) {
						stream.markdown('⏱️ **Rate limit reached.** Please try again in a moment.');
					} else if (error.message.includes('quota') || error.message.includes('billing')) {
						stream.markdown('💳 **Quota exceeded.** Please check your OpenAI billing at https://platform.openai.com/account/billing');
					} else {
						stream.markdown(`❌ **Error:** ${error.message}`);
					}
				} else {
					stream.markdown('❌ An unknown error occurred. Please try again.');
				}
			}
		}
	);

	// Set participant icon (avatar) - displayed next to @shingane in chat
	participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'avatar.png');

	return participant;
}
