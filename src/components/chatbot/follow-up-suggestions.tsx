'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Lightbulb, TrendingUp, Users, AlertTriangle } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface FollowUpSuggestionsProps {
  messages: Message[];
  onSuggestionClick: (suggestion: string) => void;
}

export function FollowUpSuggestions({ messages, onSuggestionClick }: FollowUpSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Array<{text: string, type: 'analysis' | 'action' | 'comparison' | 'detail', icon: any}>>([]);

  useEffect(() => {
    if (messages.length === 0) {
      setSuggestions([]);
      return;
    }

    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const lastModelMessage = messages.filter(m => m.role === 'model').pop();
    
    if (!lastUserMessage || !lastModelMessage) return;

    const contextualSuggestions = generateContextualSuggestions(lastUserMessage.content, lastModelMessage.content);
    setSuggestions(contextualSuggestions);
  }, [messages]);

  const generateContextualSuggestions = (userQuestion: string, modelResponse: string) => {
    const suggestions = [];
    const userLower = userQuestion.toLowerCase();
    const responseLower = modelResponse.toLowerCase();

    // Analisis berdasarkan pertanyaan sebelumnya
    if (userLower.includes('tingkat kehadiran') || userLower.includes('persentase')) {
      suggestions.push({
        text: "Bandingkan dengan periode sebelumnya",
        type: 'comparison' as const,
        icon: TrendingUp
      });
      suggestions.push({
        text: "Analisis faktor penyebab tingkat kehadiran ini",
        type: 'analysis' as const,
        icon: Lightbulb
      });
    }

    if (userLower.includes('kelas') && (userLower.includes('tertinggi') || userLower.includes('terendah'))) {
      suggestions.push({
        text: "Siapa saja siswa di kelas tersebut yang sering tidak hadir?",
        type: 'detail' as const,
        icon: Users
      });
      suggestions.push({
        text: "Rekomendasi tindakan untuk kelas ini",
        type: 'action' as const,
        icon: AlertTriangle
      });
    }

    if (userLower.includes('siswa') && userLower.includes('tidak hadir')) {
      suggestions.push({
        text: "Analisis pola absensi siswa-siswa tersebut",
        type: 'analysis' as const,
        icon: TrendingUp
      });
      suggestions.push({
        text: "Strategi untuk meningkatkan kehadiran mereka",
        type: 'action' as const,
        icon: Lightbulb
      });
    }

    if (userLower.includes('tren') || userLower.includes('pola')) {
      suggestions.push({
        text: "Prediksi tren untuk minggu depan",
        type: 'analysis' as const,
        icon: TrendingUp
      });
      suggestions.push({
        text: "Identifikasi hari dengan absensi tertinggi",
        type: 'detail' as const,
        icon: AlertTriangle
      });
    }

    // Analisis berdasarkan respons model
    if (responseLower.includes('sakit') || responseLower.includes('izin')) {
      suggestions.push({
        text: "Analisis lebih detail tentang alasan ketidakhadiran",
        type: 'analysis' as const,
        icon: Lightbulb
      });
    }

    if (responseLower.includes('rekomendasi') || responseLower.includes('saran')) {
      suggestions.push({
        text: "Bagaimana cara mengimplementasikan rekomendasi ini?",
        type: 'action' as const,
        icon: ArrowRight
      });
    }

    // Saran umum berdasarkan konteks
    if (suggestions.length < 3) {
      const generalSuggestions = [
        {
          text: "Tampilkan statistik kehadiran hari ini",
          type: 'detail' as const,
          icon: Users
        },
        {
          text: "Analisis perbandingan dengan bulan lalu",
          type: 'comparison' as const,
          icon: TrendingUp
        },
        {
          text: "Identifikasi siswa yang perlu perhatian khusus",
          type: 'action' as const,
          icon: AlertTriangle
        }
      ];
      
      suggestions.push(...generalSuggestions.slice(0, 3 - suggestions.length));
    }

    return suggestions.slice(0, 4); // Maksimal 4 saran
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'analysis': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'action': return 'bg-green-100 text-green-800 border-green-200';
      case 'comparison': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'detail': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'analysis': return 'Analisis';
      case 'action': return 'Tindakan';
      case 'comparison': return 'Perbandingan';
      case 'detail': return 'Detail';
      default: return 'Umum';
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <Card className="mt-4 border-dashed border-2 border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Pertanyaan Lanjutan yang Disarankan
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {suggestions.map((suggestion, index) => {
            const IconComponent = suggestion.icon;
            return (
              <Button
                key={index}
                variant="ghost"
                className="h-auto p-3 justify-start text-left hover:bg-blue-100 border border-transparent hover:border-blue-200 transition-all"
                onClick={() => onSuggestionClick(suggestion.text)}
              >
                <div className="flex items-start gap-3 w-full">
                  <IconComponent className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-0.5 ${getTypeColor(suggestion.type)}`}
                      >
                        {getTypeLabel(suggestion.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {suggestion.text}
                    </p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-blue-400 flex-shrink-0 mt-1" />
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}