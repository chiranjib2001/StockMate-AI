import React, { useState } from 'react';
import { X, Sparkles, RefreshCw, Send, HelpCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';

interface AskGemmaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AskGemmaModal: React.FC<AskGemmaModalProps> = ({ isOpen, onClose }) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const sampleQuestions = [
    "What products should I reorder this week?",
    "What is my current inventory valuation and stock health?",
    "Which products haven't moved or are running critically low?"
  ];

  const handleAsk = async (q?: string) => {
    const query = q || question;
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.askGemma(query);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to query Gemma");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '24px', maxWidth: '720px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', padding: '8px', borderRadius: '8px' }}>
              <Sparkles size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#ffffff' }}>Ask Your Inventory (Gemma 2)</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Deterministic backend metrics + open-weight LLM reasoning
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-subtle)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Suggested Prompts */}
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Suggested Questions:</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                id={`ask-sample-${idx}`}
                onClick={() => {
                  setQuestion(q);
                  handleAsk(q);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)'
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}
        >
          <input
            id="gemma-qa-input"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask any question about your stock, valuation, or restock needs..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'rgba(10, 14, 23, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
          <button
            id="gemma-qa-submit-btn"
            type="submit"
            disabled={isLoading || !question.trim()}
            className="btn-primary"
            style={{ opacity: isLoading || !question.trim() ? 0.6 : 1 }}
          >
            {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
            <span>Ask</span>
          </button>
        </form>

        {/* Loading Indicator */}
        {isLoading && (
          <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
            <RefreshCw size={24} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
            <p style={{ fontSize: '0.85rem', color: '#a78bfa', fontWeight: 600 }}>Gemma 2:2b is analyzing verified database records...</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Supplier PII and internal notes were automatically stripped before reasoning.</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: '12px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', color: '#fb7185', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* Result Card */}
        {result && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-glow)',
            borderRadius: 'var(--radius-sm)',
            padding: '18px',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Verified Metrics Chips */}
            {result.metrics && (
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '14px',
                paddingBottom: '12px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                  Valuation: ${result.metrics.total_inventory_valuation_usd?.toLocaleString()}
                </span>
                <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                  Units: {result.metrics.total_units_in_stock}
                </span>
                <span className={`badge ${result.metrics.low_stock_items_count > 0 ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.72rem' }}>
                  Low Stock Items: {result.metrics.low_stock_items_count}
                </span>
                <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                  Latency: {result.latency_seconds}s ({result.model_used})
                </span>
              </div>
            )}

            {/* Gemma Response Body */}
            <div style={{
              fontSize: '0.92rem',
              color: '#e2e8f0',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap'
            }}>
              {result.answer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
