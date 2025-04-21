import express from "express";
import { configDotenv } from "dotenv";
configDotenv();
import "colors";

const app = express();

app.get("/", (req, res, next) => {
  res.json({
    status: "success",
    message: "Hello from the finconnect backend API. Test",
  });
});

app.listen(process.env.PORT || 3007, () => {
  console.log(
    `App is running on PORT ${process.env.PORT || 3007}`.yellow.underline
  );
});
