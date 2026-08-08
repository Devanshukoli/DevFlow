import React, { useState } from 'react';
import { ArrowLeft, ThumbsUp, ThumbsDown, Bookmark, CheckCircle2, Sparkles, Send, Eye, Clock, Share2, Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Question, Answer, User } from '../types';

interface QuestionDetailsProps {
  question: Question;
  answers: Answer[];
  onBack: () => void;
  onVoteQuestion: (questionId: string, voteType: 'up' | 'down') => void;
  onVoteAnswer: (answerId: string, voteType: 'up' | 'down') => void;
  onToggleSave: (questionId: string) => void;
  onAddAnswer: (questionId: string, content: string, isAiGenerated?: boolean) => void;
  onAcceptAnswer: (answerId: string) => void;
  currentUser: User;
  onSelectTag: (tag: string) => void;
}

export const QuestionDetails: React.FC<QuestionDetailsProps> = ({
  question,
  answers,
  onBack,
  onVoteQuestion,
  onVoteAnswer,
  onToggleSave,
  onAddAnswer,
  onAcceptAnswer,
  currentUser,
  onSelectTag,
}) => {
  const [newAnswerText, setNewAnswerText] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const voteScore = question.upvotes - question.downvotes;

  // Post new user answer
  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswerText.trim()) return;
    onAddAnswer(question.id, newAnswerText.trim(), false);
    setNewAnswerText('');
  };

  // Generate AI Answer via server endpoint
  const handleGenerateAiAnswer = async () => {
    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionTitle: question.title,
          questionContent: question.content,
          tags: question.tags,
        }),
      });

      if (!res.ok) {
        throw new Error(`AI generation failed with status ${res.status}`);
      }

      const data = await res.json();
      if (data.answer) {
        onAddAnswer(question.id, data.answer, true);
      } else {
        throw new Error('No answer returned from AI API');
      }
    } catch (err: any) {
      console.error('AI generation error:', err);
      setAiError(err.message || 'Failed to generate AI response. Please try again.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const insertCodeSnippet = () => {
    setNewAnswerText((prev) => prev + '\n\n```typescript\n// Insert your code here\n```\n');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold transition-colors"
          id="back-to-feed-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleSave(question.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all ${
              question.isSaved
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            id={`detail-save-btn-${question.id}`}
          >
            <Bookmark className={`w-4 h-4 ${question.isSaved ? 'fill-amber-500' : ''}`} />
            <span>{question.isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
          {question.title}
        </h1>

        {/* Metadata bar */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <img
              src={question.author.avatar}
              alt={question.author.name}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {question.author.name}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Asked {question.createdAt}</span>
          </div>

          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{question.views} views</span>
          </div>
        </div>

        {/* Content body */}
        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed">
          <ReactMarkdown>{question.content}</ReactMarkdown>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 pt-2">
          {question.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onSelectTag(tag)}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-orange-500/10 hover:text-orange-600 transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Question Vote Bar & AI Generator Trigger */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <button
              onClick={() => onVoteQuestion(question.id, 'up')}
              className={`p-1.5 rounded-lg transition-colors ${
                question.userVote === 'up'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-500 hover:text-orange-500'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold px-2 text-slate-800 dark:text-slate-200">
              {voteScore}
            </span>
            <button
              onClick={() => onVoteQuestion(question.id, 'down')}
              className={`p-1.5 rounded-lg transition-colors ${
                question.userVote === 'down'
                  ? 'bg-rose-500 text-white'
                  : 'text-slate-500 hover:text-rose-500'
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>

          {/* AI Answer Banner Action */}
          <button
            onClick={handleGenerateAiAnswer}
            disabled={isGeneratingAi}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 active:scale-95 disabled:opacity-50 transition-all"
            id="generate-ai-answer-btn"
          >
            <Sparkles className={`w-4 h-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
            <span>{isGeneratingAi ? 'DevFlow AI thinking...' : 'Generate Answer with AI'}</span>
          </button>

        </div>

        {aiError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {aiError}
          </div>
        )}

      </div>

      {/* Answers Section Header */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
        </h2>
      </div>

      {/* Answers List */}
      <div className="space-y-4" id="answers-container">
        {answers.map((answer) => {
          const answerScore = answer.upvotes - answer.downvotes;
          return (
            <div
              key={answer.id}
              className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${
                answer.isAccepted
                  ? 'border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                  : answer.isAiGenerated
                  ? 'border-orange-500/40 bg-gradient-to-br from-orange-500/5 via-white dark:via-slate-900 to-amber-500/5'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
              id={`answer-card-${answer.id}`}
            >
              {/* Accepted / AI Badges */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <img
                    src={answer.author.avatar}
                    alt={answer.author.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {answer.author.name}
                      </span>
                      {answer.isAiGenerated && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                          <Sparkles className="w-3 h-3" /> AI Assistant
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{answer.createdAt}</span>
                  </div>
                </div>

                {answer.isAccepted && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Accepted Answer</span>
                  </div>
                )}
              </div>

              {/* Answer Content */}
              <div className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed text-sm">
                <ReactMarkdown>{answer.content}</ReactMarkdown>
              </div>

              {/* Answer Actions */}
              <div className="flex items-center justify-between gap-4 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <button
                    onClick={() => onVoteAnswer(answer.id, 'up')}
                    className={`p-1 rounded-lg ${
                      answer.userVote === 'up' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-orange-500'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold px-1.5">{answerScore}</span>
                  <button
                    onClick={() => onVoteAnswer(answer.id, 'down')}
                    className={`p-1 rounded-lg ${
                      answer.userVote === 'down' ? 'bg-rose-500 text-white' : 'text-slate-500 hover:text-rose-500'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {!answer.isAccepted && (
                  <button
                    onClick={() => onAcceptAnswer(answer.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark as Accepted Solution</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Post Answer Form */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Your Answer
          </h3>
          <button
            type="button"
            onClick={insertCodeSnippet}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Insert Code Block</span>
          </button>
        </div>

        <form onSubmit={handleSubmitAnswer} className="space-y-4">
          <textarea
            rows={5}
            placeholder="Write a clear, detailed answer with code examples..."
            value={newAnswerText}
            onChange={(e) => setNewAnswerText(e.target.value)}
            className="w-full p-4 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 font-sans"
            id="post-answer-textarea"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newAnswerText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 disabled:opacity-40 transition-all"
              id="submit-answer-btn"
            >
              <Send className="w-4 h-4" />
              <span>Post Answer</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
