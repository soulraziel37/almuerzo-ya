/** Error esperado, con un mensaje que la app puede mostrar tal cual. */
export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
