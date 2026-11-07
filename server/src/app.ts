import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import authRouter from "./routes/auth";
import healthRouter from "./routes/health";
import requestsRouter from "./routes/requests";
import usersRouter from "./routes/users";

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/users", usersRouter);

export { app };
export default app;
