import { Buyer } from '../models/Buyer.js';
import { Campaign } from '../models/Campaign.js';
import { Publisher } from '../models/Publisher.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendPaginated } from '../utils/apiResponse.js';
import { ApiFeatures } from '../helpers/apiFeatures.js';

/* ============================ BUYERS ============================ */

export const listBuyers = catchAsync(async (req, res) => {
  const features = new ApiFeatures(Buyer.find(), req.query)
    .filter()
    .search(['name', 'company', 'email'])
    .sort()
    .paginate();

  const countFilter = new ApiFeatures(Buyer.find(), req.query).filter().query.getFilter();
  const [buyers, total] = await Promise.all([features.query, Buyer.countDocuments(countFilter)]);

  // attach a campaign count per buyer (single grouped query)
  const ids = buyers.map((b) => b._id);
  const counts = await Campaign.aggregate([
    { $match: { buyer: { $in: ids } } },
    { $group: { _id: '$buyer', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
  const data = buyers.map((b) => ({ ...b.toObject(), campaignCount: countMap[b._id.toString()] || 0 }));

  return sendPaginated(res, { data, page: features.page, limit: features.limit, total });
});

export const getBuyer = catchAsync(async (req, res, next) => {
  const buyer = await Buyer.findById(req.params.id);
  if (!buyer) return next(AppError.notFound('Buyer not found'));
  const campaigns = await Campaign.find({ buyer: buyer._id }).sort('-createdAt');
  return sendSuccess(res, { data: { buyer, campaigns } });
});

export const createBuyer = catchAsync(async (req, res) => {
  const buyer = await Buyer.create({ ...req.body, createdBy: req.user._id });
  return sendSuccess(res, { statusCode: 201, message: 'Buyer created', data: { buyer } });
});

export const updateBuyer = catchAsync(async (req, res, next) => {
  const buyer = await Buyer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!buyer) return next(AppError.notFound('Buyer not found'));
  return sendSuccess(res, { message: 'Buyer updated', data: { buyer } });
});

export const deleteBuyer = catchAsync(async (req, res, next) => {
  const buyer = await Buyer.findById(req.params.id);
  if (!buyer) return next(AppError.notFound('Buyer not found'));
  // cascade: remove the buyer's campaigns and their publishers
  await Promise.all([
    Publisher.deleteMany({ buyer: buyer._id }),
    Campaign.deleteMany({ buyer: buyer._id }),
    buyer.deleteOne(),
  ]);
  return sendSuccess(res, { message: 'Buyer and all its campaigns/publishers deleted' });
});

/* ============================ CAMPAIGNS ============================ */

export const listCampaigns = catchAsync(async (req, res, next) => {
  const buyer = await Buyer.findById(req.params.buyerId);
  if (!buyer) return next(AppError.notFound('Buyer not found'));
  const campaigns = await Campaign.find({ buyer: buyer._id }).sort('-createdAt');
  const ids = campaigns.map((c) => c._id);
  const counts = await Publisher.aggregate([
    { $match: { campaign: { $in: ids } } },
    { $group: { _id: '$campaign', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
  const data = campaigns.map((c) => ({ ...c.toObject(), publisherCount: countMap[c._id.toString()] || 0 }));
  return sendSuccess(res, { data: { campaigns: data } });
});

export const createCampaign = catchAsync(async (req, res, next) => {
  const buyer = await Buyer.findById(req.params.buyerId);
  if (!buyer) return next(AppError.notFound('Buyer not found'));
  const campaign = await Campaign.create({ ...req.body, buyer: buyer._id, createdBy: req.user._id });
  return sendSuccess(res, { statusCode: 201, message: 'Campaign created', data: { campaign } });
});

export const getCampaign = catchAsync(async (req, res, next) => {
  const campaign = await Campaign.findById(req.params.id).populate('buyer', 'name company');
  if (!campaign) return next(AppError.notFound('Campaign not found'));
  const publishers = await Publisher.find({ campaign: campaign._id }).sort('-createdAt');
  return sendSuccess(res, { data: { campaign, publishers } });
});

export const updateCampaign = catchAsync(async (req, res, next) => {
  const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!campaign) return next(AppError.notFound('Campaign not found'));
  return sendSuccess(res, { message: 'Campaign updated', data: { campaign } });
});

export const deleteCampaign = catchAsync(async (req, res, next) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) return next(AppError.notFound('Campaign not found'));
  await Promise.all([Publisher.deleteMany({ campaign: campaign._id }), campaign.deleteOne()]);
  return sendSuccess(res, { message: 'Campaign and its publishers deleted' });
});

/* ============================ PUBLISHERS ============================ */

export const listPublishers = catchAsync(async (req, res, next) => {
  const campaign = await Campaign.findById(req.params.campaignId);
  if (!campaign) return next(AppError.notFound('Campaign not found'));
  const publishers = await Publisher.find({ campaign: campaign._id }).sort('-createdAt');
  return sendSuccess(res, { data: { publishers } });
});

export const createPublisher = catchAsync(async (req, res, next) => {
  const campaign = await Campaign.findById(req.params.campaignId);
  if (!campaign) return next(AppError.notFound('Campaign not found'));
  const publisher = await Publisher.create({
    ...req.body,
    campaign: campaign._id,
    buyer: campaign.buyer,
    createdBy: req.user._id,
  });
  return sendSuccess(res, { statusCode: 201, message: 'Publisher created', data: { publisher } });
});

export const updatePublisher = catchAsync(async (req, res, next) => {
  const publisher = await Publisher.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!publisher) return next(AppError.notFound('Publisher not found'));
  return sendSuccess(res, { message: 'Publisher updated', data: { publisher } });
});

export const deletePublisher = catchAsync(async (req, res, next) => {
  const publisher = await Publisher.findByIdAndDelete(req.params.id);
  if (!publisher) return next(AppError.notFound('Publisher not found'));
  return sendSuccess(res, { message: 'Publisher deleted' });
});
