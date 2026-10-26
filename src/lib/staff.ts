import Role from "@/models/Role";
import { PERMISSION_KEYS } from "@/lib/permissions";

/** Permissions of an admin user: undefined for a super admin, a (possibly empty) list for staff with a role. */
export async function loadStaffPerms(user: { role: string; adminRoleId?: any }): Promise<string[] | undefined> {
  if (user.role !== "admin" || !user.adminRoleId) return undefined;
  const role: any = await Role.findById(user.adminRoleId).select("permissions").lean();
  return (role?.permissions || []).filter((k: string) => PERMISSION_KEYS.includes(k));
}
