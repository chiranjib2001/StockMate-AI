import React from 'react';
import { ShieldCheck, Lock, Eye, AlertOctagon, Cpu, Database } from 'lucide-react';
import { AIAuditLog } from '../api/client';

interface PrivacyViewProps {
  auditLogs: AIAuditLog[];
  onOpenPrivacyModal: () => void;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({ auditLogs, onOpenPrivacyModal }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Privacy Architecture Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Lock size={20} color="#10b981" />
            <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 700 }}>
              1. Never Leaves Your Local Database
            </h4>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Supplier email addresses, supplier legal names, exact warehouse bins, rack locations, contract discounts, and access passcodes are strictly excluded by the whitelist layer.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Cpu size={20} color="#a78bfa" />
            <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 700 }}>
              2. Minimized Whitelist to Gemma
            </h4>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            The open-weight model only receives anonymous product references (e.g. <code style={{ color: '#a78bfa' }}>P-101</code>), stock counts, and sales velocity metrics needed to compute restock advice.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #06b6d4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Database size={20} color="#22d3ee" />
            <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 700 }}>
              3. Transparent Audit & Control
            </h4>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Every interaction is logged with exact field counts and timestamps. Users can inspect the exact payload sent before any external model is invoked.
          </p>
          <button
            onClick={onOpenPrivacyModal}
            className="btn-secondary"
            style={{ marginTop: '12px', fontSize: '0.78rem', padding: '6px 12px' }}
          >
            <Eye size={14} />
            <span>Launch Live Data Inspector</span>
          </button>
        </div>
      </div>

      {/* AI Audit Logs Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
              Real-Time AI Context Audit Trail
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
              Verifiable proof of fields transmitted, latency, and model execution
            </p>
          </div>
          <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
            Zero-Leak Policy Verified
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 14px' }}>Timestamp</th>
                <th style={{ padding: '12px 14px' }}>Action Type</th>
                <th style={{ padding: '12px 14px' }}>User Query / Input</th>
                <th style={{ padding: '12px 14px' }}>Whitelisted Fields Sent</th>
                <th style={{ padding: '12px 14px' }}>Model</th>
                <th style={{ padding: '12px 14px' }}>Latency</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.82rem' }}>
                  <td style={{ padding: '12px 14px', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(log.created_at).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className="badge badge-purple">{log.action_type}</span>
                  </td>
                  <td style={{ padding: '12px 14px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#ffffff' }}>
                    "{log.user_input}"
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                    {log.fields_sent.join(', ')}
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                    {log.model_name}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#34d399', fontWeight: 600 }}>
                    {log.latency_seconds}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {auditLogs.length === 0 && (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-subtle)' }}>
              No AI queries recorded in this session yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
