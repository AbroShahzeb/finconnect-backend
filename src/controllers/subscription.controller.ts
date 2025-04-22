import { Types } from "mongoose";
import Subscription from "../models/subscription.model.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { SubscriptionBodySchema } from "../utils/validations.js";
import { RequestUser } from "./auth.controller.js";
import stripe from "../utils/stripe.js";

export const createSubscription = catchAsync(async (req, res, next) => {
  const validatedData = SubscriptionBodySchema.safeParse(req.body);
  if (!validatedData.success) {
    return next(AppError.handleValidationError(validatedData.error));
  }

  const {
    name,
    price,
    frequency,
    paymentMethod,
    status,
    startDate,
    renewalDate,
  } = validatedData.data;
  const { _id: userId } = req.user as Types.ObjectId;

  const existingSubscription = await Subscription.findOne({ userId });

  if (existingSubscription) {
    return next(new AppError("You already have an active subscription", 400));
  }

  const subscription = await Subscription.create({
    userId,
    name,
    price,
    frequency,
    paymentMethod,
    status,
    startDate,
    renewalDate,
  });

  res.status(201).json({ status: "success", data: { subscription } });
});

export const getSubscription = catchAsync(async (req, res, next) => {
  const reqUser = req.user as RequestUser;
  const userId = reqUser.id.toString();

  if (userId !== req.params.id) {
    return next(new AppError("You are not the owner of this account", 401));
  }

  const subscriptions = await Subscription.find({ userId: req.params.id });

  res.status(200).json({ status: "success", data: subscriptions });
});

export const createSubscriptionStripe = catchAsync(async (req, res, next) => {
  const { name, price } = req.body;
  console.log("Request body:", req.body); // Debugging line
  const reqUser = req.user as RequestUser;
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    metadata: {
      userId: reqUser.id,
      subscriptionName: name,
      subscriptionPrice: price,
    },
    success_url: "https://finconnect.shahzebabro.com/dashboard",
    cancel_url: "https://finconnect.shahzebabro.com/pricing",
    line_items: [
      {
        price: "price_1RGf45RDr0agcdVyepPBm1MD",
        quantity: 1,
      },
    ],
  });

  res.status(200).json({ url: session.url });
});
