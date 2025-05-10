/**
 * @fileOverview LLM Provider Configuration
 * Determines which LLM provider (Gemini, Llama OpenAI SDK, or Llama Azure SDK) to use based on environment variables.
 */

// Define the possible LLM providers
export type LLMProvider = 'GEMINI' | 'LLAMA' | 'LLAMA_AZURE';

// Read the provider from the environment variable, default to 'GEMINI' if not set or invalid
const providerEnv = process.env.LLM_PROVIDER?.toUpperCase();
export const llmProvider: LLMProvider = 
    (providerEnv === 'GEMINI' || providerEnv === 'LLAMA' || providerEnv === 'LLAMA_AZURE') 
    ? providerEnv 
    : 'GEMINI';

// --- Llama (OpenAI SDK Compatible) specific configuration ---
export const llamaApiEndpoint = process.env.LLAMA_API_ENDPOINT || ''; // Base URL for OpenAI SDK, e.g., "http://your-llama-ip:port/v1"
export const llamaApiKey = process.env.LLAMA_API_KEY || 'EMPTY'; // API key for Llama (OpenAI SDK)
export const llamaModelName = process.env.LLAMA_MODEL_NAME || 'meta-llama/Llama-4-Scout-17B-16E-Instruct'; // Default model for Llama (OpenAI SDK)

// --- Llama (Azure AI Inference) specific configuration ---
export const azureAiEndpoint = process.env.AZURE_AI_ENDPOINT || ''; // Azure AI Inference endpoint, e.g., "https://models.github.ai/inference"
export const azureAiKey = process.env.AZURE_AI_KEY || ''; // GitHub token or Azure key for Azure AI Inference
// We can reuse llamaModelName for Azure Llama as well, or define a separate AZURE_LLAMA_MODEL_NAME if needed.
// For now, let's assume llamaModelName is suitable if not overridden by a specific Azure model env var.
export const azureLlamaModelName = process.env.AZURE_LLAMA_MODEL_NAME || llamaModelName;


console.log(`[LLM Config] Using LLM Provider: ${llmProvider}`);

if (llmProvider === 'LLAMA') {
  if (!llamaApiEndpoint) {
    console.warn('[LLM Config] LLAMA (OpenAI SDK) provider selected, but LLAMA_API_ENDPOINT is not set. It should be the base URL (e.g., http://host:port/v1).');
  }
  if (!llamaApiKey || llamaApiKey === 'EMPTY') {
    console.warn('[LLM Config] LLAMA_API_KEY is not set or is empty for Llama (OpenAI SDK).');
  }
  console.log(`[LLM Config] Llama (OpenAI SDK) Endpoint: ${llamaApiEndpoint}`);
  console.log(`[LLM Config] Llama (OpenAI SDK) Model: ${llamaModelName}`);
  console.log(`[LLM Config] Llama (OpenAI SDK) API Key: ${llamaApiKey !== 'EMPTY' ? 'Provided' : 'Not Provided / Empty'}`);
} else if (llmProvider === 'LLAMA_AZURE') {
  if (!azureAiEndpoint) {
    console.warn('[LLM Config] LLAMA_AZURE provider selected, but AZURE_AI_ENDPOINT is not set.');
  }
  if (!azureAiKey) {
    console.warn('[LLM Config] LLAMA_AZURE provider selected, but AZURE_AI_KEY is not set.');
  }
  console.log(`[LLM Config] Llama (Azure AI) Endpoint: ${azureAiEndpoint}`);
  console.log(`[LLM Config] Llama (Azure AI) Model: ${azureLlamaModelName}`);
  console.log(`[LLM Config] Llama (Azure AI) Key: ${azureAiKey ? 'Provided' : 'Not Provided'}`);
}
