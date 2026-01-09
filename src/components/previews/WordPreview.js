import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import DOMPurify from 'dompurify';

const WordPreview = ({ blob, darkMode }) => {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const convertToHtml = async () => {
      try {
        setLoading(true);
        setError(null);

        const arrayBuffer = await blob.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });

        // Sanitize HTML to prevent XSS attacks
        const sanitizedHtml = DOMPurify.sanitize(result.value, {
          ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'strong', 'em', 'u', 'b', 'i', 'a', 'br', 'blockquote', 'span', 'div'],
          ALLOWED_ATTR: ['href', 'class', 'style', 'colspan', 'rowspan']
        });

        setHtml(sanitizedHtml);
        setMessages(result.messages);
        setLoading(false);
      } catch (err) {
        console.error('Word preview error:', err);
        setError('Failed to generate preview. The file may be corrupted or use unsupported features.');
        setLoading(false);
      }
    };

    if (blob) {
      convertToHtml();
    }
  }, [blob]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Converting Word document to preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className={`max-w-lg p-6 rounded-lg ${darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-700'}`}>
          <h3 className="font-semibold mb-2">Preview Not Available</h3>
          <p className="mb-2">{error}</p>
          <p className="text-sm">You can still download the file to view it in Microsoft Word or a compatible application.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Subtle Preview Notice */}
      <div className={`px-4 py-2 border-b text-xs ${darkMode ? 'bg-gray-800/50 border-gray-700 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
        <p className="text-center">Preview • Formatting may differ from original document</p>
      </div>

      {/* Conversion Messages (if any) */}
      {messages.length > 0 && (
        <details className={`px-4 py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <summary className={`cursor-pointer text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Show conversion details ({messages.length})
          </summary>
          <div className="mt-2 space-y-1">
            {messages.map((msg, idx) => (
              <p key={idx} className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {msg.message}
              </p>
            ))}
          </div>
        </details>
      )}

      {/* Document Preview */}
      <div className="flex-1 overflow-auto">
        <div className={`max-w-4xl mx-auto p-12 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`} style={{ minHeight: '11in' }}>
          <div
            className={`word-preview-content ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}
            dangerouslySetInnerHTML={{ __html: html }}
            style={{
              fontFamily: "'Calibri', 'Arial', sans-serif",
              fontSize: '11pt',
              lineHeight: '1.5',
            }}
          />
        </div>
      </div>

      <style>{`
        .word-preview-content {
          text-align: justify;
        }
        .word-preview-content p {
          margin-bottom: 0.75em;
          text-indent: 0;
        }
        .word-preview-content h1 {
          font-size: 20pt;
          font-weight: bold;
          margin: 0.67em 0;
          color: ${darkMode ? '#e5e7eb' : '#1f2937'};
        }
        .word-preview-content h2 {
          font-size: 16pt;
          font-weight: bold;
          margin: 0.75em 0;
          color: ${darkMode ? '#d1d5db' : '#374151'};
        }
        .word-preview-content h3 {
          font-size: 13.5pt;
          font-weight: bold;
          margin: 0.83em 0;
          color: ${darkMode ? '#d1d5db' : '#4b5563'};
        }
        .word-preview-content ul, .word-preview-content ol {
          margin-left: 1.5em;
          margin-bottom: 0.75em;
          padding-left: 0.5em;
        }
        .word-preview-content li {
          margin-bottom: 0.25em;
        }
        .word-preview-content table {
          border-collapse: collapse;
          margin: 1em 0;
          width: 100%;
          border: 1px solid ${darkMode ? '#4b5563' : '#d1d5db'};
        }
        .word-preview-content table td, .word-preview-content table th {
          border: 1px solid ${darkMode ? '#4b5563' : '#d1d5db'};
          padding: 0.5em 0.75em;
        }
        .word-preview-content table th {
          background-color: ${darkMode ? '#374151' : '#f9fafb'};
          font-weight: bold;
        }
        .word-preview-content strong, .word-preview-content b {
          font-weight: 700;
        }
        .word-preview-content em, .word-preview-content i {
          font-style: italic;
        }
        .word-preview-content u {
          text-decoration: underline;
        }
        .word-preview-content a {
          color: ${darkMode ? '#60a5fa' : '#2563eb'};
          text-decoration: underline;
        }
        .word-preview-content a:hover {
          color: ${darkMode ? '#93c5fd' : '#1d4ed8'};
        }
        .word-preview-content blockquote {
          margin: 1em 0;
          padding-left: 1em;
          border-left: 3px solid ${darkMode ? '#4b5563' : '#d1d5db'};
          color: ${darkMode ? '#9ca3af' : '#6b7280'};
        }
      `}</style>
    </div>
  );
};

export default WordPreview;
