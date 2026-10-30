import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";

/** The standard signed-in response: a login token in the body and in the httpOnly cookie. */
export function sessionResponse(user: any, extra: Record<string, unknown> = {}) {
  const token = signToken({
    userId: user._id.toString(),
    email: user.email || "",
    role: user.role,
    name: user.name,
    assignedDestination: user.assignedDestination ? String(user.assignedDestination._id || user.assignedDestination) : undefined,
  });
  const response = NextResponse.json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email || "", role: user.role, phone: user.phone, assignedDestination: user.assignedDestination },
    ...extra,
  });
  response.cookies.set("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 7 * 24 * 60 * 60, path: "/" });
  return response;
}
