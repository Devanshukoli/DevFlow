import { Question, User, Tag, JobPerk } from '../types';

export const CURRENT_USER: User = {
  id: 'usr_me',
  name: 'Devanshu Koli',
  username: 'devanshukoli',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  bio: 'Full-stack AI developer passionate about high-performance web systems, TypeScript, and cloud-native architecture.',
  location: 'San Francisco, CA',
  website: 'https://github.com/Devanshukoli',
  joinedAt: 'January 2024',
  reputation: 2840,
  badges: {
    gold: 4,
    silver: 18,
    bronze: 42
  },
  topTech: ['React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'Tailwind'],
  askedCount: 12,
  answeredCount: 38
};

export const MOCK_USERS: User[] = [
  CURRENT_USER,
  {
    id: 'usr_1',
    name: 'Sarah Drasner',
    username: 'sdras',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    bio: 'VP of User Experience, open source enthusiast, speaker, and author.',
    location: 'Seattle, WA',
    website: 'https://sarah.dev',
    joinedAt: 'March 2021',
    reputation: 15420,
    badges: { gold: 24, silver: 89, bronze: 140 },
    topTech: ['Vue', 'CSS', 'Animation', 'JavaScript'],
    askedCount: 15,
    answeredCount: 210
  },
  {
    id: 'usr_2',
    name: 'Alex Rivera',
    username: 'arivera_dev',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    bio: 'Staff Backend Engineer. Building distributed data pipelines and Rust services.',
    location: 'Austin, TX',
    joinedAt: 'November 2022',
    reputation: 8910,
    badges: { gold: 12, silver: 45, bronze: 90 },
    topTech: ['Rust', 'PostgreSQL', 'Docker', 'Go'],
    askedCount: 8,
    answeredCount: 142
  },
  {
    id: 'usr_3',
    name: 'Elena Rostova',
    username: 'elena_codes',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
    bio: 'AI researcher and PyTorch core contributor. Crafting LLM alignment algorithms.',
    location: 'Zurich, CH',
    joinedAt: 'February 2023',
    reputation: 11200,
    badges: { gold: 18, silver: 62, bronze: 105 },
    topTech: ['Python', 'PyTorch', 'Transformers', 'FastAPI'],
    askedCount: 5,
    answeredCount: 168
  },
  {
    id: 'usr_4',
    name: 'Marcus Chen',
    username: 'mchen_tech',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    bio: 'Senior Frontend Architect specializing in React Server Components & Micro-frontends.',
    location: 'Toronto, CA',
    joinedAt: 'August 2022',
    reputation: 6730,
    badges: { gold: 8, silver: 31, bronze: 64 },
    topTech: ['Next.js', 'React', 'GraphQL', 'Tailwind'],
    askedCount: 22,
    answeredCount: 95
  }
];

export const MOCK_TAGS: Tag[] = [
  {
    id: 'tag_1',
    name: 'react',
    description: 'React is a JavaScript library for building user interfaces maintained by Meta and community.',
    questionCount: 1420,
    isFollowed: true
  },
  {
    id: 'tag_2',
    name: 'typescript',
    description: 'TypeScript is a strongly typed programming language that builds on JavaScript.',
    questionCount: 1180,
    isFollowed: true
  },
  {
    id: 'tag_3',
    name: 'nextjs',
    description: 'The React Framework for the Web. Used by top companies to build server-rendered React applications.',
    questionCount: 940,
    isFollowed: true
  },
  {
    id: 'tag_4',
    name: 'python',
    description: 'High-level programming language emphasizes readability, dynamic typing, and automated memory management.',
    questionCount: 2150,
    isFollowed: false
  },
  {
    id: 'tag_5',
    name: 'tailwind',
    description: 'A utility-first CSS framework packed with classes that can be composed to build any design.',
    questionCount: 830,
    isFollowed: false
  },
  {
    id: 'tag_6',
    name: 'nodejs',
    description: 'Node.js is an open-source, cross-platform JavaScript runtime environment.',
    questionCount: 1650,
    isFollowed: false
  },
  {
    id: 'tag_7',
    name: 'express',
    description: 'Fast, unopinionated, minimalist web framework for Node.js applications.',
    questionCount: 520,
    isFollowed: false
  },
  {
    id: 'tag_8',
    name: 'gemini-api',
    description: 'Google Generative AI SDK and APIs for multimodal text, vision, and reasoning capabilities.',
    questionCount: 310,
    isFollowed: true
  }
];

export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q_1',
    title: 'How to fix React 19 Hydration Mismatch error with dynamic Server Components?',
    content: `I'm upgrading a Next.js 14 App Router project to Next.js 15 / React 19. When rendering client components with dynamic timestamps or browser-only APIs (\`window.localStorage\`), I get this error during SSR hydration:

\`\`\`bash
Uncaught Error: Hydration failed because the initial UI does not match what was rendered on the server.
Warning: Expected server HTML to contain a matching <div> in <div>.
\`\`\`

Here is my client component code:

\`\`\`tsx
"use client";

import { useState, useEffect } from "react";

export default function UserHeader() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  return (
    <div class="p-4 bg-slate-900 text-white">
      Current Theme: {theme}
    </div>
  );
}
\`\`\`

What is the idiomatic way to handle client-only state without causing hydration flashes or warnings in React 19?`,
    tags: ['react', 'nextjs', 'typescript', 'hydration'],
    author: MOCK_USERS[4],
    createdAt: '2 hours ago',
    views: 342,
    upvotes: 48,
    downvotes: 1,
    userVote: 'up',
    answersCount: 3,
    isSaved: true,
    hasAcceptedAnswer: true
  },
  {
    id: 'q_2',
    title: 'Optimizing Gemini Flash API response latency for streaming real-time chat apps',
    content: `We are integrating the \`@google/genai\` SDK in an Express backend proxying response streams to a React frontend via Server-Sent Events (SSE). 

While streaming works, we noticed a ~800ms Time-To-First-Token (TTFT) delay on cold starts. 

Here is our current setup:

\`\`\`typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function handleStreamResponse(req, res) {
  const responseStream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: req.body.prompt,
  });

  for await (const chunk of responseStream) {
    res.write(\`data: \${JSON.stringify({ text: chunk.text })}\\n\\n\`);
  }
  res.end();
}
\`\`\`

Are there specific connection pooling, model parameter tweaks, or pre-warm strategies recommended to cut down the TTFT to under 250ms?`,
    tags: ['gemini-api', 'nodejs', 'typescript', 'express'],
    author: CURRENT_USER,
    createdAt: '5 hours ago',
    views: 890,
    upvotes: 95,
    downvotes: 2,
    userVote: null,
    answersCount: 4,
    isSaved: false,
    hasAcceptedAnswer: false
  },
  {
    id: 'q_3',
    title: 'How to properly infer conditional return types in TypeScript 5.4 generic function wrappers?',
    content: `I'm writing a TypeScript utility wrapper that maps API error states to strongly typed discriminated unions. However, when passing generic constraints, TypeScript fails to narrow the conditional type correctly:

\`\`\`typescript
type ApiResponse<T> = 
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

function processPayload<T extends Record<string, any>>(
  input: T
): ApiResponse<T> {
  if (!input) {
    return { status: 'error', message: 'Payload empty' }; // TS2322 Error
  }
  return { status: 'success', data: input };
}
\`\`\`

Why is TypeScript raising \`Type '{ status: "error"; message: string; }' is not assignable to type 'ApiResponse<T>'\` and how can I resolve it without casting with \`as any\`?`,
    tags: ['typescript', 'react', 'javascript'],
    author: MOCK_USERS[2],
    createdAt: '1 day ago',
    views: 1240,
    upvotes: 112,
    downvotes: 0,
    userVote: null,
    answersCount: 5,
    isSaved: true,
    hasAcceptedAnswer: true
  },
  {
    id: 'q_4',
    title: 'Best practices for organizing Tailwind CSS v4 custom theme tokens and container queries',
    content: `With Tailwind CSS v4 introducing native \`@theme\` directives in CSS rather than \`tailwind.config.js\`, what is the cleanest method to define custom semantic color scales, typography scales, and container queries without duplicating \`@theme\` blocks across sub-modules?`,
    tags: ['tailwind', 'css', 'react'],
    author: MOCK_USERS[1],
    createdAt: '2 days ago',
    views: 650,
    upvotes: 34,
    downvotes: 0,
    userVote: null,
    answersCount: 2,
    isSaved: false,
    hasAcceptedAnswer: false
  }
];

