// src/ai/genkit.ts
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Check if GEMINI_API_KEY is available
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey && typeof window === 'undefined') {
  console.warn('GEMINI_API_KEY not found in environment variables');
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey || 'placeholder-key-for-build',
    }),
  ],
  model: googleAI.model('gemini-1.5-flash'), // Set default model to free tier
});