import express from "express";
import { configDotenv } from "dotenv";
configDotenv();
import "colors";

import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import webhookRoutes from "./routes/webhook.route.js";
import subscriptionRoutes from "./routes/subscription.route.js";
import finConnectRoutes from "./routes/finconnect.route.js";
import globalErrorHandler from "./controllers/error.controller.js";
import { connectDB } from "./utils/db.js";
import passport from "passport";
import "./config/passport.js";

const app = express();

connectDB();

app.use(webhookRoutes);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(passport.initialize());

app.use(cookieParser());

app.get("/", (req, res, next) => {
  res.json({
    status: "success",
    message: "Hello world...",
  });
});

app.use("/api", finConnectRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

app.use(globalErrorHandler);

app.listen(process.env.PORT || 3007, () => {
  console.log(
    `App is running on PORT ${process.env.PORT || 3007}`.yellow.underline
  );
});
