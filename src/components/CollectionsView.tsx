import React from 'react';
import { Bookmark, Sparkles } from 'lucide-react';
import { Question } from '../types';
import { QuestionCard } from './QuestionCard';

interface CollectionsViewProps {
  questions: Question[];
  onSelectQuestion: (question: Question) => void;
  onVote: (questionId: string, voteType: 'up' | 'down') => void;
  onToggleSave: (questionId: string) => void;
  onSelectTag: (tag: string) => void;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  questions,
  onSelectQuestion,
  onVote,
  onToggleSave,
  onSelectTag,
}) => {
  const savedQuestions = questions.filter((q) => q.isSaved);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
            <Bookmark className="w-5 h-5 fill-amber-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Saved Collections
          </h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Your bookmarked questions for quick reference and code snippets.
        </p>
      </div>

      {savedQuestions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <Bookmark className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Saved Questions Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click the bookmark icon on any question card in the feed to save it to your personal collection.
          </p>
        </div>
      ) : (
        <div className="space-y-4" id="saved-questions-list">
          {savedQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onSelectQuestion={onSelectQuestion}
              onVote={onVote}
              onToggleSave={onToggleSave}
              onSelectTag={onSelectTag}
            />
          ))}
        </div>
      )}
    </div>
  );
};
