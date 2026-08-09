import React, { useState } from "react";
import { Brain, HelpCircle, Send, Database, CheckCircle, AlertTriangle, ArrowRight, Activity } from "lucide-react";
import Markdown from "react-markdown";
import { getApiUrl } from "../../utils/api";

interface EvidenceItem {
  type: string;
  value: string;
  source: string;
}

interface AskResult {
  question: string;
  intent: string;
  answer: string;
  evidence: EvidenceItem[];
  confidence: string;
  contextStats?: {
    factsCount: number;
    relationshipsCount: number;
    queryType: string;
  };
}

interface AskDevFlowPanelProps {
  jobId: string;
}

export const AskDevFlowPanel: React.FC<AskDevFlowPanelProps> = ({ jobId }) => {
  const [question, setQuestion] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AskResult | null>(null);

  const suggestedQuestions = [
    "How is this repository structured?",
    "What frameworks does it use?",
    "Where are the API routes?",
    "What are the biggest health risks?",
    "Which packages are used by the backend?",
  ];

  const handleSubmit = async (qText: string) => {
    if (!qText.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl(`/api/analysis/${jobId}/ask`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: qText }),
      });

      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.error?.message || "An error occurred while generating an answer.");
      }

      setResult(json.data);
      setQuestion("");
    } catch (err: any) {
      console.error("[AskDevFlowPanel] Error asking question:", err);
      setError(err.message || "DevFlow could not generate an answer right now.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    const c = confidence.toLowerCase();
    if (c === "high") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (c === "medium") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-[#1e293b]/50 px-6 py-4 border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-emerald-400">ASK DEVFLOW</h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">What would you like to understand about this repository?</p>
          </div>
        </div>
        
        {/* Graph Context Indicator */}
        {result?.contextStats && (
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-400">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300 font-bold">GRAPH CONTEXT</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">{result.contextStats.factsCount} facts</span>
            <span>•</span>
            <span className="text-indigo-400">{result.contextStats.relationshipsCount} rels</span>
            <span>•</span>
            <span className="text-amber-400 uppercase">{result.contextStats.queryType} query</span>
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="p-6 space-y-6">
        {/* Suggested Questions */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Suggested Questions</span>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuestion(q);
                  handleSubmit(q);
                }}
                disabled={isAnalyzing}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:bg-slate-800/80 hover:border-slate-700/80 transition-all font-sans text-left disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Form Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(question);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about architecture, dependencies, frameworks, endpoints..."
              disabled={isAnalyzing}
              maxLength={500}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-slate-200 placeholder-slate-500 rounded-lg px-4 py-3 text-sm transition-all focus:outline-none"
            />
            <span className="absolute right-3 top-3 text-[10px] font-mono text-slate-600">
              {question.length}/500
            </span>
          </div>
          <button
            type="submit"
            disabled={!question.trim() || isAnalyzing}
            className="px-5 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10 disabled:opacity-50 disabled:hover:bg-emerald-500 disabled:shadow-none"
          >
            {isAnalyzing ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Ask</span>
              </>
            )}
          </button>
        </form>

        {/* Error Handling */}
        {error && (
          <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-lg text-rose-400 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">ANALYSIS ERROR</span>
              <p className="text-slate-300 font-sans">{error}</p>
            </div>
          </div>
        )}

        {/* Analyzing state message */}
        {isAnalyzing && (
          <div className="py-8 text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
            <p className="text-sm font-mono text-emerald-400 tracking-wider">Analyzing repository context...</p>
          </div>
        )}

        {/* Result Area */}
        {result && !isAnalyzing && (
          <div className="border-t border-[#1e293b] pt-6 space-y-6 animate-fadeIn">
            {/* Answer Display */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">DEVFLOW ANSWER</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <div className="prose prose-invert max-w-none text-slate-300 font-sans text-sm leading-relaxed bg-slate-950/60 p-5 rounded-lg border border-slate-900">
                <Markdown>{result.answer}</Markdown>
              </div>
            </div>

            {/* Evidence & Confidence Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Evidence Panel */}
              <div className="md:col-span-2 space-y-3">
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-bold block">EVIDENCE IN KNOWLEDGE GRAPH</span>
                {result.evidence.length === 0 ? (
                  <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-900/60 text-xs text-slate-500 font-mono">
                    No explicit relational facts were listed. Grounding confidence matches model logic.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.evidence.map((item, index) => {
                      const isFilePath = item.value.includes("/") || item.value.includes(".");
                      return (
                        <div
                          key={index}
                          className="px-3 py-2 bg-slate-950/50 border border-slate-900 rounded-lg flex items-center justify-between text-xs font-mono"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Database className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                            <span className="text-slate-400 text-[10px] capitalize font-bold flex-shrink-0">[{item.type}]:</span>
                            <span
                              className={`truncate font-sans ${
                                isFilePath ? "text-emerald-400 font-mono text-[11px]" : "text-slate-300 font-bold"
                              }`}
                              title={item.value}
                            >
                              {item.value}
                            </span>
                          </div>
                          {isFilePath && (
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono ml-2 flex-shrink-0">
                              path
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Confidence Panel */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold block">CONFIDENCE LEVEL</span>
                <div className={`p-4 rounded-lg border flex flex-col items-center justify-center text-center space-y-2 h-[100px] md:h-auto ${getConfidenceColor(result.confidence)}`}>
                  <span className="text-xs uppercase font-mono tracking-widest text-slate-400">STATE STATUS</span>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-lg font-black font-mono tracking-wider uppercase">{result.confidence}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
