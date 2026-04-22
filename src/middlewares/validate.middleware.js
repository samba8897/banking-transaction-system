const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return next(new ApiError(400, result.error.issues[0].message));
  }

  req.body = result.data;
  next();
};

module.exports = validate;