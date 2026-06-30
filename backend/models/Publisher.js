import mongoose from 'mongoose';
import {
  ENTITY_STATUS_VALUES,
  ENTITY_STATUS,
  PERFORMANCE_RATING_VALUES,
  PERFORMANCE_RATING,
} from '../config/constants.js';

/** A Publisher sends calls to a specific Campaign. */
const publisherSchema = new mongoose.Schema(
  {
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer', default: null, index: true }, // denormalised for fast lookups
    name: { type: String, required: [true, 'Publisher name is required'], trim: true, maxlength: 140 },
    payout: { type: Number, default: 0, min: 0 },
    paymentTerms: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    status: { type: String, enum: ENTITY_STATUS_VALUES, default: ENTITY_STATUS.ACTIVE },
    performance: { type: String, enum: PERFORMANCE_RATING_VALUES, default: PERFORMANCE_RATING.AVERAGE },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

publisherSchema.index({ campaign: 1, status: 1 });

export const Publisher = mongoose.model('Publisher', publisherSchema);
export default Publisher;
