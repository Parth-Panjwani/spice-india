import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStudent extends Document {
  fullName: string;
  studentId: string; // Unique ID printed on card
  course: string;
  year: string; // e.g., "2024-2025"
  photoUrl?: string; // We might store Base64 or URL
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema: Schema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    studentId: { type: String, required: true, unique: true, trim: true },
    course: { type: String, required: true },
    year: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    photoUrl: { type: String }, // Can handle Data URI
  },
  { timestamps: true }
);

const Student: Model<IStudent> = mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);

export default Student;
