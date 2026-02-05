import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction extends Document {
  amount: number;
  date: Date;
  description: string;
  category: mongoose.Types.ObjectId;
  entity?: mongoose.Types.ObjectId; // Optional: e.g., Linked to "John Doe"
  subType?: string; // e.g., 'Salary', 'Visa', 'Ticket', 'Monthly Rent'
  paymentMethod?: string; // Cash, Bank Transfer, UPI
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    amount: { type: Number, required: true },
    rubalAmount: { type: Number },     // Optional Rubal equivalent
    rubalRate: { type: Number },       // Optional exchange rate used
    date: { type: Date, required: true, default: Date.now },
    description: { type: String, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    entity: { type: Schema.Types.ObjectId, ref: 'Entity' },
    subType: { type: String, trim: true }, // Important for the breakdown requirement
    paymentMethod: { type: String, default: 'Cash' },
  },
  { timestamps: true }
);

const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
