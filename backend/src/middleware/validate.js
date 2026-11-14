import { AppError } from '../utils/AppError.js';

/** Validate req.body / req.query with a Zod schema. Stores the sanitised result on req.valid. */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      const details = result.error.issues.map((issue) => `${issue.path.join('.') || source}: ${issue.message}`);
      return next(new AppError(400, 'Validation failed', details));
    }
    req.valid = result.data;
    return next();
  };
}
