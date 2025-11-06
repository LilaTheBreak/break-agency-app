import type { NextFunction, Request, Response } from "express";

interface ProblemDetails {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
}

export class HttpError extends Error {
  status: number;
  payload?: Record<string, unknown>;

  constructor(status: number, message: string, payload?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export function problemDetailsHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (res.headersSent) return;

  const status = err instanceof HttpError ? err.status : 500;
  const title =
    err instanceof HttpError
      ? err.message
      : err instanceof Error
        ? err.message
        : "Internal Server Error";

  const body: ProblemDetails = {
    type: status >= 500 ? "about:blank" : undefined,
    title,
    status,
    detail: status >= 500 ? "An unexpected error occurred." : undefined,
    instance: req.originalUrl
  };

  if (err instanceof HttpError && err.payload) {
    Object.assign(body, err.payload);
  }

  res.status(status).json(body);
}
