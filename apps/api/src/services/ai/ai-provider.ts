export interface AIEvidenceItem {
  type: string;
  value: string;
  source: string;
}

export interface AIAnswerResult {
  answer: string;
  evidence: AIEvidenceItem[];
  confidence: string;
}

export interface AIProvider {
  generateAnswer(context: any, question: string): Promise<AIAnswerResult>;
}
