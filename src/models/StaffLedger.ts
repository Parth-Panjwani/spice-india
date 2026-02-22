import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStaffLedger extends Document {
  staffName: string;
  monthlySalaryRUB: number;
  salaryPaidRUB: number;
  advancesRUB: number;
  setupCostOwedRUB: number;
  setupCostPaidRUB: number;
  balanceRUB: number;
  history: {
    date: Date;
    amount: number;
    type: 'salary_paid' | 'advance_issued' | 'setup_recovered';
    note?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const StaffLedgerSchema: Schema = new Schema(
  {
    staffName: { type: String, required: true, trim: true },
    monthlySalaryRUB: { type: Number, required: true },
    salaryPaidRUB: { type: Number, default: 0 },
    advancesRUB: { type: Number, default: 0 },
    setupCostOwedRUB: { type: Number, default: 0 },
    setupCostPaidRUB: { type: Number, default: 0 },
    balanceRUB: { type: Number, default: 0 }, // calculated or stored tracker
    history: [
      {
        date: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        type: { type: String, enum: ['salary_paid', 'advance_issued', 'setup_recovered'], required: true },
        note: { type: String }
      }
    ]
  },
  { timestamps: true }
);

const StaffLedger: Model<IStaffLedger> = mongoose.models.StaffLedger || mongoose.model<IStaffLedger>('StaffLedger', StaffLedgerSchema);

export default StaffLedger;
