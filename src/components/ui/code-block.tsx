import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  filename?: string;
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'typescript',
  showLineNumbers = true,
  filename,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split('\n');

  return (
    <div
      className={`rounded-lg border border-[#222f43] bg-[#0a0e14] overflow-hidden text-xs font-mono my-3 ${className}`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#111722] border-b border-[#1f2c3f] text-slate-400 select-none">
        <div className="flex items-center gap-2">
          {filename ? (
            <span className="text-slate-200 font-medium text-[12px]">{filename}</span>
          ) : (
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              {language}
            </span>
          )}
        </div>

        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-[#1a2433] text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 text-[11px]"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Container */}
      <div className="p-4 overflow-x-auto text-slate-200 leading-relaxed font-mono">
        {showLineNumbers ? (
          <table className="border-collapse w-full">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-[#111722]/60 rounded">
                  <td className="pr-4 text-right select-none text-slate-600 font-mono text-[11px] w-8">
                    {idx + 1}
                  </td>
                  <td className="whitespace-pre pl-2 text-slate-200">{line}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre className="whitespace-pre bg-transparent p-0 m-0 text-slate-200">
            <code>{code.trim()}</code>
          </pre>
        )}
      </div>
    </div>
  );
};
