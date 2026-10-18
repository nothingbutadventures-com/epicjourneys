"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import HandshakeIcon from "@mui/icons-material/Handshake";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function PartnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, requiredRole: "partner" }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("epic_partner_token", data.token);
        localStorage.setItem("epic_partner_user", JSON.stringify(data.user));
        router.push("/partner");
      } else {
        setError(data.error || "Invalid partner credentials");
      }
    } catch (e: any) {
      setError(e.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 420,
          width: "100%",
          p: 4,
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
        }}
      >
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: "#0f172a",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <HandshakeIcon sx={{ fontSize: 26 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>
            Partner Portal
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            EpicJourneys Destination Partners
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Partner Email"
              type="email"
              required
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="partner@epicjourneys.in"
            />

            <TextField
              label="Password"
              type="password"
              required
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                py: 1.2,
                backgroundColor: "#0f172a",
                "&:hover": { backgroundColor: "#1e293b" },
                fontWeight: 600,
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Sign In to Partner Portal"}
            </Button>
          </Box>
        </form>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Button
            component={Link}
            href="/"
            startIcon={<ArrowBackIcon />}
            variant="text"
            size="small"
            sx={{ color: "#64748b" }}
          >
            Back to Website
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
