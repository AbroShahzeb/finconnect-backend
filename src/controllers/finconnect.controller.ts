import Transaction from "../models/transaction.model.js";
import User from "../models/user.model.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { RequestUser } from "./auth.controller.js";
import PDFDocument from "pdfkit";
import { Response } from "express";

export const getBalance = catchAsync(async (req, res) => {
  const user = req.user as RequestUser;
  const { id: userId } = user;

  if (!userId) {
    return res.status(400).json({
      status: "fail",
      message: "User ID is required",
    });
  }

  const userAcc = await User.findById(userId);
  if (!userAcc) {
    return res.status(404).json({
      status: "fail",
      message: "User not found",
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      balance: userAcc.balance, // Replace with actual balance retrieval logic
    },
  });
});

export const transferFunds = catchAsync(async (req, res, next) => {
  const { to, from, amount, title, description } = req.body;
  const reqUser = req.user as RequestUser;
  const userId = reqUser.id.toString();

  if (userId !== from) {
    return next(
      new AppError("You are not authorized to transfer from this account", 403)
    );
  }

  const ToAccount = await User.findById(to);
  if (!ToAccount) {
    return next(new AppError("Receiving account not found", 404));
  }

  const FromAccount = await User.findById(from);
  if (!FromAccount) {
    return next(new AppError("Sender account not found", 404));
  }

  if (FromAccount._id.toString() === ToAccount._id.toString()) {
    return next(new AppError("Cannot transfer to the same account", 400));
  }

  if (amount <= 0) {
    return next(new AppError("Amount must be greater than zero", 400));
  }

  if (FromAccount.balance < +amount) {
    return next(new AppError("Insufficient funds", 400));
  }

  // Update balances
  FromAccount.balance -= parseFloat(amount);
  ToAccount.balance += parseFloat(amount);

  await FromAccount.save();
  await ToAccount.save();

  // Create "out" transaction for sender
  const senderTransaction = await Transaction.create({
    to: ToAccount._id,
    from: FromAccount._id,
    amount,
    title,
    description,
    type: "out",
    date: new Date(),
  });

  // Create "in" transaction for receiver
  const receiverTransaction = await Transaction.create({
    to: ToAccount._id,
    from: FromAccount._id,
    amount,
    title,
    description,
    type: "in",
    date: new Date(),
  });

  if (!senderTransaction || !receiverTransaction) {
    return next(new AppError("Transaction failed", 500));
  }

  res.status(201).json({
    status: "success",
    data: {
      message: `Transferred $${amount} from ${from} to ${to}. New sender balance: ${FromAccount.balance}`,
    },
  });
});

export const generateInvoiceObject = catchAsync(async (req, res, next) => {
  const { start, end } = req.query;
  const user = req.user as RequestUser;
  const { id: userId } = user;

  // Get both 'in' and 'out' transactions involving the user
  const transactions = await Transaction.find({
    from: userId,
    type: "out",
    date: {
      $gte: new Date(start as string),
      $lte: new Date(end as string),
    },
  });

  if (!transactions || transactions.length === 0) {
    return next(new AppError("No transactions found", 404));
  }

  // Create a unique transaction list where each transaction is only counted once
  const uniqueTransactions = transactions.reduce((acc, txn) => {
    // Check if the transaction is already included in the result
    const existingTxn = acc.find(
      (t) => t._id.toString() === txn._id.toString()
    );
    if (!existingTxn) {
      acc.push({
        _id: txn._id,
        title: txn.title,
        amount: txn.amount,
        date: txn.date,
        description: txn.description,
        type: txn.type, // "in" or "out"
        from: txn.from,
        to: txn.to,
      });
    }
    return acc;
  }, []);

  // Calculate the total out amount (money sent)
  const totalOut = uniqueTransactions
    .filter((txn) => txn.from.toString() === userId && txn.type === "out")
    .reduce((sum, txn) => sum + txn.amount, 0);

  // Build invoice object
  const invoice = {
    title: "Transaction Invoice",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    period: {
      start,
      end,
    },
    transactions: uniqueTransactions.map((txn) => ({
      title: txn.title,
      amount: txn.amount,
      date: txn.date,
      description: txn.description,
      type: txn.type,
      from: txn.from,
      to: txn.to,
    })),
    total: totalOut,
    generatedAt: new Date().toISOString(),
  };

  res.status(200).json({
    status: "success",
    data: {
      invoice,
    },
  });
});
