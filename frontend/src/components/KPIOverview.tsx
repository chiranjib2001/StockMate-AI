import React from 'react';
import { DollarSign, Layers, AlertTriangle, TrendingUp } from 'lucide-react';
import { DashboardKPIs } from '../api/client';

interface KPIOverviewProps {
  kpis: DashboardKPIs | null;
}

export const KPIOverview: React.FC<KPIOverviewProps> = ({ kpis }) => {
  if (!kpis) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {/* Total Valuation */}
      <div className="glass-card interactive" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase' }}>
              Inventory Valuation
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
              ${kpis.total_inventory_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 500 }}>
              Potential Rev: ${kpis.potential_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '10px' }}>
            <DollarSign size={22} color="#34d399" />
          </div>
        </div>
      </div>

      {/* Units in Stock */}
      <div className="glass-card interactive" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase' }}>
              Physical Units on Hand
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
              {kpis.total_stock_units} <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-muted)' }}>units</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
              Across {kpis.total_products} unique SKUs
            </span>
          </div>
          <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '10px', borderRadius: '10px' }}>
            <Layers size={22} color="#22d3ee" />
          </div>
        </div>
      </div>

      {/* Low Stock Warning */}
      <div className="glass-card interactive" style={{ padding: '20px', borderColor: kpis.low_stock_count > 0 ? 'rgba(244, 63, 94, 0.35)' : 'var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase' }}>
              Low Stock Warnings
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: kpis.low_stock_count > 0 ? '#fb7185' : '#ffffff', marginTop: '4px' }}>
              {kpis.low_stock_count} <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-muted)' }}>items</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: kpis.out_of_stock_count > 0 ? '#fb7185' : 'var(--text-subtle)' }}>
              {kpis.out_of_stock_count} completely depleted
            </span>
          </div>
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', padding: '10px', borderRadius: '10px' }}>
            <AlertTriangle size={22} color="#fb7185" />
          </div>
        </div>
      </div>

      {/* Sales Velocity */}
      <div className="glass-card interactive" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase' }}>
              Recent Sales Logged
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
              {kpis.recent_sales_count} <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-muted)' }}>units</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 500 }}>
              Gemma tracked & audited
            </span>
          </div>
          <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '10px', borderRadius: '10px' }}>
            <TrendingUp size={22} color="#a78bfa" />
          </div>
        </div>
      </div>
    </div>
  );
};
