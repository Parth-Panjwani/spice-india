import mongoose, { Schema, Document, Model } from 'mongoose';

// 1. Inventory Item
export interface IInventoryItem extends Document {
  name: string;
  unit: string; // e.g., 'kg', 'liters', 'pieces'
  currentStock: number;
  minimumThreshold: number;
  averageDailyUsage?: number;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
    currentStock: { type: Number, required: true, default: 0 },
    minimumThreshold: { type: Number, required: true, default: 5 },
    averageDailyUsage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const InventoryItem: Model<IInventoryItem> = mongoose.models.InventoryItem || mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema);

// 2. Inventory Purchase
export interface IInventoryPurchase extends Document {
  itemRef: mongoose.Types.ObjectId;
  quantity: number;
  priceRUB: number;
  invoiceImage: string;
  purchasedBy: string;
  date: Date;
  linkedRemittance: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryPurchaseSchema: Schema = new Schema(
  {
    itemRef: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    quantity: { type: Number, required: true },
    priceRUB: { type: Number, required: true },
    invoiceImage: { type: String, required: true }, // Mandatory proof
    purchasedBy: { type: String, required: true, trim: true },
    date: { type: Date, required: true, default: Date.now },
    linkedRemittance: { type: Schema.Types.ObjectId, ref: 'Remittance', required: true }, // Ties purchase to tracked funds
  },
  { timestamps: true }
);

export const InventoryPurchase: Model<IInventoryPurchase> = mongoose.models.InventoryPurchase || mongoose.model<IInventoryPurchase>('InventoryPurchase', InventoryPurchaseSchema);

// 3. Inventory Consumption
export interface IInventoryConsumption extends Document {
  itemRef: mongoose.Types.ObjectId;
  quantityUsed: number;
  date: Date;
  loggedBy: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryConsumptionSchema: Schema = new Schema(
  {
    itemRef: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    quantityUsed: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
    loggedBy: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export const InventoryConsumption: Model<IInventoryConsumption> = mongoose.models.InventoryConsumption || mongoose.model<IInventoryConsumption>('InventoryConsumption', InventoryConsumptionSchema);
