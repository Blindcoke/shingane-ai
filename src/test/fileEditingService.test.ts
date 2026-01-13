import * as assert from 'assert';
import * as vscode from 'vscode';
import { applyEdit } from '../services/fileEditingService';
import type { EditOperation } from '../types';

suite('File Editing Service Test Suite', () => {
	let testDocument: vscode.TextDocument;

	setup(async function() {
		this.timeout(10000);
		testDocument = await vscode.workspace.openTextDocument({
			content: 'function hello() {\n  console.log("Hello");\n}',
			language: 'typescript'
		});
	});

	teardown(async function() {
		this.timeout(5000);
		await vscode.commands.executeCommand('workbench.action.closeAllEditors');
	});

	test('Should apply partial edit without preview', async function() {
		this.timeout(10000);
		const operation: EditOperation = {
			summary: 'Update console log message',
			search: 'console.log("Hello");',
			replace: 'console.log("Hello, World!");'
		};

		const result = await applyEdit(testDocument, operation, false);

		assert.strictEqual(result.success, true, 'Edit should succeed');
		assert.ok(result.message.includes('successfully'), 'Should have success message');

		const updatedContent = testDocument.getText();
		assert.ok(updatedContent.includes('Hello, World!'), 'Content should be updated');
	});
});
