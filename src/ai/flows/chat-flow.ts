/**
 * @fileOverview A chatbot flow that answers questions based on provided context.
 */
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

// Define input and output schemas
const ChatInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })),
  prompt: z.string(),
});

const ChatOutputSchema = z.string();

// Define the main chat flow
const attendanceChatFlow = ai.defineFlow(
  {
    name: 'attendanceChatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async ({ history, prompt }) => {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'placeholder-key-for-build') {
      throw new Error('GEMINI_API_KEY tidak tersedia. Silakan konfigurasi API key di environment variables.');
    }

    try {
      // Convert history to the correct format for messages
      const messages = [
        ...history.map(h => ({
          role: h.role as 'user' | 'model',
          content: [{ text: h.content }],
        })),
        {
          role: 'user' as const,
          content: [{ text: prompt }],
        },
      ];

      const response = await ai.generate({
        model: googleAI.model('gemini-1.5-pro-latest'),
        system: `Anda adalah ElektroBot, asisten AI untuk aplikasi absensi sekolah AbsensiKu.
- Tugas utama Anda adalah menjawab pertanyaan pengguna HANYA BERDASARKAN data yang disediakan dalam prompt.
- JANGAN mencoba mencari data sendiri. Semua informasi yang Anda butuhkan sudah ada dalam prompt.
- Jawablah dengan ringkas dan jelas dalam Bahasa Indonesia.
- Jika data yang dibutuhkan untuk menjawab pertanyaan tidak ada dalam prompt, katakan dengan sopan bahwa Anda tidak memiliki informasi tersebut.
- Analisis data yang diberikan (terutama JSON) untuk memberikan jawaban yang akurat.`,
        messages: messages,
        config: {
          temperature: 0.2,
        },
      });

      return response.text;
    } catch (error: any) {
      console.error('Error in attendanceChatFlow:', error);
      
      // Return user-friendly error message
      if (error.message?.includes('API key')) {
        return 'Maaf, terjadi masalah dengan konfigurasi API. Silakan hubungi administrator.';
      } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
        return 'Maaf, layanan chatbot sedang mengalami pembatasan. Silakan coba lagi nanti.';
      } else {
        return 'Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi atau hubungi administrator.';
      }
    }
  }
);

// Export types and the main chat function
export type ChatInput = z.infer<typeof ChatInputSchema>;
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  try {
    return await attendanceChatFlow(input);
  } catch (error: any) {
    console.error('Error in chat function:', error);
    return 'Maaf, layanan chatbot tidak tersedia saat ini. Silakan coba lagi nanti.';
  }
}