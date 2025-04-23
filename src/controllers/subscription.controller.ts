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

  const subscriptions = await Subscription.findOne({
    userId: req.params.id,
  }).select("name price -_id");

  res.status(200).json({ status: "success", data: subscriptions });
});

export const createSubscriptionStripe = catchAsync(async (req, res, next) => {
  const { name, price } = req.body; // `name` is the subscription name
  const reqUser = req.user as RequestUser;

  // Map subscription names to Stripe price IDs
  const priceMapping: Record<string, string> = {
    starter: "price_1RGl3sRDr0agcdVyLHZMW8vZ", // Replace with actual Stripe price ID for "starter"
    pro: "price_1RGf45RDr0agcdVyepPBm1MD", // Replace with actual Stripe price ID for "pro"
    business: "price_1RGf4TRDr0agcdVy2q3a3Kh8", // Replace with actual Stripe price ID for "business"
  };

  // Validate the subscription name
  const stripePriceId = priceMapping[name.toLowerCase()];
  if (!stripePriceId) {
    return next(new AppError("Invalid subscription name provided", 400));
  }

  // Create a Stripe checkout session
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
        price: stripePriceId, // Dynamically set the price ID based on the subscription name
        quantity: 1,
      },
    ],
  });

  res.status(200).json({ url: session.url });
});
