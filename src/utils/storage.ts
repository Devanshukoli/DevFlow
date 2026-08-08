import { Question, Answer, Tag, FilterType } from '../types';
import { MOCK_QUESTIONS, MOCK_ANSWERS, MOCK_TAGS, CURRENT_USER } from '../data/mockData';

const QUESTIONS_KEY = 'devflow_questions_v1';
const ANSWERS_KEY = 'devflow_answers_v1';
const TAGS_KEY = 'devflow_tags_v1';

export function getStoredQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(QUESTIONS_KEY);
    if (!raw) {
      localStorage.setItem(QUESTIONS_KEY, JSON.stringify(MOCK_QUESTIONS));
      return MOCK_QUESTIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading stored questions:', e);
    return MOCK_QUESTIONS;
  }
}

export function saveQuestions(questions: Question[]): void {
  try {
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
  } catch (e) {
    console.error('Failed saving questions:', e);
  }
}

export function getStoredAnswers(): Record<string, Answer[]> {
  try {
    const raw = localStorage.getItem(ANSWERS_KEY);
    if (!raw) {
      localStorage.setItem(ANSWERS_KEY, JSON.stringify(MOCK_ANSWERS));
      return MOCK_ANSWERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading stored answers:', e);
    return MOCK_ANSWERS;
  }
}

export function saveAnswers(answersMap: Record<string, Answer[]>): void {
  try {
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(answersMap));
  } catch (e) {
    console.error('Failed saving answers:', e);
  }
}

export function getStoredTags(): Tag[] {
  try {
    const raw = localStorage.getItem(TAGS_KEY);
    if (!raw) {
      localStorage.setItem(TAGS_KEY, JSON.stringify(MOCK_TAGS));
      return MOCK_TAGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading stored tags:', e);
    return MOCK_TAGS;
  }
}

export function saveTags(tags: Tag[]): void {
  try {
    localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
  } catch (e) {
    console.error('Failed saving tags:', e);
  }
}

export function filterAndSortQuestions(
  questions: Question[],
  searchQuery: string,
  filter: FilterType,
  selectedTag?: string | null
): Question[] {
  let result = [...questions];

  // Tag filter
  if (selectedTag) {
    result = result.filter((q) =>
      q.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase())
    );
  }

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  // Sorting
  switch (filter) {
    case 'newest':
      return result; // Order maintained or reverse timestamp
    case 'recommended':
      return result.sort((a, b) => b.upvotes - a.upvotes);
    case 'frequent':
      return result.sort((a, b) => b.views - a.views);
    case 'unanswered':
      return result.filter((item) => item.answersCount === 0);
    default:
      return result;
  }
}
