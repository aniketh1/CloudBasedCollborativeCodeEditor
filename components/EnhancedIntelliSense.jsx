"use client";

import React, { useEffect, useState } from 'react';

const EnhancedIntelliSense = ({ 
  editor, 
  monaco, 
  language = 'javascript', 
  projectFiles = [] 
}) => {
  const [isSetup, setIsSetup] = useState(false);

  useEffect(() => {
    if (!editor || !monaco || isSetup) return;

    try {
      // Basic JavaScript/TypeScript intellisense enhancements
      if (language === 'javascript' || language === 'typescript') {
        // Add common JavaScript snippets
        monaco.languages.registerCompletionItemProvider(language, {
          provideCompletionItems: (model, position) => {
            const suggestions = [
              {
                label: 'console.log',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'console.log(${1:message});',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Log a message to the console'
              },
              {
                label: 'function',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'function ${1:name}(${2:params}) {\n\t${3:// body}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Function declaration'
              },
              {
                label: 'arrow function',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'const ${1:name} = (${2:params}) => {\n\t${3:// body}\n};',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Arrow function'
              }
            ];

            return { suggestions };
          }
        });
      }

      setIsSetup(true);
    } catch (error) {
      console.warn('Error setting up enhanced IntelliSense:', error);
    }
  }, [editor, monaco, language, projectFiles, isSetup]);

  return null;
};

export default EnhancedIntelliSense;