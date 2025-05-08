// This file imports all the Genkit flows and makes them available
// to the Genkit development tools (like the flow runner UI).

import '@/ai/flows/transcribe-patient-encounter'; // Always uses Gemini
import '@/ai/flows/generate-soap-note';       // Uses configured provider
import '@/ai/flows/generate-billing-codes';    // Uses configured provider
import '@/ai/flows/chatbot-flow';              // Uses configured provider
