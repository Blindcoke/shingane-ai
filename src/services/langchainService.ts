/**
 * LangChain Service for Shingane AI
 * This module handles prompt construction and OpenAI integration using LangChain
 * with structured outputs via Zod schemas
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { EditOperation, EditOperationSchema } from '../types';

/**
 * Constructs a system prompt for the AI assistant
 */
function constructSystemPrompt(
	fileName: string,
	languageId: string,
	fileContent: string
): string {
	return `You are a helpful AI assistant integrated into VS Code via the Shingane AI extension.

		Current file: ${fileName}
		Language: ${languageId}

		File content:
		\`\`\`${languageId}
		${fileContent}
		\`\`\`

		INSTRUCTIONS:
		You must edit the current file by providing a "search" text and a "replace" text.

		CRITICAL RULES - READ CAREFULLY:
		1. ALWAYS prefer PARTIAL edits over full file replacement
		2. Copy the "search" text EXACTLY from the file - character by character, including all whitespace
		3. The "search" text should be the SMALLEST section that contains what you want to change
		4. The "replace" text should have the SAME indentation as the original "search" text
		5. DO NOT add extra leading spaces or tabs to the "replace" text
		6. Only use empty "search" (full file replacement) if the user explicitly asks to rewrite the entire file

		EXAMPLES:

		✓ GOOD - Partial edit with correct indentation:
		{
		"summary": "Add error handling to login function",
		"search": "async function login(user) {\\n  return api.post('/login', user);\\n}",
		"replace": "async function login(user) {\\n  try {\\n    return await api.post('/login', user);\\n  } catch (error) {\\n    console.error(error);\\n    throw error;\\n  }\\n}"
		}

		✗ BAD - Full file replacement (only when explicitly requested):
		{
		"summary": "Add error handling",
		"search": "",
		"replace": "entire file content here..."
		}

		✗ BAD - Extra indentation in replace text:
		{
		"summary": "Fix function",
		"search": "function test() {\\n  return 1;\\n}",
		"replace": "    function test() {\\n      return 2;\\n    }"
		}

		Remember: Match indentation exactly, prefer partial edits, copy search text precisely.`;
		}

/**
 * Generates AI response using OpenAI via LangChain.
 * Reference: https://js.langchain.com/docs/integrations/chat/openai
 */
export async function generateResponse(
	apiKey: string,
	userPrompt: string,
	fileName: string,
	languageId: string,
	fileContent: string,
	model: string = 'gpt-5-mini'
): Promise<EditOperation> {

	const chatModel = new ChatOpenAI({
		apiKey: apiKey,
		model: model,
		temperature: 1,
	});

	// API: withStructuredOutput - forces AI to return JSON matching schema
	// https://js.langchain.com/docs/how_to/structured_output/
	const structuredModel = chatModel.withStructuredOutput(EditOperationSchema);

	const systemPrompt = constructSystemPrompt(fileName, languageId, fileContent);
	const messages = [
		new SystemMessage(systemPrompt),
		new HumanMessage(userPrompt)
	];

	try {
		const response = await structuredModel.invoke(messages);
		return response as EditOperation;
	} catch (error) {
		console.error('[Shingane AI] Error generating response:', error);
		if (error instanceof Error) {
			if (error.message.includes('API key') || error.message.includes('401')) {
				throw new Error('Invalid API key. Please check your credentials.');
			}
			if (error.message.includes('rate limit') || error.message.includes('429')) {
				throw new Error('Rate limit reached. Please try again later.');
			}
			if (error.message.includes('quota') || error.message.includes('billing')) {
				throw new Error('Quota exceeded. Please check your OpenAI billing details.');
			}
		}
		throw new Error('Failed to get response from AI. Please check the console for details.');
	}
}
