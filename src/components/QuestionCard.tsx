import React from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Eye, Bookmark, CheckCircle2, Share2 } from 'lucide-react';
import { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  onSelectQuestion: (question: Question) => void;
  onVote: (questionId: string, voteType: 'up' | 'down') => void;
  onToggleSave: (questionId: string) => void;
  onSelectTag: (tag: string) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onSelectQuestion,
  onVote,
  onToggleSave,
  onSelectTag,
}) => {
  const voteScore = question.upvotes - question.downvotes;

  return (
    <article
      className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-orange-500/30 dark:hover:border-orange-500/30 transition-all group"
      id={`question-card-${question.id}`}
    >
      <div className="flex flex-col sm:flex-row items-start gap-4">
        
        {/* Voting Pillar */}
        <div className="flex sm:flex-col items-center gap-1 bg-slate-50 dark:bg-slate-800/60 p-2 sm:p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 shrink-0">
          <button
            onClick={() => onVote(question.id, 'up')}
            className={`p-1.5 rounded-lg transition-colors ${
              question.userVote === 'up'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-orange-500 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Upvote"
            id={`vote-up-btn-${question.id}`}
          >
            <ThumbsUp className="w-4 h-4" />
          </button>

          <span className={`text-xs font-bold px-1 my-0.5 ${
            voteScore > 0 ? 'text-orange-600 dark:text-orange-400' : voteScore < 0 ? 'text-rose-500' : 'text-slate-600 dark:text-slate-400'
          }`}>
            {voteScore}
          </span>

          <button
            onClick={() => onVote(question.id, 'down')}
            className={`p-1.5 rounded-lg transition-colors ${
              question.userVote === 'down'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Downvote"
            id={`vote-down-btn-${question.id}`}
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>

        {/* Main Card Content */}
        <div className="flex-1 min-w-0 space-y-3">
          
          {/* Header & Title */}
          <div className="flex items-start justify-between gap-3">
            <h2
              onClick={() => onSelectQuestion(question)}
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer line-clamp-2 leading-snug transition-colors"
            >
              {question.title}
            </h2>

            {/* Bookmark Action */}
            <button
              onClick={() => onToggleSave(question.id)}
              className={`p-2 rounded-xl border transition-all shrink-0 ${
                question.isSaved
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title={question.isSaved ? "Remove from collection" : "Save question"}
              id={`save-question-btn-${question.id}`}
            >
              <Bookmark className={`w-4 h-4 ${question.isSaved ? 'fill-amber-500' : ''}`} />
            </button>
          </div>

          {/* Snippet Content */}
          <p
            onClick={() => onSelectQuestion(question)}
            className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 cursor-pointer leading-relaxed"
          >
            {question.content.replace(/```[\s\S]*?```/g, '[Code snippet]').replace(/#+/g, '')}
          </p>

          {/* Tag Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {question.tags.map((tag) => (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTag(tag);
                }}
                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
                id={`card-tag-${tag}-${question.id}`}
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Meta Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
            
            {/* Author Info */}
            <div className="flex items-center gap-2">
              <img
                src={question.author.avatar}
                alt={question.author.name}
                className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {question.author.name}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-400">{question.createdAt}</span>
            </div>

            {/* Answer & View Counters */}
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-1.5 font-medium px-2 py-1 rounded-md ${
                  question.hasAcceptedAnswer
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : question.answersCount > 0
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-400'
                }`}
              >
                {question.hasAcceptedAnswer ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <MessageSquare className="w-3.5 h-3.5" />
                )}
                <span>{question.answersCount} answers</span>
              </div>

              <div className="flex items-center gap-1 text-slate-400">
                <Eye className="w-3.5 h-3.5" />
                <span>{question.views} views</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </article>
  );
};
