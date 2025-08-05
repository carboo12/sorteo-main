'use server';

/**
 * @fileOverview Implements a Genkit flow to select a winning number for the raffle.
 *
 * - selectWinningNumber - A function that selects a winning number between 1 and 100, ensuring it hasn't been selected in the current month.
 * - SelectWinningNumberOutput - The return type for the selectWinningNumber function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SelectWinningNumberOutputSchema = z.object({
  winningNumber: z.number().describe('The winning number between 1 and 100.'),
});
export type SelectWinningNumberOutput = z.infer<typeof SelectWinningNumberOutputSchema>;

let lastWinningNumber: number | null = null;
let lastWinningMonth: number | null = null;

export async function selectWinningNumber(): Promise<SelectWinningNumberOutput> {
  return selectWinningNumberFlow();
}

const selectWinningNumberPrompt = ai.definePrompt({
  name: 'selectWinningNumberPrompt',
  output: {schema: SelectWinningNumberOutputSchema},
  prompt: `You are a provably fair number generator for a raffle.

  Pick a single winning number between 1 and 100 (inclusive) at random.
  Ensure that the number has not been selected as the winning number in the current month.
  Return the number in JSON format.
  Do not return any other text.`,
});

const selectWinningNumberFlow = ai.defineFlow(
  {
    name: 'selectWinningNumberFlow',
    outputSchema: SelectWinningNumberOutputSchema,
  },
  async () => {
    let winningNumber: number;
    const currentMonth = new Date().getMonth();

    do {
      const {output} = await selectWinningNumberPrompt({});
      winningNumber = output!.winningNumber;
    } while (lastWinningMonth === currentMonth && winningNumber === lastWinningNumber);

    lastWinningNumber = winningNumber;
    lastWinningMonth = currentMonth;

    return {winningNumber};
  }
);
