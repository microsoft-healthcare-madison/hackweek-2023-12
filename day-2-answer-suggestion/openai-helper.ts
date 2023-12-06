import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_API_ORG,
});

export async function evaluateChatPromptGpt35(
  systemMessage: string,
  instructions: string,
  question: string
) {
  return evaluateChatPrompt("gpt-3.5-turbo-1106", systemMessage, instructions, question);
}

export async function evaluateChatPromptGpt4(
  systemMessage: string,
  instructions: string,
  question: string
) {
  return evaluateChatPrompt("gpt-4-1106-preview", systemMessage, instructions, question);
}

async function evaluateChatPrompt(
  model: string,
  systemMessage: string,
  instructions: string,
  question: string
) {

  let chatInputMessages: ChatCompletionMessageParam[] = [{
    role: "system",
    content:systemMessage
  }];
  if (instructions.length > 0)
  {
    chatInputMessages.push({
      role: "user",
      content: instructions,
    });
  }
  if (question.length > 0) {
    chatInputMessages.push({
      role: "user",
      content: question
    });
  }
  const response = await client.chat.completions.create({
    model: model,
    temperature: 0.9,
    response_format: { type: "json_object" },
    messages: chatInputMessages,
  });
  const ret = JSON.parse(response.choices[0].message.content!);
  return ret;
}
