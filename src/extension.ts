/**
 * Shingane AI Extension - Main Entry Point
 * This VS Code extension provides an AI assistant accessible via @shingane in chat.
 */

import * as vscode from 'vscode';
import { createShinganeParticipant } from './chatParticipant';
import { ConfigurationManager } from './managers/configurationManager';
import { registerEditCommands } from './ui/diffPreviewUI';
import { promptForApiKey, promptToClearApiKey } from './ui/apiKeyUI';

/**
 * Called when the extension is activated.
 *
 * Activation occurs based on the activationEvents defined in package.json.
 * Set to "onChatParticipant" for lazy-loading the extension only when the user invokes @shingane.
 * @see https://code.visualstudio.com/api/references/vscode-api#ExtensionContext
 */
export async function activate(context: vscode.ExtensionContext) {
	try {
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
				const apiKey = await promptForApiKey();
				if (apiKey) {
					await configManager.setApiKey(apiKey);
				}
			}
		}

		const configureApiKeyCommand = vscode.commands.registerCommand(
			'shingane-ai.configureApiKey',
			async () => {
				try {
					const apiKey = await promptForApiKey();
					if (apiKey) {
						await configManager.setApiKey(apiKey);
						vscode.window.showInformationMessage('OpenAI API key configured successfully!');
					}
				} catch (error) {
					console.error('[Shingane AI] Error configuring API key:', error);
					vscode.window.showErrorMessage('Failed to configure API key. See console for details.');
				}
			}
		);

		const clearApiKeyCommand = vscode.commands.registerCommand(
			'shingane-ai.clearApiKey',
			async () => {
				try {
					const confirmed = await promptToClearApiKey();
					if (confirmed) {
						await configManager.clearApiKey();
						vscode.window.showInformationMessage('OpenAI API key cleared successfully.');
					}
				} catch (error) {
					console.error('[Shingane AI] Error clearing API key:', error);
					vscode.window.showErrorMessage('Failed to clear API key. See console for details.');
				}
			}
		);

		context.subscriptions.push(configureApiKeyCommand, clearApiKeyCommand);

		registerEditCommands(context);

		const participant = createShinganeParticipant(context, configManager);
		context.subscriptions.push(participant);

		console.log('Shingane AI chat participant registered: @shingane');
		console.log('Shingane AI extension is now active!');
	} catch (error) {
		console.error('[Shingane AI] Error activating extension:', error);
		vscode.window.showErrorMessage('Shingane AI failed to activate. Please see the console for details.');
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
