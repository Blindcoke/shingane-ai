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

/**
 * Creates and returns a chat participant for the Shingane AI extension.
 * The chat participant listens for @shingane mentions in VS Code's chat interface
 * and processes user requests.
 * @see https://code.visualstudio.com/api/references/vscode-api#chat.createChatParticipant
 */
export function createShinganeParticipant(
	context: vscode.ExtensionContext
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
				throw new Error("No active editor open");
			}

			const document = editor.document;
			const fileContent = document.getText();
			const fileName = document.fileName;
			const languageId = document.languageId;

			// Display captured context
			stream.markdown(`🤖 **Shingane AI**\n\n`);
			stream.markdown(`📄 **File:** \`${fileName}\`\n`);
			stream.markdown(`🔤 **Language:** \`${languageId}\`\n`);
			stream.markdown(`💬 **Your prompt:** "${userPrompt}"\n\n`);
			stream.markdown(`**File content preview:**\n\`\`\`${languageId}\n${fileContent.substring(0, 500)}${fileContent.length > 500 ? '...' : ''}\n\`\`\``);
		}
	);

	// Set participant icon (avatar) - displayed next to @shingane in chat
	participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'avatar.png');

	return participant;
}
