import React, { useState } from 'react';
import { X, Plus, ShieldCheck, Lock } from 'lucide-react';
import { api, Product } from '../api/client';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onProductCreated
}) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Apparel');
  const [unitCost, setUnitCost] = useState('10.00');
  const [sellingPrice, setSellingPrice] = useState('25.00');
  const [quantity, setQuantity] = useState('20');
  const [minimumStock, setMinimumStock] = useState('5');
  const [supplierName, setSupplierName] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [warehouseLocation, setWarehouseLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) {
      setError("SKU and Product Name are required.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.createProduct({
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        category,
        unit_cost: parseFloat(unitCost) || 0,
        selling_price: parseFloat(sellingPrice) || 0,
        quantity_on_hand: parseInt(quantity) || 0,
        minimum_stock: parseInt(minimumStock) || 5,
        supplier_name: supplierName.trim() || undefined,
        supplier_email: supplierEmail.trim() || undefined,
        warehouse_location: warehouseLocation.trim() || undefined,
        notes: notes.trim() || undefined
      });
      onProductCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create product");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '24px', maxWidth: '650px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#ffffff' }}>Add New Product</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Create an inventory record with automated privacy field classification
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-subtle)' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '6px', color: '#fb7185', fontSize: '0.85rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* General Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>SKU *</label>
              <input
                id="new-product-sku"
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. TSH-BLU-L"
                style={{ width: '100%', padding: '9px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Product Title *</label>
              <input
                id="new-product-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Classic Cotton T-Shirt (Navy)"
                style={{ width: '100%', padding: '9px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Category</label>
              <select
                id="new-product-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', padding: '9px 10px', background: '#1e293b', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff' }}
              >
                <option value="Apparel">Apparel</option>
                <option value="Home Goods">Home Goods</option>
                <option value="Wellness">Wellness</option>
                <option value="Pantry">Pantry</option>
                <option value="Electronics">Electronics</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Unit Cost ($)</label>
              <input
                id="new-product-cost"
                type="number"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Price ($)</label>
              <input
                id="new-product-price"
                type="number"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Starting Qty</label>
              <input
                id="new-product-qty"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}
              />
            </div>
          </div>

          {/* Sensitive / Privacy Section */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '8px',
            padding: '14px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Lock size={14} color="#10b981" />
              <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600, textTransform: 'uppercase' }}>
                Protected Local Metadata (Never Sent to Gemma)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Supplier Email (PII)</label>
                <input
                  id="new-product-supplier-email"
                  type="email"
                  value={supplierEmail}
                  onChange={(e) => setSupplierEmail(e.target.value)}
                  placeholder="orders@supplier.example"
                  style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Warehouse Location</label>
                <input
                  id="new-product-location"
                  type="text"
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                  placeholder="e.g. Rack C-04, Bin 2"
                  style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button id="save-new-product-btn" type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
