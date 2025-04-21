import { z } from "zod";

export const LogInRequestBodySchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, { message: "Password is required" }),
});

export const RegisterRequestBodySchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be atleast 3 characters long" }),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, { message: "Password must be atleast 8 characters long" }),
});
