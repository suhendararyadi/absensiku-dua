'use client';

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, ChevronDown, ChevronUp, Brain, Zap } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ContextIndicatorProps {
  messageCount: number;
  conversationSummary: string;
  onClearContext: () => void;
}

export function ContextIndicator({ messageCount, conversationSummary, onClearContext }: ContextIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (messageCount === 0) return null;

  const getContextLevel = () => {
    if (messageCount < 4) return { level: 'Basic', color: 'bg-green-50 border-green-200', icon: MessageSquare };
    if (messageCount < 8) return { level: 'Enhanced', color: 'bg-blue-50 border-blue-200', icon: Brain };
    return { level: 'Advanced', color: 'bg-purple-50 border-purple-200', icon: Zap };
  };

  const contextInfo = getContextLevel();
  const IconComponent = contextInfo.icon;

  return (
    <Alert className={`mb-4 ${contextInfo.color}`}>
      <IconComponent className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800 flex items-center justify-between">
        <span>🧠 Context Awareness Aktif</span>
        <Badge variant="secondary" className="ml-2">
          {contextInfo.level}
        </Badge>
      </AlertTitle>
      <AlertDescription className="text-blue-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              💬 {messageCount} pesan dalam percakapan
            </span>
            {conversationSummary && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Ringkasan konteks tersimpan
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {conversationSummary && (
              <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {isOpen ? 'Sembunyikan' : 'Lihat Ringkasan'}
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearContext}
              className="h-6 px-2 text-xs"
            >
              Reset Context
            </Button>
          </div>
        </div>
        
        {conversationSummary && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleContent>
              <div className="mt-3 p-3 bg-blue-100 rounded-md border border-blue-200">
                <div className="flex items-start gap-2">
                  <Brain className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-blue-800">Ringkasan Konteks:</strong>
                    <p className="text-sm text-blue-700 mt-1">{conversationSummary}</p>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        <div className="mt-2 text-xs text-blue-600">
          💡 ElektroBot memahami konteks percakapan dan dapat merujuk ke pembahasan sebelumnya
        </div>
      </AlertDescription>
    </Alert>
  );
}