import { Router } from "express";
import {
  authorize,
  checkSubscription,
} from "../middlewares/auth.middleware.js";
import {
  generateInvoiceObject,
  getBalance,
  transferFunds,
} from "../controllers/finconnect.controller.js";

const router = Router();

router.get("/balance", authorize, checkSubscription, getBalance);
router.post("/transfer", authorize, checkSubscription, transferFunds);
router.get("/invoice", authorize, checkSubscription, generateInvoiceObject);

export default router;
