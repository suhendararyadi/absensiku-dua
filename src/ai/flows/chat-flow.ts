
'use server';
/**
 * @fileOverview A chatbot flow that answers questions based on provided context.
 */
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

// This flow no longer uses tools to fetch data.
// Data is now fetched on the client and passed directly in the prompt.

// Define the main chat flow
const attendanceChatFlow = ai.defineFlow(
  {
    name: 'attendanceChatFlow',
    inputSchema: z.object({
      history: z.array(z.object({
        role: z.enum(['user', 'model']),
        content: z.string(),
      })),
      prompt: z.string(), // The prompt will contain both the user's question and the data context
    }),
    outputSchema: z.string(),
  },
  async ({ history, prompt }) => {
    const response = await ai.generate({
      model: googleAI.model('gemini-1.5-pro-latest'),
      system: `Anda adalah ElektroBot, asisten AI untuk aplikasi absensi sekolah AbsensiKu.
- Tugas utama Anda adalah menjawab pertanyaan pengguna HANYA BERDASARKAN data yang disediakan dalam prompt.
- JANGAN mencoba mencari data sendiri. Semua informasi yang Anda butuhkan sudah ada dalam prompt.
- Jawablah dengan ringkas dan jelas dalam Bahasa Indonesia.
- Jika data yang dibutuhkan untuk menjawab pertanyaan tidak ada dalam prompt, katakan dengan sopan bahwa Anda tidak memiliki informasi tersebut.
- Analisis data yang diberikan (terutama JSON) untuk memberikan jawaban yang akurat.`,
      history: history.map(h => ({role: h.role, content: [{text: h.content}]})),
      prompt: prompt,
      config: {
        temperature: 0.2,
      },
    });

    return response.text;
  }
);

// Export types and the main chat function
export type ChatInput = z.infer<typeof attendanceChatFlow.inputSchema>;
export type ChatOutput = z.infer<typeof attendanceChatFlow.outputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return await attendanceChatFlow(input);
}
