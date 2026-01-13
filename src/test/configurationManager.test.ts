import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigurationManager } from '../managers/configurationManager';

suite('ConfigurationManager Test Suite', () => {
	let configManager: ConfigurationManager;
	let mockContext: vscode.ExtensionContext;

	suiteSetup(async function() {
		this.timeout(5000);
		mockContext = {
			secrets: {
				store: async (key: string, value: string) => {
					(mockContext as any)[`_secret_${key}`] = value;
				},
				get: async (key: string) => {
					return (mockContext as any)[`_secret_${key}`];
				},
				delete: async (key: string) => {
					delete (mockContext as any)[`_secret_${key}`];
				}
			}
		} as any;

		configManager = new ConfigurationManager(mockContext);
	});

	setup(async () => {
		await configManager.clearApiKey();
	});

	test('Should initially have no API key', async () => {
		const hasKey = await configManager.hasApiKey();
		assert.strictEqual(hasKey, false, 'Should not have API key initially');
	});

	test('Should store and retrieve API key', async () => {
		const testKey = 'sk-test-key-12345';

		await configManager.setApiKey(testKey);
		const retrievedKey = await configManager.getApiKey();

		assert.strictEqual(retrievedKey, testKey, 'Retrieved key should match stored key');
	});

	test('Should return true when API key exists', async () => {
		const testKey = 'sk-test-key-67890';

		await configManager.setApiKey(testKey);
		const hasKey = await configManager.hasApiKey();

		assert.strictEqual(hasKey, true, 'Should have API key after storing');
	});

	test('Should clear API key successfully', async () => {
		const testKey = 'sk-test-key-clear';

		await configManager.setApiKey(testKey);
		await configManager.clearApiKey();

		const hasKey = await configManager.hasApiKey();
		assert.strictEqual(hasKey, false, 'Should not have API key after clearing');
	});

	test('Should handle empty string API key', async () => {
		await configManager.setApiKey('');
		const hasKey = await configManager.hasApiKey();

		assert.strictEqual(hasKey, false, 'Empty string should be considered as no key');
	});

	test('Should return undefined when no API key is set', async () => {
		const retrievedKey = await configManager.getApiKey();
		assert.strictEqual(retrievedKey, undefined, 'Should return undefined when no key set');
	});

	suiteTeardown(async () => {
		await configManager.clearApiKey();
	});
});
