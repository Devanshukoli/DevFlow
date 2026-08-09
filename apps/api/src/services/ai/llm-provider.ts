import { GoogleGenAI, Type } from "@google/genai";
import { AIProvider, AIAnswerResult } from "./ai-provider.js";

export class GeminiAIProvider implements AIProvider {
  private ai: GoogleGenAI | null = null;
  private modelName: string;

  constructor() {
    const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
    this.modelName = process.env.AI_MODEL || "gemini-3.6-flash";

    if (apiKey) {
      this.ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }

  async generateAnswer(context: any, question: string): Promise<AIAnswerResult> {
    if (!this.ai) {
      throw new Error("AI provider API key is not configured.");
    }

    let systemInstruction = `You are DevFlow, an advanced repository intelligence assistant.
Your absolute directive is to answer questions using ONLY the verified repository facts supplied in the context below.

DO NOT invent files, dependencies, frameworks, routes, architecture, or health findings.
If the supplied evidence/facts in the context do not contain enough information to answer the question, you MUST explicitly state that the available repository evidence is insufficient.
Do NOT fabricate an answer or assume/invent details not in the context.
Distinguish observed facts from reasonable interpretation.
When possible, list the exact evidence supporting your answer.
Do NOT claim to have executed any code.
Do NOT claim to have inspected files that were not supplied in the context.

Provide a clear, detailed, professional answer formatted as clean Markdown.`;

    if (context && context.questionIntent === "repository_overview") {
      systemInstruction += `

For repository overview or onboarding questions (e.g., "What is this repository?", "How is it structured?", "Where should I start?", "What should I know before diving in?"):
1. Act as a senior engineer giving a 30-second, high-density, professional codebase briefing. Do not give generic software engineering advice.
2. Synthesize the supplied verified facts (especially the detailed 'repositoryOverview' object if present) into a cohesive developer explanation.
3. Recommended general overview structure:
   - What this repository is (repository name, summary/description, languages, frameworks, app type).
   - How it is structured (frontend/backend boundaries, workspaces/monorepo, major directories, layout).
   - Main technologies, frameworks, and key dependencies.
   - Important architectural characteristics or signals.
   - Important entry points/components.
   - Where a developer should start exploring.
4. For "Where should I start?" questions, guide the user using README.md (for project purpose/setup), detected entry points, workspace boundaries, major directories, architecture signals, or package manifests. Outline a logical pathway.
5. For "How is this repository structured?" questions, synthesize the application type, monorepo/workspace details, major folders, entry points, languages, and frameworks.
6. For "What is this project?" questions, synthesize repo name, summary, technologies, and overall purpose.
7. For "What should I know before diving in?" questions, produce a concise onboarding briefing summarizing architecture, languages, frameworks, entry points, API surface, dependencies, and any high-severity health findings or risks.
8. Ground everything in the evidence. If a service or database (e.g., Redis, Postgres, etc.) is not mentioned in the context facts, do not claim it exists or is used!
9. If any specific detail or area is unknown, state "The current repository analysis did not identify..." instead of "There is no..." or fabricating a detail.`;
    }

    const prompt = `User Question: "${question}"

Structured Context:
${JSON.stringify(context, null, 2)}`;

    try {
      const response = await Promise.race([
        this.ai.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                answer: {
                  type: Type.STRING,
                  description: "The grounded markdown answer addressing the question based on the context facts.",
                },
                evidence: {
                  type: Type.ARRAY,
                  description: "List of exact matching items directly present in the context.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: {
                        type: Type.STRING,
                        description: "Type of the fact (e.g. framework, package, language, api_route, health, directory, workspace, file).",
                      },
                      value: {
                        type: Type.STRING,
                        description: "The name, path, or identifier of the fact (e.g. 'Express', 'apps/api/src/routes/auth.ts:42').",
                      },
                      source: {
                        type: Type.STRING,
                        description: "Always set to 'graph'.",
                      },
                    },
                    required: ["type", "value", "source"],
                  },
                },
                confidence: {
                  type: Type.STRING,
                  description: "Confidence level of the answer: 'high', 'medium', or 'low'. If evidence is insufficient, confidence must be 'low'.",
                },
              },
              required: ["answer", "evidence", "confidence"],
            },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("AI Provider request timed out.")), 15000)
        ),
      ]);

      const jsonText = response.text?.trim() || "{}";
      const result = JSON.parse(jsonText);

      return {
        answer: result.answer || "Insufficient evidence to answer this question.",
        evidence: Array.isArray(result.evidence) ? result.evidence : [],
        confidence: result.confidence || "low",
      };
    } catch (err: any) {
      console.error("[ai-provider] Error generating answer:", err);
      throw new Error(`AI_PROVIDER_UNAVAILABLE: ${err.message}`);
    }
  }
}

export class MockAIProvider implements AIProvider {
  async generateAnswer(context: any, question: string): Promise<AIAnswerResult> {
    const qLower = question.toLowerCase();

    // Check intent/keywords for deterministic mock behavior in tests
    if (qLower.includes("redis")) {
      return {
        answer: "The current repository evidence does not show Redis as a detected dependency or architecture component.",
        evidence: [],
        confidence: "low",
      };
    }

    if (qLower.includes("framework")) {
      const frameworkFacts = (context.facts || []).filter((f: any) => f.type === "framework");
      if (frameworkFacts.length > 0) {
        return {
          answer: `Based on the repository context, the following frameworks are used: ${frameworkFacts.map((f: any) => f.name).join(", ")}.`,
          evidence: frameworkFacts.map((f: any) => ({
            type: "framework",
            value: f.name,
            source: "graph",
          })),
          confidence: "high",
        };
      }
    }

    if (qLower.includes("express")) {
      return {
        answer: "The backend is structured using the Express framework.",
        evidence: [
          { type: "framework", value: "Express", source: "graph" },
          { type: "workspace", value: "apps/api", source: "graph" },
        ],
        confidence: "high",
      };
    }

    return {
      answer: `Mocked answer for: "${question}". Provided context contains ${context.facts?.length || 0} facts.`,
      evidence: (context.facts || []).slice(0, 3).map((f: any) => ({
        type: f.type || "unknown",
        value: f.name || f.path || f.title || "unknown",
        source: "graph",
      })),
      confidence: "high",
    };
  }
}
