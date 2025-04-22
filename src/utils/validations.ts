import { z } from "zod";

export const LogInRequestBodySchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, { message: "Password is required" }),
});

export const RegisterRequestBodySchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name must be atleast 3 characters long" }),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, { message: "Password must be atleast 8 characters long" }),
});

export const SubscriptionBodySchema = z
  .object({
    name: z.string().min(1, { message: "Subscription name is required" }),
    price: z
      .number({ invalid_type_error: "Price must be a number" })
      .positive({ message: "Price must be positive" })
      .min(1, { message: "Price is required" }),

    frequency: z
      .enum(["daily", "weekly", "monthly", "yearly"])
      .optional()
      .default("monthly"),

    paymentMethod: z.string().optional().default("card"),

    status: z
      .enum(["active", "cancelled", "expired"])
      .optional()
      .default("active"),

    startDate: z
      .preprocess(
        (arg) => (typeof arg === "string" ? new Date(arg) : arg),
        z.date()
      )
      .refine((date) => date <= new Date(), {
        message: "Start date must be in the past",
      }),

    renewalDate: z
      .preprocess(
        (arg) => (typeof arg === "string" ? new Date(arg) : arg),
        z.date()
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.renewalDate && data.startDate) {
        return data.renewalDate > data.startDate;
      }
      return true;
    },
    {
      message: "Renewal date must be after the start date",
      path: ["renewalDate"],
    }
  );
