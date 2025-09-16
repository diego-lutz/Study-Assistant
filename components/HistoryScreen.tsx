
import React from 'react';
import { StudySession } from '../types';
import { DocumentTextIcon, GlobeAltIcon, TrashIcon } from '@heroicons/react/24/outline';

interface HistoryScreenProps {
  sessions: StudySession[];
  onOpenSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ sessions, onOpenSession, onDeleteSession }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Study History</h2>
      
      {sessions.length === 0 ? (
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
          <p className="text-gray-600 dark:text-gray-300">No study sessions found. Start a new session to see it here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-3 rounded-full mr-4 ${session.mode === 'rag' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-purple-100 dark:bg-purple-900'}`}>
                  {session.mode === 'rag' ? (
                    <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                  ) : (
                    <GlobeAltIcon className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{session.topic}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Studied on {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onOpenSession(session.id)}
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
                >
                  Reopen
                </button>
                <button
                  onClick={() => onDeleteSession(session.id)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryScreen;
