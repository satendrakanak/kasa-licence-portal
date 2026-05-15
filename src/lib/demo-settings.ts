import { prisma } from "@/lib/prisma";

const DEMO_OPERATIONS_KEY = "demo_operations";

export type DemoOperationsSettings = {
  demoToursEnabled: boolean;
  demoResetOnExpiry: boolean;
};

export const defaultDemoOperationsSettings: DemoOperationsSettings = {
  demoToursEnabled: true,
  demoResetOnExpiry: true,
};

function normalizeDemoOperationsSettings(value: unknown): DemoOperationsSettings {
  if (!value || typeof value !== "object") return defaultDemoOperationsSettings;

  const data = value as Partial<Record<keyof DemoOperationsSettings, unknown>>;

  return {
    demoToursEnabled: Boolean(data.demoToursEnabled),
    demoResetOnExpiry:
      typeof data.demoResetOnExpiry === "boolean"
        ? data.demoResetOnExpiry
        : defaultDemoOperationsSettings.demoResetOnExpiry,
  };
}

export async function getDemoOperationsSettings() {
  const setting = await prisma.adminSetting.findUnique({
    where: { key: DEMO_OPERATIONS_KEY },
  });

  return normalizeDemoOperationsSettings(setting?.value);
}

export async function saveDemoOperationsSettings(
  settings: DemoOperationsSettings,
) {
  return prisma.adminSetting.upsert({
    where: { key: DEMO_OPERATIONS_KEY },
    update: { value: settings },
    create: { key: DEMO_OPERATIONS_KEY, value: settings },
  });
}
