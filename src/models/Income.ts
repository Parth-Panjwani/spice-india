import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IIncome extends Document {
  amount: number;
  rubalAmount?: number;
  rubalRate?: number;
  date: Date;
  source: string; // e.g., 'Student Fee'
  description: string; // e.g., 'Mess Fee (Jan-Mar)'
  student?: mongoose.Types.ObjectId; // Link to specific student
  createdAt: Date;
}

const IncomeSchema: Schema = new Schema(
  {
    amount: { type: Number, required: true },
    rubalAmount: { type: Number }, // Optional Rubal Equivalent
    rubalRate: { type: Number },   // Optional Rate used
    date: { type: Date, default: Date.now },
    source: { type: String, required: true, default: 'Student Fee' },
    description: { type: String },
    student: { type: Schema.Types.ObjectId, ref: 'Student' },
  },
  { timestamps: true }
);

const Income: Model<IIncome> = mongoose.models.Income || mongoose.model<IIncome>('Income', IncomeSchema);

export default Income;
