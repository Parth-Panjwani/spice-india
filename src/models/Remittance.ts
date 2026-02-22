import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRemittance extends Document {
  amountINR: number;
  rubalRate: number;
  amountRUB: number;
  sentTo: string;
  purpose: 'Groceries' | 'Salary' | 'Advance' | 'Emergency';
  date: Date;
  proofImageUrl: string;
  notes?: string;
  status: 'sent' | 'confirmed';
  createdAt: Date;
  updatedAt: Date;
}

const RemittanceSchema: Schema = new Schema(
  {
    amountINR: { type: Number, required: true },
    rubalRate: { type: Number, required: true },
    amountRUB: { type: Number, required: true },
    sentTo: { type: String, required: true, trim: true },
    purpose: { type: String, enum: ['Groceries', 'Salary', 'Advance', 'Emergency'], required: true },
    date: { type: Date, required: true, default: Date.now },
    proofImageUrl: { type: String, required: true },
    notes: { type: String, trim: true },
    status: { type: String, enum: ['sent', 'confirmed'], default: 'sent' },
  },
  { timestamps: true }
);

const Remittance: Model<IRemittance> = mongoose.models.Remittance || mongoose.model<IRemittance>('Remittance', RemittanceSchema);

export default Remittance;
