/**
 * Chainable query-builder that adds filtering, searching, sorting, field
 * limiting and pagination to any Mongoose query from req.query.
 *
 *   const features = new ApiFeatures(Task.find(), req.query)
 *     .filter().search(['title','description']).sort().paginate();
 *   const docs = await features.query;
 */
export class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString || {};
    this.page = Math.max(parseInt(this.queryString.page, 10) || 1, 1);
    this.limit = Math.min(Math.max(parseInt(this.queryString.limit, 10) || 20, 1), 100);
  }

  filter() {
    const queryObj = { ...this.queryString };
    ['page', 'sort', 'limit', 'fields', 'search', 'q'].forEach((f) => delete queryObj[f]);

    // advanced operators: gte | gt | lte | lt | in
    let str = JSON.stringify(queryObj);
    str = str.replace(/\b(gte|gt|lte|lt|in|ne)\b/g, (m) => `$${m}`);
    const parsed = JSON.parse(str);

    // comma separated $in values -> arrays
    Object.keys(parsed).forEach((key) => {
      if (parsed[key] && typeof parsed[key] === 'object' && parsed[key].$in) {
        parsed[key].$in = String(parsed[key].$in).split(',');
      }
    });

    this.query = this.query.find(parsed);
    return this;
  }

  search(fields = []) {
    const term = this.queryString.search || this.queryString.q;
    if (term && fields.length) {
      const regex = new RegExp(term.trim(), 'i');
      this.query = this.query.find({ $or: fields.map((f) => ({ [f]: regex })) });
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    }
    return this;
  }

  paginate() {
    const skip = (this.page - 1) * this.limit;
    this.query = this.query.skip(skip).limit(this.limit);
    return this;
  }
}

export default ApiFeatures;
