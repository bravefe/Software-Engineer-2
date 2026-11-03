import "dotenv/config";
import { app } from "./app";
import { disconnectPrisma } from "./prisma";

const port = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const server = app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
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
