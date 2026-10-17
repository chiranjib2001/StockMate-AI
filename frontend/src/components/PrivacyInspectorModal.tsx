import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';

interface PrivacyInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct?: any;
}

export const PrivacyInspectorModal: React.FC<PrivacyInspectorModalProps> = ({
  isOpen,
  onClose,
  selectedProduct
}) => {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPreview();
    }
  }, [isOpen]);

  const loadPreview = async () => {
    setIsLoading(true);
    try {
      const res = await api.getPrivacyPreview();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '820px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '8px', borderRadius: '8px' }}>
              <ShieldCheck size={22} color="#10b981" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#ffffff' }}>Privacy Masking Inspector</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Comparing internal business records vs. data whitelisted for AI inference
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-subtle)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Guarantee Banner */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Lock size={18} color="#10b981" />
          <span style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: 500 }}>
            <strong>Zero Direct DB Access:</strong> The AI model never receives database credentials, supplier contacts, customer PII, or internal storage coordinates.
          </span>
        </div>

        {/* Side by side comparison */}
        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {/* Left: Raw */}
            <div style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                  Raw Database Record (Local Only)
                </span>
                <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>
                  Confidential
                </span>
              </div>
              <pre style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: '#94a3b8',
                background: 'rgba(0,0,0,0.3)',
                padding: '12px',
                borderRadius: '6px',
                overflowX: 'auto',
                lineHeight: 1.5
              }}>
                {JSON.stringify(data.raw_record_with_pii, null, 2)}
              </pre>
            </div>

            {/* Right: Masked */}
            <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a78bfa' }}>
                  What Gemma AI Actually Sees
                </span>
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                  Whitelisted Payload
                </span>
              </div>
              <pre style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: '#38bdf8',
                background: 'rgba(0,0,0,0.3)',
                padding: '12px',
                borderRadius: '6px',
                overflowX: 'auto',
                lineHeight: 1.5
              }}>
                {JSON.stringify(data.sanitized_ai_payload, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Excluded Fields Pills */}
        {data?.redacted_fields && (
          <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '14px', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
              Explicitly Redacted / Isolated Metadata Fields:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {data.redacted_fields.map((f: string, i: number) => (
                <span key={i} className="badge badge-danger" style={{ fontSize: '0.72rem' }}>
                  ✕ {f}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button onClick={onClose} className="btn-secondary">
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
