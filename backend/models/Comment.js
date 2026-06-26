import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, default: '', trim: true },
    codeBlock: { type: String, default: '' }, // optional fenced code snippet
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // replies
    attachments: [
      {
        fileName: String,
        url: String,
        publicId: String,
        fileType: String,
        size: Number,
      },
    ],
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

commentSchema.index({ task: 1, createdAt: -1 });

export const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
