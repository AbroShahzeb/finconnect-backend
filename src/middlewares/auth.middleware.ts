import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { RequestUser } from "../controllers/auth.controller.js";

export const authorize = catchAsync(async (req, res, next) => {
  const token = req.cookies?.jwt;

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
