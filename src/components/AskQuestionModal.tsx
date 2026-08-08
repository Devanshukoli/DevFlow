import React, { useState } from 'react';
import { X, Plus, Sparkles, Tag, HelpCircle, Send } from 'lucide-react';
import { Tag as TagType } from '../types';

interface AskQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitQuestion: (title: string, content: string, tags: string[]) => void;
  availableTags: TagType[];
}

export const AskQuestionModal: React.FC<AskQuestionModalProps> = ({
  isOpen,
  onClose,
  onSubmitQuestion,
  availableTags,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['react', 'typescript']);

  if (!isOpen) return null;

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim().toLowerCase().replace(/^#/, '');
    if (clean && !selectedTags.includes(clean) && selectedTags.length < 5) {
      setSelectedTags([...selectedTags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDownTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || selectedTags.length === 0) return;

    onSubmitQuestion(title.trim(), content.trim(), selectedTags);
    setTitle('');
    setContent('');
    setSelectedTags(['react', 'typescript']);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      
      <div className="relative w-full max-w-2xl my-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-500/10 text-orange-600 rounded-lg">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Ask a Public Question
              </h2>
              <p className="text-xs text-slate-500">
                Be specific and imagine you are asking a question to another developer.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            id="close-ask-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Question Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Title <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. How to handle state hydration in Next.js App Router?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              id="ask-title-input"
            />
          </div>

          {/* Explanation / Code Details */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Detailed Explanation & Code <span className="text-orange-500">*</span>
            </label>
            <textarea
              required
              rows={6}
              placeholder="Explain what you are trying to achieve, what you have tried, and include code blocks using markdown ```typescript ... ```"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 leading-relaxed"
              id="ask-content-textarea"
            />
          </div>

          {/* Tag Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Tags (Up to 5) <span className="text-orange-500">*</span>
            </label>

            {/* Selected Tags Pills */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Tag Input */}
            <input
              type="text"
              placeholder="Type a tag name and press Enter..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDownTag}
              className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              id="ask-tag-input"
            />

            {/* Suggested Tag Quick Select */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400 py-1">Popular:</span>
              {availableTags.slice(0, 6).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleAddTag(t.name)}
                  className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-orange-500 transition-colors"
                >
                  +{t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={!title.trim() || !content.trim() || selectedTags.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 disabled:opacity-40 transition-all"
              id="submit-question-btn"
            >
              <Send className="w-4 h-4" />
              <span>Post Your Question</span>
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
