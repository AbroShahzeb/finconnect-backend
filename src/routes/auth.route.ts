import { Router } from "express";
import {
  getMe,
  login,
  logout,
  register,
  signInWithOAuth,
} from "../controllers/auth.controller.js";
import passport from "passport";
import { authorize } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.post("/me", authorize, getMe);
router.post("/logout", authorize, logout);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/redirect",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  signInWithOAuth
);

export default router;
