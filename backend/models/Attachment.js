import mongoose from 'mongoose';

/**
 * Standalone attachment registry. Files embedded directly on tasks/comments are
 * also mirrored here so we can query "all files uploaded by X" or run cleanup.
 */
const attachmentSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null, index: true },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    fileName: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    fileType: { type: String, default: '' }, // mime type
    category: { type: String, default: 'file' }, // image | pdf | excel | zip | video | file
    size: { type: Number, default: 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Attachment = mongoose.model('Attachment', attachmentSchema);
export default Attachment;
