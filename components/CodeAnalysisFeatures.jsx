"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Advanced code analysis and linting features
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
      ],
      complexity: {
        maxLines: 300,
        maxCyclomaticComplexity: 10,
        maxNestingDepth: 4
      }
    },
    python: {
      errors: [
        {
          pattern: /print\(/g,
          message: "Consider using logging instead of print statements",
          severity: "warning",
          quickFix: "Use logging module"
        },
        {
          pattern: /except:/g,
          message: "Avoid bare except clauses",
          severity: "error",
          quickFix: "Specify exception type"
        },
        {
          pattern: /^\s*pass\s*$/gm,
          message: "Empty pass statement - consider adding implementation",
          severity: "info",
          quickFix: "Add implementation"
        }
      ],
      complexity: {
        maxLines: 500,
        maxCyclomaticComplexity: 12,
        maxNestingDepth: 5
      }
    }
  };

  // Analyze code for errors, warnings, and suggestions
  const analyzeCode = useCallback(async (codeText) => {
    if (!codeText || !language) return;

    setIsAnalyzing(true);
    
    try {
      const rules = analysisRules[language] || {};
      const foundErrors = [];
      const foundWarnings = [];
      const foundSuggestions = [];

      // Run pattern-based analysis
      if (rules.errors) {
        rules.errors.forEach((rule, ruleIndex) => {
          let match;
          while ((match = rule.pattern.exec(codeText)) !== null) {
            const position = getPositionFromOffset(codeText, match.index);
            const issue = {
              id: `${ruleIndex}-${match.index}`,
              message: rule.message,
              severity: rule.severity,
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column + match[0].length,
              quickFix: rule.quickFix,
              source: 'CodeAnalysis'
            };

            if (rule.severity === 'error') {
              foundErrors.push(issue);
            } else if (rule.severity === 'warning') {
              foundWarnings.push(issue);
            } else {
              foundSuggestions.push(issue);
            }
          }
          // Reset regex lastIndex to avoid issues with global flag
          rule.pattern.lastIndex = 0;
        });
      }

      // Calculate code metrics
      const metrics = calculateCodeMetrics(codeText, language);
      setCodeMetrics(metrics);

      // Check complexity violations
      if (rules.complexity) {
        if (metrics.lineCount > rules.complexity.maxLines) {
          foundWarnings.push({
            id: 'complexity-lines',
            message: `File is too long (${metrics.lineCount} lines). Consider splitting into smaller functions.`,
            severity: 'warning',
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 1,
            source: 'Complexity'
          });
        }

        if (metrics.cyclomaticComplexity > rules.complexity.maxCyclomaticComplexity) {
          foundWarnings.push({
            id: 'complexity-cyclomatic',
            message: `High cyclomatic complexity (${metrics.cyclomaticComplexity}). Consider refactoring.`,
            severity: 'warning',
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 1,
            source: 'Complexity'
          });
        }
      }

      setErrors(foundErrors);
      setWarnings(foundWarnings);
      setSuggestions(foundSuggestions);

      // Notify parent components
      if (onErrorsDetected) onErrorsDetected(foundErrors);
      if (onWarningsDetected) onWarningsDetected(foundWarnings);

    } catch (error) {
      console.error('Code analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [language, onErrorsDetected, onWarningsDetected]);

  // Helper function to convert string offset to line/column position
  const getPositionFromOffset = (text, offset) => {
    const lines = text.substr(0, offset).split('\n');
    return {
      lineNumber: lines.length,
      column: lines[lines.length - 1].length + 1
    };
  };

  // Calculate code metrics
  const calculateCodeMetrics = (codeText, lang) => {
    const lines = codeText.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    const commentLines = lines.filter(line => {
      const trimmed = line.trim();
      if (lang === 'javascript') {
        return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
      } else if (lang === 'python') {
        return trimmed.startsWith('#');
      }
      return false;
    });

    // Simple cyclomatic complexity calculation
    let cyclomaticComplexity = 1;
    const complexityKeywords = {
      javascript: ['if', 'else', 'while', 'for', 'case', 'catch', '&&', '||', '?'],
      python: ['if', 'elif', 'else', 'while', 'for', 'except', 'and', 'or']
    };

    const keywords = complexityKeywords[lang] || [];
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = codeText.match(regex);
      if (matches) {
        cyclomaticComplexity += matches.length;
      }
    });

    // Calculate nesting depth
    let maxNestingDepth = 0;
    let currentDepth = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('{') || trimmed.endsWith(':')) {
        currentDepth++;
        maxNestingDepth = Math.max(maxNestingDepth, currentDepth);
      }
      if (trimmed.includes('}')) {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }

    return {
      lineCount: lines.length,
      nonEmptyLineCount: nonEmptyLines.length,
      commentLineCount: commentLines.length,
      cyclomaticComplexity,
      maxNestingDepth,
      codeToCommentRatio: commentLines.length / Math.max(nonEmptyLines.length, 1)
    };
  };

  // Add markers to Monaco Editor
  useEffect(() => {
    if (!editor || !monaco) return;

    const model = editor.getModel();
    if (!model) return;

    // Combine all issues for markers
    const allIssues = [...errors, ...warnings, ...suggestions];
    const markers = allIssues.map(issue => ({
      startLineNumber: issue.startLineNumber,
      startColumn: issue.startColumn,
      endLineNumber: issue.endLineNumber,
      endColumn: issue.endColumn,
      message: issue.message,
      severity: issue.severity === 'error' ? monaco.MarkerSeverity.Error :
                issue.severity === 'warning' ? monaco.MarkerSeverity.Warning :
                monaco.MarkerSeverity.Info,
      source: issue.source
    }));

    monaco.editor.setModelMarkers(model, 'codeAnalysis', markers);

    return () => {
      monaco.editor.setModelMarkers(model, 'codeAnalysis', []);
    };
  }, [editor, monaco, errors, warnings, suggestions]);

  // Debounced code analysis
  useEffect(() => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    analysisTimeoutRef.current = setTimeout(() => {
      analyzeCode(code);
    }, 1000);

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [code, analyzeCode]);

  // Problems Panel Component
  const ProblemsPanel = () => {
    const allIssues = [
      ...errors.map(e => ({ ...e, type: 'error' })),
      ...warnings.map(w => ({ ...w, type: 'warning' })),
      ...suggestions.map(s => ({ ...s, type: 'info' }))
    ].sort((a, b) => a.startLineNumber - b.startLineNumber);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="absolute bottom-8 left-4 right-4 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-80 overflow-hidden z-50"
      >
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-800">Problems</span>
              <div className="flex items-center gap-4 text-sm">
                {errors.length > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    {errors.length} errors
                  </span>
                )}
                {warnings.length > 0 && (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                    {warnings.length} warnings
                  </span>
                )}
                {suggestions.length > 0 && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    {suggestions.length} suggestions
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setShowProblems(false)}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {allIssues.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="text-2xl mb-2">✅</div>
              <div>No problems found</div>
              <div className="text-sm">Your code looks great!</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {allIssues.map((issue, index) => (
                <div 
                  key={issue.id || index}
                  className="p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    if (editor) {
                      editor.setPosition({
                        lineNumber: issue.startLineNumber,
                        column: issue.startColumn
                      });
                      editor.focus();
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 ${
                      issue.type === 'error' ? 'bg-red-500' :
                      issue.type === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}></div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-800 font-medium">
                        {issue.message}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Line {issue.startLineNumber}, Column {issue.startColumn}
                        {issue.source && ` • ${issue.source}`}
                      </div>
                      {issue.quickFix && (
                        <button className="text-xs text-blue-600 hover:text-blue-800 mt-1">
                          💡 {issue.quickFix}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Code Metrics Panel
  const CodeMetricsPanel = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute top-4 right-20 bg-white rounded-lg shadow-lg p-4 min-w-64 z-40"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📊</span>
        <span className="font-semibold text-gray-800">Code Metrics</span>
      </div>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Lines of Code:</span>
          <span className="font-medium">{codeMetrics.lineCount || 0}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Non-empty Lines:</span>
          <span className="font-medium">{codeMetrics.nonEmptyLineCount || 0}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Comments:</span>
          <span className="font-medium">{codeMetrics.commentLineCount || 0}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Complexity:</span>
          <span className={`font-medium ${
            (codeMetrics.cyclomaticComplexity || 0) > 10 ? 'text-red-600' :
            (codeMetrics.cyclomaticComplexity || 0) > 6 ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {codeMetrics.cyclomaticComplexity || 0}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Max Nesting:</span>
          <span className={`font-medium ${
            (codeMetrics.maxNestingDepth || 0) > 4 ? 'text-red-600' :
            (codeMetrics.maxNestingDepth || 0) > 2 ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {codeMetrics.maxNestingDepth || 0}
          </span>
        </div>
        
        <div className="pt-2 border-t border-gray-200">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Documentation:</span>
            <span className={`${
              (codeMetrics.codeToCommentRatio || 0) > 0.2 ? 'text-green-600' :
              (codeMetrics.codeToCommentRatio || 0) > 0.1 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {((codeMetrics.codeToCommentRatio || 0) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      {/* Analysis Status Indicator */}
      {isAnalyzing && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-40 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Analyzing code...
        </div>
      )}

      {/* Problems Panel */}
      <AnimatePresence>
        {showProblems && <ProblemsPanel />}
      </AnimatePresence>

      {/* Code Metrics Panel */}
      {Object.keys(codeMetrics).length > 0 && (
        <CodeMetricsPanel />
      )}

      {/* Floating Action Buttons */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-40">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowProblems(!showProblems)}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white font-bold ${
            errors.length > 0 ? 'bg-red-500' :
            warnings.length > 0 ? 'bg-yellow-500' :
            'bg-green-500'
          }`}
          title="Show Problems"
        >
          {errors.length + warnings.length + suggestions.length || '✓'}
        </motion.button>
      </div>
    </>
  );
};

export default CodeAnalysisFeatures;