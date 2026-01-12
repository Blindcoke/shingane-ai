import { z } from 'zod';

export type UserDecision = 'accept' | 'reject';

export interface FileEdit {
	search: string;
	replace: string;
}

/**
 * Zod schema for structured output.
 * API: https://js.langchain.com/docs/how_to/structured_output/
 */
export const EditOperationSchema = z.object({
	summary: z.string().describe('A brief description of the changes made.'),
	search: z.string().describe('The exact text to find and replace. To replace the entire file, this should be an empty string.'),
	replace: z.string().describe('The new text to replace the "search" text with.')
});

export type EditOperation = z.infer<typeof EditOperationSchema>;
