import React, { useState, useEffect, useRef } from 'react';
import { StudySession, Page, ToolLength } from '../types';
import * as geminiService from '../services/geminiService';
import { PencilSquareIcon, ChatBubbleBottomCenterTextIcon, LightBulbIcon, DocumentMagnifyingGlassIcon, XMarkIcon, Cog6ToothIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';
import Spinner from './common/Spinner';

interface StudyScreenProps {
  session: StudySession;
  onUpdateSession: (session: StudySession) => void;
  navigate: (page: Page) => void;
}

type Tool = 'rephrase' | 'explain' | 'analogy' | 'analyze';

const StudyScreen: React.FC<StudyScreenProps> = ({ session, onUpdateSession, navigate }) => {
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toolLength, setToolLength] = useState<ToolLength>('medium');
  const [showLengthOptions, setShowLengthOptions] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<Range | null>(null);
  const lengthMenuRef = useRef<HTMLDivElement>(null);

  const handleToolClick = (tool: Tool) => {
    setActiveTool(tool);
    document.body.style.cursor = 'text';
  };

  const cancelSelection = () => {
    setActiveTool(null);
    setSelectedText('');
    rangeRef.current = null;
    document.body.style.cursor = 'default';
  };

  const handleMouseUp = () => {
    if (!activeTool || !contentRef.current) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      if (contentRef.current.contains(range.commonAncestorContainer)) {
        setSelectedText(selection.toString());
        rangeRef.current = range.cloneRange();
        processSelection(selection.toString());
      }
    }
  };

  const processSelection = async (text: string) => {
    if (!activeTool || !text) return;

    setIsProcessing(true);
    let result = '';
    try {
      switch (activeTool) {
        case 'explain':
          result = await geminiService.getExplanation(text, session.content, toolLength);
          onUpdateSession({ ...session, notes: [{ id: Date.now().toString(), type: 'explanation', originalText: text, generatedContent: result, length: toolLength }, ...session.notes] });
          break;
        case 'rephrase':
          result = await geminiService.getRephrase(text, toolLength);
          if (rangeRef.current) {
            rangeRef.current.deleteContents();
            const fragment = document.createRange().createContextualFragment(result);
            rangeRef.current.insertNode(fragment);
            onUpdateSession({ ...session, content: contentRef.current?.innerHTML || session.content, changes: [...session.changes, { id: Date.now().toString(), originalText: text, rephrasedText: result }] });
          }
          break;
        case 'analogy':
          result = await geminiService.getAnalogy(text, toolLength);
          onUpdateSession({ ...session, notes: [{ id: Date.now().toString(), type: 'analogy', originalText: text, generatedContent: result, length: toolLength }, ...session.notes] });
          break;
        case 'analyze':
          result = await geminiService.getAnalysis(text, toolLength);
          onUpdateSession({ ...session, notes: [{ id: Date.now().toString(), type: 'analyze', originalText: text, generatedContent: result, length: toolLength }, ...session.notes] });
          break;
      }
    } catch (error) {
      console.error(`Error with tool ${activeTool}:`, error);
      // Future enhancement: show an error toast to the user
    } finally {
      setIsProcessing(false);
      cancelSelection();
    }
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool, session, toolLength]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (lengthMenuRef.current && !lengthMenuRef.current.contains(event.target as Node)) {
        setShowLengthOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [lengthMenuRef]);

  const ToolButton = ({ tool, label, icon: Icon }: { tool: Tool; label: string; icon: React.ElementType }) => (
    <button
      onClick={() => handleToolClick(tool)}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm md:text-base md:px-4 ${activeTool === tool ? 'bg-primary-600 text-white scale-105 shadow-lg' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
    >
      <Icon className="h-5 w-5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  const LengthSelector = () => (
    <div className="relative" ref={lengthMenuRef}>
      <button onClick={() => setShowLengthOptions(!showLengthOptions)} className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">
        <Cog6ToothIcon className="h-5 w-5" />
        <span className="capitalize hidden sm:inline">{toolLength}</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${showLengthOptions ? 'rotate-180' : ''}`} />
      </button>
      {showLengthOptions && (
        <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-gray-700 rounded-md shadow-lg z-50 border dark:border-gray-600">
          {(['short', 'medium', 'detailed'] as ToolLength[]).map(len => (
            <button
              key={len}
              onClick={() => { setToolLength(len); setShowLengthOptions(false); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 capitalize"
            >
              {len}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-grow">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="sticky top-[80px] bg-gray-50 dark:bg-gray-900 z-30 p-4 rounded-xl mb-6 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <ToolButton tool="rephrase" label="Rephrase" icon={PencilSquareIcon} />
                <ToolButton tool="explain" label="Explain" icon={ChatBubbleBottomCenterTextIcon} />
                <ToolButton tool="analogy" label="Analogy" icon={LightBulbIcon} />
                <ToolButton tool="analyze" label="Analyze" icon={DocumentMagnifyingGlassIcon} />
              </div>
              <div className="flex items-center space-x-2">
                 <LengthSelector />
                {activeTool && (
                  <button
                    onClick={cancelSelection}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                    <span className="hidden sm:inline">Cancel</span>
                  </button>
                )}
              </div>
            </div>
            {activeTool && <p className="text-center text-sm text-primary-600 dark:text-primary-400 mt-3 animate-pulse">Select text to {activeTool}...</p>}
          </div>

          <h2 className="text-3xl font-bold mb-2">{session.topic}</h2>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Source: <span className="font-semibold">{session.source.name}</span>
          </div>
          
          <div
            ref={contentRef}
            className="prose dark:prose-invert max-w-none text-lg leading-relaxed"
            dangerouslySetInnerHTML={{ __html: session.content }}
          />
        </div>
      </div>
      
      <Sidebar session={session} onUpdateSession={onUpdateSession} />

      {isProcessing && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="flex flex-col items-center bg-white dark:bg-gray-800 p-8 rounded-lg">
                <Spinner/>
                <p className="mt-4 text-lg">AI is thinking...</p>
            </div>
         </div>
      )}

    </div>
  );
};

export default StudyScreen;
