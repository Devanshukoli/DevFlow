import React, { useEffect, useState } from 'react';
import { Navbar } from '../../../src/components/Navbar';
import { Sidebar } from '../../../src/components/Sidebar';
import { RightSidebar } from '../../../src/components/RightSidebar';
import { QuestionCard } from '../../../src/components/QuestionCard';
import { QuestionDetails } from '../../../src/components/QuestionDetails';
import { AskQuestionModal } from '../../../src/components/AskQuestionModal';
import { CollectionsView } from '../../../src/components/CollectionsView';
import { TagsView } from '../../../src/components/TagsView';
import { CommunityView } from '../../../src/components/CommunityView';
import { JobsView } from '../../../src/components/JobsView';
import { ProfileView } from '../../../src/components/ProfileView';

import { ActiveTab, FilterType, Question, Answer, Tag } from '../../../src/types';
import { CURRENT_USER, MOCK_USERS } from '../../../src/data/mockData';
import {
  getStoredQuestions,
  saveQuestions,
  getStoredAnswers,
  saveAnswers,
  getStoredTags,
  saveTags,
  filterAndSortQuestions,
} from '../../../src/utils/storage';

export default function App() {
  const [questions, setQuestions] = useState<Question[]>(() => getStoredQuestions());
  const [answersMap, setAnswersMap] = useState<Record<string, Answer[]>>(() => getStoredAnswers());
  const [tags, setTags] = useState<Tag[]>(() => getStoredTags());

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [filter, setFilter] = useState<FilterType>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isAskModalOpen, setIsAskModalOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Sync HTML class for dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Persist state changes
  useEffect(() => {
    saveQuestions(questions);
  }, [questions]);

  useEffect(() => {
    saveAnswers(answersMap);
  }, [answersMap]);

  useEffect(() => {
    saveTags(tags);
  }, [tags]);

  // Question selection handler
  const handleSelectQuestion = (q: Question) => {
    // Increment view count
    const updated = questions.map((item) =>
      item.id === q.id ? { ...item, views: item.views + 1 } : item
    );
    setQuestions(updated);
    const refreshed = updated.find((item) => item.id === q.id) || q;
    setSelectedQuestion(refreshed);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Vote question
  const handleVoteQuestion = (questionId: string, voteType: 'up' | 'down') => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;

        let newVote: 'up' | 'down' | null = voteType;
        let upDiff = 0;
        let downDiff = 0;

        if (q.userVote === voteType) {
          // Toggle off vote
          newVote = null;
          if (voteType === 'up') upDiff = -1;
          if (voteType === 'down') downDiff = -1;
        } else {
          if (q.userVote === 'up') upDiff = -1;
          if (q.userVote === 'down') downDiff = -1;

          if (voteType === 'up') upDiff += 1;
          if (voteType === 'down') downDiff += 1;
        }

        return {
          ...q,
          upvotes: Math.max(0, q.upvotes + upDiff),
          downvotes: Math.max(0, q.downvotes + downDiff),
          userVote: newVote,
        };
      })
    );

    if (selectedQuestion?.id === questionId) {
      setSelectedQuestion((prev) => {
        if (!prev) return null;

        let newVote: 'up' | 'down' | null = voteType;
        let upDiff = 0;
        let downDiff = 0;

        if (prev.userVote === voteType) {
          newVote = null;
          if (voteType === 'up') upDiff = -1;
          if (voteType === 'down') downDiff = -1;
        } else {
          if (prev.userVote === 'up') upDiff = -1;
          if (prev.userVote === 'down') downDiff = -1;

          if (voteType === 'up') upDiff += 1;
          if (voteType === 'down') downDiff += 1;
        }

        return {
          ...prev,
          upvotes: Math.max(0, prev.upvotes + upDiff),
          downvotes: Math.max(0, prev.downvotes + downDiff),
          userVote: newVote,
        };
      });
    }
  };

  // Bookmark / Save question
  const handleToggleSaveQuestion = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, isSaved: !q.isSaved } : q))
    );
    if (selectedQuestion?.id === questionId) {
      setSelectedQuestion((prev) => (prev ? { ...prev, isSaved: !prev.isSaved } : null));
    }
  };

  // Add new answer
  const handleAddAnswer = (questionId: string, content: string, isAiGenerated: boolean = false) => {
    const newAnswer: Answer = {
      id: `ans_${Date.now()}`,
      questionId,
      author: isAiGenerated
        ? {
            id: 'ai_bot',
            name: 'DevFlow AI',
            username: 'devflow_ai',
            avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
            bio: 'Automated software intelligence powered by Gemini models',
            joinedAt: '2024',
            reputation: 9999,
            badges: { gold: 50, silver: 120, bronze: 300 },
            topTech: ['AI', 'TypeScript', 'React', 'Node.js'],
            askedCount: 0,
            answeredCount: 1540,
          }
        : CURRENT_USER,
      content,
      createdAt: 'Just now',
      upvotes: isAiGenerated ? 5 : 0,
      downvotes: 0,
      isAccepted: false,
      isAiGenerated,
    };

    setAnswersMap((prev) => ({
      ...prev,
      [questionId]: [newAnswer, ...(prev[questionId] || [])],
    }));

    // Update question answer counter
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, answersCount: q.answersCount + 1 } : q))
    );

    if (selectedQuestion?.id === questionId) {
      setSelectedQuestion((prev) =>
        prev ? { ...prev, answersCount: prev.answersCount + 1 } : null
      );
    }
  };

  // Accept Answer
  const handleAcceptAnswer = (answerId: string) => {
    if (!selectedQuestion) return;

    setAnswersMap((prev) => {
      const currentList = prev[selectedQuestion.id] || [];
      const updatedList = currentList.map((ans) => ({
        ...ans,
        isAccepted: ans.id === answerId ? !ans.isAccepted : false,
      }));
      return { ...prev, [selectedQuestion.id]: updatedList };
    });

    setQuestions((prev) =>
      prev.map((q) =>
        q.id === selectedQuestion.id ? { ...q, hasAcceptedAnswer: true } : q
      )
    );

    setSelectedQuestion((prev) => (prev ? { ...prev, hasAcceptedAnswer: true } : null));
  };

  // Answer voting
  const handleVoteAnswer = (answerId: string, voteType: 'up' | 'down') => {
    if (!selectedQuestion) return;

    setAnswersMap((prev) => {
      const list = prev[selectedQuestion.id] || [];
      const updatedList = list.map((ans) => {
        if (ans.id !== answerId) return ans;

        let newVote: 'up' | 'down' | null = voteType;
        let upDiff = 0;
        let downDiff = 0;

        if (ans.userVote === voteType) {
          newVote = null;
          if (voteType === 'up') upDiff = -1;
          if (voteType === 'down') downDiff = -1;
        } else {
          if (ans.userVote === 'up') upDiff = -1;
          if (ans.userVote === 'down') downDiff = -1;

          if (voteType === 'up') upDiff += 1;
          if (voteType === 'down') downDiff += 1;
        }

        return {
          ...ans,
          upvotes: Math.max(0, ans.upvotes + upDiff),
          downvotes: Math.max(0, ans.downvotes + downDiff),
          userVote: newVote,
        };
      });
      return { ...prev, [selectedQuestion.id]: updatedList };
    });
  };

  // Post new question submit handler
  const handleCreateQuestion = (title: string, content: string, tagList: string[]) => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      title,
      content,
      tags: tagList,
      author: CURRENT_USER,
      createdAt: 'Just now',
      views: 1,
      upvotes: 0,
      downvotes: 0,
      answersCount: 0,
      isSaved: false,
      hasAcceptedAnswer: false,
    };

    setQuestions([newQuestion, ...questions]);

    // Update tags count
    setTags((prevTags) => {
      const nextTags = [...prevTags];
      tagList.forEach((tagName) => {
        const existingIndex = nextTags.findIndex(
          (t) => t.name.toLowerCase() === tagName.toLowerCase()
        );
        if (existingIndex >= 0) {
          nextTags[existingIndex] = {
            ...nextTags[existingIndex],
            questionCount: nextTags[existingIndex].questionCount + 1,
          };
        } else {
          nextTags.push({
            id: `tag_${Date.now()}_${tagName}`,
            name: tagName.toLowerCase(),
            description: `Questions related to ${tagName}`,
            questionCount: 1,
          });
        }
      });
      return nextTags;
    });

    setActiveTab('home');
    setSelectedQuestion(newQuestion);
  };

  // Tag click handler
  const handleSelectTag = (tagName: string) => {
    setSelectedTag(tagName);
    setActiveTab('home');
    setSelectedQuestion(null);
  };

  // Filtered Questions list
  const filteredQuestions = filterAndSortQuestions(questions, searchQuery, filter, selectedTag);
  const savedQuestions = questions.filter((q) => q.isSaved);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-orange-500/20 selection:text-orange-500">
      
      {/* Top Sticky Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedQuestion(null);
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onOpenAskModal={() => setIsAskModalOpen(true)}
        currentUser={CURRENT_USER}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main App Layout Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-8">
        
        {/* Left Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSelectedQuestion(null);
          }}
          onOpenAskModal={() => setIsAskModalOpen(true)}
          savedCount={savedQuestions.length}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
        />

        {/* Center Main View Container */}
        <main className="flex-1 min-w-0">
          
          {selectedQuestion ? (
            /* Single Question Detail View */
            <QuestionDetails
              question={selectedQuestion}
              answers={answersMap[selectedQuestion.id] || []}
              onBack={() => setSelectedQuestion(null)}
              onVoteQuestion={handleVoteQuestion}
              onVoteAnswer={handleVoteAnswer}
              onToggleSave={handleToggleSaveQuestion}
              onAddAnswer={handleAddAnswer}
              onAcceptAnswer={handleAcceptAnswer}
              currentUser={CURRENT_USER}
              onSelectTag={handleSelectTag}
            />
          ) : activeTab === 'collections' ? (
            /* Saved Collections View */
            <CollectionsView
              questions={questions}
              onSelectQuestion={handleSelectQuestion}
              onVote={handleVoteQuestion}
              onToggleSave={handleToggleSaveQuestion}
              onSelectTag={handleSelectTag}
            />
          ) : activeTab === 'tags' ? (
            /* Tags Explorer View */
            <TagsView
              tags={tags}
              onSelectTag={handleSelectTag}
              onToggleFollowTag={(tagId) => {
                setTags((prev) =>
                  prev.map((t) => (t.id === tagId ? { ...t, isFollowed: !t.isFollowed } : t))
                );
              }}
            />
          ) : activeTab === 'community' ? (
            /* Community Members & Perks View */
            <CommunityView users={MOCK_USERS} />
          ) : activeTab === 'find-jobs' ? (
            /* Developer Jobs View */
            <JobsView />
          ) : activeTab === 'profile' ? (
            /* User Profile View */
            <ProfileView
              user={CURRENT_USER}
              userQuestions={questions.filter((q) => q.author.id === CURRENT_USER.id)}
              onSelectQuestion={handleSelectQuestion}
              onVote={handleVoteQuestion}
              onToggleSave={handleToggleSaveQuestion}
              onSelectTag={handleSelectTag}
            />
          ) : (
            /* Home Question Feed View */
            <div className="space-y-6">
              
              {/* Active Filter Banner or Tag Header */}
              {selectedTag ? (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                      Showing questions tagged with:
                    </span>
                    <span className="text-sm font-bold px-2.5 py-0.5 rounded-lg bg-orange-500 text-white">
                      #{selectedTag}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    Clear Filter
                  </button>
                </div>
              ) : (
                /* Filter Bar */
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                      All Questions
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                      {filteredQuestions.length} {filteredQuestions.length === 1 ? 'question' : 'questions'} available
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    {(['newest', 'recommended', 'frequent', 'unanswered'] as FilterType[]).map(
                      (type) => (
                        <button
                          key={type}
                          onClick={() => setFilter(type)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                            filter === type
                              ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          {type}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Questions Feed Cards */}
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-12 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <p className="text-sm font-semibold text-slate-500">
                    No questions found matching your criteria.
                  </p>
                  <button
                    onClick={() => setIsAskModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs"
                  >
                    Be the first to ask a question!
                  </button>
                </div>
              ) : (
                <div className="space-y-4" id="question-feed-list">
                  {filteredQuestions.map((question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      onSelectQuestion={handleSelectQuestion}
                      onVote={handleVoteQuestion}
                      onToggleSave={handleToggleSaveQuestion}
                      onSelectTag={handleSelectTag}
                    />
                  ))}
                </div>
              )}

            </div>
          )}

        </main>

        {/* Right Sidebar (Hot Questions & Trending Tags) */}
        {!selectedQuestion && activeTab === 'home' && (
          <RightSidebar
            questions={questions}
            tags={tags}
            onSelectQuestion={handleSelectQuestion}
            onSelectTag={handleSelectTag}
          />
        )}

      </div>

      {/* Modal for Posting New Questions */}
      <AskQuestionModal
        isOpen={isAskModalOpen}
        onClose={() => setIsAskModalOpen(false)}
        onSubmitQuestion={handleCreateQuestion}
        availableTags={tags}
      />

    </div>
  );
}
