import mongoose from 'mongoose';
import { ENTITY_STATUS_VALUES, ENTITY_STATUS } from '../config/constants.js';

/**
 * A Buyer is the parent record. Each buyer owns unlimited Campaigns, so buyer
 * information is never duplicated per campaign.
 */
const buyerSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Buyer name is required'], trim: true, maxlength: 120 },
    company: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    status: { type: String, enum: ENTITY_STATUS_VALUES, default: ENTITY_STATUS.ACTIVE },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

buyerSchema.index({ name: 'text', company: 'text' });
buyerSchema.index({ status: 1 });

export const Buyer = mongoose.model('Buyer', buyerSchema);
export default Buyer;
