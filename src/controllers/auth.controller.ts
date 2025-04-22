import bcrypt from "bcryptjs";
import User, { IUserDoc } from "../models/user.model.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import {
  LogInRequestBodySchema,
  RegisterRequestBodySchema,
} from "../utils/validations.js";
import { Response } from "express";
import jwt from "jsonwebtoken";
import mongoose, { mongo, Types } from "mongoose";
import Account from "../models/account.model.js";

type RequestUser = {
  id: string;
  name: string;
  email: string;
  picture: string;
};

const signToken = (id: Types.ObjectId, res: Response) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    domain: ".shahzebabro.com",
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
    return next(new AppError("No user found for this email", 400));
  }

  const existingAccount = await Account.findOne({
    provider: "credentials",
    providerAccountId: email,
  });

  if (!existingAccount) {
    return next(new AppError("No account found", 404));
  }

  const passwordsMatch = await bcrypt.compare(
    password,
    existingAccount.password
  );

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

  const session = await mongoose.startSession();
  session.startTransaction();

  const existingAccount = await User.findOne({ email }).session(session);

  if (existingAccount) {
    session.abortTransaction();
    return next(
      new AppError(
        "User with this email already exists, please try logging in",
        400
      )
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const [newUser] = await User.create([{ name, email }], { session });

  await Account.create(
    [
      {
        userId: newUser._id,
        name,
        provider: "credentials",
        providerAccountId: email,
        password: hashedPassword,
      },
    ],
    { session }
  );

  await session.commitTransaction();

  signToken(newUser._id, res);

  res.status(201).json({ status: "success", data: newUser });
});

export const signInWithOAuth = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const { id, name, email, picture: image } = req.user as RequestUser;

  let existingUser = await User.findOne({ email }).session(session);

  if (!existingUser) {
    [existingUser] = await User.create([{ name, email, image: image }], {
      session,
    });
  } else {
    const updatedData: { name?: string; image?: string } = {};

    if (existingUser.name !== name) updatedData.name = name;
    if (existingUser.image !== image) updatedData.image = image;

    if (Object.keys(updatedData).length > 0) {
      await User.updateOne(
        { _id: existingUser._id },
        { $set: updatedData }
      ).session(session);
    }
  }

  const existingAccount = await Account.findOne({
    userId: existingUser._id,
    provider: "google",
    providerAccountId: id,
  }).session(session);

  if (!existingAccount) {
    await Account.create(
      [
        {
          userId: existingUser._id,
          name,
          image,
          provider: "google",
          providerAccountId: id,
        },
      ],
      { session }
    );
  }

  session.commitTransaction();

  signToken(existingUser._id, res);
  res.redirect(`${process.env.FRONTEND_URL}/login`);
});
