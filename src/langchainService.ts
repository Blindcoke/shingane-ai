/**
 * LangChain Service for Shingane AI
 * This module handles prompt construction and OpenAI integration using LangChain.
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

/**
 * Constructs a LangChain prompt combining file context and user instruction.
 *
 * The prompt structure:
 * - SystemMessage: Provides context about the file being analyzed
 * - HumanMessage: Contains the user's specific instruction/question
 * Reference: https://js.langchain.com/docs/modules/model_io/messages/
 */
export function constructPrompt(
	userPrompt: string,
	fileContent: string,
	fileName: string,
	languageId: string
) {
	const systemMessage = new SystemMessage(
		`You are a helpful AI assistant integrated into VS Code via the Shingane AI extension.
			You have access to the user's current file and can help with code-related questions, refactoring, explanations, and more.

			Current file: ${fileName}
			Language: ${languageId}

			File content:
			\`\`\`${languageId}
			${fileContent}
			\`\`\`

		Please provide helpful, accurate, and concise responses. When suggesting code changes, format them properly with markdown code blocks.`
	);

	const humanMessage = new HumanMessage(userPrompt);

	return [systemMessage, humanMessage];
}

/**
 * Generates AI response using OpenAI via LangChain.
 * Reference: https://js.langchain.com/docs/integrations/chat/openai
 */
export async function generateResponse(
	apiKey: string,
	messages: Array<SystemMessage | HumanMessage>,
	model: string = 'gpt-5-mini'
): Promise<string> {
	const chatModel = new ChatOpenAI({
		apiKey: apiKey,
		model: model,
		temperature: 1,
	});

	// Reference: https://js.langchain.com/docs/modules/model_io/chat/quick_start
	const response = await chatModel.invoke(messages);

	// Return the content as string
	return response.content.toString();
}
