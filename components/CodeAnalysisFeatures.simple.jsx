"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';

// Simplified code analysis and linting features (without framer-motion)
const CodeAnalysisFeatures = ({ 
  editor, 
  monaco, 
  language, 
  code, 
  onErrorsDetected,
  onWarningsDetected 
}) => {
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [codeMetrics, setCodeMetrics] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showProblems, setShowProblems] = useState(false);
  const analysisTimeoutRef = useRef(null);

  // Code analysis rules for different languages
  const analysisRules = {
    javascript: {
      errors: [
        {
          pattern: /console\.log\(/g,
          message: "Remove console.log statements before production",
          severity: "warning",
          quickFix: "Remove console.log"
        },
        {
          pattern: /var\s+/g,
          message: "Use 'let' or 'const' instead of 'var'",
          severity: "warning",
          quickFix: "Replace with 'let' or 'const'"
        },
        {
          pattern: /==(?!=)/g,
          message: "Use strict equality (===) instead of loose equality (==)",
          severity: "error",
          quickFix: "Use ==="
        },
        {
          pattern: /function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/g,
          message: "Consider using arrow functions for better readability",
          severity: "info",
          quickFix: "Convert to arrow function"
        }
      ]
    },
    typescript: {
      errors: [
        {
          pattern: /any/g,
          message: "Avoid using 'any' type, use specific types instead",
          severity: "warning",
          quickFix: "Specify proper type"
        },
        {
          pattern: /console\.log\(/g,
          message: "Remove console.log statements before production",
          severity: "warning",
          quickFix: "Remove console.log"
        }
      ]
    },
    python: {
      errors: [
        {
          pattern: /print\(/g,
          message: "Consider using logging instead of print statements",
          severity: "info",
          quickFix: "Use logging module"
        },
        {
          pattern: /except:/g,
          message: "Specify exception types instead of bare except",
          severity: "warning",
          quickFix: "Add exception type"
        }
      ]
    }
  };

  // Analyze code for issues
  const analyzeCode = useCallback(() => {
    if (!code || !language) {
      setErrors([]);
      setWarnings([]);
      setSuggestions([]);
      return;
    }

    setIsAnalyzing(true);
    
    // Clear previous timeout
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    // Debounce analysis
    analysisTimeoutRef.current = setTimeout(() => {
      const rules = analysisRules[language] || { errors: [] };
      const foundErrors = [];
      const foundWarnings = [];
      const foundSuggestions = [];

      rules.errors.forEach(rule => {
        let match;
        while ((match = rule.pattern.exec(code)) !== null) {
          const issue = {
            message: rule.message,
            severity: rule.severity,
            quickFix: rule.quickFix,
            line: getLineNumber(code, match.index),
            column: getColumnNumber(code, match.index),
            offset: match.index,
            length: match[0].length
          };

          switch (rule.severity) {
            case 'error':
              foundErrors.push(issue);
              break;
            case 'warning':
              foundWarnings.push(issue);
              break;
            case 'info':
              foundSuggestions.push(issue);
              break;
          }
        }
      });

      setErrors(foundErrors);
      setWarnings(foundWarnings);
      setSuggestions(foundSuggestions);
      setIsAnalyzing(false);

      // Calculate code metrics
      const metrics = calculateCodeMetrics(code, language);
      setCodeMetrics(metrics);

      // Notify parent components
      if (onErrorsDetected) onErrorsDetected(foundErrors);
      if (onWarningsDetected) onWarningsDetected(foundWarnings);
      
    }, 1000);
  }, [code, language, onErrorsDetected, onWarningsDetected]);

  // Helper functions
  const getLineNumber = (text, offset) => {
    return text.substring(0, offset).split('\n').length;
  };

  const getColumnNumber = (text, offset) => {
    const lines = text.substring(0, offset).split('\n');
    return lines[lines.length - 1].length + 1;
  };

  const calculateCodeMetrics = (code, language) => {
    const lines = code.split('\n');
    const codeLines = lines.filter(line => line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('#'));
    const commentLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('//') || trimmed.startsWith('#') || 
             (language === 'javascript' && (trimmed.startsWith('/*') || trimmed.includes('*/')));
    });

    return {
      totalLines: lines.length,
      codeLines: codeLines.length,
      commentLines: commentLines.length,
      complexity: calculateComplexity(code, language),
      functions: countFunctions(code, language),
      classes: countClasses(code, language)
    };
  };

  const calculateComplexity = (code, language) => {
    const complexityPatterns = {
      javascript: /\b(if|else|for|while|switch|case|catch)\b/g,
      typescript: /\b(if|else|for|while|switch|case|catch)\b/g,
      python: /\b(if|elif|else|for|while|try|except|with)\b/g
    };
    
    const pattern = complexityPatterns[language];
    return pattern ? (code.match(pattern) || []).length : 0;
  };

  const countFunctions = (code, language) => {
    const functionPatterns = {
      javascript: /\b(function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>|\w+\s*:\s*function)/g,
      typescript: /\b(function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>|\w+\s*:\s*function)/g,
      python: /\bdef\s+\w+/g
    };
    
    const pattern = functionPatterns[language];
    return pattern ? (code.match(pattern) || []).length : 0;
  };

  const countClasses = (code, language) => {
    const classPatterns = {
      javascript: /\bclass\s+\w+/g,
      typescript: /\bclass\s+\w+/g,
      python: /\bclass\s+\w+/g
    };
    
    const pattern = classPatterns[language];
    return pattern ? (code.match(pattern) || []).length : 0;
  };

  // Apply error markers to editor
  const applyErrorMarkers = useCallback(() => {
    if (!editor || !monaco) return;

    const markers = [];
    
    [...errors, ...warnings, ...suggestions].forEach(issue => {
      markers.push({
        startLineNumber: issue.line,
        startColumn: issue.column,
        endLineNumber: issue.line,
        endColumn: issue.column + issue.length,
        message: issue.message,
        severity: issue.severity === 'error' ? monaco.MarkerSeverity.Error :
                 issue.severity === 'warning' ? monaco.MarkerSeverity.Warning :
                 monaco.MarkerSeverity.Info
      });
    });

    monaco.editor.setModelMarkers(editor.getModel(), 'code-analysis', markers);
  }, [editor, monaco, errors, warnings, suggestions]);

  // Run analysis when code changes
  useEffect(() => {
    analyzeCode();
  }, [analyzeCode]);

  // Apply markers when issues change
  useEffect(() => {
    applyErrorMarkers();
  }, [applyErrorMarkers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, []);

  const totalIssues = errors.length + warnings.length;

  return (
    <div className="code-analysis-features">
      {/* Analysis Status */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        {isAnalyzing && (
          <div className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Analyzing...
          </div>
        )}
        
        {totalIssues > 0 && !isAnalyzing && (
          <button
            onClick={() => setShowProblems(!showProblems)}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-2 transition-colors"
          >
            <span>⚠️</span>
            {totalIssues} issue{totalIssues !== 1 ? 's' : ''}
          </button>
        )}

        {totalIssues === 0 && !isAnalyzing && code && (
          <div className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-2">
            <span>✅</span>
            No issues found
          </div>
        )}
      </div>

      {/* Problems Panel */}
      {showProblems && (
        <div className="absolute top-16 left-4 bg-gray-800 rounded-lg p-4 shadow-lg max-w-md max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-medium">Problems</h4>
            <button
              onClick={() => setShowProblems(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2">
            {errors.map((error, index) => (
              <div key={`error-${index}`} className="flex items-start gap-2 p-2 bg-red-900/30 rounded border-l-2 border-red-500">
                <span className="text-red-400 text-xs mt-0.5">❌</span>
                <div className="flex-1">
                  <div className="text-red-300 text-sm">{error.message}</div>
                  <div className="text-gray-400 text-xs">Line {error.line}, Column {error.column}</div>
                  {error.quickFix && (
                    <button className="text-blue-400 hover:text-blue-300 text-xs mt-1">
                      💡 {error.quickFix}
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {warnings.map((warning, index) => (
              <div key={`warning-${index}`} className="flex items-start gap-2 p-2 bg-yellow-900/30 rounded border-l-2 border-yellow-500">
                <span className="text-yellow-400 text-xs mt-0.5">⚠️</span>
                <div className="flex-1">
                  <div className="text-yellow-300 text-sm">{warning.message}</div>
                  <div className="text-gray-400 text-xs">Line {warning.line}, Column {warning.column}</div>
                  {warning.quickFix && (
                    <button className="text-blue-400 hover:text-blue-300 text-xs mt-1">
                      💡 {warning.quickFix}
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {suggestions.map((suggestion, index) => (
              <div key={`suggestion-${index}`} className="flex items-start gap-2 p-2 bg-blue-900/30 rounded border-l-2 border-blue-500">
                <span className="text-blue-400 text-xs mt-0.5">💡</span>
                <div className="flex-1">
                  <div className="text-blue-300 text-sm">{suggestion.message}</div>
                  <div className="text-gray-400 text-xs">Line {suggestion.line}, Column {suggestion.column}</div>
                  {suggestion.quickFix && (
                    <button className="text-blue-400 hover:text-blue-300 text-xs mt-1">
                      💡 {suggestion.quickFix}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Code Metrics Panel */}
      {Object.keys(codeMetrics).length > 0 && (
        <div className="absolute bottom-4 left-4 bg-gray-800 rounded-lg p-3 shadow-lg">
          <h4 className="text-white font-medium mb-2 text-sm">Code Metrics</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="text-gray-400">Lines:</div>
            <div className="text-white">{codeMetrics.totalLines}</div>
            
            <div className="text-gray-400">Code:</div>
            <div className="text-white">{codeMetrics.codeLines}</div>
            
            <div className="text-gray-400">Comments:</div>
            <div className="text-white">{codeMetrics.commentLines}</div>
            
            <div className="text-gray-400">Complexity:</div>
            <div className={`${codeMetrics.complexity > 10 ? 'text-red-400' : 'text-green-400'}`}>
              {codeMetrics.complexity}
            </div>
            
            <div className="text-gray-400">Functions:</div>
            <div className="text-white">{codeMetrics.functions}</div>
            
            <div className="text-gray-400">Classes:</div>
            <div className="text-white">{codeMetrics.classes}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeAnalysisFeatures;