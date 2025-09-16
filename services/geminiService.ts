import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { QuizQuestion, ToolLength } from '../types';

// FIX: Per coding guidelines, API key must be from process.env.API_KEY and used directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
const model = 'gemini-2.5-flash';

const generateContent = async (prompt: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating content:", error);
    return "Error: Could not generate content from AI.";
  }
};

export const generateStudyGuideDirect = async (topic: string): Promise<string> => {
    const prompt = `Crie um guia de estudos completo e bem estruturado sobre o tópico: "${topic}".

Siga estas regras de formatação estritamente para a saída HTML:
1.  **Idioma**: Todo o texto deve estar em Português do Brasil (pt-br).
2.  **Estrutura Lógica**: Organize o conteúdo de forma hierárquica. Use <h1> para o título principal, <h2> para seções principais e <h3> para subseções.
3.  **Listas**: Use listas de marcadores (<ul><li>) para conceitos, exemplos ou características.
4.  **Legibilidade e Espaçamento**: Garanta um bom espaçamento entre parágrafos (<p>). CRÍTICO: Insira um espaço em branco visual ANTES e DEPOIS de cada título de seção principal (<h2>) para separá-lo claramente do texto circundante.
5.  **Ênfase**: Use a tag <strong> para destacar os termos técnicos e conceitos mais importantes.
6.  **Saída Direta**: A sua resposta deve ser APENAS o código HTML formatado. Não inclua \`\`\`html, comentários ou explicações.`;
    return generateContent(prompt);
};

export const generateStudyGuideRAG = async (topic: string, documentText: string): Promise<string> => {
    const prompt = `Baseado ESTRITAMENTE no conteúdo do documento fornecido, crie um guia de estudos completo e bem estruturado sobre "${topic}". O guia deve usar apenas informações do texto fornecido.

Siga estas regras de formatação estritamente para a saída HTML:
1.  **Idioma**: Todo o texto deve estar em Português do Brasil (pt-br).
2.  **Estrutura Lógica**: Organize o conteúdo de forma hierárquica. Use <h1> para o título principal, <h2> para seções principais e <h3> para subseções.
3.  **Listas**: Use listas de marcadores (<ul><li>) para conceitos, exemplos ou características.
4.  **Legibilidade e Espaçamento**: Garanta um bom espaçamento entre parágrafos (<p>). CRÍTICO: Insira um espaço em branco visual ANTES e DEPOIS de cada título de seção principal (<h2>) para separá-lo claramente do texto circundante.
5.  **Ênfase**: Use a tag <strong> para destacar os termos técnicos e conceitos mais importantes.
6.  **Saída Direta**: A sua resposta deve ser APENAS o código HTML formatado. Não inclua \`\`\`html, comentários ou explicações.
  
Documento de referência:
---
${documentText}
---
`;
    return generateContent(prompt);
};

// FIX: Add missing reformatText function called by FormatterPage.tsx.
export const reformatText = async (rawText: string): Promise<string> => {
    const prompt = `Reformate o seguinte texto para ter uma estrutura HTML clara e lógica. Use cabeçalhos (h1, h2, h3), parágrafos (p), listas (ul, li) e ênfase (strong) para melhorar a legibilidade.

Siga estas regras de formatação estritamente para a saída HTML:
1.  **Idioma**: Mantenha o idioma original do texto (Português do Brasil - pt-br).
2.  **Estrutura Lógica**: Organize o conteúdo de forma hierárquica. Use <h1> para o título principal, <h2> para seções principais e <h3> para subseções.
3.  **Listas**: Use listas de marcadores (<ul><li>) para conceitos, exemplos ou características.
4.  **Legibilidade**: Garanta um bom espaçamento entre parágrafos (<p>) e seções.
5.  **Ênfase**: Use a tag <strong> para destacar os termos técnicos e conceitos mais importantes.
6.  **Saída Direta**: A sua resposta deve ser APENAS o código HTML formatado. Não inclua \`\`\`html, comentários ou explicações.

Texto para reformatar:
---
${rawText}
---
`;
    return generateContent(prompt);
};

const lengthInstructions = {
    short: 'Gere uma resposta muito breve, com uma ou duas frases.',
    medium: 'Gere um parágrafo conciso.',
    detailed: 'Gere uma explicação mais completa, potencialmente com múltiplos pontos ou exemplos em uma lista.'
};

const formatInstructions = "Formate a resposta em HTML. Use a tag <strong> para termos-chave e listas <ul><li> para múltiplos pontos para tornar a explicação clara e fácil de digerir. Responda APENAS com o fragmento HTML.";


export const getExplanation = async (text: string, context: string, length: ToolLength): Promise<string> => {
  const prompt = `Explique o seguinte texto selecionado de uma forma simples e clara.
  ${lengthInstructions[length]}
  
  Contexto do texto completo: "${context.substring(0, 500)}..."
  Texto selecionado para explicar: "${text}"

  ${formatInstructions}
  `;
  return generateContent(prompt);
};

export const getRephrase = async (text: string, length: ToolLength): Promise<string> => {
    const prompt = `Reformule o seguinte texto para ser mais claro e conciso, mantendo o significado original.
    ${lengthInstructions[length]}
    
    Texto para reformular: "${text}"

    ${formatInstructions}
    `;
    return generateContent(prompt);
};

export const getAnalogy = async (text: string, length: ToolLength): Promise<string> => {
    const prompt = `Forneça uma analogia simples para ajudar a entender este conceito.
    ${lengthInstructions[length]}

    Conceito: "${text}"

    ${formatInstructions}
    `;
    return generateContent(prompt);
};

export const getAnalysis = async (text: string, length: ToolLength): Promise<string> => {
    const prompt = `Forneça uma breve análise do seguinte texto, destacando seu principal argumento, implicações ou significado.
    ${lengthInstructions[length]}
    
    Texto a ser analisado: "${text}"

    ${formatInstructions}
    `;
    return generateContent(prompt);
};

export const getQuiz = async (topic: string, content: string): Promise<QuizQuestion[]> => {
    const prompt = `Based on the following study guide about "${topic}", generate 5 multiple-choice questions to test understanding. For each question, provide 4 options and clearly indicate the correct answer.

    Study Guide Content:
    ---
    ${content.substring(0, 4000)}
    ---
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        quiz: {
                            type: Type.ARRAY,
                            description: "An array of quiz questions.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: {
                                        type: Type.STRING,
                                        description: "The question text."
                                    },
                                    options: {
                                        type: Type.ARRAY,
                                        description: "An array of 4 possible answers.",
                                        items: { type: Type.STRING }
                                    },
                                    correctAnswer: {
                                        type: Type.STRING,
                                        description: "The correct answer from the options list."
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        
        const jsonResponse = JSON.parse(response.text);
        // The response schema puts the questions inside a 'quiz' property.
        return jsonResponse.quiz || [];

    } catch (error) {
        console.error("Error generating quiz:", error);
        // As per requirements, return an empty array on failure.
        return [];
    }
};
