
'use server';

/**
 * @fileOverview Implements a Genkit flow to select a winning number for the raffle.
 *
 * - selectWinningNumber - A function that selects a winning number between 1 and 100.
 * - SelectWinningNumberOutput - The return type for the selectWinningNumber function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SelectWinningNumberOutputSchema = z.object({
  winningNumber: z.number().describe('The winning number between 1 and 100.'),
});
export type SelectWinningNumberOutput = z.infer<typeof SelectWinningNumberOutputSchema>;


export async function selectWinningNumber(): Promise<SelectWinningNumberOutput> {
  return selectWinningNumberFlow();
}

const selectWinningNumberPrompt = ai.definePrompt({
  name: 'selectWinningNumberPrompt',
  output: {schema: SelectWinningNumberOutputSchema},
  prompt: `You are a provably fair number generator for a raffle.

  Pick a single winning number between 1 and 100 (inclusive) at random.
  Return the number in JSON format.
  Do not return any other text.`,
});

const selectWinningNumberFlow = ai.defineFlow(
  {
    name: 'selectWinningNumberFlow',
    outputSchema: SelectWinningNumberOutputSchema,
  },
  async () => {
    const {output} = await selectWinningNumberPrompt({});
    if (!output) {
        throw new Error('Failed to generate a winning number.');
    }
    return { winningNumber: output.winningNumber };
  }
);
