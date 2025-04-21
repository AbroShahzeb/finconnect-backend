import { Request, Response, NextFunction } from "express";
import { Error } from "mongoose";
import AppError from "../utils/appError.js";

interface ValidationError extends Error {
  errors: { [key: string]: { message: string } };
}

interface DuplicateKeyError extends Error {
  keyValue: { [key: string]: string };
}

const handleInvalidJWTError = (): AppError =>
  new AppError("Invalid token. Login with correct token", 401);

const handleExpiredJWTError = (): AppError =>
  new AppError("Token has expired. Please login again", 401);

const handleCastError = (err: Error.CastError): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateRecordDB = (err: DuplicateKeyError): AppError => {
  const dupField = Object.keys(err.keyValue)[0];

  let message;

  if (dupField === "email")
    message = `User with this email already exists. Please try another one.`;
  else message = `Duplicate field value. Please use another value.`;

  return new AppError(message, 400);
};

const handleValidationError = (err: ValidationError): AppError => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const sendProdError = (err: AppError, res: Response): void => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      extra: undefined,
      errors: err?.errors,
    });
  } else {
    console.error("ERROR 💥", err);

    res.status(500).json({
      status: "error",
      message: "Something wrong happened",
    });
  }
};

const sendDevError = (err: AppError, res: Response): void => {
  console.log(err);

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendDevError(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err, message: err.message };

    if (error.name === "CastError")
      error = handleCastError(error as Error.CastError);
    if (error.code === 11000)
      error = handleDuplicateRecordDB(error as DuplicateKeyError);
    if (error._message === "User validation failed") {
      error = handleValidationError(error as ValidationError);
    }

    if (error.name === "JsonWebTokenError") error = handleInvalidJWTError();
    if (error.name === "TokenExpiredError") error = handleExpiredJWTError();

    sendProdError(error as AppError, res);
  }
};

export default globalErrorHandler;
