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
			// For now, just acknowledge the request
			stream.markdown(`👋 Hello! I'm Shingane AI. Full functionality coming soon!\n\n`);
			stream.markdown(`You said: "${request.prompt}"`);
		}
	);

	// Set participant icon (avatar) - displayed next to @shingane in chat
	participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'avatar.png');

	return participant;
}
