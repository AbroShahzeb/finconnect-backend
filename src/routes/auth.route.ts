import { Router } from "express";
import { login, register } from "../controllers/auth.controller.js";
import passport from "passport";

const router = Router();

router.post("/login", login);
router.post("/register", register);

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
  (req, res) => {
    console.log("Request user", req.user);
    res.status(200).json("Signed in successfully");
  }
);

export default router;
