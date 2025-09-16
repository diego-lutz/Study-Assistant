export type Theme = 'light' | 'dark';

export type Page = 'home' | 'study' | 'quiz' | 'history';

export type StudyMode = 'direct' | 'rag';

export type ToolLength = 'short' | 'medium' | 'detailed';

export interface StudyNote {
  id: string;
  type: 'explanation' | 'analogy' | 'analyze';
  length: ToolLength;
  originalText: string;
  generatedContent: string;
}

export interface TextChange {
  id:string;
  originalText: string;
  rephrasedText: string;
}

export interface StudySession {
  id: string;
  topic: string;
  mode: StudyMode;
  source: {
    type: 'ai' | 'file';
    name: string;
  };
  content: string;
  notes: StudyNote[];
  changes: TextChange[];
  createdAt: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}
