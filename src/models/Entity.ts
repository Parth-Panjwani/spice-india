import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEntity extends Document {
  name: string;
  category: mongoose.Types.ObjectId; // Ref to Category
  metadata?: Record<string, any>; // Flexible field for extra details (e.g., Staff Position, Rent Location)
  createdAt: Date;
  updatedAt: Date;
}

const EntitySchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    metadata: { type: Map, of: String }, // Flexible key-value pairs
  },
  { timestamps: true }
);

// Compound index to ensure unique names per category
EntitySchema.index({ name: 1, category: 1 }, { unique: true });

const Entity: Model<IEntity> = mongoose.models.Entity || mongoose.model<IEntity>('Entity', EntitySchema);

export default Entity;
