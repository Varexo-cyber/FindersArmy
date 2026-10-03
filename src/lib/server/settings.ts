import "server-only";
import { db } from "./db";
import { settingsSchema, type Settings, type SettingKey } from "../settings-schema";
import { validateRanks } from "../ranks";

export async function getSettings(): Promise<Settings> {
  const rows = await db.setting.findMany();
  const raw: Record<string, unknown> = {};
  for (const row of rows) raw[row.key] = row.value;
  const parsed = settingsSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  // A corrupt stored value must not silently become a default; fail loudly so an admin fixes it.
  throw new Error(`Invalid settings in database: ${parsed.error.message}`);
}

export async function updateSetting<K extends SettingKey>(key: K, value: Settings[K]): Promise<void> {
  const partial = settingsSchema.shape[key].parse(value);
  if (key === "ranks") validateRanks(partial as Settings["ranks"]);
  await db.setting.upsert({
    where: { key },
    create: { key, value: partial as object },
    update: { value: partial as object },
  });
}
