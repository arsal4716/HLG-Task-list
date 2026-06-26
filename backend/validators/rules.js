import validator from 'validator';

/** Reusable field rules for the validate() middleware. */
export const required = (v) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '')
    ? 'is required'
    : null;

export const isEmail = (v) => (v && !validator.isEmail(String(v)) ? 'must be a valid email' : null);

export const minLen = (n) => (v) =>
  v && String(v).length < n ? `must be at least ${n} characters` : null;

export const maxLen = (n) => (v) =>
  v && String(v).length > n ? `must be at most ${n} characters` : null;

export const isIn = (values) => (v) =>
  v && !values.includes(v) ? `must be one of: ${values.join(', ')}` : null;

export const isMongoId = (v) =>
  v && !validator.isMongoId(String(v)) ? 'must be a valid id' : null;

export const isNumber = (v) =>
  v !== undefined && v !== '' && Number.isNaN(Number(v)) ? 'must be a number' : null;

export const isArray = (v) => (v !== undefined && !Array.isArray(v) ? 'must be an array' : null);

export const isDate = (v) =>
  v && Number.isNaN(Date.parse(v)) ? 'must be a valid date' : null;
