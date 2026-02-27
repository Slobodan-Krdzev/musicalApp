import { ValidationError } from '../utils/errors.js';

/**
 * Wraps Zod schema validation. Expects req.body (or pass getData).
 */
export function validate(schema, getData = (req) => req.body) {
  return (req, res, next) => {
    const data = getData(req);
    const result = schema.safeParse(data);
    if (result.success) {
      req.validated = result.data;
      next();
    } else {
      next(new ValidationError('Validation failed', result.error.flatten()));
    }
  };
}
