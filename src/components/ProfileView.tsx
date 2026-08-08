import React from 'react';
import { User, Question } from '../types';
import { Award, MapPin, Globe, Calendar, MessageSquare, ThumbsUp, Code2, CheckCircle2 } from 'lucide-react';
import { QuestionCard } from './QuestionCard';

interface ProfileViewProps {
  user: User;
  userQuestions: Question[];
  onSelectQuestion: (question: Question) => void;
  onVote: (questionId: string, voteType: 'up' | 'down') => void;
  onToggleSave: (questionId: string) => void;
  onSelectTag: (tag: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  userQuestions,
  onSelectQuestion,
  onVote,
  onToggleSave,
  onSelectTag,
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-20 h-20 rounded-2xl object-cover border-4 border-orange-500/20 shadow-md shrink-0"
          />

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {user.name}
                </h1>
                <span className="text-xs font-mono text-slate-400">@{user.username}</span>
              </div>

              <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold text-sm">
                {user.reputation.toLocaleString()} Reputation Points
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {user.bio}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2">
              {user.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {user.location}
                </span>
              )}
              {user.website && (
                <a
                  href={user.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-orange-500 hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {user.website.replace('https://', '')}
                </a>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Joined {user.joinedAt}
              </span>
            </div>
          </div>
        </div>

        {/* Badges & Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
            <div className="text-xs text-slate-400 font-medium">Questions</div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              {user.askedCount}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
            <div className="text-xs text-slate-400 font-medium">Answers</div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              {user.answeredCount}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
            <div className="text-xs text-slate-400 font-medium">Gold Badges</div>
            <div className="text-lg font-extrabold text-amber-500 mt-1">
              🥇 {user.badges.gold}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
            <div className="text-xs text-slate-400 font-medium">Silver Badges</div>
            <div className="text-lg font-extrabold text-slate-400 mt-1">
              🥈 {user.badges.silver}
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Top Tech Stack
          </h3>
          <div className="flex flex-wrap gap-2">
            {user.topTech.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Asked Questions List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Asked Questions ({userQuestions.length})
        </h2>

        {userQuestions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
            You haven't asked any questions yet. Use the "Ask Question" button in the header!
          </div>
        ) : (
          userQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onSelectQuestion={onSelectQuestion}
              onVote={onVote}
              onToggleSave={onToggleSave}
              onSelectTag={onSelectTag}
            />
          ))
        )}
      </div>

    </div>
  );
};
