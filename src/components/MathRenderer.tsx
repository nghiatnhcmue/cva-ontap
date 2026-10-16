'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

/**
 * Component render nội dung kết hợp văn bản thường, công thức Toán học KaTeX ($...$ hoặc $$...$$)
 * và khối mã nguồn lập trình (```lang ... ```)
 */
export default function MathRenderer({ content, className = '' }: MathRendererProps) {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    let text = content;

    // 1. Render khối code: ```lang ... ```
    text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const language = lang || 'code';
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      return `
        <div class="my-3 rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 text-slate-100 shadow-md">
          <div class="bg-slate-800/80 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-700">
            <span class="uppercase tracking-wider font-bold text-blue-400">${language}</span>
            <span class="text-[10px]">Syntax Highlighting</span>
          </div>
          <pre class="p-4 text-xs font-mono overflow-x-auto leading-relaxed"><code>${escapedCode}</code></pre>
        </div>
      `;
    });

    // 2. Render display math: $$ ... $$
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      try {
        return `<div class="my-2.5 overflow-x-auto py-1 text-center">${katex.renderToString(math.trim(), {
          displayMode: true,
          throwOnError: false,
        })}</div>`;
      } catch {
        return `$$${math}$$`;
      }
    });

    // 3. Render inline math: $ ... $
    text = text.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false,
        });
      } catch {
        return `$${math}$`;
      }
    });

    // 4. Render inline code: ` ... `
    text = text.replace(/`([^`\n]+?)`/g, (_, code) => {
      return `<code class="px-1.5 py-0.5 rounded-md bg-slate-100 text-blue-700 font-mono text-[11px] border border-slate-200">${code}</code>`;
    });

    return text;
  }, [content]);

  return (
    <div
      className={`math-rendered-content ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}

