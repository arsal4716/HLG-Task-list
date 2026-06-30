import mongoose from 'mongoose';
import { ENTITY_STATUS_VALUES, ENTITY_STATUS } from '../config/constants.js';

/** A Campaign belongs to one Buyer and owns many Publishers. */
const campaignSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer', required: true, index: true },
    name: { type: String, required: [true, 'Campaign name is required'], trim: true, maxlength: 140 },
    module: { type: String, trim: true, default: '' },
    paymentTerms: { type: String, trim: true, default: '' },
    contactName: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    status: { type: String, enum: ENTITY_STATUS_VALUES, default: ENTITY_STATUS.ACTIVE },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

campaignSchema.index({ buyer: 1, status: 1 });

export const Campaign = mongoose.model('Campaign', campaignSchema);
export default Campaign;
