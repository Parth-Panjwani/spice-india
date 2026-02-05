import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  type: 'expense' | 'income'; 
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    type: { type: String, enum: ['expense', 'income'], default: 'expense' },
    description: { type: String },
  },
  { timestamps: true }
);

// Check if model exists to prevent overwrite error in hot reload
const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