export const MOCK_ANSWERS: Record<string, any[]> = {
  'q_1': [
    {
      id: 'ans_1',
      questionId: 'q_1',
      author: MOCK_USERS[1],
      content: `The error happens because \`localStorage\` is not available on the server during initial SSR HTML compilation. When the browser receives the server HTML, it finds no theme text (or a default theme), but the client re-render immediately evaluates \`localStorage\` resulting in a mismatch.

### Recommended Solution: Delayed Mount Flag

Use a simple \`mounted\` flag in \`useEffect\` so client-only state is read strictly after hydration completes:

\`\`\`tsx
"use client";

import { useState, useEffect } from "react";

export default function UserHeader() {
  const [theme, setTheme] = useState("dark");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) setTheme(savedTheme);
  }, []);

  if (!isMounted) {
    // Skeleton or match SSR default
    return <div class="p-4 bg-slate-900 text-white min-h-[56px] animate-pulse" />;
  }

  return (
    <div class="p-4 bg-slate-900 text-white">
      Current Theme: {theme}
    </div>
  );
}
\`\`\`

This guarantees 100% hydration consistency!`,
      createdAt: '1 hour ago',
      upvotes: 32,
      downvotes: 0,
      userVote: 'up',
      isAccepted: true
    },
    {
      id: 'ans_2',
      questionId: 'q_1',
      author: MOCK_USERS[2],
      content: `Alternatively, if you use React 19, you can use the \`suppressHydrationWarning\` attribute on the parent container if the value difference is purely cosmetic (like text dates or numbers):

\`\`\`tsx
<div suppressHydrationWarning className="p-4 bg-slate-900 text-white">
  Current Theme: {typeof window !== 'undefined' ? localStorage.getItem('theme') : 'dark'}
</div>
\`\`\``,
      createdAt: '30 mins ago',
      upvotes: 8,
      downvotes: 1,
      userVote: null,
      isAccepted: false
    }
  ],
  'q_2': [
    {
      id: 'ans_3',
      questionId: 'q_2',
      author: MOCK_USERS[3],
      content: `To achieve sub-200ms TTFT with \`@google/genai\`, apply these 3 optimizations:

1. **Reuse Client Instance**: Ensure \`new GoogleGenAI()\` is initialized ONCE globally, not inside the route request handler.
2. **System Instruction Pre-warming**: Move system instructions and response schema parameters out of prompt string concatenation.
3. **HTTP Keep-Alive**: Ensure HTTP agent reuse is active in Express Node environment.

\`\`\`typescript
import { GoogleGenAI } from "@google/genai";

// Initialize once globally
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function handleStreamResponse(req, res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const responseStream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: req.body.prompt,
    config: {
      temperature: 0.2, // Lower temperature reduces generation delay
    }
  });

  for await (const chunk of responseStream) {
    if (chunk.text) {
      res.write(\`data: \${JSON.stringify({ text: chunk.text })}\\n\\n\`);
    }
  }
  res.end();
}
\`\`\``,
      createdAt: '3 hours ago',
      upvotes: 42,
      downvotes: 0,
      userVote: 'up',
      isAccepted: false
    }
  ]
};

