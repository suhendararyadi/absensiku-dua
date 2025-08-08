
'use client';

import { useState, useEffect } from 'react';
import { chat } from '@/ai/flows/chat-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Bot, User, BrainCircuit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getClasses, getStudentsInClass, getAttendance } from '@/lib/firestore-service';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // 1. Fetch all classes
      const classesResult = await getClasses();

      // 2. For each class, fetch its students and structure the data
      let classesWithStudents = [];
      if (Array.isArray(classesResult)) {
          classesWithStudents = await Promise.all(
              classesResult.map(async (cls) => {
                  const studentsResult = await getStudentsInClass(cls.id);
                  return {
                      ...cls,
                      // Ensure students is always an array
                      students: Array.isArray(studentsResult) ? studentsResult : [],
                  };
              })
          );
      }
      
      // 3. Fetch recent attendance
      const attendance = await getAttendance({});

      // 4. Construct a detailed prompt for the AI, including the new structured data.
      const dataContext = `
        Berikut adalah data yang saya miliki. Gunakan informasi ini untuk menjawab pertanyaan pengguna.
        Tanggal Hari Ini: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

        Daftar Kelas dan Siswa di Dalamnya:
        ${JSON.stringify(classesWithStudents, null, 2)}

        Data Absensi Terbaru (7 hari terakhir):
        ${JSON.stringify(attendance, null, 2)}
      `;

      // The history does not include the big data context prompt.
      const historyForModel = currentMessages.slice(0, -1); 

      // The prompt now includes the user's question AND the data context.
      const fullPrompt = `
        ${dataContext}
        ---
        Pertanyaan Pengguna: ${currentInput}
      `;
      
      const modelResponse = await chat({
        history: historyForModel,
        prompt: fullPrompt,
      });

      setMessages(prevMessages => [
        ...prevMessages,
        { role: 'model', content: modelResponse },
      ]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Gagal mendapatkan respon dari AI: ${error.message}. Coba lagi.`
      });
      // Restore the old messages if the API call fails
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Alert className="mb-4 bg-primary/5 border-primary/20">
        <BrainCircuit className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary">ElektroBot: Asisten Cerdas</AlertTitle>
        <AlertDescription>
          Anda dapat bertanya tentang data absensi. Contoh: "Siapa saja yang sakit hari ini?", "Tampilkan absensi kelas 11B dalam 3 hari terakhir", atau "Cari absensi siswa bernama Alex di kelas 10A".
        </AlertDescription>
      </Alert>
      <Card className="h-[calc(100vh-220px)] flex flex-col">
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Bot className="h-8 w-8 text-primary" />
            <CardTitle>ElektroBot</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="flex justify-center items-center h-full">
                  <div className="text-center text-muted-foreground">
                    <BrainCircuit size={48} className="mx-auto" />
                    <p className="mt-2">Mulai percakapan dengan mengetik pertanyaan Anda di bawah.</p>
                  </div>
                </div>
              )}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.role === 'model' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[85%] whitespace-pre-wrap ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  {message.role === 'user' && <User className="h-6 w-6 text-muted-foreground flex-shrink-0" />}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <Bot className="h-6 w-6 text-primary flex-shrink-0" />
                  <div className="bg-muted rounded-lg px-4 py-2 max-w-[85%] flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ketik pertanyaan Anda tentang absensi..."
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
            />
            <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Kirim'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
