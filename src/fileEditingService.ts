/**
 * File Editing Service
 *
 * Handles AI-generated file edits with diff preview.
 * Supports single-file operations with user preview/approval.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import type { EditOperation, FileEdit, UserDecision } from './types';
// https://code.visualstudio.com/api/references/vscode-api#EventEmitter
const decisionEmitter = new vscode.EventEmitter<UserDecision>();

/**
 * Apply edit operation with optional preview
 * Returns success status and message
 */
export async function applyEdit(
	currentDocument: vscode.TextDocument,
	operation: EditOperation,
	showPreview: boolean
): Promise<{ success: boolean; message: string }> {
	try {
		if (!operation) {
			return { success: false, message: 'Invalid edit operation' };
		}

		const result = await applySingleFileEdit(
			currentDocument,
			{ search: operation.search, replace: operation.replace },
			showPreview
		);

		// Autosave on success
		if (result.success && currentDocument.isDirty) {
			await currentDocument.save();
		}

		return result;

	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		console.error('[Shingane AI] Error applying edit:', message);
		return { success: false, message: `Error: ${message}` };
	}
}

/**
 * Apply edit to a single file - SIMPLIFIED VERSION
 */
async function applySingleFileEdit(
	document: vscode.TextDocument,
	fileEdit: FileEdit,
	showPreview: boolean
): Promise<{ success: boolean; message: string }> {
	const fileContent = document.getText();
	const searchText = fileEdit.search.replace(/\r\n/g, '\n');
	let replaceText = fileEdit.replace;

	const searchPosition = searchText === '' ? -1 : fileContent.indexOf(searchText);

	// If search text not found, fall back to full file replacement
	if (searchPosition === -1) {
		if (searchText !== '') {
			const choice = await vscode.window.showWarningMessage(
				`Search text not found in ${path.basename(document.fileName)}. Replace entire file?`,
				{ modal: true },
				'Show Diff',
				'Cancel'
			);
			if (choice !== 'Show Diff') {
				return { success: false, message: 'Edit cancelled' };
			}
		}

		// Safety check: Remove common leading indentation from all lines
		const lines = replaceText.split('\n');
		if (lines.length > 1) {
			const indents = lines
				.filter(line => line.trim().length > 0)
				.map(line => line.match(/^[ \t]*/)?.[0].length || 0);

			if (indents.length > 0) {
				const minIndent = Math.min(...indents);
				if (minIndent > 0) {
					console.log(`[Shingane AI] Removing ${minIndent} chars of leading indentation from replacement`);
					replaceText = lines.map(line => line.substring(minIndent)).join('\n');
				}
			}
		}

		// Full file replacement
		const fullFileRange = new vscode.Range(
			new vscode.Position(0, 0),
			document.lineAt(document.lineCount - 1).range.end
		);

		if (showPreview) {
			const decision = await showDiffPreview(document, fileContent, replaceText);
			if (decision === 'reject') {
				return { success: false, message: 'Edit cancelled by user' };
			}
		}

		const edit = new vscode.WorkspaceEdit();
		edit.replace(document.uri, fullFileRange, replaceText);
		const success = await vscode.workspace.applyEdit(edit);
		return success
			? { success: true, message: 'Changes applied successfully' }
			: { success: false, message: 'Failed to apply edit' };
	}

	const searchRange = new vscode.Range(
		document.positionAt(searchPosition),
		document.positionAt(searchPosition + searchText.length)
	);

	const previewContent = fileContent.substring(0, searchPosition) +
		replaceText +
		fileContent.substring(searchPosition + searchText.length);

	if (showPreview) {
		const decision = await showDiffPreview(document, fileContent, previewContent);
		if (decision === 'reject') {
			return { success: false, message: 'Edit cancelled by user' };
		}
	}

	const edit = new vscode.WorkspaceEdit();
	edit.replace(document.uri, searchRange, replaceText);
	const success = await vscode.workspace.applyEdit(edit);
	return success
		? { success: true, message: 'Changes applied successfully' }
		: { success: false, message: 'Failed to apply edit' };
}



/**
 * Show diff preview with accept/reject buttons
 * Uses custom URI scheme for virtual document
 */
async function showDiffPreview(
	document: vscode.TextDocument,
	originalContent: string,
	newContent: string
): Promise<UserDecision> {
	console.log('[Shingane AI] showDiffPreview: Starting...');

	const previewUri = document.uri.with({
		scheme: 'shingane-preview',
		query: `t=${Date.now()}`
	});
	console.log(`[Shingane AI] showDiffPreview: previewUri: ${previewUri.toString()}`);


	const newContentProvider = vscode.workspace.registerTextDocumentContentProvider('shingane-preview', {
		provideTextDocumentContent: (uri: vscode.Uri) => {
			console.log(`[Shingane AI] provideTextDocumentContent (new): Called for URI: ${uri.toString()}`);
			console.log(`[Shingane AI] provideTextDocumentContent (new): Providing content (first 100 chars): ${newContent.substring(0, 100)}`);
			return newContent;
		}
	});
	console.log('[Shingane AI] showDiffPreview: TextDocumentContentProvider for new content registered.');

	console.log('[Shingane AI] showDiffPreview: Registering TextDocumentContentProvider for original content...');
	const originalUri = document.uri.with({
		scheme: 'shingane-original',
		query: `t=${Date.now()}`
	});
	const originalContentProvider = vscode.workspace.registerTextDocumentContentProvider('shingane-original', {
		provideTextDocumentContent: (uri: vscode.Uri) => {
			console.log(`[Shingane AI] provideTextDocumentContent (original): Called for URI: ${uri.toString()}`);
			console.log(`[Shingane AI] provideTextDocumentContent (original): Providing content (first 100 chars): ${originalContent.substring(0, 100)}`);
			return originalContent;
		}
	});
	console.log('[Shingane AI] showDiffPreview: TextDocumentContentProvider for original content registered.');


	console.log('[Shingane AI] showDiffPreview: Executing vscode.diff command...');
	await vscode.commands.executeCommand(
		'vscode.diff',
		originalUri,
		previewUri,
		`${path.basename(document.fileName)} (Preview)`
	);
	console.log('[Shingane AI] showDiffPreview: vscode.diff command executed.');

	const decision = await new Promise<UserDecision>(resolve => {
		// https://code.visualstudio.com/api/references/vscode-api#StatusBarItem
		const acceptButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1001);
		acceptButton.text = "$(check) Accept";
		acceptButton.command = 'shingane-ai.acceptEdit';
		acceptButton.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
		acceptButton.show();
		console.log('[Shingane AI] showDiffPreview: Accept button shown.');

		const rejectButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
		rejectButton.text = "$(close) Reject";
		rejectButton.command = 'shingane-ai.rejectEdit';
		rejectButton.show();
		console.log('[Shingane AI] showDiffPreview: Reject button shown.');

		const listener = decisionEmitter.event(decision => {
			console.log(`[Shingane AI] showDiffPreview: Decision received: ${decision}`);
			resolve(decision);
			disposeButtons();
		});
		console.log('[Shingane AI] showDiffPreview: Listening for decision...');

		function disposeButtons() {
			console.log('[Shingane AI] showDiffPreview: Disposing buttons and listener.');
			acceptButton.dispose();
			rejectButton.dispose();
			listener.dispose();
			newContentProvider.dispose();
			originalContentProvider.dispose();
		}
	});

	console.log('[Shingane AI] showDiffPreview: Closing active editor...');
	await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
	console.log('[Shingane AI] showDiffPreview: Active editor closed.');

	return decision;
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
