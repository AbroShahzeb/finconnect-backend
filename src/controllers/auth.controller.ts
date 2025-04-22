import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import {
  LogInRequestBodySchema,
  RegisterRequestBodySchema,
} from "../utils/validations.js";
import { Response } from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

const signToken = (id: Types.ObjectId, res: Response) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

export const login = catchAsync(async (req, res, next) => {
  const validationResults = LogInRequestBodySchema.safeParse(req.body);

  if (!validationResults.success) {
    return next(AppError.handleValidationError(validationResults.error));
  }

  const { email, password } = validationResults.data;
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("No account found for this email", 400));
  }

  const passwordsMatch = await bcrypt.compare(password, user.password);

  if (!passwordsMatch) {
    return next(new AppError("Invalid Credentials", 400));
  }

  signToken(user._id, res);

  res.status(200).json({
    status: "success",
    message: "Logged in successfully",
    user,
  });
});

export const register = catchAsync(async (req, res, next) => {
  const validationResults = RegisterRequestBodySchema.safeParse(req.body);

  if (!validationResults.success) {
    return next(AppError.handleValidationError(validationResults.error));
  }

  const { name, email, password } = validationResults.data;

  const existingAccount = await User.findOne({ email });

  if (existingAccount) {
    return next(
      new AppError(
        "User with this email already exists, please try loggin in",
        400
      )
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = await User.create({ name, email, password: hashedPassword });

  signToken(newUser._id, res);

  res.status(201).json({ status: "success", data: newUser });
});
