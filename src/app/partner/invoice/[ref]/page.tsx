"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Box, Button } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import InvoiceView from "@/components/invoice/InvoiceView";

export default function PartnerInvoicePage() {
  const { ref } = useParams<{ ref: string }>();
  return (
    <Box sx={{ maxWidth: 860 }}>
      <Button component={Link} href="/partner/bookings" size="small" startIcon={<ArrowBackRoundedIcon />} sx={{ mb: 1.5, color: "#475569", "@media print": { display: "none" } }}>Back to bookings</Button>
      <InvoiceView bookingRef={ref} tokenKey="epic_partner_token" />
    </Box>
  );
}
