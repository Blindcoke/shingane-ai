import * as assert from 'assert';
import { EditOperationSchema } from '../types';

suite('Type Schema Test Suite', () => {
	test('Should validate correct EditOperation', () => {
		const validOperation = {
			summary: 'Add error handling',
			search: 'function test() {}',
			replace: 'function test() { try {} catch {} }'
		};

		const result = EditOperationSchema.safeParse(validOperation);
		assert.strictEqual(result.success, true, 'Valid operation should pass');

		if (result.success) {
			assert.strictEqual(result.data.summary, validOperation.summary);
			assert.strictEqual(result.data.search, validOperation.search);
			assert.strictEqual(result.data.replace, validOperation.replace);
		}
	});

	test('Should validate EditOperation with empty search', () => {
		const operationWithEmptySearch = {
			summary: 'Full file replacement',
			search: '',
			replace: 'new content here'
		};

		const result = EditOperationSchema.safeParse(operationWithEmptySearch);
		assert.strictEqual(result.success, true, 'Empty search should be valid');
	});

	test('Should reject operation missing summary', () => {
		const invalidOperation = {
			search: 'test',
			replace: 'new test'
		};

		const result = EditOperationSchema.safeParse(invalidOperation);
		assert.strictEqual(result.success, false, 'Missing summary should fail validation');
	});

	test('Should reject operation missing search', () => {
		const invalidOperation = {
			summary: 'Test',
			replace: 'new test'
		};

		const result = EditOperationSchema.safeParse(invalidOperation);
		assert.strictEqual(result.success, false, 'Missing search should fail validation');
	});

	test('Should reject operation missing replace', () => {
		const invalidOperation = {
			summary: 'Test',
			search: 'old test'
		};

		const result = EditOperationSchema.safeParse(invalidOperation);
		assert.strictEqual(result.success, false, 'Missing replace should fail validation');
	});

	test('Should reject operation with wrong types', () => {
		const invalidOperation = {
			summary: 123,
			search: true,
			replace: null
		};

		const result = EditOperationSchema.safeParse(invalidOperation);
		assert.strictEqual(result.success, false, 'Wrong types should fail validation');
	});
});
