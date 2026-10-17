import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { NaturalLanguageBar } from './components/NaturalLanguageBar';
import { KPIOverview } from './components/KPIOverview';
import { RestockBanner } from './components/RestockBanner';
import { InventoryTable } from './components/InventoryTable';
import { MovementsView } from './components/MovementsView';
import { PrivacyView } from './components/PrivacyView';
import { AskGemmaModal } from './components/AskGemmaModal';
import { PrivacyInspectorModal } from './components/PrivacyInspectorModal';
import { AddProductModal } from './components/AddProductModal';
import { api, Product, DashboardKPIs, StockMovement, AIAuditLog } from './api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Sparkles, PieChart, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'movements' | 'privacy'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AIAuditLog[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  // Modals
  const [isAskOpen, setIsAskOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedProductForPrivacy, setSelectedProductForPrivacy] = useState<Product | undefined>();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [systemHealth, setSystemHealth] = useState({
    database: 'MongoDB Atlas',
    ai_model: 'Gemma 2'
  });

  useEffect(() => {
    refreshAllData();
    api.getHealth().then((h) => {
      if (h && h.database) {
        setSystemHealth({ database: h.database, ai_model: h.ai_model });
      }
    });
  }, []);

  const refreshAllData = async () => {
    try {
      const [prods, kpiData, moves, audits, catData] = await Promise.all([
        api.getProducts(),
        api.getKPIs(),
        api.getMovements(),
        api.getAuditLogs(),
        api.getCategoryDistribution()
      ]);
      setProducts(prods);
      setKpis(kpiData);
      setMovements(moves);
      setAuditLogs(audits);
      setCategoryData(catData);
    } catch (e) {
      console.error("Error refreshing data:", e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStockDelta = async (productId: string, delta: number, type: string) => {
    try {
      await api.recordMovement(productId, delta, type, `Direct manual ${type}`);
      showToast(`Logged ${type}: ${delta > 0 ? '+' : ''}${delta} unit(s)`);
      refreshAllData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleOneClickRestock = async (productId: string, qty: number, productName: string) => {
    try {
      await api.recordMovement(productId, qty, 'restock', `Restock Assistant auto-fill`);
      showToast(`Restocked +${qty} units of ${productName}`);
      refreshAllData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.deleteProduct(id);
      showToast("Product deleted successfully");
      refreshAllData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleOpenPrivacyForProduct = (product: Product) => {
    setSelectedProductForPrivacy(product);
    setIsPrivacyOpen(true);
  };

  const barColors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#1e293b',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          borderRadius: '8px',
          padding: '12px 18px',
          color: '#ffffff',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.88rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <CheckCircle2 size={18} color="#34d399" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAskAI={() => setIsAskOpen(true)}
        onOpenPrivacyModal={() => setIsPrivacyOpen(true)}
        onOpenAddProduct={() => setIsAddOpen(true)}
        modelBadge={systemHealth.ai_model}
      />

      {/* Main Container */}
      <main style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '24px' }}>
        {/* Natural Language Command Bar (Always accessible on top) */}
        <NaturalLanguageBar onStockUpdated={refreshAllData} />

        {/* Tab 1: Dashboard View */}
        {activeTab === 'dashboard' && (
          <div>
            <KPIOverview kpis={kpis} />
            <RestockBanner
              recommendations={kpis?.critical_restocks || []}
              onQuickRestock={handleOneClickRestock}
            />

            {/* Visual Analytics & Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '28px' }}>
              {/* Category Valuation Chart */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PieChart size={18} color="#8b5cf6" />
                    <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 700 }}>Inventory Value by Category</h4>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Verified figures ($)</span>
                </div>

                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                      <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                      <Tooltip
                        contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.8rem' }}
                        formatter={(val: any) => [`$${val}`, 'Inventory Value']}
                      />
                      <Bar dataKey="total_value" radius={[6, 6, 0, 0]}>
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Local AI Engine Health & Architecture */}
              <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Cpu size={18} color="#06b6d4" />
                    <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 700 }}>Open-Weight AI Pipeline</h4>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
                    Running <strong>{systemHealth.ai_model}</strong> with zero-leak privacy sanitization. User statements are filtered via whitelist projections before reasoning.
                  </p>

                  <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span>Model Inference:</span>
                      <strong style={{ color: '#34d399' }}>{systemHealth.ai_model}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span>Storage Engine:</span>
                      <strong style={{ color: '#38bdf8' }}>{systemHealth.database}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>PII Redaction Policy:</span>
                      <strong style={{ color: '#a78bfa' }}>Zero Leak Whitelist</strong>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                  <button onClick={() => setIsAskOpen(true)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}>
                    <Sparkles size={14} color="#a78bfa" />
                    <span>Run Query</span>
                  </button>
                  <button onClick={() => setIsPrivacyOpen(true)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}>
                    <ShieldCheck size={14} color="#10b981" />
                    <span>Verify Whitelist</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Inventory Table Quick Overview */}
            <InventoryTable
              products={products}
              onStockDelta={handleStockDelta}
              onDeleteProduct={handleDeleteProduct}
              onOpenPrivacyForProduct={handleOpenPrivacyForProduct}
            />
          </div>
        )}

        {/* Tab 2: Products Catalog View */}
        {activeTab === 'products' && (
          <InventoryTable
            products={products}
            onStockDelta={handleStockDelta}
            onDeleteProduct={handleDeleteProduct}
            onOpenPrivacyForProduct={handleOpenPrivacyForProduct}
          />
        )}

        {/* Tab 3: Movements Audit View */}
        {activeTab === 'movements' && (
          <MovementsView movements={movements} />
        )}

        {/* Tab 4: Privacy & AI Audit View */}
        {activeTab === 'privacy' && (
          <PrivacyView
            auditLogs={auditLogs}
            onOpenPrivacyModal={() => setIsPrivacyOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-subtle)',
        padding: '20px 24px',
        textAlign: 'center',
        fontSize: '0.78rem',
        color: 'var(--text-subtle)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span>StockMate AI · Built for Hacktoberfest 2026 Open-Source AI Challenge (Week 2: Side Hustle)</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Model: Gemma 2:2b</span>
            <span>Database: MongoDB</span>
            <span>Host: Render Ready</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AskGemmaModal isOpen={isAskOpen} onClose={() => setIsAskOpen(false)} />
      <PrivacyInspectorModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        selectedProduct={selectedProductForPrivacy}
      />
      <AddProductModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onProductCreated={refreshAllData}
      />
    </div>
  );
};

export default App;
