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
// Ensure LLAMA_API_ENDPOINT is the base URL, e.g., "http://your-llama-ip:port/v1" for OpenAI SDK compatibility.
export const llamaApiEndpoint = process.env.LLAMA_API_ENDPOINT || '';
export const llamaApiKey = process.env.LLAMA_API_KEY || 'EMPTY'; // Default to "EMPTY" or as per API requirements
export const llamaModelName = process.env.LLAMA_MODEL_NAME || 'meta-llama/Llama-4-Scout-17B-16E-Instruct'; // Default model

console.log(`[LLM Config] Using LLM Provider: ${llmProvider}`);
if (llmProvider === 'LLAMA') {
  if (!llamaApiEndpoint) {
    console.warn('[LLM Config] LLAMA provider selected, but LLAMA_API_ENDPOINT is not set. It should be the base URL (e.g., http://host:port/v1).');
  }
  // API key might be optional or 'EMPTY' for some local setups, so warning is conditional.
  if (!llamaApiKey && process.env.NODE_ENV !== 'development') { // Example: Warn if API key is missing in non-dev
    console.warn('[LLM Config] LLAMA_API_KEY is not set or is empty.');
  }
   console.log(`[LLM Config] Llama Endpoint (baseURL for OpenAI SDK): ${llamaApiEndpoint}`);
   console.log(`[LLM Config] Llama Model: ${llamaModelName}`);
   console.log(`[LLM Config] Llama API Key: ${llamaApiKey ? 'Provided' : 'Not Provided / Empty'}`);
}
