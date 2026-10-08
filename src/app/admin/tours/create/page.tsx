"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import { INDIAN_STATES } from "@/lib/constants";

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  meals: string;
  stay: string;
}

export default function AdminCreateTourPage() {
  const router = useRouter();
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState("Himachal Pradesh");
  const [destinationId, setDestinationId] = useState("");
  const [startingPoint, setStartingPoint] = useState("");
  const [durationDays, setDurationDays] = useState(3);
  const [durationNights, setDurationNights] = useState(2);
  const [priceInr, setPriceInr] = useState(9999);
  const [maxGroupSize, setMaxGroupSize] = useState(15);
  const [coverImage, setCoverImage] = useState("");

  // Highlights
  const [highlights, setHighlights] = useState<string[]>([
    "Scenic alpine viewpoints",
    "Local guided heritage walk",
  ]);
  const [newHighlight, setNewHighlight] = useState("");

  // Tour Classifications (Admin Created)
  const [travelStylesList, setTravelStylesList] = useState<any[]>([]);
  const [selectedTravelStyles, setSelectedTravelStyles] = useState<string[]>([]);
  const [physicalRatingsList, setPhysicalRatingsList] = useState<any[]>([]);
  const [selectedPhysicalRating, setSelectedPhysicalRating] = useState<string>("2 - Light / Moderate");
  const [journeyTypesList, setJourneyTypesList] = useState<any[]>([]);
  const [selectedJourneyType, setSelectedJourneyType] = useState<string>("Guided Group Tour");
  const [discountsList, setDiscountsList] = useState<any[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);

  // Inclusions & Exclusions
  const [inclusions, setInclusions] = useState<string[]>([
    "Accommodation in verified stays",
    "Daily breakfast and dinner",
    "Sightseeing transfers in private cab",
  ]);
  const [newInclusion, setNewInclusion] = useState("");

  const [exclusions, setExclusions] = useState<string[]>([
    "Personal adventure sport equipment",
    "Lunch and extra personal expenses",
  ]);
  const [newExclusion, setNewExclusion] = useState("");

  // Itinerary Days
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([
    {
      day: 1,
      title: "Arrival and Welcome",
      description: "Arrive at destination, check-in to resort, evening orientation walk.",
      meals: "Dinner",
      stay: "Standard Resort",
    },
    {
      day: 2,
      title: "Exploration & Sightseeing",
      description: "Full day sightseeing of key local monuments and natural wonders.",
      meals: "Breakfast, Dinner",
      stay: "Standard Resort",
    },
    {
      day: 3,
      title: "Departure",
      description: "Morning checkout and farewell transfers.",
      meals: "Breakfast",
      stay: "Tour concludes",
    },
  ]);

  useEffect(() => {
    fetchDestinations();
    fetchClassifications();
  }, []);

  const fetchClassifications = async () => {
    try {
      const [resStyles, resRatings, resTypes, resDiscounts] = await Promise.all([
        fetch("/api/travel-styles").then((r) => r.json()),
        fetch("/api/physical-ratings").then((r) => r.json()),
        fetch("/api/journey-types").then((r) => r.json()),
        fetch("/api/discounts").then((r) => r.json()),
      ]);
      if (resStyles.success && resStyles.data) {
        setTravelStylesList(resStyles.data);
        if (resStyles.data[0]) setSelectedTravelStyles([resStyles.data[0].name]);
      }
      if (resRatings.success && resRatings.data) {
        setPhysicalRatingsList(resRatings.data);
        if (resRatings.data[0]) setSelectedPhysicalRating(resRatings.data[0].name);
      }
      if (resTypes.success && resTypes.data) {
        setJourneyTypesList(resTypes.data);
        if (resTypes.data[0]) setSelectedJourneyType(resTypes.data[0].name);
      }
      if (resDiscounts.success && resDiscounts.data) {
        setDiscountsList(resDiscounts.data);
      }
    } catch (e) {
      console.error("Error loading classifications:", e);
    }
  };

  const toggleTravelStyle = (styleName: string) => {
    if (selectedTravelStyles.includes(styleName)) {
      setSelectedTravelStyles(selectedTravelStyles.filter((s) => s !== styleName));
    } else {
      setSelectedTravelStyles([...selectedTravelStyles, styleName]);
    }
  };

  const fetchDestinations = async () => {
    try {
      const res = await fetch("/api/destinations?all=true");
      const data = await res.json();
      if (data.success) {
        setDestinations(data.data || []);
        if (data.data && data.data.length > 0) {
          setDestinationId(data.data[0]._id);
          setState(data.data[0].state);
          setStartingPoint(data.data[0].name);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDestinationChange = (destId: string) => {
    setDestinationId(destId);
    const dest = destinations.find((d) => d._id === destId);
    if (dest) {
      setState(dest.state);
      setStartingPoint(dest.name);
    }
  };

  const addHighlight = () => {
    if (newHighlight.trim()) {
      setHighlights([...highlights, newHighlight.trim()]);
      setNewHighlight("");
    }
  };

  const removeHighlight = (idx: number) => {
    setHighlights(highlights.filter((_, i) => i !== idx));
  };

  const addInclusion = () => {
    if (newInclusion.trim()) {
      setInclusions([...inclusions, newInclusion.trim()]);
      setNewInclusion("");
    }
  };

  const removeInclusion = (idx: number) => {
    setInclusions(inclusions.filter((_, i) => i !== idx));
  };

  const addExclusion = () => {
    if (newExclusion.trim()) {
      setExclusions([...exclusions, newExclusion.trim()]);
      setNewExclusion("");
    }
  };

  const removeExclusion = (idx: number) => {
    setExclusions(exclusions.filter((_, i) => i !== idx));
  };

  const addItineraryDay = () => {
    const nextDay = itinerary.length + 1;
    setItinerary([
      ...itinerary,
      {
        day: nextDay,
        title: `Day ${nextDay} Itinerary`,
        description: "Activities and visits scheduled for this day.",
        meals: "Breakfast",
        stay: "Standard Hotel",
      },
    ]);
  };

  const updateItineraryDay = (index: number, field: keyof ItineraryDay, val: any) => {
    const updated = [...itinerary];
    updated[index] = { ...updated[index], [field]: val };
    setItinerary(updated);
  };

  const removeItineraryDay = (index: number) => {
    const updated = itinerary
      .filter((_, i) => i !== index)
      .map((item, idx) => ({ ...item, day: idx + 1 }));
    setItinerary(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("epic_token");

    try {
      const res = await fetch("/api/tours", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title,
          shortDescription,
          description,
          state,
          destinationId,
          startingPoint,
          endingPoint: startingPoint, // Both starting and ending match as requested
          durationDays,
          durationNights,
          priceInr,
          maxGroupSize,
          coverImage,
          highlights,
          itinerary,
          inclusions,
          exclusions,
          travelStyles: selectedTravelStyles,
          physicalRating: selectedPhysicalRating,
          journeyType: selectedJourneyType,
          discountPercentage,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/admin/tours");
      } else {
        setError(data.error || "Failed to create tour");
      }
    } catch (e: any) {
      setError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
        <Button
          component={Link}
          href="/admin/tours"
          startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 16 }} />}
          sx={{ color: "#64748b", borderRadius: "4px" }}
          size="small"
        >
          Tours
        </Button>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>
            Create Tour Itinerary
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
            Add departure details, itinerary timeline, and pricing in INR (₹)
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: Overview */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: "#0f172a" }}>
            1. Tour Title & Description
          </Typography>

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Tour Title"
                required
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Manali Alpine & Solang Valley Adventure"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Short Description"
                fullWidth
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief summary for catalog cards"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Detailed Description"
                multiline
                rows={3}
                required
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Comprehensive description of the journey, attractions, and landscapes..."
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Cover Image URL"
                fullWidth
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 2: Attributes & Classifications */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: "#0f172a" }}>
            2. Travel Styles, Ratings & Discounts
          </Typography>

          <Grid container spacing={2}>
            {/* Travel Styles Multi-select Chips */}
            <Grid size={{ xs: 12 }}>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "#334155", mb: 1 }}>
                Travel Styles (Click to select/unselect)
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {travelStylesList.length === 0 ? (
                  <Typography sx={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    Loading travel styles...
                  </Typography>
                ) : (
                  travelStylesList.map((style) => {
                    const selected = selectedTravelStyles.includes(style.name);
                    return (
                      <Chip
                        key={style._id}
                        label={style.name}
                        onClick={() => toggleTravelStyle(style.name)}
                        sx={{
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          bgcolor: selected ? "#0f172a" : "#f1f5f9",
                          color: selected ? "#ffffff" : "#475569",
                          border: selected ? "1px solid #0f172a" : "1px solid #e2e8f0",
                          "&:hover": {
                            bgcolor: selected ? "#1e293b" : "#e2e8f0",
                          },
                        }}
                      />
                    );
                  })
                )}
              </Box>
            </Grid>

            {/* Physical Rating */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Physical Rating</InputLabel>
                <Select
                  value={selectedPhysicalRating}
                  label="Physical Rating"
                  onChange={(e) => setSelectedPhysicalRating(e.target.value)}
                  sx={{ borderRadius: "4px" }}
                >
                  {physicalRatingsList.map((r) => (
                    <MenuItem key={r._id} value={r.name}>
                      Level {r.level}: {r.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Journey Type */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Journey Type</InputLabel>
                <Select
                  value={selectedJourneyType}
                  label="Journey Type"
                  onChange={(e) => setSelectedJourneyType(e.target.value)}
                  sx={{ borderRadius: "4px" }}
                >
                  {journeyTypesList.map((j) => (
                    <MenuItem key={j._id} value={j.name}>
                      {j.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Discount Option */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Applicable Discount</InputLabel>
                <Select
                  value={discountPercentage}
                  label="Applicable Discount"
                  onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                  sx={{ borderRadius: "4px" }}
                >
                  <MenuItem value={0}>No Discount (0%)</MenuItem>
                  {discountsList.map((d) => (
                    <MenuItem key={d._id} value={d.value}>
                      {d.name} ({d.value}% OFF)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Section 3: Destination & Pricing */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: "#0f172a" }}>
            3. Departure City & Commercials
          </Typography>

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Departure City</InputLabel>
                <Select
                  value={destinationId}
                  label="Departure City"
                  onChange={(e) => handleDestinationChange(e.target.value)}
                >
                  {destinations.map((d) => (
                    <MenuItem key={d._id} value={d._id}>
                      {d.name} ({d.state})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Start & End City"
                disabled
                fullWidth
                value={`${startingPoint} (Same Start & End)`}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Days"
                type="number"
                required
                fullWidth
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Nights"
                type="number"
                required
                fullWidth
                value={durationNights}
                onChange={(e) => setDurationNights(Number(e.target.value))}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Price (INR ₹)"
                type="number"
                required
                fullWidth
                value={priceInr}
                onChange={(e) => setPriceInr(Number(e.target.value))}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Max Group Size"
                type="number"
                fullWidth
                value={maxGroupSize}
                onChange={(e) => setMaxGroupSize(Number(e.target.value))}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 4: Itinerary */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a" }}>
              4. Day-by-Day Timeline
            </Typography>
            <Button
              startIcon={<AddRoundedIcon sx={{ fontSize: 15 }} />}
              onClick={addItineraryDay}
              size="small"
              variant="outlined"
              sx={{ borderRadius: "4px", height: 28, fontSize: "0.75rem", borderColor: "#e2e8f0" }}
            >
              Add Day
            </Button>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {itinerary.map((day, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 2,
                  borderRadius: "4px",
                  bgcolor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.25 }}>
                  <Chip
                    label={`Day ${day.day}`}
                    size="small"
                    sx={{ bgcolor: "#0f172a", color: "#ffffff", fontWeight: 700, borderRadius: "4px", height: 20, fontSize: "0.68rem" }}
                  />
                  {itinerary.length > 1 && (
                    <IconButton size="small" onClick={() => removeItineraryDay(idx)} sx={{ color: "#ef4444", p: 0.5 }}>
                      <DeleteRoundedIcon fontSize="small" sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </Box>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Day Title"
                      fullWidth
                      value={day.title}
                      onChange={(e) => updateItineraryDay(idx, "title", e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Day Description"
                      multiline
                      rows={2}
                      fullWidth
                      value={day.description}
                      onChange={(e) => updateItineraryDay(idx, "description", e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Meals"
                      fullWidth
                      value={day.meals}
                      onChange={(e) => updateItineraryDay(idx, "meals", e.target.value)}
                      placeholder="e.g. Breakfast, Dinner"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Stay"
                      fullWidth
                      value={day.stay}
                      onChange={(e) => updateItineraryDay(idx, "stay", e.target.value)}
                      placeholder="e.g. Resort / Hotel"
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Section 5: Highlights, Inclusions & Exclusions */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: "#0f172a" }}>
            5. Highlights, Inclusions & Exclusions
          </Typography>

          {/* Highlights */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "#475569", display: "block", mb: 0.5 }}>
              Highlights:
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                placeholder="Add highlight (e.g. Solang Valley paragliding)"
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHighlight())}
              />
              <Button variant="outlined" onClick={addHighlight} sx={{ borderRadius: "4px", borderColor: "#e2e8f0" }}>
                Add
              </Button>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {highlights.map((h, i) => (
                <Chip key={i} label={h} onDelete={() => removeHighlight(i)} size="small" sx={{ borderRadius: "4px" }} />
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Inclusions */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "#059669", display: "block", mb: 0.5 }}>
              Inclusions:
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                placeholder="Add inclusion (e.g. Breakfast and dinner included)"
                value={newInclusion}
                onChange={(e) => setNewInclusion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInclusion())}
              />
              <Button variant="outlined" onClick={addInclusion} sx={{ borderRadius: "4px", borderColor: "#e2e8f0" }}>
                Add
              </Button>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {inclusions.map((inc, i) => (
                <Chip key={i} label={inc} onDelete={() => removeInclusion(i)} size="small" sx={{ borderRadius: "4px" }} />
              ))}
            </Box>
          </Box>

          {/* Exclusions */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "#dc2626", display: "block", mb: 0.5 }}>
              Exclusions:
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                placeholder="Add exclusion (e.g. Personal gear rental)"
                value={newExclusion}
                onChange={(e) => setNewExclusion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addExclusion())}
              />
              <Button variant="outlined" onClick={addExclusion} sx={{ borderRadius: "4px", borderColor: "#e2e8f0" }}>
                Add
              </Button>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {exclusions.map((exc, i) => (
                <Chip key={i} label={exc} onDelete={() => removeExclusion(i)} size="small" sx={{ borderRadius: "4px" }} />
              ))}
            </Box>
          </Box>
        </Paper>

        {/* Action bar */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mb: 4 }}>
          <Button component={Link} href="/admin/tours" sx={{ color: "#64748b", borderRadius: "4px" }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <SaveRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{
              bgcolor: "#0f172a",
              color: "#ffffff",
              borderRadius: "4px",
              px: 3,
              height: 32,
              "&:hover": { bgcolor: "#1e293b" },
            }}
          >
            {loading ? "Publishing..." : "Publish Tour"}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
