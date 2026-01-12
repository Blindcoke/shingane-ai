/**
 * Configuration Manager for Shingane AI
 *
 * Handles secure API key storage and configuration settings.
 *
 * References:
 * - SecretStorage API: https://code.visualstudio.com/api/references/vscode-api#SecretStorage
 */

import * as vscode from 'vscode';

export class ConfigurationManager {
	private static readonly API_KEY_SECRET = 'shingane-ai.openaiApiKey';

	constructor(private context: vscode.ExtensionContext) {}

	/**
	 * Retrieves the stored OpenAI API key from secure storage and returns API key or undefined if not set
	 */
	async getApiKey(): Promise<string | undefined> {
		return await this.context.secrets.get(ConfigurationManager.API_KEY_SECRET);
	}

	/**
	 * Stores the OpenAI API key in secure storage.
	 * @param apiKey - The API key to store securely
	 */
	async setApiKey(apiKey: string): Promise<void> {
		await this.context.secrets.store(ConfigurationManager.API_KEY_SECRET, apiKey);
	}

	/**
	 * Prompts user to enter their OpenAI API and returns the entered API key or undefined if cancelled
	 */
	async promptForApiKey(): Promise<string | undefined> {
		/**
		* Reference: https://code.visualstudio.com/api/references/vscode-api#window.showInputBox
		*/
		const apiKey = await vscode.window.showInputBox({
			prompt: 'Enter your OpenAI API Key',
			password: true,
			placeHolder: 'sk-...',
			ignoreFocusOut: true,
			validateInput: (value) => {
				if (!value || value.trim().length === 0) {
					return 'API key cannot be empty';
				}
				if (!value.startsWith('sk-')) {
					return 'OpenAI API keys typically start with "sk-"';
				}
				return null;
			}
		});

		if (apiKey) {
			await this.setApiKey(apiKey);
		}

		return apiKey;
	}

	/**
	 * Checks if an API key is configured and returns true if API key exists
	 */
	async hasApiKey(): Promise<boolean> {
		const apiKey = await this.getApiKey();
		return apiKey !== undefined && apiKey.length > 0;
	}

	/**
	 * Clears the stored OpenAI API key.
	 */
	async clearApiKey(): Promise<void> {
		await this.context.secrets.delete(ConfigurationManager.API_KEY_SECRET);
	}

	/**
	 * Prompts the user to confirm clearing the API key and returns true if the user confirmed
	 */
	async promptToClearApiKey(): Promise<boolean> {
		const result = await vscode.window.showWarningMessage(
			'Are you sure you want to clear your OpenAI API key?',
			{ modal: true },
			'Yes'
		);

		if (result === 'Yes') {
			await this.clearApiKey();
			return true;
		}
		return false;
	}
}
