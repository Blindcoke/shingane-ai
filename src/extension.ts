/**
 * Shingane AI Extension - Main Entry Point
 * This VS Code extension provides an AI assistant accessible via @shingane in chat.
 */

import * as vscode from 'vscode';
import { createShinganeParticipant } from './chatParticipant';
import { ConfigurationManager } from './configurationManager';

/**
 * Called when the extension is activated.
 *
 * Activation occurs based on the activationEvents defined in package.json.
 * Set to "onChatParticipant" for lazy-loading the extension only when the user invokes @shingane.
 * @see https://code.visualstudio.com/api/references/vscode-api#ExtensionContext
 */
export async function activate(context: vscode.ExtensionContext) {
	console.log('Shingane AI extension is activating...');

	const configManager = new ConfigurationManager(context);

	const hasApiKey = await configManager.hasApiKey();
	if (!hasApiKey) {
		const response = await vscode.window.showInformationMessage(
			'Shingane AI: OpenAI API key not configured. Configure now?',
			'Yes',
			'Later'
		);

		if (response === 'Yes') {
			await configManager.promptForApiKey();
		}
	}

	const configureApiKeyCommand = vscode.commands.registerCommand(
		'shingane-ai.configureApiKey',
		async () => {
			const apiKey = await configManager.promptForApiKey();
			if (apiKey) {
				vscode.window.showInformationMessage('OpenAI API key configured successfully!');
			}
		}
	);

	const clearApiKeyCommand = vscode.commands.registerCommand(
		'shingane-ai.clearApiKey',
		async () => {
			const cleared = await configManager.promptToClearApiKey();
			if (cleared) {
				vscode.window.showInformationMessage('OpenAI API key cleared successfully.');
			}
		}
	);

	context.subscriptions.push(configureApiKeyCommand, clearApiKeyCommand);

	const participant = createShinganeParticipant(context, configManager);
	context.subscriptions.push(participant);

	console.log('Shingane AI chat participant registered: @shingane');
	console.log('Shingane AI extension is now active!');
}

// This method is called when your extension is deactivated
export function deactivate() {}
