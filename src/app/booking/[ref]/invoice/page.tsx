"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Box, Button, Container } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InvoiceView from "@/components/invoice/InvoiceView";

export default function BookingInvoicePage() {
  const { ref } = useParams<{ ref: string }>();
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#FDF9EC", "@media print": { bgcolor: "#fff" } }}>
      <Box sx={{ "@media print": { display: "none" } }}><Navbar /></Box>
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 }, flexGrow: 1 }}>
        <Button component={Link} href={`/booking/${ref}`} startIcon={<ArrowBackRoundedIcon />} sx={{ mb: 2, color: "#475569", "@media print": { display: "none" } }}>Back to booking</Button>
        <InvoiceView bookingRef={ref} />
      </Container>
      <Box sx={{ "@media print": { display: "none" } }}><Footer /></Box>
    </Box>
  );
}
