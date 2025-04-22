// routes/webhook.ts or similar

import express from "express";
import Stripe from "stripe";
import { buffer } from "micro";
import stripe from "../utils/stripe.js"; // your stripe instance
import Subscription from "../models/subscription.model.js";
import { configDotenv } from "dotenv";
configDotenv();

const router = express.Router();

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

        // Optionally update your database
        console.log(`✅ Subscription successful: ${subscriptionId}`);

        // TODO: Mark user subscription active in DB using metadata or customer email
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
