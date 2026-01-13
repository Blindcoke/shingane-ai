/**
 * Diff Preview UI
 *
 * Handles the diff preview for file edits.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import type { UserDecision } from '../types';

const decisionEmitter = new vscode.EventEmitter<UserDecision>();

/**
 * Show diff preview with accept/reject buttons
 * Uses custom URI scheme for virtual document
 */
export async function showDiffPreview(
    document: vscode.TextDocument,
    originalContent: string,
    newContent: string
): Promise<UserDecision> {
    let newContentProvider: vscode.Disposable | undefined;
    let originalContentProvider: vscode.Disposable | undefined;

    try {
        const previewUri = document.uri.with({
            scheme: 'shingane-preview',
            query: `t=${Date.now()}`
        });

        newContentProvider = vscode.workspace.registerTextDocumentContentProvider('shingane-preview', {
            provideTextDocumentContent: () => newContent
        });

        const originalUri = document.uri.with({
            scheme: 'shingane-original',
            query: `t=${Date.now()}`
        });
        originalContentProvider = vscode.workspace.registerTextDocumentContentProvider('shingane-original', {
            provideTextDocumentContent: () => originalContent
        });

        await vscode.commands.executeCommand(
            'vscode.diff',
            originalUri,
            previewUri,
            `${path.basename(document.fileName)} (Preview)`
        );

        const decision = await new Promise<UserDecision>(resolve => {
            const acceptButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1001);
            acceptButton.text = "$(check) Accept";
            acceptButton.command = 'shingane-ai.acceptEdit';
            acceptButton.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
            acceptButton.show();

            const rejectButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
            rejectButton.text = "$(close) Reject";
            rejectButton.command = 'shingane-ai.rejectEdit';
            rejectButton.show();

            const listener = decisionEmitter.event(decision => {
                resolve(decision);
                disposeButtons();
            });

            function disposeButtons() {
                acceptButton.dispose();
                rejectButton.dispose();
                listener.dispose();
            }
        });

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

        return decision;

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Shingane AI] Error showing diff preview:', message);
        vscode.window.showErrorMessage(`Failed to show diff preview: ${message}`);
        return 'reject'; // Assume rejection on error
    } finally {
        newContentProvider?.dispose();
        originalContentProvider?.dispose();
    }
}

/**
 * Register commands for accept/reject buttons
 */
export function registerEditCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('shingane-ai.acceptEdit', () => {
            decisionEmitter.fire('accept');
        }),
        vscode.commands.registerCommand('shingane-ai.rejectEdit', () => {
            decisionEmitter.fire('reject');
        })
    );
}
