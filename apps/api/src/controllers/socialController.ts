import { Request, Response } from "express";

const NOT_IMPLEMENTED_RESPONSE = {
  ok: false,
  error: "Not implemented — social schema models were removed"
};

export async function getAccounts(req: Request, res: Response) {
  // REMOVED: Social controller features not implemented
  return res.status(410).json({ 
    error: "Social features removed",
    message: "This feature is not yet implemented and has been removed."
  });
}

export async function connect(req: Request, res: Response) {
  // REMOVED: Social controller features not implemented
  return res.status(410).json({ 
    error: "Social features removed",
    message: "This feature is not yet implemented and has been removed."
  });
}

export async function disconnect(req: Request, res: Response) {
  // REMOVED: Social controller features not implemented
  return res.status(410).json({ 
    error: "Social features removed",
    message: "This feature is not yet implemented and has been removed."
  });
}

export async function refresh(req: Request, res: Response) {
  // REMOVED: Social controller features not implemented
  return res.status(410).json({ 
    error: "Social features removed",
    message: "This feature is not yet implemented and has been removed."
  });
}

export async function metrics(req: Request, res: Response) {
  // REMOVED: Social controller features not implemented
  return res.status(410).json({ 
    error: "Social features removed",
    message: "This feature is not yet implemented and has been removed."
  });
}
