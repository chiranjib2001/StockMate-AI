import React from 'react';
import { AlertCircle, ArrowUpRight, ShoppingCart, HelpCircle } from 'lucide-react';
import { RestockRecommendation } from '../api/client';

interface RestockBannerProps {
  recommendations: RestockRecommendation[];
  onQuickRestock: (productId: string, reorderQty: number, productName: string) => void;
}

export const RestockBanner: React.FC<RestockBannerProps> = ({
  recommendations,
  onQuickRestock
}) => {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} color="#f59e0b" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
            Smart Restocking Assistant
          </h3>
          <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>
            Action Required ({recommendations.length})
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
          Calculated with lead-time buffers & explicit uncertainty modeling
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '14px'
      }}>
        {recommendations.map((item) => (
          <div
            key={item.product_id}
            className="glass-card"
            style={{
              padding: '16px 18px',
              borderLeft: `4px solid ${item.urgency === 'Critical' ? '#f43f5e' : '#f59e0b'}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#ffffff' }}>
                    {item.product_name}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                    SKU: {item.sku} · {item.category}
                  </span>
                </div>
                <span className={`badge ${item.urgency === 'Critical' ? 'badge-danger' : 'badge-warning'}`}>
                  {item.urgency}
                </span>
              </div>

              {/* Quantities Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                margin: '12px 0',
                padding: '10px 12px',
                background: 'rgba(0, 0, 0, 0.25)',
                borderRadius: '8px'
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                    Current Stock
                  </span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: item.current_stock === 0 ? '#f43f5e' : '#fbbf24' }}>
                    {item.current_stock}
                  </div>
                </div>

                <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '16px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                    Threshold
                  </span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {item.minimum_stock}
                  </div>
                </div>

                <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '16px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                    Suggested Reorder
                  </span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>
                    +{item.recommended_reorder} units
                  </div>
                </div>
              </div>

              {/* Reasoning & Uncertainty */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Est. Cost: ${item.estimated_cost.toFixed(2)} (${item.unit_cost}/u)
                </span>
                <span style={{ color: 'var(--text-subtle)' }}>
                  Uncertainty: <strong style={{ color: item.uncertainty_level === 'High' ? '#fb7185' : '#38bdf8' }}>{item.uncertainty_level}</strong>
                </span>
              </div>
            </div>

            <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                id={`restock-btn-${item.product_id}`}
                onClick={() => onQuickRestock(item.product_id, item.recommended_reorder, item.product_name)}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399' }}
              >
                <ShoppingCart size={14} />
                <span>One-Click Restock (+{item.recommended_reorder})</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