export const MOCK_JOBS: JobPerk[] = [
  {
    id: 'job_1',
    title: 'Senior Full-Stack AI Engineer',
    company: 'Vercel',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=100',
    location: 'Remote (US/Canada)',
    type: 'Full-time',
    salary: '$180,000 - $240,000',
    tags: ['Next.js', 'React', 'TypeScript', 'Node.js', 'AI'],
    description: 'Help build the next generation of web developer tools, AI SDK integrations, and edge runtime compute.',
    postedAt: '1 day ago'
  },
  {
    id: 'job_2',
    title: 'Staff Backend Systems Architect',
    company: 'Anthropic',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=100',
    location: 'San Francisco, CA / Hybrid',
    type: 'Full-time',
    salary: '$220,000 - $310,000',
    tags: ['Rust', 'Python', 'Distributed Systems', 'Kubernetes'],
    description: 'Architect reliable, high-throughput model serving infrastructure and real-time streaming engines.',
    postedAt: '3 days ago'
  },
  {
    id: 'job_3',
    title: 'Principal Developer Experience Advocate',
    company: 'Supabase',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=100',
    location: 'Remote (Global)',
    type: 'Remote',
    salary: '$160,000 - $210,000',
    tags: ['PostgreSQL', 'TypeScript', 'Open Source', 'Docs'],
    description: 'Empower developers worldwide through high quality tutorials, open source libraries, and community engagement.',
    postedAt: '4 days ago'
  }
];
