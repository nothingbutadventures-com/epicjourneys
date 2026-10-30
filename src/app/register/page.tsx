"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Typography } from "@mui/material";
import { safeRedirect, withRedirect } from "@/lib/redirect";
import AuthShell, { fieldSx, submitSx } from "@/components/AuthShell";
import PhoneAuth from "@/components/PhoneAuth";

function RegisterForm() {
  const router = useRouter();
  const redirect = useSearchParams().get("redirect");

  return (
    <AuthShell
      title="Create your account"
      subtitle="Just your mobile number. No password to remember."
      footer={
        <>
          Already have an account?{" "}
          <Link href={withRedirect("/login", redirect)} style={{ color: "#E68A00", fontWeight: 700 }}>
            Log in
          </Link>
        </>
      }
    >
      <PhoneAuth fieldSx={fieldSx} buttonSx={submitSx} submitLabel="Verify & continue" onAuthed={() => { router.push(safeRedirect(redirect)); router.refresh(); }} />
      <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8", textAlign: "center", mt: 2 }}>
        By registering you agree to our Terms of Service and Privacy Policy.
      </Typography>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
