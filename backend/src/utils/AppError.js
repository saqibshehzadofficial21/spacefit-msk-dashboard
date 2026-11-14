/** Operational error with an HTTP status. Thrown by services, rendered by the central error handler. */
export class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.details = details;
  }
}

export const notFound = (entity, id) => new AppError(404, `${entity} "${id}" was not found`);
