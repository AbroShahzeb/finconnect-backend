import express from "express";
import { configDotenv } from "dotenv";
configDotenv();
import "colors";

import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.js";
import globalErrorHandler from "./controllers/error.controller.js";
import { connectDB } from "./utils/db.js";

const app = express();

connectDB();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

app.get("/", (req, res, next) => {
  res.json({
    status: "success",
    message: "Hello world...",
  });
});

app.use("/api/auth", authRoutes);

app.use(globalErrorHandler);

app.listen(process.env.PORT || 3007, () => {
  console.log(
    `App is running on PORT ${process.env.PORT || 3007}`.yellow.underline
  );
});
