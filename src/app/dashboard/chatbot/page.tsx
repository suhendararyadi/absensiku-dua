'use client';

import { useState, useEffect } from 'react';
import { chat, createConversationSummary } from '@/ai/flows/chat-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Bot, User, BrainCircuit, MessageSquare, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getClasses, getStudentsInClass, getAttendance, getAttendanceStats } from '@/lib/firestore-service';
import { QuickInsights } from '@/components/chatbot/quick-insights';
import { ConversationHistory } from '@/components/chatbot/conversation-history';
import { ContextIndicator } from '@/components/chatbot/context-indicator';
import { FollowUpSuggestions } from '@/components/chatbot/follow-up-suggestions';
import { MarkdownRenderer } from '@/components/chatbot/markdown-renderer';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ClassWithStudents {
  id: string;
  className: string;
  studentCount: number;
  students: {
    id: string;
    studentName: string;
    nisn: string;
  }[];
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [systemStats, setSystemStats] = useState({ totalStudents: 0, totalClasses: 0 });
  const [conversationSummary, setConversationSummary] = useState<string>('');
  const { toast } = useToast();

  // Initialize suggested questions on component mount
  useEffect(() => {
    setSuggestedQuestions(generateSuggestedQuestions(0, 0));
  }, []);

  // Smart question suggestions based on current data
  const generateSuggestedQuestions = (classesCount: number, totalStudents: number) => {
    const suggestions = [
      "Berapa tingkat kehadiran keseluruhan minggu ini?",
      "Kelas mana yang memiliki tingkat absensi tertinggi?",
      "Siapa saja siswa yang sering tidak hadir?",
      "Tampilkan tren kehadiran 7 hari terakhir",
      "Berapa jumlah siswa yang sakit hari ini?",
      "Analisis pola absensi per hari dalam seminggu",
      "Bandingkan kehadiran bulan ini dengan bulan lalu",
      "Siswa mana yang belum pernah alfa?",
      "Rekomendasi tindakan untuk meningkatkan kehadiran"
    ];
    return suggestions.slice(0, 6); // Show 6 suggestions
  };

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
      let classesWithStudents: ClassWithStudents[] = [];
      if (Array.isArray(classesResult)) {
          classesWithStudents = await Promise.all(
              classesResult.map(async (cls): Promise<ClassWithStudents> => {
                  const studentsResult = await getStudentsInClass(cls.id);
                  return {
                      ...cls,
                      // Ensure students is always an array
                      students: Array.isArray(studentsResult) ? studentsResult : [],
                  };
              })
          );
      }
      
      // 3. Fetch recent attendance and statistics
      const attendance = await getAttendance({});
      const attendanceStats = await getAttendanceStats(7);
      const attendanceStats30Days = await getAttendanceStats(30);

      // 4. Calculate additional insights
      const totalStudents = classesWithStudents.reduce((sum, cls) => sum + cls.students.length, 0);
      const currentDate = new Date();
      const currentTime = currentDate.toLocaleTimeString('id-ID');
      const currentDay = currentDate.toLocaleDateString('id-ID', { weekday: 'long' });
      
      // 5. Construct a comprehensive data context for the AI
      const dataContext = `
        === KONTEKS SISTEM ABSENSI ABSENSIKU ===
        Waktu Saat Ini: ${currentDay}, ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })} pukul ${currentTime}
        Total Siswa di Sistem: ${totalStudents} siswa
        Total Kelas: ${classesWithStudents.length} kelas

        === STRUKTUR KELAS DAN SISWA ===
        ${JSON.stringify(classesWithStudents, null, 2)}

        === DATA ABSENSI DETAIL (7 HARI TERAKHIR) ===
        ${JSON.stringify(attendance, null, 2)}

        === STATISTIK ABSENSI (7 HARI TERAKHIR) ===
        ${JSON.stringify(attendanceStats, null, 2)}

        === STATISTIK ABSENSI (30 HARI TERAKHIR) ===
        ${JSON.stringify(attendanceStats30Days, null, 2)}

        === PANDUAN ANALISIS ===
        - Status absensi: Hadir, Sakit, Izin, Alfa
        - Waktu check-in dan check-out tersedia jika ada
        - Data dikelompokkan per tanggal, kelas, dan siswa
        - Gunakan statistik untuk memberikan insight yang mendalam
        - Identifikasi pola, tren, dan anomali dalam data
      `;

      // The history does not include the big data context prompt.
      const historyForModel = currentMessages.slice(0, -1); 
      
      // Create conversation summary if history is getting long
      let currentSummary = conversationSummary;
      if (historyForModel.length > 8 && historyForModel.length % 6 === 0) {
        try {
          const summaryMessages = historyForModel.slice(0, -2); // Don't include the very latest messages
          currentSummary = await createConversationSummary(summaryMessages);
          setConversationSummary(currentSummary);
        } catch (error) {
          console.error('Error creating summary:', error);
        }
      }

      // The prompt now includes the user's question AND the data context.
      const fullPrompt = `
        ${dataContext}
        ---
        Pertanyaan Pengguna: ${currentInput}
      `;
      
      const modelResponse = await chat({
        history: historyForModel,
        prompt: fullPrompt,
        contextSummary: currentSummary,
      });

      setMessages(prevMessages => [
        ...prevMessages,
        { role: 'model', content: modelResponse },
      ]);
      
      // Update system stats and generate new suggestions
      setSystemStats({ totalStudents, totalClasses: classesWithStudents.length });
      setSuggestedQuestions(generateSuggestedQuestions(classesWithStudents.length, totalStudents));
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Kesalahan',
        description: `Gagal mendapatkan respon dari AI: ${error.message}. Coba lagi.`
      });
      // Restore the old messages if the API call fails
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsightClick = (question: string) => {
    setInput(question);
  };

  const handleLoadConversation = (loadedMessages: Message[]) => {
    setMessages(loadedMessages);
  };

  const handleClearConversation = () => {
    setMessages([]);
    setInput('');
    setConversationSummary('');
  };

  return (
    <div className="container mx-auto p-6 h-[calc(100vh-80px)] flex flex-col gap-6">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 flex-1">
      <Alert className="mb-4 bg-primary/5 border-primary/20">
        <BrainCircuit className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary">ElektroBot: Asisten Cerdas</AlertTitle>
        <AlertDescription>
          ElektroBot dapat menganalisis data absensi secara mendalam dan memberikan insight yang actionable. Gunakan saran pertanyaan di bawah atau tanyakan apa saja tentang data absensi Anda.
        </AlertDescription>
      </Alert>
      
      <ContextIndicator 
        messageCount={messages.length}
        conversationSummary={conversationSummary}
        onClearContext={handleClearConversation}
      />
      

      
      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="flex-row items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <Bot className="h-8 w-8 text-primary" />
            <CardTitle>ElektroBot</CardTitle>
          </div>
          <ConversationHistory
            currentMessages={messages}
            onLoadConversation={handleLoadConversation}
            onClearConversation={handleClearConversation}
          />
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="space-y-4 pb-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full space-y-6 min-h-[400px]">
                  <div className="text-center text-muted-foreground">
                    <BrainCircuit size={48} className="mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Selamat datang di ElektroBot!</h3>
                    <p className="text-sm">Asisten AI cerdas untuk analisis data absensi</p>
                  </div>
                  
                  {suggestedQuestions.length > 0 && (
                    <div className="w-full max-w-2xl">
                      <h4 className="text-sm font-medium mb-3 text-center">💡 Saran Pertanyaan:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {suggestedQuestions.map((question, index) => (
                          <button
                            key={index}
                            onClick={() => setInput(question)}
                            className="text-left p-3 text-xs bg-muted/50 hover:bg-muted rounded-lg transition-colors border border-border/50 hover:border-border"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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
                    className={`rounded-lg px-4 py-3 max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground shadow-sm whitespace-pre-wrap'
                        : 'bg-muted border border-border/50 shadow-sm'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <div className="text-sm leading-relaxed">{message.content}</div>
                    ) : (
                      <MarkdownRenderer content={message.content} className="text-sm" />
                    )}
                    {message.role === 'model' && (
                      <div className="text-xs text-muted-foreground mt-2 opacity-60">
                        ElektroBot • {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && <User className="h-6 w-6 text-muted-foreground flex-shrink-0" />}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <Bot className="h-6 w-6 text-primary flex-shrink-0" />
                  <div className="bg-muted rounded-lg px-4 py-3 max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                      </div>
                      <span className="text-sm text-muted-foreground">ElektroBot sedang menganalisis...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Input Area */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLoading ? "ElektroBot sedang memproses..." : "Ketik pertanyaan Anda tentang absensi..."}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading}
              className="min-h-[44px] resize-none"
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
      
      {/* Follow-up Suggestions - Outside main chat area */}
      {messages.length > 0 && (
        <Card className="flex-shrink-0">
          <CardContent className="p-4">
            <FollowUpSuggestions 
              messages={messages}
              onSuggestionClick={setInput}
            />
          </CardContent>
        </Card>
      )}
       </div>
     </div>
   );
 }