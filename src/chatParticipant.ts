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
import { generateResponse } from './services/langchainService';
import { ConfigurationManager } from './managers/configurationManager';
import { applyEdit } from './services/fileEditingService';
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

			// 4. Send to OpenAI with structured output
			stream.markdown(`🤖 **Analyzing ${fileName}...**\n\n`);

			try {
				const operation = await generateResponse(
					apiKey,
					userPrompt,
					fileName,
					languageId,
					fileContent
				);

				stream.markdown(`🔄 **${operation.summary}**\n\n`);

				const config = vscode.workspace.getConfiguration('shingane-ai');
				const showPreview = config.get<boolean>('showEditPreview', true);

				const result = await applyEdit(document, operation, showPreview);

				if (result.success) {
					stream.markdown(`✅ ${result.message}`);
				} else {
					stream.markdown(`❌ ${result.message}`);
				}

			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
				console.error('[Shingane AI] Chat participant error:', errorMessage);

				if (errorMessage.includes('API key')) {
					stream.markdown('❌ **Invalid API key.** Please reconfigure your OpenAI API key.');
				} else if (errorMessage.includes('rate limit')) {
					stream.markdown('⏱️ **Rate limit reached.** Please try again in a moment.');
				} else if (errorMessage.includes('quota')) {
					stream.markdown('💳 **Quota exceeded.** Please check your OpenAI billing status.');
				} else {
					stream.markdown(`❌ **An error occurred:** ${errorMessage}`);
				}
			}
		}
	);

	// Set participant icon (avatar) - displayed next to @shingane in chat
	participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'avatar.png');

	return participant;
}
