import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { RequestUser } from "../controllers/auth.controller.js";
import Subscription, {
  ISubscriptionDoc,
} from "../models/subscription.model.js";
import { Request } from "express";

export const authorize = catchAsync(async (req, res, next) => {
  const token = req.cookies?.jwt;

  console.log("Token:", token); // Debugging line

  if (!token) {
    return next(
      new AppError("You are not logged in. Please log in to continue.", 401)
    );
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token does not exist.", 401)
    );
  }

  req.user = currentUser;
  next();
});

export const restrictTo = (...allowedRoles: ("admin" | "developer")[]) => {
  return (req, res, next) => {
    const user = req.user as RequestUser;

    if (!user) {
      return next(new AppError("You are not logged in", 401));
    }

    if (!allowedRoles.includes(user.role as "admin" | "developer")) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

export const checkSubscription = catchAsync(async (req, res, next) => {
  const user = req.user as RequestUser;

  if (!user) {
    return next(new AppError("You are not logged in", 401));
  }

  // Check if the user has an active subscription
  const activeSubscription = await Subscription.findOne({
    userId: user.id,
    status: "active",
  });

  if (!activeSubscription) {
    return next(new AppError("You do not have an active subscription.", 403));
  }

  // Attach subscription details to the request object (optional)
  (req as Request & { subscription?: ISubscriptionDoc }).subscription =
    activeSubscription;

  next();
});
