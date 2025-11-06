import type { Request, Response, NextFunction } from "express";

export function notFoundHandler(_req: Request, res: Response, _next: NextFunction) {
  res.status(404).json({
    type: "https://httpstatuses.com/404",
    title: "Resource Not Found",
    status: 404,
    detail: "The requested resource could not be found."
  });
}
