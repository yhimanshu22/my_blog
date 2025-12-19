
import mongoose, { Schema, Document, Model } from 'mongoose';

// --- Interfaces ---

export interface IPost extends Document {
  title: string;
  slug: string;
  description: string;
  content: string;
  date: Date;
  tags: string[];
  isAiGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHighlight extends Document {
  articleSlug: string;
  text: string;
  range: {
    startPath: number[];
    startOffset: number;
    endPath: number[];
    endOffset: number;
  };
  color: 'yellow' | 'green';
  createdAt: Date;
}

export interface IComment extends Document {
  articleSlug: string;
  highlightId?: mongoose.Types.ObjectId;
  content: string;
  author: string;
  createdAt: Date;
}

// --- Schemas ---

const PostSchema = new Schema<IPost>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String },
  content: { type: String, required: true }, // MDX Content
  date: { type: Date, required: true },
  tags: { type: [String], default: [] },
  isAiGenerated: { type: Boolean, default: false },
}, { timestamps: true });

const HighlightSchema = new Schema<IHighlight>({
  articleSlug: { type: String, required: true, index: true },
  text: { type: String, required: true },
  range: {
    startPath: { type: [Number], required: true },
    startOffset: { type: Number, required: true },
    endPath: { type: [Number], required: true },
    endOffset: { type: Number, required: true },
  },
  color: { type: String, enum: ['yellow', 'green'], default: 'yellow' },
  createdAt: { type: Date, default: Date.now },
});

const CommentSchema = new Schema<IComment>({
  articleSlug: { type: String, required: true, index: true },
  highlightId: { type: Schema.Types.ObjectId, ref: 'Highlight' },
  content: { type: String, required: true },
  author: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// --- Models ---

// Prevent OverwriteModelError in Next.js development
export const Post: Model<IPost> = mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
export const Highlight: Model<IHighlight> = mongoose.models.Highlight || mongoose.model<IHighlight>('Highlight', HighlightSchema);
export const Comment: Model<IComment> = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
