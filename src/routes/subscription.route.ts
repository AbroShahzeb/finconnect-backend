import { Router } from "express";
import {
  createPaymentIntent,
  createSubscription,
  getSubscription,
} from "../controllers/subscription.controller.js";
import { authorize, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", createSubscription);
router.get("/:id", authorize, restrictTo("admin"), getSubscription);
router.get("/payment", createPaymentIntent);

export default router;
