import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { resolve } from "node:path";
import authRouter from "./routes/auth";
import healthRouter from "./routes/health";
import requestsRouter from "./routes/requests";
import usersRouter from "./routes/users";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/users", usersRouter);

app.use(express.static(resolve(__dirname, "../../client/dist")));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    next();
    return;
  }
  res.sendFile(resolve(__dirname, "../../client/dist/index.html"), (error) => {
    if (error) next();
  });
});

export { app };
export default app;
