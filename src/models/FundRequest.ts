import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IFundRequest extends Document {
  amountRUB: number;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  requestedBy: string;
  notes?: string;
  dateRequested: Date;
}

const fundRequestSchema = new Schema<IFundRequest>({
  amountRUB: { type: Number, required: true },
  purpose: { type: String, required: true },
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

const FundRequest: Model<IFundRequest> = mongoose.models.FundRequest || mongoose.model<IFundRequest>('FundRequest', fundRequestSchema);

export default FundRequest;
