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
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

interface TourCardProps {
  fromCityId?: string;
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
    journeyType?: string;
    discountPercentage?: number;
  };
}

export default function TourCard({ tour, fromCityId }: TourCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: "6px",
        border: "1px solid #e2e8f0",
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
      <Box sx={{ position: "relative", bgcolor: "#f1f5f9", overflow: "hidden" }}>
        <CardMedia
          component="img"
          height="215"
          className="tour-img"
          image={
            tour.coverImage ||
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
              borderRadius: "6px",
              height: 24,
            }}
          />
        )}

        {/* Duration Chip */}
        <Chip
          icon={<AccessTimeIcon sx={{ fontSize: "13px !important", color: "#ca8a04 !important" }} />}
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
            borderRadius: "6px",
            height: 24,
          }}
        />

        {/* Optional Discount Badge */}
        {tour.discountPercentage ? (
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
              borderRadius: "6px",
              height: 22,
            }}
          />
        ) : null}
      </Box>

      {/* Content */}
      <CardContent sx={{ p: 2.25, flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {/* Departure Location & Category */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1, gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
            <LocationOnIcon sx={{ fontSize: 14, color: "#ca8a04", flexShrink: 0 }} />
            <Typography
              noWrap
              variant="caption"
              sx={{ color: "#64748b", fontWeight: 600, fontSize: "0.75rem" }}
            >
              {tour.targetCity || tour.startingPoint}, {tour.state}
            </Typography>
          </Box>

          {tour.journeyType && (
            <Chip
              label={tour.journeyType}
              size="small"
              sx={{
                bgcolor: "#f1f5f9",
                color: "#475569",
                fontSize: "0.68rem",
                fontWeight: 600,
                borderRadius: "6px",
                height: 20,
              }}
            />
          )}
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
        {tour.shortDescription && (
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
                  bgcolor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: "#475569",
                  fontSize: "0.65rem",
                  borderRadius: "6px",
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
            borderTop: "1px solid #f1f5f9",
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
                ₹{Math.round(tour.priceInr / (1 - tour.discountPercentage / 100)).toLocaleString("en-IN")}
              </Typography>
            ) : null}
          </Box>

          <Button
            component={Link}
            href={`/tours/${tour.slug || tour._id}${fromCityId ? `?from=${fromCityId}` : ""}`}
            variant="contained"
            size="small"
            endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{
              backgroundColor: "#facc15",
              color: "#0f172a",
              borderRadius: "6px",
              fontSize: "0.85rem",
              px: 2,
              py: 0.8,
              fontWeight: 700,
              "&:hover": { backgroundColor: "#eab308" },
            }}
          >
            Explore
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
