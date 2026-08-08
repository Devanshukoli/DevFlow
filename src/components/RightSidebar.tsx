import React from 'react';
import { Flame, ChevronRight, TrendingUp, Sparkles, Award } from 'lucide-react';
import { Question, Tag } from '../types';

interface RightSidebarProps {
  questions: Question[];
  tags: Tag[];
  onSelectQuestion: (question: Question) => void;
  onSelectTag: (tag: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  questions,
  tags,
  onSelectQuestion,
  onSelectTag,
}) => {
  // Sort hot questions by views/upvotes
  const hotQuestions = [...questions]
    .sort((a, b) => b.upvotes + b.views - (a.upvotes + a.views))
    .slice(0, 5);

  const topTags = [...tags]
    .sort((a, b) => b.questionCount - a.questionCount)
    .slice(0, 6);

  return (
    <aside className="hidden lg:block w-80 space-y-6">
      
      {/* Hot Questions Box */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Flame className="w-5 h-5 text-orange-500 fill-orange-500/20" />
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Top Hot Questions
          </h3>
        </div>

        <div className="space-y-3.5" id="hot-questions-list">
          {hotQuestions.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectQuestion(item)}
              className="w-full flex items-start justify-between gap-3 text-left group hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-xl transition-colors"
              id={`hot-question-${item.id}`}
            >
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 line-clamp-2 transition-colors">
                {item.title}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Popular Tags Box */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <TrendingUp className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Popular Tags
          </h3>
        </div>

        <div className="flex flex-wrap gap-2" id="popular-tags-list">
          {topTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => onSelectTag(tag.name)}
              className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 border border-slate-200/60 dark:border-slate-700/60 transition-all"
              id={`tag-badge-${tag.name}`}
            >
              <span>#{tag.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                {tag.questionCount}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* DevFlow Leaderboard Summary */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-5 h-5 text-amber-400" />
          <h4 className="font-bold text-sm text-amber-400 uppercase tracking-wider">
            Community Milestones
          </h4>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Over <strong>12,400+</strong> questions answered by <strong>4,800+</strong> verified core developers. Earn badges by contributing high quality answers.
        </p>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/50">
            <div className="font-extrabold text-amber-400 text-sm">98.4%</div>
            <div className="text-[10px] text-slate-400">Solved</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/50">
            <div className="font-extrabold text-orange-400 text-sm">&lt;15m</div>
            <div className="text-[10px] text-slate-400">Avg Time</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/50">
            <div className="font-extrabold text-emerald-400 text-sm">AI</div>
            <div className="text-[10px] text-slate-400">Assisted</div>
          </div>
        </div>
      </div>

    </aside>
  );
};
