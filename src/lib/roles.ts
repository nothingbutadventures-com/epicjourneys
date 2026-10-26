import { PERMISSION_KEYS } from "@/lib/permissions";

export function cleanRole(body: any) {
  const perms = Array.isArray(body.permissions) ? [...new Set(body.permissions.map(String))] : [];
  return {
    name: String(body.name ?? "").trim().slice(0, 60),
    description: String(body.description ?? "").trim().slice(0, 300),
    permissions: perms.filter((k) => PERMISSION_KEYS.includes(k as string)) as string[],
    invalid: perms.some((k) => !PERMISSION_KEYS.includes(k as string)),
  };
}
