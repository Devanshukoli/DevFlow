import React, { useState } from 'react';
import { Tag as TagIcon, Search, Check, Plus } from 'lucide-react';
import { Tag } from '../types';

interface TagsViewProps {
  tags: Tag[];
  onSelectTag: (tagName: string) => void;
  onToggleFollowTag: (tagId: string) => void;
}

export const TagsView: React.FC<TagsViewProps> = ({
  tags,
  onSelectTag,
  onToggleFollowTag,
}) => {
  const [query, setQuery] = useState('');

  const filtered = tags.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          Tags Directory
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          A tag is a keyword or label that categorizes your question with other similar questions.
        </p>
      </div>

      {/* Tag Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter tags by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          id="tags-search-input"
        />
      </div>

      {/* Grid of Tags */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="tags-grid">
        {filtered.map((tag) => (
          <div
            key={tag.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all flex flex-col justify-between"
            id={`tag-card-${tag.id}`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onSelectTag(tag.name)}
                  className="px-3 py-1 rounded-lg text-sm font-bold bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 transition-colors"
                >
                  #{tag.name}
                </button>

                <button
                  onClick={() => onToggleFollowTag(tag.id)}
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                    tag.isFollowed
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  id={`follow-tag-btn-${tag.id}`}
                >
                  {tag.isFollowed ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                {tag.description}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400">
              {tag.questionCount} questions
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
