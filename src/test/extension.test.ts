import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	test('Extension should be present', () => {
		const extension = vscode.extensions.getExtension('shingane.shingane-ai');
		assert.ok(extension, 'Extension should be installed');
	});
});
