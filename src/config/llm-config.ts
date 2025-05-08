/**
 * @fileOverview LLM Provider Configuration
 * Determines which LLM provider (Gemini or Llama) to use based on environment variables.
 */

// Define the possible LLM providers
export type LLMProvider = 'GEMINI' | 'LLAMA';

// Read the provider from the environment variable, default to 'GEMINI' if not set or invalid
const providerEnv = process.env.LLM_PROVIDER?.toUpperCase();
export const llmProvider: LLMProvider = (providerEnv === 'GEMINI' || providerEnv === 'LLAMA') ? providerEnv : 'GEMINI';

// Llama specific configuration (only relevant if llmProvider is 'LLAMA')
export const llamaApiEndpoint = process.env.LLAMA_API_ENDPOINT || '';
export const llamaApiKey = process.env.LLAMA_API_KEY || '';
export const llamaModelName = process.env.LLAMA_MODEL_NAME || 'meta-llama/Llama-4-Scout-17B-16E-Instruct'; // Default model

console.log(`[LLM Config] Using LLM Provider: ${llmProvider}`);
if (llmProvider === 'LLAMA') {
  if (!llamaApiEndpoint) {
    console.warn('[LLM Config] LLAMA provider selected, but LLAMA_API_ENDPOINT is not set.');
  }
  if (!llamaApiKey) {
    console.warn('[LLM Config] LLAMA provider selected, but LLAMA_API_KEY is not set.');
  }
   console.log(`[LLM Config] Llama Endpoint: ${llamaApiEndpoint}`);
   console.log(`[LLM Config] Llama Model: ${llamaModelName}`);
}
