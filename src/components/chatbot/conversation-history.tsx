'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { History, Trash2, Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ConversationSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

interface ConversationHistoryProps {
  currentMessages: Message[];
  onLoadConversation: (messages: Message[]) => void;
  onClearConversation: () => void;
}

export function ConversationHistory({ 
  currentMessages, 
  onLoadConversation, 
  onClearConversation 
}: ConversationHistoryProps) {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved sessions from localStorage
    const savedSessions = localStorage.getItem('chatbot-sessions');
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (error) {
        console.error('Error loading sessions:', error);
      }
    }
  }, []);

  const saveCurrentSession = () => {
    if (currentMessages.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Tidak ada percakapan',
        description: 'Tidak ada pesan untuk disimpan.'
      });
      return;
    }

    const firstUserMessage = currentMessages.find(m => m.role === 'user')?.content || 'Percakapan Baru';
    const title = firstUserMessage.length > 50 
      ? firstUserMessage.substring(0, 50) + '...' 
      : firstUserMessage;

    const newSession: ConversationSession = {
      id: Date.now().toString(),
      title,
      messages: [...currentMessages],
      timestamp: Date.now()
    };

    const updatedSessions = [newSession, ...sessions.slice(0, 9)]; // Keep only 10 most recent
    setSessions(updatedSessions);
    localStorage.setItem('chatbot-sessions', JSON.stringify(updatedSessions));

    toast({
      title: 'Percakapan disimpan',
      description: `"${title}" telah disimpan.`
    });
  };

  const loadSession = (session: ConversationSession) => {
    onLoadConversation(session.messages);
    toast({
      title: 'Percakapan dimuat',
      description: `"${session.title}" telah dimuat.`
    });
  };

  const deleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    localStorage.setItem('chatbot-sessions', JSON.stringify(updatedSessions));
    
    toast({
      title: 'Percakapan dihapus',
      description: 'Riwayat percakapan telah dihapus.'
    });
  };

  const exportConversation = () => {
    if (currentMessages.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Tidak ada data',
        description: 'Tidak ada percakapan untuk diekspor.'
      });
      return;
    }

    const conversationText = currentMessages
      .map(msg => `${msg.role === 'user' ? 'Pengguna' : 'ElektroBot'}: ${msg.content}`)
      .join('\n\n');
    
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `percakapan-elektrobot-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Percakapan diekspor',
      description: 'File percakapan telah diunduh.'
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          Riwayat
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Riwayat Percakapan</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={saveCurrentSession}>
          <Upload className="h-4 w-4 mr-2" />
          Simpan Percakapan Ini
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={exportConversation}>
          <Download className="h-4 w-4 mr-2" />
          Ekspor ke File
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onClearConversation}>
          <Trash2 className="h-4 w-4 mr-2" />
          Hapus Percakapan Saat Ini
        </DropdownMenuItem>
        
        {sessions.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Percakapan Tersimpan</DropdownMenuLabel>
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between px-2 py-1 hover:bg-muted rounded">
                <button
                  onClick={() => loadSession(session)}
                  className="flex-1 text-left text-sm truncate hover:text-primary"
                  title={session.title}
                >
                  <div className="truncate">{session.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(session.timestamp)}
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </>
        )}
        
        {sessions.length === 0 && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            Belum ada percakapan tersimpan
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}