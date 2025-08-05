# **App Name**: Sorteo Xpress

## Core Features:

- Raffle Grid Display: Display a grid of 100 numbers (1-100), where each number represents a raffle ticket.
- Number Selection & Name Input: Allow users to optionally enter a name when selecting a number.
- Turno-based Reset: Implement a system to ensure that numbers are available for sale each 'turno' (3 times a day) and are reset accordingly.
- Number Winner persistence: The winning number can repeat monthly only. The list should be filtered for new turnos.
- Winning Number Selection: Implement a provably fair system to pick one winning number between 1 and 100, each 'turno', while respecting the 'reset' schedule (a type of pseudo-random number generator or PRNG can be the 'tool' to implement it).
- Indicate winner and display logs: Indicate winning number on the UI. The application should show winning numbers of each previous turnos, including date and name.

## Style Guidelines:

- Primary color: Vibrant purple (#A050BE) to convey excitement and chance, inspired by classic game show aesthetics.
- Background color: Light purple (#F2E7FA), creating a soft and engaging backdrop.
- Accent color: Electric blue (#7DF9FF), to highlight selectable numbers and important CTAs.
- Body and headline font: 'Space Grotesk' (sans-serif) to give a modern tech look that is suitable for a raffle.
- Use simple, clear icons to indicate selected and winning numbers.
- Clear number grid with highlighted available/unavailable states.
- Subtle highlighting animation on the winning number.