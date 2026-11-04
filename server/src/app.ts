import cors from "cors";
import express from "express";
import healthRouter from "./routes/health";

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.use("/api", healthRouter);

export { app };
export default app;
