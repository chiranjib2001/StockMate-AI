import json
import os
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

LOCAL_STORAGE_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
LOCAL_STORAGE_FILE = os.path.join(LOCAL_STORAGE_DIR, "inventory_store.json")

class Database:
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        self.is_mongodb_connected: bool = False
        self._local_cache: Dict[str, List[Dict[str, Any]]] = {
            "products": [],
            "stock_movements": [],
            "sales": [],
            "ai_audit_logs": []
        }

    async def connect(self):
        """Attempts to connect to MongoDB, falls back gracefully to JSON storage."""
        try:
            client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=1500)
            # Ping database to verify connection
            await client.admin.command('ping')
            self.client = client
            self.db = client[settings.DATABASE_NAME]
            self.is_mongodb_connected = True
            print(f"[DB] Successfully connected to MongoDB at {settings.MONGODB_URI}")
        except Exception as e:
            self.is_mongodb_connected = False
            print(f"[DB] MongoDB not reachable ({e}). Using persistent local JSON engine.")
            self._load_local_storage()

    def _load_local_storage(self):
        os.makedirs(LOCAL_STORAGE_DIR, exist_ok=True)
        if os.path.exists(LOCAL_STORAGE_FILE):
            try:
                with open(LOCAL_STORAGE_FILE, 'r', encoding='utf-8') as f:
                    self._local_cache = json.load(f)
            except Exception:
                pass

    def _save_local_storage(self):
        os.makedirs(LOCAL_STORAGE_DIR, exist_ok=True)
        try:
            with open(LOCAL_STORAGE_FILE, 'w', encoding='utf-8') as f:
                json.dump(self._local_cache, f, default=str, indent=2)
        except Exception as e:
            print(f"[DB Local] Error saving JSON storage: {e}")

    # --- Product Operations ---
    async def get_products(self) -> List[Dict[str, Any]]:
        if self.is_mongodb_connected:
            cursor = self.db.products.find({}, {"_id": 0})
            return await cursor.to_list(length=1000)
        return list(self._local_cache.get("products", []))

    async def get_product_by_id(self, product_id: str) -> Optional[Dict[str, Any]]:
        if self.is_mongodb_connected:
            return await self.db.products.find_one({"id": product_id}, {"_id": 0})
        for p in self._local_cache.get("products", []):
            if p.get("id") == product_id:
                return p
        return None

    async def get_product_by_sku(self, sku: str) -> Optional[Dict[str, Any]]:
        if self.is_mongodb_connected:
            return await self.db.products.find_one({"sku": sku}, {"_id": 0})
        for p in self._local_cache.get("products", []):
            if p.get("sku") == sku:
                return p
        return None

    async def save_product(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        if self.is_mongodb_connected:
            await self.db.products.update_one(
                {"id": product_data["id"]},
                {"$set": product_data},
                upsert=True
            )
            return product_data
        
        # Local JSON
        existing = False
        for i, p in enumerate(self._local_cache["products"]):
            if p.get("id") == product_data["id"]:
                self._local_cache["products"][i] = product_data
                existing = True
                break
        if not existing:
            self._local_cache["products"].append(product_data)
        self._save_local_storage()
        return product_data

    async def delete_product(self, product_id: str) -> bool:
        if self.is_mongodb_connected:
            res = await self.db.products.delete_one({"id": product_id})
            return res.deleted_count > 0
        
        initial_len = len(self._local_cache["products"])
        self._local_cache["products"] = [p for p in self._local_cache["products"] if p.get("id") != product_id]
        if len(self._local_cache["products"]) < initial_len:
            self._save_local_storage()
            return True
        return False

    # --- Stock Movements & Transactions ---
    async def record_movement(self, movement: Dict[str, Any]) -> Dict[str, Any]:
        """Atomically record stock change and update product quantity."""
        product_id = movement["product_id"]
        delta = movement["quantity_delta"]

        if self.is_mongodb_connected:
            # Atomic update in MongoDB
            await self.db.products.update_one(
                {"id": product_id},
                {"$inc": {"quantity_on_hand": delta}, "$set": {"updated_at": datetime.utcnow()}}
            )
            await self.db.stock_movements.insert_one(movement)
            return movement

        # Local JSON update
        for p in self._local_cache["products"]:
            if p.get("id") == product_id:
                p["quantity_on_hand"] = max(0, int(p.get("quantity_on_hand", 0)) + delta)
                p["updated_at"] = str(datetime.utcnow())
                break
        
        self._local_cache["stock_movements"].append(movement)
        self._save_local_storage()
        return movement

    async def get_movements(self, limit: int = 50) -> List[Dict[str, Any]]:
        if self.is_mongodb_connected:
            cursor = self.db.stock_movements.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit)
            return await cursor.to_list(length=limit)
        
        movements = list(self._local_cache.get("stock_movements", []))
        movements.reverse()
        return movements[:limit]

    # --- AI Audit Logs ---
    async def log_ai_audit(self, audit: Dict[str, Any]):
        if self.is_mongodb_connected:
            await self.db.ai_audit_logs.insert_one(audit)
            return
        self._local_cache["ai_audit_logs"].append(audit)
        self._save_local_storage()

    async def get_ai_audits(self, limit: int = 30) -> List[Dict[str, Any]]:
        if self.is_mongodb_connected:
            cursor = self.db.ai_audit_logs.find({}, {"_id": 0}).sort("created_at", -1).limit(limit)
            return await cursor.to_list(length=limit)
        audits = list(self._local_cache.get("ai_audit_logs", []))
        audits.reverse()
        return audits[:limit]

db = Database()
