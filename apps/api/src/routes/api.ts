import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { listingsRouter } from "./listings.js";
import { contactsRouter } from "./contacts.js";
import { viewingsRouter } from "./viewings.js";

export const apiRouter: Router = Router();

/** Everything below this line requires auth */
apiRouter.use(authenticate(true));

apiRouter.use("/listings", listingsRouter);
apiRouter.use("/contacts", contactsRouter);
apiRouter.use("/viewings", viewingsRouter);
