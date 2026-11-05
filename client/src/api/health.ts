export interface HealthStatus {
  status: "ok" | "error";
  database: "connected" | "disconnected";
  message?: string;
}

export type HealthRole = "REQUESTER" | "REVIEWER";

export interface RoleHealthStatus extends HealthStatus {
  role: HealthRole;
}

export interface RoleHealthResult {
  role: HealthRole;
  status?: HealthStatus;
  error?: string;
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const response = await fetch("/api/health");
  const data = (await response.json()) as HealthStatus;

  if (!response.ok) {
    throw new Error(data.message || "API or database connection is unavailable.");
  }

  return data;
}

async function getRoleHealthStatus(role: HealthRole): Promise<RoleHealthStatus> {
  const response = await fetch(`/api/health/${role.toLowerCase()}`, {
    credentials: "include",
  });
  const data = (await response.json()) as RoleHealthStatus & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error || data.message || "Health check is unavailable.");
  }

  return data;
}

export async function getRoleHealthResults(): Promise<RoleHealthResult[]> {
  const roles: HealthRole[] = ["REQUESTER", "REVIEWER"];

  return Promise.all(
    roles.map(async (role): Promise<RoleHealthResult> => {
      try {
        return { role, status: await getRoleHealthStatus(role) };
      } catch (cause: unknown) {
        return {
          role,
          error:
            cause instanceof Error ? cause.message : "Health check failed.",
        };
      }
    }),
  );
}
