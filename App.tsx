
import React, { useState, useEffect, useCallback } from 'react';
import HomeScreen from './components/HomeScreen';
import StudyScreen from './components/StudyScreen';
import QuizPage from './components/QuizPage';
import HistoryScreen from './components/HistoryScreen';
import { Theme, StudySession, Page } from './types';
import { SunIcon, MoonIcon, BookOpenIcon, ClockIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'light';
  });
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem('studySessions');
      if (savedSessions) {
        setSessions(JSON.parse(savedSessions));
      }
    } catch (error) {
      console.error("Failed to load sessions from localStorage", error);
      setSessions([]);
    }
  }, []);

  const saveSessions = useCallback((updatedSessions: StudySession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem('studySessions', JSON.stringify(updatedSessions));
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const startNewSession = (session: StudySession) => {
    const newSession = { ...session, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const updatedSessions = [newSession, ...sessions];
    saveSessions(updatedSessions);
    setActiveSession(newSession);
    setCurrentPage('study');
  };
  
  const updateSession = (updatedSession: StudySession) => {
    const sessionIndex = sessions.findIndex(s => s.id === updatedSession.id);
    if (sessionIndex !== -1) {
      const updatedSessions = [...sessions];
      updatedSessions[sessionIndex] = updatedSession;
      saveSessions(updatedSessions);
      setActiveSession(updatedSession);
    }
  };

  const openSession = (sessionId: string) => {
    const sessionToOpen = sessions.find(s => s.id === sessionId);
    if (sessionToOpen) {
      setActiveSession(sessionToOpen);
      setCurrentPage('study');
    }
  };

  const deleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    saveSessions(updatedSessions);
    if (activeSession?.id === sessionId) {
      setActiveSession(null);
      setCurrentPage('home');
    }
  };


  const renderNav = () => (
    <nav className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center sticky top-0 z-40">
      <div className="flex items-center space-x-4">
        <BookOpenIcon className="h-8 w-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Study Assistant</h1>
      </div>
      <div className="flex items-center space-x-4">
        {activeSession && (
          <button
            onClick={() => setCurrentPage('quiz')}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <AcademicCapIcon className="h-5 w-5 mr-2" />
            Quiz
          </button>
        )}
        <button
          onClick={() => setCurrentPage('history')}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <ClockIcon className="h-5 w-5 mr-2" />
          History
        </button>
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          {theme === 'light' ? <MoonIcon className="h-6 w-6 text-gray-700" /> : <SunIcon className="h-6 w-6 text-yellow-400" />}
        </button>
      </div>
    </nav>
  );

  const renderPage = () => {
    switch (currentPage) {
      case 'study':
        return activeSession ? <StudyScreen session={activeSession} onUpdateSession={updateSession} navigate={setCurrentPage}/> : <HomeScreen onStartSession={startNewSession} />;
      case 'quiz':
        return activeSession ? <QuizPage session={activeSession} navigate={setCurrentPage} /> : <HomeScreen onStartSession={startNewSession} />;
      case 'history':
        return <HistoryScreen sessions={sessions} onOpenSession={openSession} onDeleteSession={deleteSession} />;
      case 'home':
      default:
        return <HomeScreen onStartSession={startNewSession} />;
    }
  };

  return (
    <div className={`min-h-screen ${theme}`}>
      <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen font-sans">
        {renderNav()}
        <main className="p-4 sm:p-6 lg:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
