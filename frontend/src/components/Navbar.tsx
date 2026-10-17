import React from 'react';
import { Package, ShieldCheck, Cpu, Database, Sparkles, Eye } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'products' | 'movements' | 'privacy';
  setActiveTab: (tab: 'dashboard' | 'products' | 'movements' | 'privacy') => void;
  onOpenAskAI: () => void;
  onOpenPrivacyModal: () => void;
  onOpenAddProduct: () => void;
  modelBadge?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAskAI,
  onOpenPrivacyModal,
  onOpenAddProduct,
  modelBadge
}) => {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(10, 14, 23, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            padding: '9px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)'
          }}>
            <Package size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #ffffff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                StockMate AI
              </h1>
              <span className="badge badge-purple" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                {modelBadge || "Gemma 2"}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 500 }}>
              Privacy-Aware Inventory Assistant
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '4px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            id="tab-dashboard-btn"
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: activeTab === 'dashboard' ? '#ffffff' : 'var(--text-muted)',
              background: activeTab === 'dashboard' ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
              transition: 'all 0.15s ease'
            }}
          >
            Dashboard
          </button>
          <button
            id="tab-products-btn"
            onClick={() => setActiveTab('products')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: activeTab === 'products' ? '#ffffff' : 'var(--text-muted)',
              background: activeTab === 'products' ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
              transition: 'all 0.15s ease'
            }}
          >
            Inventory Catalog
          </button>
          <button
            id="tab-movements-btn"
            onClick={() => setActiveTab('movements')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: activeTab === 'movements' ? '#ffffff' : 'var(--text-muted)',
              background: activeTab === 'movements' ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
              transition: 'all 0.15s ease'
            }}
          >
            Movement Audit
          </button>
          <button
            id="tab-privacy-btn"
            onClick={() => setActiveTab('privacy')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: activeTab === 'privacy' ? '#ffffff' : 'var(--text-muted)',
              background: activeTab === 'privacy' ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
              transition: 'all 0.15s ease'
            }}
          >
            Privacy Logs
          </button>
        </nav>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            id="inspect-privacy-btn"
            onClick={onOpenPrivacyModal}
            className="btn-secondary"
            title="Inspect Privacy Data Masking"
            style={{ padding: '8px 12px', fontSize: '0.82rem' }}
          >
            <ShieldCheck size={16} color="#10b981" />
            <span>Privacy Guard</span>
          </button>

          <button
            id="ask-gemma-btn"
            onClick={onOpenAskAI}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.82rem', borderColor: 'rgba(139, 92, 246, 0.4)' }}
          >
            <Sparkles size={16} color="#a78bfa" />
            <span>Ask Gemma</span>
          </button>

          <button
            id="add-product-btn"
            onClick={onOpenAddProduct}
            className="btn-primary"
            style={{ padding: '8px 14px', fontSize: '0.82rem' }}
          >
            <span>+ Add Item</span>
          </button>
        </div>
      </div>
    </header>
  );
};
