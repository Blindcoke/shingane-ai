/**
 * API Key UI Management
 *
 * Handles all UI interactions related to the OpenAI API key.
 */

import * as vscode from 'vscode';

/**
 * Prompts user to enter their OpenAI API and returns the entered API key or undefined if cancelled
 */
export async function promptForApiKey(): Promise<string | undefined> {
    try {
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

        return apiKey;
    } catch (error) {
        console.error('[Shingane AI] Error prompting for API key:', error);
        vscode.window.showErrorMessage('Failed to prompt for API key. See console for details.');
        return undefined;
    }
}

/**
 * Prompts the user to confirm clearing the API key and returns true if the user confirmed
 */
export async function promptToClearApiKey(): Promise<boolean> {
    try {
        const result = await vscode.window.showWarningMessage(
            'Are you sure you want to clear your OpenAI API key?',
            { modal: true },
            'Yes'
        );

        return result === 'Yes';
    } catch (error) {
        console.error('[Shingane AI] Error prompting to clear API key:', error);
        vscode.window.showErrorMessage('An unexpected error occurred. See console for details.');
        return false;
    }
}
