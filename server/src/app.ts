import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
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

const clientBuildDirectory = resolve(__dirname, "../../client/dist");
if (existsSync(clientBuildDirectory)) {
  app.use(express.static(clientBuildDirectory));
  app.get("*", (request, response, next) => {
    if (request.path === "/api" || request.path.startsWith("/api/")) {
      next();
      return;
    }

    response.sendFile(resolve(clientBuildDirectory, "index.html"), (error) => {
      if (error) {
        next(error);
      }
    });
  });
}

export { app };
export default app;
