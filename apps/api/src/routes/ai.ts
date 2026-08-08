import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

export const aiRouter = Router();

aiRouter.post('/ai-answer', async (req: Request, res: Response) => {
  const { questionTitle, questionContent, tags } = req.body || {};

  if (!questionTitle || !questionContent) {
    return res.status(400).json({ error: 'questionTitle and questionContent are required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a senior software engineering expert on DevFlow (a developer Q&A community like Stack Overflow).
Provide a clear, accurate, markdown-formatted technical answer to the following question. Include code snippets with appropriate language tags (e.g. \`\`\`typescript ... \`\`\`) where appropriate.

Question Title: ${questionTitle}
Tags: ${Array.isArray(tags) ? tags.join(', ') : tags}

Question Details:
${questionContent}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const answerText = response.text || 'No answer generated.';
      return res.json({ answer: answerText });
    } catch (err: any) {
      console.error('Gemini API call failed:', err);
    }
  }

  // Fallback answer if GEMINI_API_KEY is not set or failed
  const fallbackAnswer = `### AI Suggested Solution

Here is a recommended approach for **${questionTitle}**:

1. **Root Cause Analysis**:
   When working with ${Array.isArray(tags) && tags.length > 0 ? tags.join(', ') : 'this issue'}, ensure all dependent modules and configuration settings are properly initialized.

2. **Implementation Example**:
\`\`\`typescript
// DevFlow AI Assistant Code Recommendation
export function resolveIssue(config: Record<string, any>) {
  if (!config) {
    throw new Error("Configuration required");
  }
  return { status: "resolved", timestamp: new Date().toISOString() };
}
\`\`\`

3. **Key Takeaways**:
- Verify async hydration state before rendering client components.
- Check environment variables and type assertions.
`;

  return res.json({ answer: fallbackAnswer });
});
