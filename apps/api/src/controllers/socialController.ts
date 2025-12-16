import { Request, Response } from "express";

const NOT_IMPLEMENTED_RESPONSE = {
  ok: false,
  error: "Not implemented — social schema models were removed"
};

export async function getAccounts(req: Request, res: Response) {
  return res.status(501).json(NOT_IMPLEMENTED_RESPONSE);
}

export async function connect(req: Request, res: Response) {
  return res.status(501).json(NOT_IMPLEMENTED_RESPONSE);
}

export async function disconnect(req: Request, res: Response) {
  return res.status(501).json(NOT_IMPLEMENTED_RESPONSE);
}

export async function refresh(req: Request, res: Response) {
  return res.status(501).json(NOT_IMPLEMENTED_RESPONSE);
}

export async function metrics(req: Request, res: Response) {
  return res.status(501).json(NOT_IMPLEMENTED_RESPONSE);
}
