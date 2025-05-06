# MedScribeAI - Agentic Clinical Documentation Assistant

![MedScribeAI Landing Page](https://github.com/user/MedScribeAI/blob/main/docs/screenshot-landing.png?raw=true) <!-- Placeholder - Update with actual image if available -->

**MedScribeAI is an AI-powered clinical documentation assistant designed to reduce the administrative burden on healthcare providers by automating the creation of clinical notes.**

Built for the UST Hackathon, this application demonstrates how a multi-agent system can streamline the documentation process, allowing clinicians to focus more on patient care and less on paperwork.

## The Problem: Clinician Burnout & Documentation Overload

Healthcare professionals spend a significant amount of time on administrative tasks, particularly clinical documentation. This contributes to burnout, reduces time available for direct patient interaction, and can impact the quality of care. Manual note-taking is often tedious and prone to errors.

## The Solution: An Ambient AI Assistant

MedScribeAI leverages a sophisticated multi-agent system powered by Google's Genkit to automate the clinical documentation workflow:

1.  **Ambient Listening:** Passively captures the natural conversation between the clinician and patient during an encounter.
2.  **Real-time Transcription:** Converts the spoken conversation into text.
3.  **Intelligent Note Generation:** Automatically structures the transcript into a standardized SOAP (Subjective, Objective, Assessment, Plan) note format.
4.  **Billing Code Suggestion:** Recommends relevant CPT and ICD-10 codes based on the clinical documentation.
5.  **EHR Integration (Simulated):** Saves the finalized note and relevant clinical data (observations, encounters) back to a simulated Electronic Health Record (EHR) system powered by Firebase Firestore.

## The Multi-Agent Workflow

MedScribeAI employs specialized AI agents collaborating behind the scenes:

1.  **Pre-Visit Agent:**
    *   **Duty:** Retrieves and summarizes the patient's history (demographics, past diagnoses, recent observations, encounters) from the EHR (Firestore) before the visit.
    *   **Action:** Provides essential context to the clinician and downstream agents.

2.  **Real-Time Listening Agent (AI Scribe):**
    *   **Duty:** "Listens" to the patient encounter (simulated via audio input). Uses speech-to-text capabilities to transcribe the conversation.
    *   **Action:** Captures the raw dialogue of the visit.

3.  **Documentation Agent:**
    *   **Duty:** Takes the transcript and patient context (from the Pre-Visit Agent) to generate a structured SOAP note. Suggests relevant billing codes based on the note's content.
    *   **Action:** Produces the primary clinical documentation artifacts.

4.  **EHR Agent:**
    *   **Duty:** Interacts with the backend database (Firebase Firestore) to fetch patient data and save finalized notes, new observations (extracted from the note), and encounter summaries.
    *   **Action:** Manages data persistence and simulates integration with an EHR system.

5.  **(Future) Learning Agent:**
    *   **Duty:** (Conceptual) Monitors clinician edits and feedback to refine prompts and improve the accuracy and quality of generated notes and codes over time.
    *   **Action:** Enables continuous improvement of the AI system.

![Agent Workflow Diagram](https://github.com/user/MedScribeAI/blob/main/docs/workflow-diagram.png?raw=true) <!-- Placeholder - Update with actual image if available -->

## Key Features

*   **Patient Management:** Add, view, update, and delete patient records.
*   **Live Transcription:** Record audio during a simulated encounter and get it transcribed.
*   **Automated SOAP Note Generation:** Generate structured clinical notes from transcripts.
*   **Billing Code Suggestions:** Receive CPT and ICD-10 code recommendations.
*   **EHR Simulation:** View patient summaries, recent observations, and encounters fetched from Firebase Firestore. Save finalized notes and extracted data back to the database.
*   **Agent Visualization:** See the different agents working in sequence via an animated overlay.
*   **AI Assistant Chatbot:** Ask questions about the application and its features.
*   **Modern UI:** Clean, responsive interface built with Shadcn/ui and Tailwind CSS, featuring dark/light modes.
*   **Landing Page:** Informative entry point explaining the application's value.

## Technology Stack

*   **Frontend:** Next.js (App Router), React, TypeScript
*   **Styling:** Tailwind CSS, Shadcn/ui
*   **AI/LLM Orchestration:** Google Genkit
*   **Database (EHR Simulation):** Firebase Firestore
*   **State Management:** React Hooks (useState, useEffect, useCallback, useRef)
*   **Forms:** React Hook Form, Zod
*   **Animation:** Framer Motion

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/medscribe-ai.git
    cd medscribe-ai
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up Firebase:**
    *   Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
    *   Enable Firestore in your project.
    *   Create a Web App in your Firebase project settings.
    *   Copy the Firebase configuration object.
    *   Create a `.env.local` file in the root of the project and add your Firebase configuration keys:
        ```plaintext
        NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
        NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
        NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
        # NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID (Optional)
        ```
    *   **Important:** Set up Firestore Security Rules. For development, you can start with permissive rules (allow read, write), but **ensure you secure these properly for any production-like environment.**
        ```json
        // Example insecure rules for quick development (DO NOT USE IN PRODUCTION)
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /{document=**} {
              allow read, write: if true;
            }
          }
        }
        ```

4.  **Set up Google AI (Genkit):**
    *   Obtain a Google AI API key (e.g., for Gemini models) from [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Add the API key to your `.env.local` file:
        ```plaintext
        GOOGLE_GENAI_API_KEY=YOUR_GOOGLE_AI_API_KEY
        ```

5.  **Run the development server:**
    *   Run the Genkit development server in one terminal:
        ```bash
        npm run genkit:watch
        ```
    *   Run the Next.js development server in another terminal:
        ```bash
        npm run dev
        ```

6.  **Open the application:**
    Navigate to `http://localhost:9002` (or the specified port) in your browser.

## Disclaimer

This application was developed for the UST Hackathon and serves as a proof-of-concept. It uses synthetic patient data and simulates EHR interactions with Firebase Firestore. It has **not** undergone formal HIPAA compliance certification or security auditing. **Do not use real patient data with this application.**
