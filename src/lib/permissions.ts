// Admin access control. Each permission is one admin sidebar page, plus the APIs that page needs.
// Shared by the sidebar, the route guard and the server-side API check.

export interface PermissionDef {
  key: string;
  label: string;
  group: string;
  /** Admin page prefix this permission unlocks. */
  href: string;
  /** API prefixes a staff member with this permission may call. */
  api: string[];
  hint?: string;
}

const TOUR_FORM_APIS = ["/api/uploads", "/api/tours", "/api/destinations", "/api/travel-styles", "/api/physical-ratings", "/api/discounts"];

export const PERMISSIONS: PermissionDef[] = [
  { key: "dashboard", label: "Dashboard", group: "Overview", href: "/admin", api: ["/api/bookings", "/api/destinations", "/api/partners", "/api/tours"], hint: "Overview numbers" },
  { key: "crm.leads", label: "Leads", group: "CRM", href: "/admin/leads", api: ["/api/leads", "/api/partners", "/api/destinations", "/api/tours"], hint: "Leads pipeline" },
  { key: "crm.calendar", label: "Calendar", group: "CRM", href: "/admin/tours-calendar", api: ["/api/tours-calendar"], hint: "Overview of every tour and date" },
  { key: "tours.create", label: "Create New Tour", group: "Tours", href: "/admin/tours/create", api: TOUR_FORM_APIS },
  { key: "tours.manage", label: "All Tours", group: "Tours", href: "/admin/tours", api: [...TOUR_FORM_APIS, "/api/launches", "/api/partners"], hint: "List, edit, delete tours" },
  { key: "tours.requests", label: "Tour Requests", group: "Tours", href: "/admin/launches", api: ["/api/launches", "/api/tours", "/api/partners", "/api/discounts", "/api/destinations"], hint: "Partner tour launch requests" },
  { key: "destinations", label: "Destinations", group: "Destinations", href: "/admin/locations", api: ["/api/destinations", "/api/partners"] },
  { key: "partners.accounts", label: "Partner Accounts", group: "Partners", href: "/admin/partners", api: ["/api/partners", "/api/destinations", "/api/discounts"] },
  { key: "partners.locations", label: "Partner Locations", group: "Partners", href: "/admin/partner-locations", api: ["/api/destinations"], hint: "Open locations for partner requests" },
  { key: "partners.requests", label: "Partner Requests", group: "Partners", href: "/admin/partner-requests", api: ["/api/partner-requests", "/api/partners", "/api/destinations"], hint: "Approve or reject partner applications" },
  { key: "bookings.list", label: "Passenger Bookings", group: "Bookings", href: "/admin/bookings", api: ["/api/bookings", "/api/tours", "/api/invoice", "/api/checkout"] },
  { key: "bookings.cancellations", label: "Cancellations", group: "Bookings", href: "/admin/cancellations", api: ["/api/cancellations", "/api/bookings"] },
  { key: "categories.styles", label: "Travel Styles", group: "Categories", href: "/admin/travel-styles", api: ["/api/travel-styles"] },
  { key: "categories.ratings", label: "Physical Rating", group: "Categories", href: "/admin/physical-ratings", api: ["/api/physical-ratings"] },
  { key: "discounts.discounts", label: "Special Discount", group: "Promotions", href: "/admin/discounts", api: ["/api/discounts"] },
  { key: "discounts.special", label: "Discounts", group: "Promotions", href: "/admin/special-discounts", api: ["/api/special-discounts", "/api/travel-styles"], hint: "Time-limited offers by travel style" },
  { key: "discounts.promo", label: "Promo Codes", group: "Promotions", href: "/admin/promo-codes", api: ["/api/promo-codes"] },
  { key: "careers.jobs", label: "Job Openings", group: "Careers", href: "/admin/careers", api: ["/api/jobs"] },
  { key: "careers.applications", label: "Applications", group: "Careers", href: "/admin/career-applications", api: ["/api/applications", "/api/jobs"] },
  { key: "management.users", label: "All Roles", group: "User Management", href: "/admin/users", api: ["/api/users"], hint: "View and manage customer accounts" },
  { key: "reviews", label: "Reviews", group: "Support", href: "/admin/reviews", api: ["/api/reviews"] },
  { key: "queries", label: "Queries", group: "Support", href: "/admin/queries", api: ["/api/queries"] },
];

/** Role Management itself is only for super admins, so it is not a grantable permission. */
export const SUPER_ONLY_PAGES = ["/admin/roles"];
export const SUPER_ONLY_APIS = ["/api/roles", "/api/staff"];

export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);
export const PERMISSION_GROUPS = [...new Set(PERMISSIONS.map((p) => p.group))];

const under = (path: string, prefix: string) => path === prefix || path.startsWith(prefix + "/");

/** The permission that owns an admin page (longest matching prefix wins, so /admin/tours/create beats /admin/tours). */
export function permissionForPage(pathname: string): PermissionDef | null {
  let best: PermissionDef | null = null;
  for (const p of PERMISSIONS) {
    if (under(pathname, p.href) && (!best || p.href.length > best.href.length)) best = p;
  }
  return best;
}

/** Can a staff member holding `perms` open this admin page? */
export function canOpenPage(perms: string[] | "all", pathname: string): boolean {
  if (perms === "all") return true;
  if (SUPER_ONLY_PAGES.some((p) => under(pathname, p))) return false;
  const def = permissionForPage(pathname);
  return Boolean(def && perms.includes(def.key));
}

/** Can a staff member holding `perms` use this API as an admin? */
export function canUseApi(perms: string[], pathname: string): boolean {
  if (SUPER_ONLY_APIS.some((p) => under(pathname, p))) return false;
  return PERMISSIONS.some((p) => perms.includes(p.key) && p.api.some((a) => under(pathname, a)));
}

export function firstAllowedHref(perms: string[] | "all"): string {
  if (perms === "all") return "/admin";
  return PERMISSIONS.find((p) => perms.includes(p.key))?.href || "/admin/login";
}
