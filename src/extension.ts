/**
 * Shingane AI Extension - Main Entry Point
 * This VS Code extension provides an AI assistant accessible via @shingane in chat.
 */

import * as vscode from 'vscode';
import { createShinganeParticipant } from './chatParticipant';

/**
 * Called when the extension is activated.
 *
 * Activation occurs based on the activationEvents defined in package.json.
 * Set to "onChatParticipant" for lazy-loading the extension only when the user invokes @shingane.
 * @see https://code.visualstudio.com/api/references/vscode-api#ExtensionContext
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('Shingane AI extension is activating...');
	// This makes the extension available in VS Code's chat interface
	const participant = createShinganeParticipant(context);
	context.subscriptions.push(participant);

	console.log('Shingane AI chat participant registered: @shingane');
	console.log('Shingane AI extension is now active!');
}

// This method is called when your extension is deactivated
export function deactivate() {}
