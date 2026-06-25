import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    senderName: {
      type: String,
      trim: true,
      default: 'Anonymous neighbor'
    },
    body: {
      type: String,
      trim: true,
      required: true,
      maxlength: 600
    }
  },
  { timestamps: true }
);

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
      maxlength: 90
    },
    type: {
      type: String,
      enum: ['lost', 'found'],
      required: true
    },
    category: {
      type: String,
      enum: ['pet', 'phone', 'wallet', 'bag', 'keys', 'jewelry', 'document', 'other'],
      required: true
    },
    description: {
      type: String,
      trim: true,
      required: true,
      maxlength: 800
    },
    imageUrl: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true,
      required: true,
      maxlength: 120
    },
    contactHint: {
      type: String,
      trim: true,
      maxlength: 120
    },
    tags: {
      type: [String],
      default: []
    },
    messages: {
      type: [messageSchema],
      default: []
    }
  },
  { timestamps: true }
);

noticeSchema.index({ title: 'text', description: 'text', location: 'text', tags: 'text' });

export default mongoose.model('Notice', noticeSchema);
