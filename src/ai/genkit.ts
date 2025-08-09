import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// The Google AI plugin looks for the GEMINI_API_KEY environment variable.
// We've set this in the .env file.
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
