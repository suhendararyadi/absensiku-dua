'use server';
/**
 * @fileOverview A chatbot flow that answers questions based on provided context.
 */
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import { UsageTracker } from '@/lib/usage-tracker';

// Define input and output schemas
const ChatInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })),
  prompt: z.string(),
  contextSummary: z.string().optional(), // Summary of previous conversation context
});

const ChatOutputSchema = z.string();

// Define the main chat flow
const attendanceChatFlow = ai.defineFlow(
  {
    name: 'attendanceChatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async ({ history, prompt, contextSummary }) => {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'placeholder-key-for-build') {
      throw new Error('GEMINI_API_KEY tidak tersedia. Silakan konfigurasi API key di environment variables.');
    }

    // Check rate limiting for Gemini 1.5 Flash free tier
    const rateLimitCheck = UsageTracker.checkRateLimit();
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.reason || 'Rate limit exceeded');
    }

    try {
      // Manage conversation context - keep only recent messages if history is too long
      let managedHistory = history;
      let contextPrefix = '';
      
      // If history is longer than 10 messages, keep only the last 6 and use context summary
      if (history.length > 10) {
        const recentHistory = history.slice(-6);
        managedHistory = recentHistory;
        
        if (contextSummary) {
          contextPrefix = `\n=== RINGKASAN PERCAKAPAN SEBELUMNYA ===\n${contextSummary}\n\n`;
        }
      }
      
      // Convert history to the correct format for messages
      const messages = [
        ...managedHistory.map(h => ({
          role: h.role as 'user' | 'model',
          content: [{ text: h.content }],
        })),
        {
          role: 'user' as const,
          content: [{ text: contextPrefix + prompt }],
        },
      ];

      const response = await ai.generate({
        model: googleAI.model('gemini-1.5-flash'),
        system: `Anda adalah ElektroBot, asisten AI cerdas untuk aplikasi absensi sekolah AbsensiKu.

## KEMAMPUAN UTAMA:
- Analisis data absensi siswa dan kelas secara mendalam
- Memberikan insight dan tren kehadiran
- Identifikasi pola absensi yang perlu perhatian
- Rekomendasi tindakan berdasarkan data
- Perhitungan statistik dan persentase kehadiran

## ATURAN ANALISIS:
1. SELALU gunakan HANYA data yang disediakan dalam prompt
2. Berikan analisis yang komprehensif dan kontekstual
3. Sertakan angka, persentase, dan statistik yang relevan
4. Identifikasi tren dan pola dalam data
5. Berikan rekomendasi praktis jika diminta
6. Gunakan format yang mudah dibaca dengan bullet points atau numbering

## GAYA KOMUNIKASI:
- Gunakan Bahasa Indonesia yang profesional namun ramah
- Berikan jawaban yang terstruktur dan informatif
- Sertakan konteks waktu (hari ini, minggu ini, dll)
- Highlight informasi penting dengan format yang jelas
- Jika data tidak tersedia, jelaskan dengan sopan dan sarankan alternatif
- PENTING: Pahami konteks percakapan sebelumnya dan rujuk ke informasi yang telah dibahas
- Gunakan kata ganti seperti "seperti yang saya sebutkan sebelumnya", "berdasarkan analisis tadi", dll untuk menunjukkan pemahaman konteks

## CONTOH ANALISIS:
- "Berdasarkan data 7 hari terakhir, tingkat kehadiran kelas 11A adalah 85% dengan 3 siswa yang sering tidak hadir"
- "Tren absensi menunjukkan peningkatan ketidakhadiran pada hari Senin sebesar 15%"
- "Siswa dengan status 'Sakit' paling banyak ditemukan di kelas 10B (5 kasus)"

## CONTOH RESPON KONTEKSTUAL:
- "Seperti yang saya analisis sebelumnya, kelas 11A memang memiliki masalah kehadiran..."
- "Berdasarkan pembahasan tadi tentang siswa yang sering tidak hadir, berikut rekomendasi tindakan..."
- "Melanjutkan analisis tren yang kita bahas, data menunjukkan..."

Jawablah dengan analisis yang mendalam dan actionable insights.`,
        messages: messages,
        config: {
          temperature: 0.3,
          maxOutputTokens: 150, // Batasi response untuk menghemat tokens di free tier
        },
      });

      // Track usage after successful response
      const tokensUsed = (response.usage?.inputTokens || 0) + (response.usage?.outputTokens || 0);
      UsageTracker.incrementUsage(tokensUsed);

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

// Function to create conversation summary
export async function createConversationSummary(messages: Array<{role: 'user' | 'model', content: string}>): Promise<string> {
  if (messages.length === 0) return '';
  
  try {
    const conversationText = messages.map(msg => 
      `${msg.role === 'user' ? 'Pengguna' : 'ElektroBot'}: ${msg.content}`
    ).join('\n\n');
    
    const summaryResponse = await ai.generate({
      model: googleAI.model('gemini-1.5-pro-latest'),
      system: `Anda adalah asisten yang membuat ringkasan percakapan. Buatlah ringkasan singkat dan padat dari percakapan berikut dalam Bahasa Indonesia. Fokus pada:
1. Topik utama yang dibahas
2. Data atau insight penting yang ditemukan
3. Pertanyaan atau analisis yang telah dilakukan
4. Kesimpulan atau rekomendasi yang diberikan

Ringkasan harus dalam 2-3 kalimat dan mempertahankan konteks penting untuk percakapan selanjutnya.`,
      messages: [{
        role: 'user' as const,
        content: [{ text: `Buatlah ringkasan dari percakapan berikut:\n\n${conversationText}` }]
      }],
      config: {
        temperature: 0.1,
      },
    });
    
    return summaryResponse.text;
  } catch (error) {
    console.error('Error creating conversation summary:', error);
    return 'Percakapan sebelumnya membahas analisis data absensi dan statistik kehadiran siswa.';
  }
}

export async function chat(input: ChatInput): Promise<ChatOutput> {
  try {
    return await attendanceChatFlow(input);
  } catch (error: any) {
    console.error('Error in chat function:', error);
    return 'Maaf, layanan chatbot tidak tersedia saat ini. Silakan coba lagi nanti.';
  }
}