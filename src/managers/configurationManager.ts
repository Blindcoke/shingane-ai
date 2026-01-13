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
		try {
			return await this.context.secrets.get(ConfigurationManager.API_KEY_SECRET);
		} catch (error) {
			console.error('[Shingane AI] Error getting API key:', error);
			vscode.window.showErrorMessage('Failed to retrieve API key. See console for details.');
			return undefined;
		}
	}

	/**
	 * Stores the OpenAI API key in secure storage.
	 * @param apiKey - The API key to store securely
	 */
	async setApiKey(apiKey: string): Promise<void> {
		try {
			await this.context.secrets.store(ConfigurationManager.API_KEY_SECRET, apiKey);
		} catch (error) {
			console.error('[Shingane AI] Error setting API key:', error);
			vscode.window.showErrorMessage('Failed to store API key. See console for details.');
		}
	}

	/**
	 * Checks if an API key is configured and returns true if API key exists
	 */
	async hasApiKey(): Promise<boolean> {
		try {
			const apiKey = await this.getApiKey();
			return apiKey !== undefined && apiKey.length > 0;
		} catch (error) {
			console.error('[Shingane AI] Error checking for API key:', error);
			return false;
		}
	}

	/**
	 * Clears the stored OpenAI API key.
	 */
	async clearApiKey(): Promise<void> {
		try {
			await this.context.secrets.delete(ConfigurationManager.API_KEY_SECRET);
		} catch (error) {
			console.error('[Shingane AI] Error clearing API key:', error);
			vscode.window.showErrorMessage('Failed to clear API key. See console for details.');
		}
	}
}

