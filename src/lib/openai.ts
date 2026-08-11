import OpenAI from "openai";

let client: OpenAI | null = null;

// Resolves OPENAI_API_KEY from the environment. Construction throws
// synchronously ("Missing credentials...") if it's unset — left to the
// caller to catch, so the API route can turn it into a friendly message.
export function getOpenAIClient(): OpenAI {
  if (!client) {
    client = new OpenAI();
  }
  return client;
}
