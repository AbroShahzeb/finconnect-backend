import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";

export const login = catchAsync(async (req, res, next) => {
  res
    .status(200)
    .json({ status: "success", message: "Logged in successfully" });
});
