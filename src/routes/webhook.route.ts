// routes/webhook.ts or similar

import express from "express";
import Stripe from "stripe";
import { buffer } from "micro";
import stripe from "../utils/stripe.js"; // your stripe instance
import Subscription from "../models/subscription.model.js"; // Import the Subscription model
import { configDotenv } from "dotenv";
import { Types } from "mongoose";
import { RequestUser } from "../controllers/auth.controller.js";
import { authorize } from "passport";
configDotenv();

const router = express.Router();

console.log("webhook api key", process.env.STRIPE_WEBHOOK_SECRET);

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"]!;
    let event: Stripe.Event;

    const buf = req.body as Buffer;

    try {
      event = stripe.webhooks.constructEvent(
        buf,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("Webhook signature verification failed.", err);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // 🔍 Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata.userId as string;
        const subscriptionName = session.metadata.subscriptionName as string;
        const subscriptionPrice = session.metadata.subscriptionPrice as string;

        // Save active subscription logic
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        try {
          // Check if the user already has an active subscription
          const existingSubscription = await Subscription.findOne({
            userId,
            status: "active",
          });

          if (existingSubscription) {
            console.error(
              `User ${userId} already has an active subscription: ${existingSubscription._id}`
            );
            res.status(400).json({
              status: "error",
              message: "You already have an active subscription.",
            });
          }

          // Create a new subscription document
          const newSubscription = await Subscription.create({
            name: subscriptionName,
            price: +subscriptionPrice,
            frequency: "monthly",
            paymentMethod: "card",
            status: "active",
            startDate: new Date(),
            renewalDate: new Date(
              new Date().setMonth(new Date().getMonth() + 1)
            ),
            userId,
            subscriptionId,
            customerId,
          });

          console.log(`✅ Subscription created: ${newSubscription._id}`);
        } catch (err) {
          console.error("Error creating subscription document:", err);
          res.status(500).json({
            status: "error",
            message: "Internal server error while creating subscription.",
          });
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Handle cancellation
        const stripeSubId = subscription.id;

        console.log(`❌ Subscription canceled: ${stripeSubId}`);

        // TODO: Mark subscription as canceled in your DB
        break;
      }

      // Add more handlers as needed (e.g. `invoice.payment_failed`, etc.)
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
);

export default router;
