
import React, { useState } from 'react';
import { StudySession } from '../types';
import * as geminiService from '../services/geminiService';
import Spinner from './common/Spinner';

interface HomeScreenProps {
  onStartSession: (session: StudySession) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartSession }) => {
  const [mode, setMode] = useState<'direct' | 'rag'>('direct');
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsText(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) {
      setError('Please enter a topic to study.');
      return;
    }
    if (mode === 'rag' && !file) {
      setError('Please upload a document for RAG mode.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let content = '';
      let sourceName = 'AI General Knowledge';

      if (mode === 'rag' && file) {
        // Simulate background processing
        await new Promise(res => setTimeout(res, 1000)); 
        const documentText = await readFileContent(file);
        content = await geminiService.generateStudyGuideRAG(topic, documentText);
        sourceName = file.name;
      } else {
        content = await geminiService.generateStudyGuideDirect(topic);
      }
      
      const newSession: Omit<StudySession, 'id' | 'createdAt'> = {
        topic,
        mode,
        source: {
            type: mode === 'rag' ? 'file' : 'ai',
            name: sourceName,
        },
        content,
        notes: [],
        changes: [],
      };

      onStartSession(newSession as StudySession);

    } catch (err) {
      setError('An error occurred while generating the study guide. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold text-gray-800 dark:text-white">Welcome to your Personal Tutor</h2>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Choose your study method to get started.</p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button onClick={() => setMode('direct')} className={`px-6 py-3 font-semibold text-lg flex-1 transition-colors duration-300 ${mode === 'direct' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 dark:text-gray-400 hover:text-primary-500'}`}>
            Gemini AI Direct
          </button>
          <button onClick={() => setMode('rag')} className={`px-6 py-3 font-semibold text-lg flex-1 transition-colors duration-300 ${mode === 'rag' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 dark:text-gray-400 hover:text-primary-500'}`}>
            From a Document (RAG)
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">What topic do you want to study?</label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., The French Revolution, Quantum Physics"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
            />
          </div>

          {mode === 'rag' && (
            <div className="mb-6">
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload your study material (.txt)</label>
              <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".txt,.md" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{fileName || 'TXT, MD up to 10MB'}</p>
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300 dark:disabled:bg-primary-800 transition-colors duration-300">
            {isLoading ? <Spinner /> : 'Start Studying'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HomeScreen;
