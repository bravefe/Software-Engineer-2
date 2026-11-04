export interface HealthStatus {
  status: "ok" | "error";
  database: "connected" | "disconnected";
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const response = await fetch("/api/health");

  if (!response.ok) {
    throw new Error("API or database connection is unavailable.");
  }

  return (await response.json()) as HealthStatus;
}
