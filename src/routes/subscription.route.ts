import { Router } from "express";
import {
  createSubscription,
  getSubscription,
} from "../controllers/subscription.controller.js";
import { authorize, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", createSubscription);
router.get("/:id", authorize, restrictTo("developer"), getSubscription);

export default router;
