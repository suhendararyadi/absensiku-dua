'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ChatbotPage() {
  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex items-center justify-between space-y-2 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8" />
            Chatbot AI Absensi
          </h1>
          <p className="text-muted-foreground">
            Fitur chatbot sedang dalam pengembangan.
          </p>
        </div>
      </div>

      <Alert className="mb-6">
        <Bot className="h-4 w-4" />
        <AlertTitle>Fitur Dalam Pengembangan</AlertTitle>
        <AlertDescription>
          Chatbot AI untuk sistem absensi sedang dalam tahap pengembangan. 
          Fitur ini akan segera tersedia untuk membantu Anda dengan informasi 
          tentang kehadiran siswa, statistik kelas, dan pertanyaan lainnya 
          terkait absensi.
        </AlertDescription>
      </Alert>

      <Card className="h-[400px] flex flex-col">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Chat dengan AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Segera Hadir!</p>
            <p>Chatbot AI akan membantu Anda mengelola data absensi dengan lebih mudah.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}