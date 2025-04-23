import { model, Schema } from "mongoose";

export interface ITransaction {
  to: string;
  from: string;
  amount: number;
  title: string;
  description: string;
  date: Date;
  type: "in" | "out";
}

export interface ITransactionDoc extends ITransaction, Document {}

const transactionSchema = new Schema<ITransaction>({
  to: {
    type: String,
    required: true,
  },
  from: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ["in", "out"],
    required: true,
  },
});

const Transaction = model<ITransaction>("Transaction", transactionSchema);
export default Transaction;
