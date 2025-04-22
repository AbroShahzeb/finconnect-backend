import Stripe from "stripe";
import { configDotenv } from "dotenv";
configDotenv();
console.log("API Key", process.env.STRIPE_SECRET_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
export default stripe;
