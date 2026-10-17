import React from 'react';
import { History, ArrowDownRight, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { StockMovement } from '../api/client';

interface MovementsViewProps {
  movements: StockMovement[];
}

export const MovementsView: React.FC<MovementsViewProps> = ({ movements }) => {
  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
            Stock Movement & Transaction Ledger
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
            Immutable audit trail of sales, receipts, and AI-assisted adjustments
          </p>
        </div>
        <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
          {movements.length} Transactions
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '12px 16px' }}>Timestamp</th>
              <th style={{ padding: '12px 16px' }}>Product</th>
              <th style={{ padding: '12px 16px' }}>Type</th>
              <th style={{ padding: '12px 16px' }}>Change</th>
              <th style={{ padding: '12px 16px' }}>Audit Reference / Note</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => {
              const isPositive = m.quantity_delta > 0;
              const formattedDate = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ', ' + new Date(m.timestamp).toLocaleDateString();

              return (
                <tr
                  key={m.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    fontSize: '0.85rem'
                  }}
                >
                  <td style={{ padding: '12px 16px', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                    {formattedDate}
                  </td>

                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#ffffff' }}>
                    {m.product_name}
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${m.movement_type === 'restock' ? 'badge-success' : m.movement_type === 'sale' ? 'badge-cyan' : 'badge-warning'}`}>
                      {m.movement_type}
                    </span>
                  </td>

                  <td style={{ padding: '12px 16px', fontWeight: 700, color: isPositive ? '#34d399' : '#38bdf8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      <span>{isPositive ? `+${m.quantity_delta}` : m.quantity_delta}</span>
                    </div>
                  </td>

                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {m.reference_note || "System updated"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {movements.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-subtle)' }}>
            No stock movements recorded yet. Log sales or receipts via the command bar above.
          </div>
        )}
      </div>
    </div>
  );
};
