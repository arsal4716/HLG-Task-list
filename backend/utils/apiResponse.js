/** Standard success envelope so the frontend can rely on a consistent shape. */
export const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null, meta = undefined } = {}) => {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

export const sendPaginated = (res, { message = 'Success', data = [], page, limit, total }) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
};

export default sendSuccess;
