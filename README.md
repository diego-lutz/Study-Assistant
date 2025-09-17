# Como Funciona a "Inteligência" por Trás do Código

A aplicação utiliza uma abordagem moderna para garantir que a Inteligência Artificial responda perguntas baseada estritamente em um documento fornecido pelo usuário. Pense nisso como um **teste com consulta (prova de livro aberto)** para a IA, onde o documento é a única fonte de consulta permitida.

Para que isso funcione, usamos duas técnicas principais:

## 1. Embeddings: Um "Super-Índice" por Significado

* **O que é?** É um processo que transforma um pedaço de texto (um parágrafo, por exemplo) em uma representação numérica (um "vetor"). Ex: `Texto -> [0.1, 0.8, -0.3, ...]`.

* **Por que usar?** Textos com significados semelhantes geram vetores numericamente parecidos. Isso permite que o código pesquise por **conceitos e sinônimos**, não apenas por palavras-chave. É como um `Ctrl+F` que entende o contexto do que você está procurando.

## 2. RAG (Retrieval-Augmented Generation): A Estratégia da "Consulta"

RAG é o processo completo que acontece toda vez que o usuário faz uma pergunta, e funciona em duas etapas:

* **Etapa 1: Recuperar (Achar a página certa do livro)**
    * O código pega a pergunta do usuário e a transforma em um vetor (embedding).
    * Ele usa o "super-índice" dos embeddings para encontrar os trechos (`chunks`) do documento original que são mais relevantes para aquela pergunta.

* **Etapa 2: Gerar (Responder a pergunta usando a página)**
    * O código monta um prompt para o Gemini que diz: "Esqueça tudo o que você sabe. Responda a esta pergunta usando APENAS os trechos de texto a seguir."
    * Ele anexa os `chunks` relevantes encontrados na Etapa 1 e a pergunta do usuário. A IA então gera a resposta, garantindo que ela seja fiel ao documento.

## Conexão com o Código

> Quando uma função como `getInteractionResponse(type, selectedText, chunks)` no `geminiService.ts` recebe `chunks` como parâmetro, é exatamente para executar a **Etapa 1 do RAG**. Ela usa esses `chunks` (o "livro") para encontrar o contexto relevante antes de montar o prompt final e pedir para a IA gerar a resposta.
