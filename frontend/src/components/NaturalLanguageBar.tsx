import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { api, NLIntentProposal } from '../api/client';

interface NaturalLanguageBarProps {
  onStockUpdated: () => void;
}

export const NaturalLanguageBar: React.FC<NaturalLanguageBarProps> = ({ onStockUpdated }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [proposal, setProposal] = useState<NLIntentProposal | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const quickPrompts = [
    "Received 15 linen shirts from supplier",
    "Sold 3 ceramic mugs in store",
    "French lavender candle broke during transit (loss 1)",
    "Restocked 20 Ethiopian coffee bags"
  ];

  const handleParse = async (textToParse?: string) => {
    const query = textToParse || input;
    if (!query.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.parseIntent(query);
      setProposal(res);
      setShowConfirmModal(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to parse command with Gemma");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!proposal || !proposal.matched_product_id) return;

    setIsLoading(true);
    try {
      await api.confirmIntent(
        proposal.matched_product_id,
        proposal.proposed_delta,
        proposal.action,
        `AI command: "${input}"`
      );
      setSuccessMessage(`Successfully updated ${proposal.matched_product_name}: ${proposal.proposed_delta > 0 ? '+' : ''}${proposal.proposed_delta} units`);
      setShowConfirmModal(false);
      setInput('');
      setProposal(null);
      onStockUpdated();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to commit stock update");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ margin: '24px 0' }}>
      <div className="glass-card" style={{
        padding: '20px 24px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.12)'
      }}>
        {/* Ambient Top Glow */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.6), transparent)'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Sparkles size={18} color="#a78bfa" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Natural Language Stock Assistant
          </h2>
          <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
            Zero-Hallucination Safe Mode
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleParse();
          }}
          style={{ display: 'flex', gap: '10px' }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              id="nl-stock-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='e.g. "I received 15 blue linen shirts and sold 2 today..."'
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 18px',
                background: 'rgba(10, 14, 23, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.92rem',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-purple)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)')}
            />
          </div>

          <button
            id="nl-submit-btn"
            type="submit"
            disabled={isLoading || !input.trim()}
            className="btn-primary"
            style={{ opacity: isLoading || !input.trim() ? 0.6 : 1 }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Gemma Parsing...</span>
              </>
            ) : (
              <>
                <span>Process Update</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Click Prompts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Quick Prompts:</span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              id={`quick-prompt-${idx}`}
              onClick={() => {
                setInput(p);
                handleParse(p);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                borderRadius: '16px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-purple)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '6px', color: '#fb7185', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && proposal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '8px', borderRadius: '8px' }}>
                  <ShieldAlert size={22} color="#a78bfa" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#ffffff' }}>Confirm AI Proposed Stock Update</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Deterministic check: Gemma extracts intent; you confirm the transaction.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowConfirmModal(false)} style={{ color: 'var(--text-subtle)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Proposal Details Card */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Matched Product
                  </span>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginTop: '3px' }}>
                    {proposal.matched_product_name}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Interpreted Action
                  </span>
                  <div style={{ marginTop: '3px' }}>
                    <span className={`badge ${proposal.action === 'restock' ? 'badge-success' : proposal.action === 'sale' ? 'badge-cyan' : 'badge-warning'}`}>
                      {proposal.action}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Current Stock
                  </span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '3px' }}>
                    {proposal.current_stock} units
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Proposed New Stock
                  </span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: proposal.proposed_delta >= 0 ? '#34d399' : '#38bdf8', marginTop: '3px' }}>
                    {proposal.new_stock} units{' '}
                    <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                      ({proposal.proposed_delta >= 0 ? '+' : ''}{proposal.proposed_delta})
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>AI Reasoning:</span>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>
                  "{proposal.explanation}" (Confidence: {Math.round(proposal.confidence * 100)}%)
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                id="cancel-proposal-btn"
                onClick={() => setShowConfirmModal(false)}
                className="btn-secondary"
              >
                Discard
              </button>
              <button
                id="confirm-proposal-btn"
                disabled={isLoading || !proposal.matched_product_id}
                onClick={handleConfirm}
                className="btn-primary"
              >
                {isLoading ? "Executing..." : "Confirm & Update Stock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
