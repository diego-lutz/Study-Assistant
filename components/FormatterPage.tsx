
import React, { useState } from 'react';
import * as geminiService from '../services/geminiService';
import Spinner from './common/Spinner';

const FormatterPage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReformat = async () => {
    if (!inputText.trim()) {
      setError('Por favor, insira algum texto para formatar.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setOutputText('');

    try {
      const formattedText = await geminiService.reformatText(inputText);
      setOutputText(formattedText);
    } catch (err) {
      console.error('Formatting error:', err);
      setError('Ocorreu um erro ao reformatar o texto. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const placeholderText = `Paralelismo em Nível de Instrução (ILP)
1. Conceitos Fundamentais
Definição: O Paralelismo em Nível de Instrução (ILP) refere-se ao conjunto de técnicas...
Contexto: A busca por maior desempenho... Vários fatores são importantes: Aumento de Desempenho: O principal motor... Dependências: A capacidade de executar... Arquitetura do Processador: Técnicas como pipelining...
Objetivo: O objetivo principal do ILP é maximizar o throughput...
`;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold text-gray-800 dark:text-white">Formatador de Texto com IA</h2>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Cole seu texto desorganizado e deixe a IA limpá-lo para você com base na estrutura lógica.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Panel */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4">Texto de Entrada</h3>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={placeholderText}
            className="w-full h-96 p-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow font-mono text-sm"
          />
        </div>

        {/* Output Panel */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4">Resultado Formatado</h3>
          <div className="w-full h-96 p-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <svg className="animate-spin mx-auto h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Formatando...</p>
                </div>
              </div>
            ) : outputText ? (
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: outputText }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 dark:text-gray-500">Seu texto formatado aparecerá aqui.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button 
          onClick={handleReformat} 
          disabled={isLoading}
          className="w-full max-w-xs flex justify-center items-center mx-auto bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300 dark:disabled:bg-primary-800 transition-colors duration-300"
        >
          {isLoading ? <><Spinner /> Formatando...</> : 'Formatar Texto'}
        </button>
      </div>
    </div>
  );
};

export default FormatterPage;