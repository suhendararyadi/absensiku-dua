'use client';

import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('prose prose-sm max-w-none', className)}>
      <ReactMarkdown
        components={{
        // Customize heading styles
        h1: ({ children }) => (
          <h1 className="text-lg font-bold mb-2 text-foreground">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold mb-2 text-foreground">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold mb-1 text-foreground">{children}</h3>
        ),
        
        // Customize paragraph styles
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 text-foreground leading-relaxed">{children}</p>
        ),
        
        // Customize list styles
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-2 space-y-1 text-foreground">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-2 space-y-1 text-foreground">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-foreground">{children}</li>
        ),
        
        // Customize emphasis styles
        strong: ({ children }) => (
          <strong className="font-bold text-foreground">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-foreground">{children}</em>
        ),
        
        // Customize code styles
        code: ({ children, className }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-foreground">
                {children}
              </code>
            );
          }
          return (
            <code className="block bg-muted p-2 rounded text-xs font-mono text-foreground whitespace-pre-wrap">
              {children}
            </code>
          );
        },
        
        // Customize blockquote styles
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-muted-foreground/20 pl-4 italic text-muted-foreground mb-2">
            {children}
          </blockquote>
        ),
        
        // Customize link styles
        a: ({ children, href }) => (
          <a 
            href={href} 
            className="text-primary hover:text-primary/80 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        
        // Remove default margins from the root
        div: ({ children }) => <div className="space-y-0">{children}</div>,
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}