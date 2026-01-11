import { useState } from 'react';
import { reviewService } from '../services/reviewService';

export const AIReviewer = () => {
  const [abstractText, setAbstractText] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<'text' | 'pdf'>('text');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [extractedText, setExtractedText] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      setPdfFile(file);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    setError('');
    setLoading(true);
    setResult(null);
    setExtractedText('');

    try {
      if (inputMode === 'text') {
        if (!abstractText.trim()) {
          setError('Please enter your abstract text');
          setLoading(false);
          return;
        }
        const response = await reviewService.analyzeAbstract(abstractText);
        console.log('Text analysis response:', response);
        
        // Ensure suggestions is a string
        if (response.analysis) {
          response.analysis.suggestions = String(response.analysis.suggestions || '');
        }
        
        setResult(response.analysis);
      } else {
        if (!pdfFile) {
          setError('Please select a PDF file');
          setLoading(false);
          return;
        }
        const response = await reviewService.analyzeAbstractPDF(pdfFile);
        console.log('PDF analysis response:', response);
        
        // Ensure suggestions is a string
        if (response.analysis) {
          response.analysis.suggestions = String(response.analysis.suggestions || '');
        }
        
        setResult(response.analysis);
        setExtractedText(response.extractedText);
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.error || 'Failed to analyze abstract');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={styles.header}>
        <div>
          <h1>🤖 AI Abstract Reviewer</h1>
          <p style={styles.subtitle}>
            Get instant AI-powered feedback on your project abstract
          </p>
        </div>
      </div>

      <div className="card">
        <h2 style={styles.sectionTitle}>Enter Your Abstract</h2>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {/* Input Mode Toggle */}
        <div style={styles.toggleContainer}>
          <button
            onClick={() => {
              setInputMode('text');
              setPdfFile(null);
              setError('');
            }}
            className={inputMode === 'text' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
          >
            📝 Type Text
          </button>
          <button
            onClick={() => {
              setInputMode('pdf');
              setAbstractText('');
              setError('');
            }}
            className={inputMode === 'pdf' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
          >
            📄 Upload PDF
          </button>
        </div>

        {inputMode === 'text' ? (
          <div className="input-group">
            <label>Abstract Text</label>
            <textarea
              value={abstractText}
              onChange={(e) => setAbstractText(e.target.value)}
              placeholder="Paste your project abstract here..."
              style={{ minHeight: '200px' }}
            />
            <small style={{ color: '#6b7280', marginTop: '4px' }}>
              Include: Background, Objectives, Methodology, and Expected Outcomes
            </small>
          </div>
        ) : (
          <div className="input-group">
            <label>Upload Abstract PDF</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              style={{ padding: '8px' }}
            />
            {pdfFile && (
              <div style={styles.fileSelected}>
                ✅ Selected: {pdfFile.name}
              </div>
            )}
            <small style={{ color: '#6b7280', marginTop: '4px' }}>
              Upload a PDF containing your abstract (max 10MB)
            </small>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Analyzing...' : '🔍 Analyze with AI'}
        </button>
      </div>

      {loading && (
        <div className="card">
          <div className="loading">
            <div className="spinner" />
            <p style={{ marginTop: '16px', color: '#6b7280' }}>
              AI is analyzing your abstract...
            </p>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h2 style={styles.sectionTitle}>AI Review Results</h2>

          {extractedText && (
            <div className="alert alert-info" style={{ marginBottom: '20px' }}>
              <strong>📄 Extracted from PDF:</strong>
              <p style={{ marginTop: '8px', fontSize: '13px', fontFamily: 'monospace' }}>
                {extractedText}
              </p>
            </div>
          )}

          <div style={styles.ratingSection}>
            <div style={styles.ratingLabel}>Overall Rating</div>
            <div style={styles.ratingValue}>
              {result.rating ? `${result.rating}/10` : 'N/A'}
            </div>
            <div style={styles.ratingBar}>
              <div
                style={{
                  ...styles.ratingBarFill,
                  width: `${(result.rating / 10) * 100}%`,
                  backgroundColor: getRatingColor(result.rating),
                }}
              />
            </div>
          </div>

          <div style={styles.feedbackSection}>
            <h3 style={styles.feedbackTitle}>📝 Detailed Feedback</h3>
            <p style={styles.feedbackText}>{result.feedback}</p>
          </div>

          {result.suggestions && (
            <div style={styles.suggestionsSection}>
              <h3 style={styles.feedbackTitle}>💡 Suggestions for Improvement</h3>
              <div style={styles.suggestionsText}>
                {(typeof result.suggestions === 'string' 
                  ? result.suggestions.split('\n') 
                  : [result.suggestions]
                ).map((suggestion: string, index: number) => (
                  <div key={index} style={styles.suggestionItem}>
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={styles.actions}>
            <button
              onClick={() => {
                setResult(null);
                setAbstractText('');
                setPdfFile(null);
                setExtractedText('');
              }}
              className="btn btn-outline"
            >
              Analyze Another
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: '20px' }}>
        <h2 style={styles.sectionTitle}>💡 Tips for a Great Abstract</h2>
        <ul style={styles.tipsList}>
          <li>✅ Start with a clear background/context of your project</li>
          <li>✅ Clearly state your objectives and goals</li>
          <li>✅ Describe your methodology or approach</li>
          <li>✅ Mention expected outcomes or results</li>
          <li>✅ Use clear, concise, and academic language</li>
          <li>✅ Keep it between 150-300 words</li>
          <li>✅ Avoid jargon and overly technical terms</li>
          <li>✅ Proofread for grammar and spelling errors</li>
        </ul>
      </div>
    </div>
  );
};

const getRatingColor = (rating: number) => {
  if (rating >= 8) return '#10b981';
  if (rating >= 6) return '#f59e0b';
  return '#ef4444';
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    marginBottom: '30px',
  },
  subtitle: {
    color: '#6b7280',
    marginTop: '4px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
  },
  toggleContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
  },
  fileSelected: {
    marginTop: '8px',
    color: '#10b981',
    fontSize: '14px',
    fontWeight: '500',
  },
  ratingSection: {
    backgroundColor: '#f9fafb',
    padding: '24px',
    borderRadius: '8px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  ratingLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: '8px',
  },
  ratingValue: {
    fontSize: '48px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '16px',
  },
  ratingBar: {
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    maxWidth: '300px',
    margin: '0 auto',
  },
  ratingBarFill: {
    height: '100%',
    transition: 'width 0.5s ease',
  },
  feedbackSection: {
    marginBottom: '24px',
  },
  feedbackTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  feedbackText: {
    color: '#374151',
    lineHeight: '1.7',
    fontSize: '15px',
  },
  suggestionsSection: {
    backgroundColor: '#fffbeb',
    padding: '20px',
    borderRadius: '8px',
    borderLeft: '4px solid #f59e0b',
  },
  suggestionsText: {
    color: '#374151',
  },
  suggestionItem: {
    marginBottom: '8px',
    paddingLeft: '8px',
  },
  actions: {
    marginTop: '24px',
    display: 'flex',
    gap: '12px',
  },
  tipsList: {
    listStyle: 'none',
    padding: 0,
    display: 'grid',
    gap: '12px',
  },
};

