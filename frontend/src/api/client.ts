export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit_cost: number;
  selling_price: number;
  quantity_on_hand: number;
  minimum_stock: number;
  supplier_name?: string;
  supplier_email?: string;
  warehouse_location?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  quantity_delta: number;
  movement_type: 'sale' | 'restock' | 'adjustment' | 'loss' | 'return';
  reference_note?: string;
  timestamp: string;
}

export interface RestockRecommendation {
  product_id: string;
  product_name: string;
  sku: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  recommended_reorder: number;
  unit_cost: number;
  estimated_cost: number;
  urgency: 'Critical' | 'Warning' | 'Normal';
  uncertainty_level: 'Low' | 'Medium' | 'High';
  reasoning: string;
}

export interface DashboardKPIs {
  total_products: number;
  total_stock_units: number;
  total_inventory_value: number;
  potential_revenue: number;
  low_stock_count: number;
  out_of_stock_count: number;
  recent_sales_count: number;
  critical_restocks: RestockRecommendation[];
}

export interface NLIntentProposal {
  action: 'sale' | 'restock' | 'adjustment' | 'loss' | 'new_product' | 'unknown';
  product_name: string;
  matched_product_id?: string;
  matched_product_name?: string;
  current_stock?: number;
  quantity: number;
  proposed_delta: number;
  new_stock?: number;
  confidence: number;
  explanation: string;
  needs_confirmation: boolean;
}

export interface AIAuditLog {
  id: string;
  action_type: string;
  user_input: string;
  fields_sent: string[];
  masked_payload: any;
  model_name: string;
  latency_seconds: number;
  created_at: string;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:8000/api";

export const api = {
  // Products
  async getProducts(search?: string, category?: string): Promise<Product[]> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (category) params.append("category", category);
    const res = await fetch(`${API_BASE}/products?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to load products");
    return res.json();
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jsonBody(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to create product");
    }
    return res.json();
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: jsonBody(updates)
    });
    if (!res.ok) throw new Error("Failed to update product");
    return res.json();
  },

  async deleteProduct(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/products/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete product");
  },

  // Movements
  async getMovements(limit = 40): Promise<StockMovement[]> {
    const res = await fetch(`${API_BASE}/movements?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch movements");
    return res.json();
  },

  async recordMovement(productId: string, delta: number, type: string, note?: string): Promise<StockMovement> {
    const res = await fetch(`${API_BASE}/movements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        quantity_delta: delta,
        movement_type: type,
        reference_note: note
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to record movement");
    }
    return res.json();
  },

  // Analytics
  async getKPIs(): Promise<DashboardKPIs> {
    const res = await fetch(`${API_BASE}/analytics/kpis`);
    if (!res.ok) throw new Error("Failed to fetch KPIs");
    return res.json();
  },

  async getCategoryDistribution(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/analytics/category-distribution`);
    if (!res.ok) throw new Error("Failed to fetch category distribution");
    return res.json();
  },

  // AI & Privacy
  async parseIntent(userInput: string): Promise<NLIntentProposal> {
    const res = await fetch(`${API_BASE}/ai/parse-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_input: userInput })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to parse natural language intent");
    }
    return res.json();
  },

  async confirmIntent(productId: string, delta: number, action: string, note: string): Promise<StockMovement> {
    const res = await fetch(`${API_BASE}/ai/confirm-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        quantity_delta: delta,
        movement_type: action,
        reference_note: note
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to confirm AI stock change");
    }
    return res.json();
  },

  async askGemma(question: string): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to get AI answer");
    }
    return res.json();
  },

  async getPrivacyPreview(): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/preview-masking`);
    if (!res.ok) throw new Error("Failed to fetch privacy preview");
    return res.json();
  },

  async getAuditLogs(): Promise<AIAuditLog[]> {
    const res = await fetch(`${API_BASE}/ai/audit-logs?limit=25`);
    if (!res.ok) throw new Error("Failed to fetch audit logs");
    return res.json();
  }
};

function jsonBody(data: any): string {
  return JSON.stringify(data);
}
