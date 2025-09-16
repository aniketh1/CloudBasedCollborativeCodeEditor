"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

// Enhanced IntelliSense and Auto-Complete System
const EnhancedIntelliSense = ({ editor, monaco, language, projectFiles = [] }) => {
  const [completionProvider, setCompletionProvider] = useState(null);
  const [hoverProvider, setHoverProvider] = useState(null);
  const [signatureProvider, setSignatureProvider] = useState(null);
  const completionCache = useRef(new Map());

  // Enhanced completion items for different languages
  const completionItems = {
    javascript: {
      keywords: [
        'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
        'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends',
        'false', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof',
        'let', 'new', 'null', 'return', 'super', 'switch', 'this', 'throw',
        'true', 'try', 'typeof', 'undefined', 'var', 'void', 'while', 'with', 'yield'
      ],
      snippets: [
        {
          label: 'function',
          insertText: 'function ${1:name}(${2:params}) {\n\t${3:// body}\n}',
          documentation: 'Function declaration',
          kind: 'Snippet'
        },
        {
          label: 'arrow',
          insertText: '(${1:params}) => {\n\t${2:// body}\n}',
          documentation: 'Arrow function',
          kind: 'Snippet'
        },
        {
          label: 'class',
          insertText: 'class ${1:ClassName} {\n\tconstructor(${2:params}) {\n\t\t${3:// constructor body}\n\t}\n\n\t${4:// methods}\n}',
          documentation: 'Class declaration',
          kind: 'Snippet'
        },
        {
          label: 'try-catch',
          insertText: 'try {\n\t${1:// code}\n} catch (${2:error}) {\n\t${3:// error handling}\n}',
          documentation: 'Try-catch block',
          kind: 'Snippet'
        },
        {
          label: 'for-loop',
          insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t${3:// loop body}\n}',
          documentation: 'For loop',
          kind: 'Snippet'
        },
        {
          label: 'forEach',
          insertText: '${1:array}.forEach((${2:item}, ${3:index}) => {\n\t${4:// iteration body}\n});',
          documentation: 'Array forEach method',
          kind: 'Snippet'
        },
        {
          label: 'map',
          insertText: '${1:array}.map((${2:item}, ${3:index}) => {\n\treturn ${4:// mapped value};\n});',
          documentation: 'Array map method',
          kind: 'Snippet'
        },
        {
          label: 'filter',
          insertText: '${1:array}.filter((${2:item}, ${3:index}) => {\n\treturn ${4:// condition};\n});',
          documentation: 'Array filter method',
          kind: 'Snippet'
        },
        {
          label: 'reduce',
          insertText: '${1:array}.reduce((${2:acc}, ${3:item}, ${4:index}) => {\n\treturn ${5:// accumulated value};\n}, ${6:initialValue});',
          documentation: 'Array reduce method',
          kind: 'Snippet'
        },
        {
          label: 'promise',
          insertText: 'new Promise((resolve, reject) => {\n\t${1:// async operation}\n\tif (${2:success}) {\n\t\tresolve(${3:result});\n\t} else {\n\t\treject(${4:error});\n\t}\n});',
          documentation: 'Promise constructor',
          kind: 'Snippet'
        },
        {
          label: 'async-function',
          insertText: 'async function ${1:name}(${2:params}) {\n\ttry {\n\t\tconst ${3:result} = await ${4:asyncOperation};\n\t\treturn ${3:result};\n\t} catch (${5:error}) {\n\t\t${6:// error handling}\n\t}\n}',
          documentation: 'Async function with error handling',
          kind: 'Snippet'
        }
      ],
      builtins: [
        'console.log', 'console.error', 'console.warn', 'console.info',
        'document.getElementById', 'document.querySelector', 'document.createElement',
        'window.addEventListener', 'setTimeout', 'setInterval', 'clearTimeout',
        'JSON.parse', 'JSON.stringify', 'Object.keys', 'Object.values',
        'Array.from', 'Array.isArray', 'Date.now', 'Math.random'
      ]
    },
    typescript: {
      keywords: [
        'abstract', 'any', 'as', 'boolean', 'constructor', 'declare', 'enum',
        'implements', 'interface', 'is', 'keyof', 'namespace', 'never',
        'number', 'object', 'private', 'protected', 'public', 'readonly',
        'static', 'string', 'symbol', 'type', 'unique', 'unknown', 'void'
      ],
      snippets: [
        {
          label: 'interface',
          insertText: 'interface ${1:InterfaceName} {\n\t${2:property}: ${3:type};\n}',
          documentation: 'Interface declaration',
          kind: 'Snippet'
        },
        {
          label: 'type',
          insertText: 'type ${1:TypeName} = ${2:type};',
          documentation: 'Type alias',
          kind: 'Snippet'
        },
        {
          label: 'enum',
          insertText: 'enum ${1:EnumName} {\n\t${2:VALUE1} = "${3:value1}",\n\t${4:VALUE2} = "${5:value2}"\n}',
          documentation: 'Enum declaration',
          kind: 'Snippet'
        },
        {
          label: 'generic-function',
          insertText: 'function ${1:name}<${2:T}>(${3:param}: ${2:T}): ${4:ReturnType} {\n\t${5:// body}\n}',
          documentation: 'Generic function',
          kind: 'Snippet'
        }
      ]
    },
    python: {
      keywords: [
        'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del',
        'elif', 'else', 'except', 'finally', 'for', 'from', 'global',
        'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or',
        'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'
      ],
      snippets: [
        {
          label: 'def',
          insertText: 'def ${1:function_name}(${2:parameters}):\n    """${3:Description}\n    \n    Args:\n        ${4:arg_description}\n    \n    Returns:\n        ${5:return_description}\n    """\n    ${6:pass}',
          documentation: 'Function definition with docstring',
          kind: 'Snippet'
        },
        {
          label: 'class',
          insertText: 'class ${1:ClassName}:\n    """${2:Class description}\n    \n    Attributes:\n        ${3:attribute_description}\n    """\n    \n    def __init__(self, ${4:parameters}):\n        """Initialize the class.\n        \n        Args:\n            ${5:parameter_description}\n        """\n        ${6:pass}\n    \n    def ${7:method_name}(self, ${8:parameters}):\n        """${9:Method description}\n        \n        Args:\n            ${10:parameter_description}\n        \n        Returns:\n            ${11:return_description}\n        """\n        ${12:pass}',
          documentation: 'Class definition with methods',
          kind: 'Snippet'
        },
        {
          label: 'if-main',
          insertText: 'if __name__ == "__main__":\n    ${1:main()}',
          documentation: 'Main execution guard',
          kind: 'Snippet'
        },
        {
          label: 'try-except',
          insertText: 'try:\n    ${1:# code that might raise an exception}\nexcept ${2:ExceptionType} as ${3:e}:\n    ${4:# exception handling}\nelse:\n    ${5:# code to run if no exception}\nfinally:\n    ${6:# cleanup code}',
          documentation: 'Try-except block',
          kind: 'Snippet'
        },
        {
          label: 'with-open',
          insertText: 'with open("${1:filename}", "${2:mode}") as ${3:file}:\n    ${4:# file operations}',
          documentation: 'File opening with context manager',
          kind: 'Snippet'
        },
        {
          label: 'list-comprehension',
          insertText: '[${1:expression} for ${2:item} in ${3:iterable} if ${4:condition}]',
          documentation: 'List comprehension',
          kind: 'Snippet'
        },
        {
          label: 'dict-comprehension',
          insertText: '{${1:key}: ${2:value} for ${3:item} in ${4:iterable} if ${5:condition}}',
          documentation: 'Dictionary comprehension',
          kind: 'Snippet'
        }
      ],
      builtins: [
        'print', 'len', 'range', 'enumerate', 'zip', 'map', 'filter',
        'sum', 'max', 'min', 'sorted', 'reversed', 'isinstance', 'hasattr',
        'getattr', 'setattr', 'open', 'input', 'int', 'float', 'str', 'bool'
      ]
    }
  };

  // Smart completion provider
  const createCompletionProvider = useCallback(() => {
    if (!monaco || !language) return null;

    return monaco.languages.registerCompletionItemProvider(language, {
      provideCompletionItems: (model, position, context, token) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });

        const suggestions = [];
        const langConfig = completionItems[language] || {};

        // Add keywords
        if (langConfig.keywords) {
          langConfig.keywords.forEach(keyword => {
            suggestions.push({
              label: keyword,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: keyword,
              range: range,
              documentation: `${language} keyword: ${keyword}`,
              sortText: `0${keyword}`
            });
          });
        }

        // Add snippets
        if (langConfig.snippets) {
          langConfig.snippets.forEach(snippet => {
            suggestions.push({
              label: snippet.label,
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: snippet.insertText,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: range,
              documentation: snippet.documentation,
              sortText: `1${snippet.label}`
            });
          });
        }

        // Add built-in functions/methods
        if (langConfig.builtins) {
          langConfig.builtins.forEach(builtin => {
            suggestions.push({
              label: builtin,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: builtin,
              range: range,
              documentation: `Built-in ${language} function/method`,
              sortText: `2${builtin}`
            });
          });
        }

        // Add context-aware suggestions based on current line
        if (language === 'javascript' || language === 'typescript') {
          // React-specific suggestions
          if (textUntilPosition.includes('import') && textUntilPosition.includes('react')) {
            suggestions.push({
              label: 'useState',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'useState',
              range: range,
              documentation: 'React Hook for state management',
              sortText: '0useState'
            });
            
            suggestions.push({
              label: 'useEffect',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'useEffect',
              range: range,
              documentation: 'React Hook for side effects',
              sortText: '0useEffect'
            });
          }

          // Console suggestions
          if (textUntilPosition.includes('console.')) {
            ['log', 'error', 'warn', 'info', 'debug', 'table', 'group', 'time'].forEach(method => {
              suggestions.push({
                label: method,
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: method,
                range: range,
                documentation: `Console method: console.${method}()`,
                sortText: `0${method}`
              });
            });
          }

          // Array method suggestions
          if (textUntilPosition.match(/\w+\./)) {
            const arrayMethods = [
              'push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'concat',
              'join', 'reverse', 'sort', 'indexOf', 'lastIndexOf', 'includes',
              'find', 'findIndex', 'filter', 'map', 'reduce', 'forEach',
              'some', 'every', 'flat', 'flatMap'
            ];

            arrayMethods.forEach(method => {
              suggestions.push({
                label: method,
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: method,
                range: range,
                documentation: `Array method: ${method}()`,
                sortText: `3${method}`
              });
            });
          }
        }

        // Add suggestions from project files
        if (projectFiles.length > 0) {
          projectFiles.forEach(file => {
            if (file.name && file.name !== model.uri.path) {
              const fileName = file.name.split('/').pop().split('.')[0];
              suggestions.push({
                label: fileName,
                kind: monaco.languages.CompletionItemKind.File,
                insertText: fileName,
                range: range,
                documentation: `Import from ${file.name}`,
                sortText: `4${fileName}`
              });
            }
          });
        }

        return { suggestions };
      }
    });
  }, [monaco, language, projectFiles]);

  // Enhanced hover provider with detailed information
  const createHoverProvider = useCallback(() => {
    if (!monaco || !language) return null;

    return monaco.languages.registerHoverProvider(language, {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position);
        if (!word) return null;

        const langConfig = completionItems[language] || {};
        let hoverContent = null;

        // Check if it's a keyword
        if (langConfig.keywords && langConfig.keywords.includes(word.word)) {
          hoverContent = {
            contents: [
              { value: `**${language} keyword**` },
              { value: `\`${word.word}\`` },
              { value: getKeywordDocumentation(word.word, language) }
            ]
          };
        }

        // Check if it's a built-in function
        if (langConfig.builtins && langConfig.builtins.some(builtin => builtin.includes(word.word))) {
          hoverContent = {
            contents: [
              { value: `**Built-in ${language} function**` },
              { value: `\`${word.word}\`` },
              { value: getBuiltinDocumentation(word.word, language) }
            ]
          };
        }

        // Add type information for TypeScript
        if (language === 'typescript') {
          // This would integrate with TypeScript language service in a real implementation
          hoverContent = {
            contents: [
              { value: `**${word.word}**` },
              { value: 'Type information would be displayed here' }
            ]
          };
        }

        return hoverContent;
      }
    });
  }, [monaco, language]);

  // Signature help provider for function parameters
  const createSignatureProvider = useCallback(() => {
    if (!monaco || !language) return null;

    return monaco.languages.registerSignatureHelpProvider(language, {
      signatureHelpTriggerCharacters: ['(', ','],
      provideSignatureHelp: (model, position, token, context) => {
        // Get the function name before the opening parenthesis
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });

        const signatures = [];

        // Add common function signatures based on language
        if (language === 'javascript' || language === 'typescript') {
          const jsSignatures = {
            'console.log': {
              label: 'console.log(message?: any, ...optionalParams: any[]): void',
              documentation: 'Outputs a message to the console',
              parameters: [
                { label: 'message', documentation: 'The message to log' },
                { label: '...optionalParams', documentation: 'Additional parameters to log' }
              ]
            },
            'setTimeout': {
              label: 'setTimeout(callback: Function, delay: number): number',
              documentation: 'Executes a function after a specified delay',
              parameters: [
                { label: 'callback', documentation: 'Function to execute' },
                { label: 'delay', documentation: 'Delay in milliseconds' }
              ]
            },
            'fetch': {
              label: 'fetch(url: string, options?: RequestInit): Promise<Response>',
              documentation: 'Fetches a resource from the network',
              parameters: [
                { label: 'url', documentation: 'The URL to fetch' },
                { label: 'options', documentation: 'Optional fetch configuration' }
              ]
            }
          };

          Object.keys(jsSignatures).forEach(funcName => {
            if (textUntilPosition.includes(funcName + '(')) {
              signatures.push({
                label: jsSignatures[funcName].label,
                documentation: jsSignatures[funcName].documentation,
                parameters: jsSignatures[funcName].parameters
              });
            }
          });
        }

        if (language === 'python') {
          const pythonSignatures = {
            'print': {
              label: 'print(*values, sep=" ", end="\\n", file=sys.stdout, flush=False)',
              documentation: 'Print values to a stream, or to sys.stdout by default',
              parameters: [
                { label: '*values', documentation: 'Values to print' },
                { label: 'sep', documentation: 'String separator between values' },
                { label: 'end', documentation: 'String appended after the last value' }
              ]
            },
            'len': {
              label: 'len(obj) -> int',
              documentation: 'Return the length of an object',
              parameters: [
                { label: 'obj', documentation: 'Object to get length of' }
              ]
            },
            'range': {
              label: 'range(start, stop[, step]) -> range object',
              documentation: 'Create a range of numbers',
              parameters: [
                { label: 'start', documentation: 'Starting value' },
                { label: 'stop', documentation: 'Ending value (exclusive)' },
                { label: 'step', documentation: 'Step size (optional)' }
              ]
            }
          };

          Object.keys(pythonSignatures).forEach(funcName => {
            if (textUntilPosition.includes(funcName + '(')) {
              signatures.push({
                label: pythonSignatures[funcName].label,
                documentation: pythonSignatures[funcName].documentation,
                parameters: pythonSignatures[funcName].parameters
              });
            }
          });
        }

        return {
          signatures: signatures,
          activeSignature: 0,
          activeParameter: 0
        };
      }
    });
  }, [monaco, language]);

  // Helper functions for documentation
  const getKeywordDocumentation = (keyword, lang) => {
    const docs = {
      javascript: {
        'async': 'Declares an asynchronous function that returns a Promise',
        'await': 'Pauses execution and waits for a Promise to resolve',
        'const': 'Declares a block-scoped constant variable',
        'let': 'Declares a block-scoped variable',
        'var': 'Declares a function-scoped or global variable',
        'function': 'Declares a function',
        'class': 'Declares a class',
        'if': 'Conditional statement',
        'for': 'Loop statement',
        'while': 'Loop statement that continues while condition is true',
        'try': 'Begins a try-catch block for error handling',
        'catch': 'Catches exceptions thrown in try block',
        'finally': 'Executes code regardless of try-catch result'
      },
      python: {
        'def': 'Defines a function',
        'class': 'Defines a class',
        'if': 'Conditional statement',
        'elif': 'Else if conditional',
        'else': 'Alternative branch for conditionals and loops',
        'for': 'Iteration over a sequence',
        'while': 'Loop that continues while condition is true',
        'try': 'Begins exception handling block',
        'except': 'Catches specific exceptions',
        'finally': 'Executes cleanup code',
        'import': 'Imports modules or specific items',
        'from': 'Imports specific items from a module',
        'return': 'Returns a value from a function',
        'yield': 'Produces a value in a generator function'
      }
    };

    return docs[lang]?.[keyword] || `${lang} keyword: ${keyword}`;
  };

  const getBuiltinDocumentation = (builtin, lang) => {
    const docs = {
      javascript: {
        'console.log': 'Outputs information to the web console',
        'setTimeout': 'Executes a function after a specified delay',
        'setInterval': 'Repeatedly executes a function with a fixed time delay',
        'JSON.parse': 'Parses a JSON string and returns the corresponding object',
        'JSON.stringify': 'Converts a JavaScript object to a JSON string'
      },
      python: {
        'print': 'Prints objects to the text stream file',
        'len': 'Returns the length (number of items) of an object',
        'range': 'Generates a sequence of numbers',
        'enumerate': 'Returns an enumerate object with index-value pairs',
        'zip': 'Combines multiple iterables into tuples'
      }
    };

    return docs[lang]?.[builtin] || `Built-in ${lang} function: ${builtin}`;
  };

  // Setup providers when monaco and editor are ready
  useEffect(() => {
    if (!monaco || !editor) return;

    // Dispose existing providers
    if (completionProvider) {
      completionProvider.dispose();
    }
    if (hoverProvider) {
      hoverProvider.dispose();
    }
    if (signatureProvider) {
      signatureProvider.dispose();
    }

    // Create new providers
    const newCompletionProvider = createCompletionProvider();
    const newHoverProvider = createHoverProvider();
    const newSignatureProvider = createSignatureProvider();

    setCompletionProvider(newCompletionProvider);
    setHoverProvider(newHoverProvider);
    setSignatureProvider(newSignatureProvider);

    // Configure editor options for better IntelliSense
    editor.updateOptions({
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnCommitCharacter: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
      wordBasedSuggestions: true,
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      },
      parameterHints: {
        enabled: true,
        cycle: true
      },
      suggestSelection: 'first',
      tabSize: 2,
      insertSpaces: true
    });

    // Cleanup function
    return () => {
      if (newCompletionProvider) newCompletionProvider.dispose();
      if (newHoverProvider) newHoverProvider.dispose();
      if (newSignatureProvider) newSignatureProvider.dispose();
    };
  }, [monaco, editor, language, createCompletionProvider, createHoverProvider, createSignatureProvider]);

  return null; // This component doesn't render anything visible
};

export default EnhancedIntelliSense;