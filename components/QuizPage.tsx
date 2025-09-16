
import React, { useState } from 'react';
import { StudySession, QuizQuestion, Page } from '../types';
import { getQuiz } from '../services/geminiService';
import Spinner from './common/Spinner';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface QuizPageProps {
  session: StudySession;
  navigate: (page: Page) => void;
}

type QuizStatus = 'idle' | 'generating' | 'taking' | 'finished';

const QuizPage: React.FC<QuizPageProps> = ({ session, navigate }) => {
  const [status, setStatus] = useState<QuizStatus>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateQuiz = async () => {
    setStatus('generating');
    setError(null);
    const quizQuestions = await getQuiz(session.topic, session.content);
    
    if (quizQuestions.length === 0) {
      // Bug Fix: Handle empty response gracefully
      setError('Failed to generate quiz. The AI could not create questions for this topic. Please go back and try again.');
      setStatus('idle');
    } else {
      setQuestions(quizQuestions);
      setUserAnswers(new Array(quizQuestions.length).fill(''));
      setCurrentQuestionIndex(0);
      setScore(0);
      setStatus('taking');
    }
  };

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Finish quiz
      let finalScore = 0;
      questions.forEach((q, index) => {
        if(userAnswers[index] === q.correctAnswer) {
          finalScore++;
        }
      });
      setScore(finalScore);
      setStatus('finished');
    }
  };

  const resetQuiz = () => {
    setStatus('idle');
    setQuestions([]);
    setError(null);
  };
  
  if (status === 'idle') {
    return (
      <div className="text-center max-w-2xl mx-auto">
        <button onClick={() => navigate('study')} className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:underline mb-8">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Study Session
        </button>
        <h2 className="text-3xl font-bold mb-4">Quiz Time: {session.topic}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">Test your knowledge on the study material. Click the button below to generate a quiz.</p>
        {error && (
            <div className="my-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative text-left" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}
        <button onClick={handleGenerateQuiz} className="bg-primary-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-primary-700 transition-colors">
          Generate Quiz
        </button>
      </div>
    );
  }

  if (status === 'generating') {
    return <div className="text-center"><Spinner /><p className="mt-2">Generating your quiz...</p></div>;
  }
  
  if (status === 'finished') {
    return (
      <div className="text-center max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold mb-4">Quiz Complete!</h2>
        <p className="text-5xl font-extrabold text-primary-600 mb-6">{score} / {questions.length}</p>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">You've successfully completed the quiz for "{session.topic}".</p>
        <div className="flex justify-center space-x-4">
            <button onClick={resetQuiz} className="bg-primary-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-700 transition-colors">
              Take Another Quiz
            </button>
            <button onClick={() => navigate('study')} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              Back to Study
            </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Question {currentQuestionIndex + 1} of {questions.length}</h2>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Topic: {session.topic}</span>
      </div>
      <p className="text-xl mb-8">{currentQuestion.question}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentQuestion.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswerSelect(option)}
            className={`p-4 rounded-lg text-left border-2 transition-all duration-200 ${
              userAnswers[currentQuestionIndex] === option
                ? 'bg-primary-100 dark:bg-primary-900 border-primary-500 ring-2 ring-primary-500'
                : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      
      <div className="mt-8 text-right">
        <button
          onClick={handleNextQuestion}
          disabled={!userAnswers[currentQuestionIndex]}
          className="bg-primary-600 text-white font-bold py-2 px-8 rounded-lg hover:bg-primary-700 disabled:bg-primary-300 dark:disabled:bg-primary-800 transition-colors"
        >
          {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Finish'}
        </button>
      </div>
    </div>
  );
};

export default QuizPage;
