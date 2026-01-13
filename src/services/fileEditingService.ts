/**
 * File Editing Service
 *
 * Handles AI-generated file edits with diff preview.
 * Supports single-file operations with user preview/approval.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import type { EditOperation, FileEdit } from '../types';
import { showDiffPreview } from '../ui/diffPreviewUI';

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
	try {
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

			// Safety check for indentation
			const lines = replaceText.split('\n');
			if (lines.length > 1) {
				const indents = lines
					.filter(line => line.trim().length > 0)
					.map(line => line.match(/^[ \t]*/)?.[0].length || 0);

				if (indents.length > 0) {
					const minIndent = Math.min(...indents);
					if (minIndent > 0) {
						replaceText = lines.map(line => line.substring(minIndent)).join('\n');
					}
				}
			}

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

	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		console.error('[Shingane AI] Error applying single file edit:', message);
		return { success: false, message: `Error: ${message}` };
	}
}
