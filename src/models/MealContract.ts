import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMealContract extends Document {
  student: mongoose.Types.ObjectId;
  mealType: 'lunch' | 'dinner' | 'both';
  durationMonths: number;
  startDate: Date;
  endDate: Date;
  amountINR: number;
  rubalRate: number;
  amountRUB: number;
  status: 'active' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

const MealContractSchema: Schema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    mealType: { type: String, enum: ['lunch', 'dinner', 'both'], required: true },
    durationMonths: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    amountINR: { type: Number, required: true },
    rubalRate: { type: Number, required: true },
    amountRUB: { type: Number, required: true },
    status: { type: String, enum: ['active', 'expired'], default: 'active' },
  },
  { timestamps: true }
);

const MealContract: Model<IMealContract> = mongoose.models.MealContract || mongoose.model<IMealContract>('MealContract', MealContractSchema);

export default MealContract;
