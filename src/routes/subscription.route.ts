import { Router } from "express";
import {
  cancelSubscription,
  createSubscription,
  createSubscriptionStripe,
  getSubscription,
} from "../controllers/subscription.controller.js";
import { authorize, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", createSubscription);
router.post("/payment", authorize, createSubscriptionStripe);
router.post("/cancel", authorize, cancelSubscription);
router.get("/:id", authorize, getSubscription);

export default router;
