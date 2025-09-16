import React, { useState, useEffect } from 'react';
import { StudySession, StudyNote } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, BeakerIcon, ArrowPathIcon, InformationCircleIcon, TrashIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import * as geminiService from '../services/geminiService';

interface SidebarProps {
  session: StudySession;
  onUpdateSession: (session: StudySession) => void;
}

type ActiveTab = 'workbench' | 'changes' | 'references';

const Sidebar: React.FC<SidebarProps> = ({ session, onUpdateSession }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('workbench');
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [loadingNotes, setLoadingNotes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // When session notes change, ensure new notes are expanded by default
    const newExpandedState = { ...expandedNotes };
    let hasChanged = false;
    session.notes.forEach(note => {
      if (newExpandedState[note.id] === undefined) {
        newExpandedState[note.id] = true;
        hasChanged = true;
      }
    });
    if (hasChanged) {
      setExpandedNotes(newExpandedState);
    }
  }, [session.notes]);


  const handleUndoChange = (changeId: string) => {
    const changeToUndo = session.changes.find(c => c.id === changeId);
    if (!changeToUndo) return;

    const newContent = session.content.replace(changeToUndo.rephrasedText, changeToUndo.originalText);
    const newChanges = session.changes.filter(c => c.id !== changeId);
    
    onUpdateSession({ ...session, content: newContent, changes: newChanges });
  };
  
  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = session.notes.filter(note => note.id !== noteId);
    onUpdateSession({ ...session, notes: updatedNotes });
  };
  
  const handleRedoNote = async (note: StudyNote) => {
    setLoadingNotes(prev => ({ ...prev, [note.id]: true }));
    let result = '';
    try {
        switch(note.type) {
            case 'explanation':
                result = await geminiService.getExplanation(note.originalText, session.content, note.length);
                break;
            case 'analogy':
                result = await geminiService.getAnalogy(note.originalText, note.length);
                break;
            case 'analyze':
                result = await geminiService.getAnalysis(note.originalText, note.length);
                break;
        }
        const updatedNotes = session.notes.map(n => {
            if (n.id === note.id) {
                return { ...n, generatedContent: result };
            }
            return n;
        });
        onUpdateSession({ ...session, notes: updatedNotes });
    } catch(error) {
        console.error("Failed to redo note:", error);
    } finally {
        setLoadingNotes(prev => ({ ...prev, [note.id]: false }));
    }
  };

  const toggleNoteExpansion = (noteId: string) => {
    setExpandedNotes(prev => ({ ...prev, [noteId]: !prev[noteId] }));
  };
  
  const NoteCard: React.FC<{note: StudyNote}> = ({ note }) => {
    const isExpanded = expandedNotes[note.id] ?? true;
    const isLoading = loadingNotes[note.id] ?? false;
    const typeTitle = note.type.charAt(0).toUpperCase() + note.type.slice(1);

    return (
      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg relative transition-all">
        {isLoading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center rounded-lg z-10">
                <svg className="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        )}
        <div className="flex justify-between items-start">
            <div className="flex-grow pr-2">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{typeTitle} of <span className="italic">"{note.originalText}"</span></p>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
                 <button onClick={() => toggleNoteExpansion(note.id)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-gray-500 dark:text-gray-400">
                    {isExpanded ? <ArrowsPointingInIcon className="h-4 w-4"/> : <ArrowsPointingOutIcon className="h-4 w-4"/>}
                 </button>
                 <button onClick={() => handleRedoNote(note)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-gray-500 dark:text-gray-400">
                    <ArrowPathIcon className="h-4 w-4"/>
                 </button>
                 <button onClick={() => handleDeleteNote(note.id)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-red-500">
                    <TrashIcon className="h-4 w-4"/>
                 </button>
            </div>
        </div>
        
        {isExpanded && (
            <div className="mt-2 text-gray-800 dark:text-gray-200 prose dark:prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: note.generatedContent }} />
        )}
      </div>
    );
  };


  const renderTabContent = () => {
    switch(activeTab) {
      case 'workbench':
        return (
          <div className="space-y-4">
            {session.notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
            {session.notes.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Your explanations and analogies will appear here.</p>}
          </div>
        );
      case 'changes':
        return (
          <div className="space-y-4">
            {session.changes.map((change) => (
              <div key={change.id} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">Original: <span className="italic">"{change.originalText}"</span></p>
                <p className="text-sm text-green-700 dark:text-green-400">Rephrased: <span className="italic" dangerouslySetInnerHTML={{ __html: change.rephrasedText }}/></p>
                <button onClick={() => handleUndoChange(change.id)} className="text-xs text-primary-600 hover:underline mt-2">Undo</button>
              </div>
            ))}
            {session.changes.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Your rephrased text history will be shown here.</p>}
          </div>
        );
      case 'references':
        return (
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <p className="font-semibold">Source:</p>
            <p className="text-gray-600 dark:text-gray-300">{session.source.name}</p>
          </div>
        );
      default:
        return null;
    }
  };

  const TabButton = ({ tab, label, icon: Icon }: { tab: ActiveTab; label: string; icon: React.ElementType }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 p-2 rounded-md text-sm flex items-center justify-center space-x-2 transition-colors ${activeTab === tab ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className={`relative transition-all duration-300 ${isOpen ? 'w-full lg:w-96' : 'w-12'}`}>
      <div className={`bg-white dark:bg-gray-800 h-full rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col ${!isOpen && 'items-center'}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -left-5 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-1 rounded-full border border-gray-300 dark:border-gray-600 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 z-10"
        >
          {isOpen ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
        </button>
        <div className={`p-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="bg-gray-100 dark:bg-gray-900 p-1 rounded-lg flex items-center space-x-1 mb-4">
            <TabButton tab="workbench" label="Workbench" icon={BeakerIcon}/>
            <TabButton tab="changes" label="Changes" icon={ArrowPathIcon}/>
            <TabButton tab="references" label="References" icon={InformationCircleIcon}/>
          </div>
          <div className="overflow-y-auto max-h-[70vh] p-1 custom-scrollbar">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
