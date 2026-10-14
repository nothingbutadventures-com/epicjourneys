"use client";

import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, Dialog, Typography } from "@mui/material";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import { inr } from "@/lib/pricing";

export interface PaymentDescriptor {
  mode: "razorpay" | "simulator";
  bookingRef: string;
  index: number;
  label: string;
  amountInr: number;
  tourTitle: string;
  prefill: { name: string; email: string; contact: string };
  keyId?: string;
  orderId?: string;
  amountPaise?: number;
  currency?: string;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

async function confirmOnServer(body: Record<string, unknown>) {
  const res = await fetch("/api/checkout/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Could not confirm the payment");
  return data;
}

/**
 * Runs one payment. With a Razorpay descriptor it opens the real Razorpay Checkout;
 * with a simulator descriptor (no keys configured) it shows a test-payment popup.
 */
export default function PaymentGateway({
  payment,
  onSuccess,
  onClose,
}: {
  payment: PaymentDescriptor | null;
  onSuccess: (bookingRef: string) => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const opened = useRef<string | null>(null);

  // Open real Razorpay Checkout automatically when the descriptor arrives.
  useEffect(() => {
    if (!payment || payment.mode !== "razorpay") return;
    const key = `${payment.bookingRef}-${payment.index}-${payment.orderId}`;
    if (opened.current === key) return;
    opened.current = key;
    setError(null);
    (async () => {
      const ok = await loadRazorpayScript();
      if (!ok || !window.Razorpay) {
        setError("Couldn't load the Razorpay checkout. Check your connection and try again.");
        return;
      }
      const rzp = new window.Razorpay({
        key: payment.keyId,
        amount: payment.amountPaise,
        currency: payment.currency || "INR",
        order_id: payment.orderId,
        name: "EpicJourneys",
        description: `${payment.tourTitle} — ${payment.label}`,
        prefill: payment.prefill,
        theme: { color: "#facc15" },
        handler: async (r: any) => {
          setBusy(true);
          try {
            await confirmOnServer({ ref: payment.bookingRef, index: payment.index, razorpay: r });
            setDone(true);
            setTimeout(() => onSuccess(payment.bookingRef), 900);
          } catch (e: any) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => onClose() },
      });
      rzp.on("payment.failed", (resp: any) => setError(resp?.error?.description || "Payment failed. Please try again."));
      rzp.open();
    })();
  }, [payment, onSuccess, onClose]);

  useEffect(() => {
    if (!payment) {
      opened.current = null;
      setError(null);
      setDone(false);
      setBusy(false);
    }
  }, [payment]);

  const simulate = async (ok: boolean) => {
    if (!payment) return;
    if (!ok) {
      setError("Simulated payment failed. No money was taken — you can try again.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await confirmOnServer({ ref: payment.bookingRef, index: payment.index, simulate: true });
      setDone(true);
      setTimeout(() => onSuccess(payment.bookingRef), 1100);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  // Real-gateway mode: only show errors / progress; Razorpay renders its own modal.
  if (payment?.mode === "razorpay") {
    return (
      <Dialog open={Boolean(error) || busy || done} onClose={onClose} maxWidth="xs" fullWidth>
        <Box sx={{ p: 3, textAlign: "center" }}>
          {done ? (
            <>
              <CheckCircleRoundedIcon sx={{ fontSize: 56, color: "#10b981" }} />
              <Typography sx={{ fontWeight: 800, mt: 1 }}>Payment received!</Typography>
            </>
          ) : busy ? (
            <>
              <CircularProgress sx={{ color: "#0f172a" }} />
              <Typography sx={{ mt: 2, fontWeight: 700 }}>Confirming your payment…</Typography>
            </>
          ) : (
            <>
              <Alert severity="error" sx={{ mb: 2, textAlign: "left" }}>{error}</Alert>
              <Button onClick={onClose} variant="outlined">Close</Button>
            </>
          )}
        </Box>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={Boolean(payment)}
      onClose={busy || done ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: "6px", overflow: "hidden" } } }}
    >
      {payment && (
        <Box>
          <Box sx={{ p: 2.5, bgcolor: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.25, py: 0.4, borderRadius: "6px", bgcolor: "#facc15", color: "#0f172a", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.08em" }}>
                <ScienceRoundedIcon sx={{ fontSize: 14 }} /> TEST MODE
              </Box>
              {!busy && !done && (
                <CloseRoundedIcon onClick={onClose} sx={{ cursor: "pointer", color: "#6b7280" }} />
              )}
            </Box>
            <Typography sx={{ mt: 1.5, fontSize: "0.82rem", color: "#64748b" }}>{payment.label} · {payment.tourTitle}</Typography>
            <Typography sx={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a" }}>{inr(payment.amountInr)}</Typography>
          </Box>

          <Box sx={{ p: 3 }}>
            {done ? (
              <Box sx={{ textAlign: "center", py: 2 }}>
                <CheckCircleRoundedIcon sx={{ fontSize: 64, color: "#16a34a" }} />
                <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", mt: 1 }}>Payment successful</Typography>
                <Typography sx={{ color: "#64748b", fontSize: "0.88rem" }}>Taking you to your booking…</Typography>
              </Box>
            ) : (
              <>
                <Alert severity="info" icon={<LockRoundedIcon fontSize="small" />} sx={{ mb: 2, fontSize: "0.82rem" }}>
                  Razorpay keys aren&apos;t configured, so this is a payment <strong>simulator</strong>. Nothing is charged — a successful simulation books the trip.
                </Alert>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, mb: 2, borderRadius: "6px", border: "1px dashed #cbd5e1", bgcolor: "#f8fafc" }}>
                  <CreditCardRoundedIcon sx={{ color: "#64748b" }} />
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>•••• •••• •••• 4242</Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }}>Test card · {payment.prefill.name}</Typography>
                  </Box>
                </Box>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Button
                  fullWidth
                  variant="contained"
                  disabled={busy}
                  onClick={() => simulate(true)}
                  sx={{ py: 1.3, bgcolor: "#facc15", color: "#0f172a", fontWeight: 800, "&:hover": { bgcolor: "#eab308" } }}
                >
                  {busy ? <CircularProgress size={22} color="inherit" /> : `Simulate successful payment · ${inr(payment.amountInr)}`}
                </Button>
                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                  <Button fullWidth disabled={busy} onClick={() => simulate(false)} sx={{ color: "#dc2626" }}>Simulate failure</Button>
                  <Button fullWidth disabled={busy} onClick={onClose} sx={{ color: "#64748b" }}>Cancel</Button>
                </Box>
              </>
            )}
          </Box>
        </Box>
      )}
    </Dialog>
  );
}
