import React, { useState } from 'react';
import { Search, Plus, Minus, Trash2, Filter, ShieldCheck, Tag } from 'lucide-react';
import { Product } from '../api/client';

interface InventoryTableProps {
  products: Product[];
  onStockDelta: (productId: string, delta: number, type: string) => void;
  onDeleteProduct: (productId: string) => void;
  onOpenPrivacyForProduct: (product: Product) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  products,
  onStockDelta,
  onDeleteProduct,
  onOpenPrivacyForProduct
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
      {/* Table Header Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
            Product Inventory Catalog
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
            Authoritative local database · Atomic transactional inventory management
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{
            position: 'relative',
            background: 'rgba(10, 14, 23, 0.7)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Search size={16} color="var(--text-subtle)" />
            <input
              id="product-search-input"
              type="text"
              placeholder="Search products, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '0.85rem',
                color: '#ffffff',
                width: '180px'
              }}
            />
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.03)', padding: '3px', borderRadius: '6px' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: selectedCategory === cat ? '#ffffff' : 'var(--text-muted)',
                  background: selectedCategory === cat ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '12px 16px' }}>Product & SKU</th>
              <th style={{ padding: '12px 16px' }}>Category</th>
              <th style={{ padding: '12px 16px' }}>Cost / Price</th>
              <th style={{ padding: '12px 16px' }}>Margin</th>
              <th style={{ padding: '12px 16px' }}>Stock Level</th>
              <th style={{ padding: '12px 16px' }}>Privacy Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const isLow = item.quantity_on_hand <= item.minimum_stock;
              const isOut = item.quantity_on_hand === 0;
              const margin = item.selling_price > 0 ? Math.round(((item.selling_price - item.unit_cost) / item.selling_price) * 100) : 0;

              return (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Title & SKU */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.92rem' }}>
                      {item.name}
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                      {item.sku}
                    </span>
                  </td>

                  {/* Category */}
                  <td style={{ padding: '14px 16px' }}>
                    <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                      {item.category}
                    </span>
                  </td>

                  {/* Cost & Price */}
                  <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>
                    <div style={{ color: '#ffffff', fontWeight: 600 }}>${item.selling_price.toFixed(2)}</div>
                    <div style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>Cost: ${item.unit_cost.toFixed(2)}</div>
                  </td>

                  {/* Margin */}
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: margin >= 50 ? '#34d399' : '#fbbf24' }}>
                      {margin}%
                    </span>
                  </td>

                  {/* Stock Level */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`}>
                        {item.quantity_on_hand} in stock
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                        (Min: {item.minimum_stock})
                      </span>
                    </div>
                  </td>

                  {/* Privacy Badge */}
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => onOpenPrivacyForProduct(item)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.72rem',
                        color: '#10b981',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                      }}
                      title="Inspect isolated supplier and location metadata"
                    >
                      <ShieldCheck size={12} />
                      <span>Protected</span>
                    </button>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {/* Sell 1 */}
                      <button
                        id={`sell-one-${item.id}`}
                        disabled={item.quantity_on_hand <= 0}
                        onClick={() => onStockDelta(item.id, -1, 'sale')}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', borderRadius: '4px', opacity: item.quantity_on_hand <= 0 ? 0.3 : 1 }}
                        title="Log Sale (-1)"
                      >
                        <Minus size={14} />
                      </button>

                      {/* Restock 1 */}
                      <button
                        id={`restock-one-${item.id}`}
                        onClick={() => onStockDelta(item.id, 1, 'restock')}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', borderRadius: '4px' }}
                        title="Receive Stock (+1)"
                      >
                        <Plus size={14} />
                      </button>

                      {/* Delete */}
                      <button
                        id={`delete-prod-${item.id}`}
                        onClick={() => onDeleteProduct(item.id)}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', borderRadius: '4px', color: '#fb7185' }}
                        title="Delete Product"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-subtle)' }}>
            No products matching current filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
