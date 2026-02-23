import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IInventoryRequest extends Document {
  itemName: string;
  quantityNeeded: number;
  unit: string;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  requestedBy: string;
  notes?: string;
  dateRequested: Date;
}

const inventoryRequestSchema = new Schema<IInventoryRequest>({
  itemName: { type: String, required: true },
  quantityNeeded: { type: Number, required: true },
  unit: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'fulfilled'], 
    default: 'pending' 
  },
  requestedBy: { type: String, required: true },
  notes: { type: String },
  dateRequested: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const InventoryRequest: Model<IInventoryRequest> = mongoose.models.InventoryRequest || mongoose.model<IInventoryRequest>('InventoryRequest', inventoryRequestSchema);

export default InventoryRequest;
