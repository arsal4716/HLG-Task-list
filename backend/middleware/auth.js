import { verifyAccessToken } from '../helpers/token.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { USER_STATUS } from '../config/constants.js';

/** Authenticates a request via Bearer access token. Attaches req.user. */
export const protect = catchAsync(async (req, _res, next) => {
  let token;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) token = header.split(' ')[1];
  else if (req.cookies && req.cookies.accessToken) token = req.cookies.accessToken;

  if (!token) return next(AppError.unauthorized('You are not logged in. Please log in.'));

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Session expired. Please refresh.' : 'Invalid token.';
    return next(AppError.unauthorized(msg));
  }

  const user = await User.findById(decoded.id).populate('department', 'name color');
  if (!user) return next(AppError.unauthorized('The user for this token no longer exists.'));
  if (user.status === USER_STATUS.SUSPENDED) return next(AppError.forbidden('Account suspended.'));
  if (user.changedPasswordAfter(decoded.iat))
    return next(AppError.unauthorized('Password recently changed. Please log in again.'));

  req.user = user;
  next();
});

export default protect;
