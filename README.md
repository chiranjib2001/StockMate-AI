# StockMate AI 📦🤖

> **Privacy-First, Open-Source AI Inventory Assistant for Small Businesses & Side Hustles**  
> *Built for [DEV Hacktoberfest 2026 Open-Source AI Challenge: Week 2 (Side Hustle)](https://dev.to/events/80)*

[![Model](https://img.shields.io/badge/Model-Gemma%202%3A2b-blueviolet.svg)](https://ai.google.dev/gemma)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-009688.svg)](https://fastapi.tiangolo.com)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript%20%2B%20Vite-61DAFB.svg)](https://vitejs.dev)
[![Database](https://img.shields.io/badge/Database-MongoDB%20%2F%20Atlas-47A248.svg)](https://www.mongodb.com)
[![Privacy](https://img.shields.io/badge/Privacy-Zero--Leak%20Whitelist-emerald.svg)](#-privacy--data-minimization-guarantee)
[![License](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)

---

## 💡 The Core Idea & The "Side Hustle" Dilemma

Solo entrepreneurs, boutique retailers, Instagram sellers, and artisan makers are running real businesses on razor-thin margins. Most still manage thousands of dollars in stock using chaotic spreadsheets, paper notebooks, or mental memory.

### The Pain Points:
1. **Costly Stockouts:** High-velocity best-sellers suddenly hit zero stock before anyone notices, causing missed sales and frustrated customers.
2. **Tied-Up Working Capital:** Over-ordering slow-moving inventory because reorder calculations and sales velocity math are tedious and neglected.
3. **The AI Privacy Paradox:** Small business owners *want* AI assistance, but commercial platforms demand direct database access or require uploading sensitive supplier emails, wholesale invoices, customer details, and warehouse access codes.

### The Solution: StockMate AI
**StockMate AI** is an intelligent, privacy-aware inventory operations platform designed specifically for small businesses. Rather than an ordinary CRUD dashboard or an opaque chatbot with direct DB access, StockMate AI combines **local open-weight AI (Gemma 2:2b)** with **deterministic business rules** and a **zero-leak data minimization layer**.

> **The Core Rule:** *The language model should never directly invent or silently mutate stock balances.*  
> **AI interprets; deterministic code validates and executes.**

---

## ✨ Key Features in Detail

### 1. 🗣️ Natural-Language Inventory Management
* **How it works:** Instead of navigating complex forms to log sales, returns, or supplier deliveries, users can speak or type plain English statements:
  * *"I received 20 Classic Linen Button-Down shirts from supplier"*
  * *"Sold 3 speckled ceramic mugs in-store today"*
  * *"Lavender candle broke during transit (loss 1)"*
* **Zero-Hallucination Safe Mode:**
  1. Gemma extracts the user's intended action (`restock`, `sale`, `adjustment`, `loss`), target product reference, and quantity delta.
  2. The system checks real inventory, calculates new projected stock levels, and generates a **Confirmation Dialog**.
  3. No stock change is committed until the human confirms the proposed transaction.

### 2. 🛡️ Privacy Whitelist & Data Minimization Guard
* **No Direct DB Access:** The AI never receives database credentials, connection strings, or unrestricted collection access.
* **Sensitive Data Isolation:**
  * **Supplier Emails & Contacts:** Automatically stripped before prompt construction.
  * **Warehouse Bin & Coordinates:** Kept exclusively in local storage.
  * **Free-Text PII Redaction:** Automated regex scrubbing redacts emails (`[REDACTED_EMAIL]`), phone numbers, and API tokens.
  * **Pseudonymization:** Products are referenced by safe tokens (e.g., `P-101`) during reasoning tasks.
* **Interactive Privacy Inspector:** A side-by-side UI modal allows owners to verify the exact raw database record versus the whitelisted payload passed to Gemma.

### 3. 📊 Grounded Business Q&A (Gemma 2)
* **Authoritative Figures First:** Questions such as *"What should I restock this week?"* or *"What is my total inventory valuation?"* are answered using verified MongoDB aggregation figures computed in Python.
* **Analytical Reasoning:** Gemma analyzes the verified numbers, trends, and safety margins to deliver contextual business advice without hallucinating dollar figures or unit counts.

### 4. ⚠️ Smart Restocking Assistant with Uncertainty Modeling
* **Safety Threshold Triggers:** Products approaching or falling below their minimum stock buffer (`minimum_stock`) trigger real-time restocking recommendations.
* **Honest Uncertainty Levels:** Instead of pretending to know future customer demand, recommendations display explicit uncertainty indicators (`Low`, `Medium`, `High`) based on sales velocity history.
* **One-Click Restocking:** Instant replenishment action buttons with automated transaction ledger entries.

### 5. 📜 Immutable Stock Movement Ledger
* Every inventory delta (sales, deliveries, write-offs, returns) is recorded with timestamp, quantity delta, user/AI reference notes, and product IDs.
* Maintains a permanent audit trail for tax, bookkeeping, and inventory reconciliations.

### 6. 🔍 Real-Time AI Context Audit Trail
* Logs every single prompt and completion: action type, latency in seconds, model used, and the exact list of whitelisted fields transmitted.
* Provides verifiable proof of zero PII leakage.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    User([Business Owner]) <--> UI[React 18 + TypeScript + Vite UI\nGlassmorphism & Recharts]
    
    subgraph FastAPI Backend
        API[REST API Gateway]
        API <--> Router[Products · Movements · Analytics · AI]
        
        subgraph Privacy Layer
            Sanitizer[PII Regex Redactor]
            Whitelist[Field Minimizer & Pseudonymizer]
            AuditLog[AI Audit Trail Logger]
        end
        
        subgraph Deterministic Engine
            Rules[Inventory Availability & Margin Rules]
            Math[Sales Velocity & Reorder Buffers]
            Atomic[Atomic DB Transaction Executor]
        end
    end

    subgraph Open-Weight AI
        Ollama[Ollama Engine]
        Gemma[Google Gemma 2:2b]
    end

    subgraph Data Layer
        DB[(MongoDB / Local Persistent Engine)]
    end

    UI <--> API
    Router --> Sanitizer --> Whitelist --> Ollama --> Gemma
    Gemma --> AuditLog
    Router <--> Deterministic Engine
    Deterministic Engine <--> DB
```

### ☁️ Hybrid Open-Weight AI Inference (Local & Cloud)

StockMate AI is architected to run seamlessly across both private local hardware and production cloud environments:

* **🏠 Local Private Mode (Default):** Runs completely offline using **Ollama** (`gemma2:2b`). No external data connection is needed.
* **🌐 Production Cloud Deployments (e.g., Render):** In remote cloud hosting environments where local Ollama on `localhost` cannot be reached and container memory is limited, StockMate AI automatically transitions to cloud open-weight providers:
  * **OpenRouter (`OPENROUTER_API_KEY`):** Connects to Google Gemma (`google/gemma-4-26b-a4b-it:free`) and open-weight models. Features built-in **multi-key rotation** (supports comma-separated keys) and automatic fallback cascading if upstream shared pools experience temporary rate limits (`429`).
  * **Groq (`GROQ_API_KEY`):** High-speed open-weight reasoning (~0.3s latency).
  * **Google AI Studio (`GEMINI_API_KEY`):** Direct Google AI API integration.

---

## 🔒 Privacy Guard: Whitelist Comparison

| Field | Raw Database Record (Local Only) | Gemma AI Whitelisted Context | Transmitted to AI? |
|---|---|---|---|
| **Product Title** | Classic Linen Button-Down (Ocean Blue) | `Classic Linen Button-Down (Ocean Blue)` or `Item-Apparel-P-101` | ✅ **Whitelisted** |
| **Current Stock** | 14 units | `14` | ✅ **Whitelisted** |
| **Minimum Threshold**| 10 units | `10` | ✅ **Whitelisted** |
| **Unit Cost & Price** | Cost: $18.50, Price: $48.00 | Cost: $18.50, Price: $48.00 | ✅ **Whitelisted** |
| **Supplier Name** | Seaside Fabrics Co. | *Excluded* | ❌ **Blocked** |
| **Supplier Email** | `wholesale@seasidefabrics.example` | *Excluded* | ❌ **Blocked** |
| **Warehouse Location** | Rack A-12, Bin 3 | *Excluded* | ❌ **Blocked** |
| **Internal Notes** | Contract discount expires Nov 2026. Gate: 4892 | *Excluded* | ❌ **Blocked** |

---

## 💻 Tech Stack

* **Frontend:** React 18, TypeScript, Vite, Vanilla CSS (Custom Obsidian Glassmorphism Design System), Lucide Icons, Recharts.
* **Backend:** Python 3.10+, FastAPI, Pydantic v2, Motor (Async MongoDB Driver), Uvicorn, HTTPX.
* **Database:** MongoDB Community / MongoDB Atlas with automated fallback to JSON persistence.
* **AI Engine:** Google Gemma 2 (2.6B parameter open-weight model) running locally on Ollama.

---

## 🚀 How to Start the Application

### Prerequisites

Ensure you have installed:
1. **Node.js** (v18 or newer) — [nodejs.org](https://nodejs.org/)
2. **Python** (v3.10 or newer) — [python.org](https://python.org/)
3. **Ollama** with the Gemma 2 model downloaded:
   ```bash
   # Download the lightweight Gemma 2 model
   ollama pull gemma2:2b
   ```

---

### Step 1: Start Ollama (AI Model)
Ensure the Ollama service is running on your machine:
```bash
# In PowerShell or Terminal:
ollama run gemma2:2b
```
*(Ollama listens on `http://localhost:11434`)*

---

### Step 2: Start the FastAPI Backend

Open a terminal in the project root:

```bash
# Navigate to the backend directory
cd backend

# (Optional) Create and activate a virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install required dependencies
pip install -r requirements.txt

# Start the backend server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

* Backend will be live at: **`http://127.0.0.1:8000`**
* Interactive Swagger API Docs: **`http://127.0.0.1:8000/docs`**

---

### Step 3: Start the React Frontend

Open a second terminal in the project root:

```bash
# Navigate to the frontend directory
cd frontend

# Install npm dependencies
npm install

# Start the Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```

* Frontend dashboard will be live at: **`http://127.0.0.1:5173`**

---

### Step 4: (Optional) Run with Docker Compose
If you want to run a local MongoDB container:
```bash
docker compose up -d
```
*(StockMate AI automatically connects to MongoDB on `mongodb://localhost:27017` or seamlessly uses its embedded local persistence engine if Docker is not active).*

> [!TIP]
> **Terminal Directory Tip:** Always run commands starting from the project root (`StockMate-AI`). If your terminal is already inside `backend`, use `cd ../frontend` to switch over to the frontend.

---

## 🛑 How to Safely Stop / Close Everything

When you are done testing or want to restart fresh, follow these steps to cleanly shut down all services without leaving orphan processes or hanging ports:

### 1. Stopping Interactive Terminals (Standard Method)
* **Frontend (Vite):** Click into the frontend terminal and press `Ctrl + C` (type `y` and press Enter if asked `Terminate batch job (Y/N)?`).
* **Backend (FastAPI):** Click into the backend terminal and press `Ctrl + C`. Uvicorn will trigger an orderly shutdown and close database connections.
* **Ollama (CLI Chat):** If running `ollama run gemma2:2b` interactively, type `/bye` or press `Ctrl + D`.

### 2. Stopping Docker MongoDB
From the project root directory, run:
```bash
# Gracefully stop and remove containers (data in mongo_data volume is preserved)
docker compose down

# Or simply pause without removing containers:
docker compose stop
```

### 3. Stopping Background Processes on Windows (PowerShell)
If servers were started in the background or ports are still occupied, run these one-liners in PowerShell to free up the ports:

```powershell
# Stop any running Vite / Node dev server (Port 5173)
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Stop any running FastAPI / Python uvicorn server (Port 8000)
Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*uvicorn*" } | Stop-Process -Force

# Stop Docker containers
docker compose down

# Close Ollama app (if desired)
Stop-Process -Name "ollama app", "ollama" -ErrorAction SilentlyContinue
```

### 4. Verify All Ports Are Free
To verify that all services have fully released their ports:
```powershell
# Check Ports 5173 (Frontend), 8000 (Backend), 27017 (MongoDB), 11434 (Ollama)
Get-NetTCPConnection -LocalPort 5173, 8000, 27017, 11434 -ErrorAction SilentlyContinue | Select-Object LocalPort, State, OwningProcess
```
*(If no output appears, all ports are completely free and clean).*

---

## 🏆 Built for Hacktoberfest 2026: Open-Source AI Challenge

StockMate AI was designed and built specifically for the **DEV Hacktoberfest 2026 Open-Source AI Challenge** under the **"Side Hustle"** theme. 

It showcases how open-source AI and open-weight models solve practical problems for real businesses by integrating:
- **Google Gemma 2 (Open-Weight Model):** Powers intelligent natural language intent extraction and grounded inventory insights.
- **Render:** Cloud hosting for the FastAPI backend web service and React static site.
- **MongoDB Atlas:** Cloud document storage for real-time inventory balances and transactional stock movements.
- **Sentry:** Observability and tracing across AI reasoning calls and database operations.
- **.tech Domain:** Live staging and production deployment hosted on `chiranjib.tech`.

---

## 📄 License
This project is licensed under the **MIT License**. Feel free to use, modify, and deploy for your own business or hackathon project!
