"use client";

import React from "react";
import Link from "next/link";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
} from "@mui/material";
import { motion } from "framer-motion";
import { thumbUrl } from "@/lib/images";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

interface TourCardProps {
  fromCityId?: string;
  hideDescription?: boolean;
  tour: {
    _id: string;
    title: string;
    slug: string;
    shortDescription?: string;
    state: string;
    startingPoint: string;
    targetCity?: string;
    endingPoint: string;
    durationDays: number;
    durationNights: number;
    priceInr: number;
    coverImage?: string;
    distanceKm?: number | null;
    travelStyles?: string[];
    physicalRating?: string;
    discountPercentage?: number;
    listPriceInr?: number;
    specialOffer?: { name: string; percentage: number; endsAt: string } | null;
  };
}

export default function TourCard({ tour, fromCityId, hideDescription }: TourCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: "4px",
        border: "1px solid #E2E2E2",
        bgcolor: "#ffffff",
        overflow: "hidden",
        transition: "box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 18px 36px -18px rgba(15, 23, 42, 0.3)",
        },
        "&:hover .tour-img": { transform: "scale(1.06)" },
      }}
    >
      {/* Cover Image & Badges */}
      <Box sx={{ position: "relative", bgcolor: "#F2F4F7", overflow: "hidden" }}>
        <CardMedia
          component="img"
          height="215"
          className="tour-img"
          image={
            thumbUrl(tour.coverImage) ||
            "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=60"
          }
          alt={tour.title}
          sx={{ objectFit: "cover", transition: "transform 0.5s ease" }}
        />

        {/* Distance Badge */}
        {tour.distanceKm !== null && tour.distanceKm !== undefined && (
          <Chip
            icon={<LocationOnIcon sx={{ fontSize: "13px !important", color: "#ffffff !important" }} />}
            label={
              tour.distanceKm < 50
                ? `Starts ${Math.round(tour.distanceKm)} km near you`
                : `${Math.round(tour.distanceKm)} km away`
            }
            size="small"
            sx={{
              position: "absolute",
              top: 10,
              left: 10,
              backgroundColor: tour.distanceKm <= 50 ? "#059669" : "rgba(15, 23, 42, 0.88)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.7rem",
              borderRadius: "4px",
              height: 24,
            }}
          />
        )}

        {/* Duration Chip */}
        <Chip
          icon={<AccessTimeIcon sx={{ fontSize: "13px !important", color: "#E68A00 !important" }} />}
          label={`${tour.durationDays}D / ${tour.durationNights}N`}
          size="small"
          sx={{
            position: "absolute",
            bottom: 10,
            left: 10,
            backgroundColor: "#ffffff",
            color: "#0f172a",
            fontWeight: 700,
            fontSize: "0.72rem",
            borderRadius: "4px",
            height: 24,
          }}
        />

        {/* Discount badge: a live special offer gets its own, louder ribbon */}
        {tour.specialOffer ? (
          <Chip
            icon={<BoltRoundedIcon sx={{ fontSize: "15px !important", color: "#0f172a !important" }} />}
            label={`${tour.specialOffer.percentage}% OFF`}
            size="small"
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "linear-gradient(135deg, #FFB84D 0%, #FF9900 100%)",
              color: "#0f172a",
              fontWeight: 800,
              fontSize: "0.72rem",
              letterSpacing: "0.02em",
              borderRadius: "4px",
              height: 24,
              boxShadow: "0 4px 12px rgba(255,153,0,0.45)",
            }}
          />
        ) : tour.discountPercentage ? (
          <Chip
            label={`${tour.discountPercentage}% OFF`}
            size="small"
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              backgroundColor: "#ef4444",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.68rem",
              borderRadius: "4px",
              height: 22,
            }}
          />
        ) : null}
      </Box>

      {tour.specialOffer && (
        <Box sx={{ px: 2, py: 0.75, bgcolor: "#FFF3DB", borderBottom: "1px solid #FFD699", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography noWrap sx={{ fontSize: "0.74rem", fontWeight: 800, color: "#0f172a" }}>
            {tour.specialOffer.name || "Limited-time offer"}
          </Typography>
          <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#92400e", whiteSpace: "nowrap" }}>
            Ends {new Date(tour.specialOffer.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}
          </Typography>
        </Box>
      )}

      {/* Content */}
      <CardContent sx={{ p: 2.25, flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {/* Departure Location & Category */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1, gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
            <LocationOnIcon sx={{ fontSize: 14, color: "#E68A00", flexShrink: 0 }} />
            <Typography
              noWrap
              variant="caption"
              sx={{ color: "#64748b", fontWeight: 600, fontSize: "0.75rem" }}
            >
              {tour.targetCity || tour.startingPoint}, {tour.state}
            </Typography>
          </Box>

        </Box>

        {/* Tour Title */}
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 800,
            fontSize: "1.05rem",
            lineHeight: 1.35,
            color: "#0f172a",
            mb: 0.75,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {tour.title}
        </Typography>


        {/* Short Description */}
        {!hideDescription && tour.shortDescription && (
          <Typography
            variant="body2"
            sx={{
              color: "#64748b",
              fontSize: "0.84rem",
              lineHeight: 1.5,
              mb: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {tour.shortDescription}
          </Typography>
        )}

        {/* Travel Style tags */}
        {tour.travelStyles && tour.travelStyles.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
            {tour.travelStyles.slice(0, 2).map((style, idx) => (
              <Chip
                key={idx}
                label={style}
                size="small"
                sx={{
                  bgcolor: "#FDF9EC",
                  border: "1px solid #E2E2E2",
                  color: "#475569",
                  fontSize: "0.65rem",
                  borderRadius: "4px",
                  height: 19,
                }}
              />
            ))}
          </Box>
        )}

        {/* Commercials & Action */}
        <Box
          sx={{
            mt: "auto",
            pt: 1.5,
            borderTop: "1px solid #F2F4F7",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: "#94a3b8",
                display: "block",
                fontSize: "0.68rem",
                textTransform: "uppercase",
                fontWeight: 600,
                lineHeight: 1,
                mb: 0.25,
              }}
            >
              Starting from
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: "#0f172a",
                fontSize: "1.1rem",
                lineHeight: 1.1,
              }}
            >
              ₹{tour.priceInr.toLocaleString("en-IN")}
              <Typography component="span" sx={{ color: "#94a3b8", fontSize: "0.72rem", fontWeight: 500, ml: 0.5 }}>
                / person
              </Typography>
            </Typography>
            {tour.discountPercentage ? (
              <Typography component="span" sx={{ color: "#94a3b8", fontSize: "0.72rem", textDecoration: "line-through" }}>
                ₹{(tour.listPriceInr && tour.listPriceInr > tour.priceInr ? tour.listPriceInr : Math.round(tour.priceInr / (1 - tour.discountPercentage / 100))).toLocaleString("en-IN")}
              </Typography>
            ) : null}
          </Box>

          <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}>
          <Button
            component={Link}
            href={`/tours/${tour.slug || tour._id}${fromCityId ? `?from=${fromCityId}` : ""}`}
            variant="contained"
            size="small"
            endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{
              backgroundColor: "#FF9900",
              color: "#0f172a",
              borderRadius: "4px",
              fontSize: "0.85rem",
              px: 2,
              py: 0.8,
              fontWeight: 700,
              "&:hover": { backgroundColor: "#E68A00" },
            }}
          >
            Explore
          </Button>
          </motion.div>
        </Box>
      </CardContent>
    </Card>
  );
}
