// routes/webhook.ts or similar

import express from "express";
import Stripe from "stripe";
import { buffer } from "micro";
import stripe from "../utils/stripe.js"; // your stripe instance
import Subscription from "../models/subscription.model.js"; // Import the Subscription model
import { configDotenv } from "dotenv";
import { Types } from "mongoose";
import { RequestUser } from "../controllers/auth.controller.js";
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

        // Save active subscription logic
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Create a new subscription document
        try {
          const userId = "680767e1f39d96047a0f1ab0"; // Assuming `req.user` contains the authenticated user
          const reqUser = req.user as RequestUser;
          const _userId = reqUser.id;
          console.log(reqUser, "reqUser");
          console.log(_userId, "userId");
          const newSubscription = await Subscription.create({
            name: "Subscription Name", // Replace with actual name if available
            price: 0, // Replace with actual price if available
            frequency: "monthly", // Replace with actual frequency if available
            paymentMethod: "card", // Replace with actual payment method if available
            status: "active",
            startDate: new Date(),
            renewalDate: new Date(
              new Date().setMonth(new Date().getMonth() + 1)
            ), // Example: 1 month later
            userId,
            subscriptionId,
            customerId,
          });

          console.log(`✅ Subscription created: ${newSubscription._id}`);
        } catch (err) {
          console.error("Error creating subscription document:", err);
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
