import "dotenv/config";
import { app } from "./app";
import { disconnectPrisma } from "./prisma";

const port = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`API server listening on port ${port}`);
});

async function shutdown() {
  server.close(async (error) => {
    if (error) {
      console.error("Failed to close the API server cleanly:", error);
      process.exitCode = 1;
    }

    await disconnectPrisma();
  });
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
