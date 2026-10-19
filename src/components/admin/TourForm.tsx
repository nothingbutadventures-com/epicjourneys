"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DestinationPicker from "@/components/admin/DestinationPicker";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
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

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  meals: string;
  stay: string;
  destinations?: { destinationId: string; name: string }[];
}

export default function TourForm({ tourId }: { tourId?: string }) {
  const isEdit = Boolean(tourId);
  const router = useRouter();
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [durationDays, setDurationDays] = useState<number | "">("");
  const [durationNights, setDurationNights] = useState<number | "">("");
  const [maxGroupSize, setMaxGroupSize] = useState<number | "">("");
  const [pickerDay, setPickerDay] = useState<number | null>(null); // which itinerary day is choosing a destination
  const [basePrice, setBasePrice] = useState<number | "">("");
  // Basic tour ("Joining / Leaving"): where it starts/ends and its own dates
  const [baseCityId, setBaseCityId] = useState("");
  const [baseAddressId, setBaseAddressId] = useState("");
  const [baseDates, setBaseDates] = useState<{ _id?: string; startDate: string; seats: number | ""; price: number | ""; discountPercentage: number; booked?: number }[]>([]);
  const [singleRoomPrice, setSingleRoomPrice] = useState<number | "">("");
  const [depositType, setDepositType] = useState<"amount" | "percentage">("percentage");
  const [depositValue, setDepositValue] = useState<number | "">(30);
  const [coverImage, setCoverImage] = useState("");

  // Highlights
  const [highlights, setHighlights] = useState<string[]>([]);
  const [newHighlight, setNewHighlight] = useState("");

  // Tour Classifications (Admin Created)
  const [travelStylesList, setTravelStylesList] = useState<any[]>([]);
  const [discountsList, setDiscountsList] = useState<any[]>([]);
  const [selectedTravelStyles, setSelectedTravelStyles] = useState<string[]>([]);
  const [physicalRatingsList, setPhysicalRatingsList] = useState<any[]>([]);
  const [selectedPhysicalRating, setSelectedPhysicalRating] = useState<string>("");

  const [inclusions, setInclusions] = useState<string[]>([]);
  const [newInclusion, setNewInclusion] = useState("");

  const [exclusions, setExclusions] = useState<string[]>([]);
  const [newExclusion, setNewExclusion] = useState("");

  // Itinerary Days
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);

  useEffect(() => {
    fetchDestinations();
    fetchClassifications();
  }, []);

  useEffect(() => {
    if (!tourId) return;
    (async () => {
      try {
        const res = await fetch(`/api/tours/${tourId}?raw=true`);
        const data = await res.json();
        if (!data.success || !data.data) throw new Error(data.error || "Tour not found");
        const t = data.data;
        setTitle(t.title || "");
        setShortDescription(t.shortDescription || "");
        setDescription(t.description || "");
        setState(t.state || "");
        setDestinationId(t.destinationId?._id || t.destinationId || "");
        setDurationDays(t.durationDays ?? "");
        setDurationNights(t.durationNights ?? "");
        setMaxGroupSize(t.maxGroupSize ?? "");
        setSingleRoomPrice(t.singleRoomPriceInr ?? "");
        setBasePrice(t.basePriceInr || t.priceInr || "");
        setBaseCityId(t.baseStartCityId || t.destinationId?._id || t.destinationId || "");
        setBaseAddressId(t.baseAddressId || "");
        setBaseDates(
          (t.departures || [])
            .filter((d: any) => d.isBase)
            .map((d: any) => ({
              _id: d._id,
              startDate: String(d.startDate).split("T")[0],
              seats: d.seats,
              price: d.price,
              discountPercentage: d.discountPercentage || 0,
              booked: d.booked || 0,
            }))
        );
        setDepositType(t.depositType === "amount" ? "amount" : "percentage");
        setDepositValue(t.depositValue ?? 30);
        setCoverImage(t.coverImage || "");
        setHighlights(t.highlights || []);
        setInclusions(t.inclusions || []);
        setExclusions(t.exclusions || []);
        setItinerary(t.itinerary || []);
        setSelectedTravelStyles(t.travelStyles || []);
        setSelectedPhysicalRating(t.physicalRating || "");
      } catch (e: any) {
        setError(e.message || "Failed to load tour");
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [tourId]);

  const fetchClassifications = async () => {
    try {
      const [resStyles, resRatings, resDiscounts] = await Promise.all([
        fetch("/api/travel-styles").then((r) => r.json()),
        fetch("/api/physical-ratings").then((r) => r.json()),
        fetch("/api/discounts").then((r) => r.json()),
      ]);
      if (resStyles.success && resStyles.data) {
        setTravelStylesList(resStyles.data);
      }
      if (resDiscounts.success && resDiscounts.data) {
        setDiscountsList(resDiscounts.data);
      }
      if (resRatings.success && resRatings.data) {
        setPhysicalRatingsList(resRatings.data);
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
      const token = typeof window !== "undefined" ? localStorage.getItem("epic_token") : null;
      const res = await fetch("/api/destinations?all=true", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await res.json();
      if (data.success) {
        setDestinations(data.data || []);
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

  const toggleDayCity = (dayIdx: number, d: { _id: string; name: string }) =>
    setItinerary((prev) =>
      prev.map((x, i) => {
        if (i !== dayIdx) return x;
        const list = x.destinations || [];
        const has = list.some((c) => c.destinationId === d._id);
        return { ...x, destinations: has ? list.filter((c) => c.destinationId !== d._id) : [...list, { destinationId: d._id, name: d.name }] };
      })
    );

  const moveDayCity = (dayIdx: number, from: number, to: number) =>
    setItinerary((prev) =>
      prev.map((x, i) => {
        if (i !== dayIdx) return x;
        const list = [...(x.destinations || [])];
        const [m] = list.splice(from, 1);
        list.splice(to, 0, m);
        return { ...x, destinations: list };
      })
    );

  const removeItineraryDay = (index: number) => {
    const updated = itinerary
      .filter((_, i) => i !== index)
      .map((item, idx) => ({ ...item, day: idx + 1 }));
    setItinerary(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!destinationId) {
      setError("Select a tour destination.");
      return;
    }
    if (!(Number(durationDays) >= 1) || durationNights === "") {
      setError("Enter the tour duration (days and nights).");
      return;
    }
    if (baseDates.length > 0 && !baseCityId) {
      setError("Choose where the basic tour starts and ends before adding dates.");
      return;
    }
    if (baseDates.some((d) => !d.startDate || !(Number(d.seats) >= 1))) {
      setError("Every basic-tour date needs a start date and number of travellers.");
      return;
    }
    if (!(Number(basePrice) > 0)) {
      setError("Enter the base price per person.");
      return;
    }
    setLoading(true);

    const token = localStorage.getItem("epic_token");

    try {
      const res = await fetch(isEdit ? `/api/tours/${tourId}` : "/api/tours", {
        method: isEdit ? "PUT" : "POST",
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
          durationDays: Number(durationDays),
          durationNights: Number(durationNights),
          maxGroupSize: Number(maxGroupSize) || 15,
          basePriceInr: Number(basePrice) || 0,
          baseStartCityId: baseCityId || null,
          baseAddressId: baseAddressId || null,
          baseDepartures: baseDates.map((d) => ({ ...d, seats: Number(d.seats), price: Number(d.price) || Number(basePrice) || 0 })),
          singleRoomPriceInr: Number(singleRoomPrice) || 0,
          depositType,
          depositValue: Number(depositValue) || 0,
          coverImage,
          highlights,
          itinerary,
          inclusions,
          exclusions,
          travelStyles: selectedTravelStyles,
          physicalRating: selectedPhysicalRating,
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

  if (initialLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

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
            {isEdit ? "Edit Tour Itinerary" : "Create Tour Itinerary"}
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
            2. Travel Styles & Ratings
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

          </Grid>
        </Paper>

        {/* Section 3: Tour Destination */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: "#0f172a" }}>
            3. Tour Destination
          </Typography>

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Tour Destination</InputLabel>
                <Select
                  value={destinationId}
                  label="Tour Destination"
                  onChange={(e) => handleDestinationChange(e.target.value)}
                >
                  {destinations.map((d) => (
                    <MenuItem key={d._id} value={d._id}>
                      {d.name} ({d.state})
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" sx={{ color: "#64748b", mt: 0.5 }}>
                  Where this tour is based. Start & end cities, prices and seats are set per date below.
                </Typography>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Days"
                type="number"
                required
                fullWidth
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Nights"
                type="number"
                required
                fullWidth
                value={durationNights}
                onChange={(e) => setDurationNights(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Max Group Size"
                type="number"
                fullWidth
                value={maxGroupSize}
                onChange={(e) => setMaxGroupSize(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Base Price (₹ per person)"
                type="number"
                required
                fullWidth
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value === "" ? "" : Number(e.target.value))}
                helperText="Starting price for every city. Each partner city adds its own supplement (set when you approve its request)."
                slotProps={{ htmlInput: { min: 1 } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Single Room Price (₹ per person)"
                type="number"
                fullWidth
                value={singleRoomPrice}
                onChange={(e) => setSingleRoomPrice(e.target.value === "" ? "" : Number(e.target.value))}
                helperText="Extra amount a traveller pays for a private room. Shared rooms are included in the tour price. Leave 0 if single rooms aren't offered."
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Deposit Type</InputLabel>
                <Select
                  value={depositType}
                  label="Deposit Type"
                  onChange={(e) => setDepositType(e.target.value as "amount" | "percentage")}
                  sx={{ borderRadius: "4px" }}
                >
                  <MenuItem value="percentage">Percentage of total</MenuItem>
                  <MenuItem value="amount">Fixed amount per person</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={depositType === "percentage" ? "Deposit Percentage (%)" : "Deposit Amount (₹ per person)"}
                type="number"
                fullWidth
                value={depositValue}
                onChange={(e) => setDepositValue(e.target.value === "" ? "" : Number(e.target.value))}
                helperText="Minimum travellers pay now to reserve seats; the remaining balance is due 30 days before the tour starts. Set 0 to turn the deposit option off."
                slotProps={{ htmlInput: { min: 0, max: depositType === "percentage" ? 100 : undefined } }}
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
                  {(
                    <IconButton size="small" onClick={() => removeItineraryDay(idx)} sx={{ color: "#ef4444", p: 0.5 }}>
                      <DeleteRoundedIcon fontSize="small" sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </Box>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Destinations for this day"
                      fullWidth
                      value=""
                      placeholder={(day.destinations || []).length ? "" : "Select destination"}
                      onClick={() => setPickerDay(idx)}
                      slotProps={{
                        inputLabel: { shrink: true },
                        input: {
                          readOnly: true,
                          startAdornment: (
                            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.5, mr: 0.5 }}>
                              <PlaceRoundedIcon sx={{ fontSize: 18, color: (day.destinations || []).length ? "#0f172a" : "#94a3b8" }} />
                              {(day.destinations || []).map((c, ci) => (
                                <React.Fragment key={c.destinationId}>
                                  {ci > 0 && <Typography sx={{ color: "#64748b", fontSize: "0.85rem" }}>→</Typography>}
                                  <Chip
                                    label={c.name}
                                    size="small"
                                    draggable
                                    onDragStart={(e) => {
                                      e.stopPropagation();
                                      e.dataTransfer.setData("text/plain", String(ci));
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const from = Number(e.dataTransfer.getData("text/plain"));
                                      if (!isNaN(from) && from !== ci) moveDayCity(idx, from, ci);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onDelete={(e) => {
                                      e.stopPropagation();
                                      toggleDayCity(idx, { _id: c.destinationId, name: c.name });
                                    }}
                                    sx={{ borderRadius: "4px", height: 22, fontSize: "0.75rem", fontWeight: 600, bgcolor: "#f1f5f9", cursor: "grab" }}
                                  />
                                </React.Fragment>
                              ))}
                            </Box>
                          ),
                          endAdornment: <Typography sx={{ fontSize: "0.72rem", color: "#0f172a", fontWeight: 600, whiteSpace: "nowrap" }}>{(day.destinations || []).length ? "Add / change" : "Add"}</Typography>,
                          sx: { cursor: "pointer", flexWrap: "wrap", "& input": { cursor: "pointer", minWidth: 0, width: 0, p: 0 } },
                        },
                      }}
                      helperText={(day.destinations || []).length > 1 ? "Drag a city to change the order" : undefined}
                    />
                  </Grid>

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

        <DestinationPicker
          open={pickerDay !== null}
          selectedIds={pickerDay !== null ? (itinerary[pickerDay]?.destinations || []).map((c) => c.destinationId) : []}
          onClose={() => setPickerDay(null)}
          onToggle={(d) => pickerDay !== null && toggleDayCity(pickerDay, d)}
        />

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

        {/* Section 6: Basic tour (Joining / Leaving) */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a" }}>
              6. Joining / Leaving (basic tour)
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Where the tour itself starts and ends, and its own dates. Travellers who join here pay the tour's base price (no separate date price). Partner cities add their own extra days and price from the Tour Launches screen.
            </Typography>
          </Box>

          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 5 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Start & end location</InputLabel>
                <Select
                  value={baseCityId}
                  label="Start & end location"
                  onChange={(e) => {
                    setBaseCityId(e.target.value as string);
                    setBaseAddressId("");
                  }}
                  sx={{ borderRadius: "4px" }}
                >
                  <MenuItem value=""><em>Not set</em></MenuItem>
                  {destinations.map((c) => (
                    <MenuItem key={c._id} value={c._id}>{c.name} ({c.state})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 7 }}>
              {(() => {
                const addrs: any[] = destinations.find((c) => c._id === baseCityId)?.addresses || [];
                return (
                  <FormControl fullWidth size="small" disabled={!baseCityId || addrs.length === 0}>
                    <InputLabel>Starting address</InputLabel>
                    <Select value={baseAddressId} label="Starting address" onChange={(e) => setBaseAddressId(e.target.value as string)} sx={{ borderRadius: "4px" }}>
                      <MenuItem value=""><em>No address selected</em></MenuItem>
                      {addrs.map((a) => (
                        <MenuItem key={a._id} value={a._id}>{a.label} — {a.address}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                );
              })()}
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.25 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>Dates</Typography>
            <Button
              size="small"
              startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={() => setBaseDates([...baseDates, { startDate: "", seats: Number(maxGroupSize) || 15, price: basePrice, discountPercentage: 0 }])}
              sx={{ borderRadius: "4px" }}
            >
              Add Date
            </Button>
          </Box>
          {baseDates.length === 0 && <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8" }}>No dates yet.</Typography>}
          {baseDates.map((d, i) => {
            const set = (patch: Partial<typeof d>) => setBaseDates(baseDates.map((x, j) => (j === i ? { ...x, ...patch } : x)));
            const end = d.startDate ? new Date(new Date(`${d.startDate}T00:00:00Z`).getTime() + Math.max(0, (Number(durationDays) || 1) - 1) * 86400000).toISOString().slice(0, 10) : "";
            return (
              <Box key={d._id || `n${i}`} sx={{ mb: 1.25, p: 1.5, border: "1px solid #cbd5e1", borderRadius: "4px" }}>
                <Grid container spacing={1.25} sx={{ alignItems: "center" }}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField label="Start date" type="date" required fullWidth size="small" value={d.startDate} onChange={(e) => set({ startDate: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField label="End date (auto)" fullWidth size="small" disabled value={end} slotProps={{ inputLabel: { shrink: true } }} />
                  </Grid>
                  <Grid size={{ xs: 4, sm: 2 }}>
                    <TextField label="Travellers" type="number" required fullWidth size="small" value={d.seats} onChange={(e) => set({ seats: e.target.value === "" ? "" : Number(e.target.value) })} slotProps={{ htmlInput: { min: 1 } }} helperText={d.booked ? `${d.booked} booked` : undefined} />
                  </Grid>
                  <Grid size={{ xs: 8, sm: 3 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Discount</InputLabel>
                      <Select value={d.discountPercentage} label="Discount" onChange={(e) => set({ discountPercentage: Number(e.target.value) })} sx={{ borderRadius: "4px" }}>
                        <MenuItem value={0}>No Discount (0%)</MenuItem>
                        {discountsList.map((disc) => (
                          <MenuItem key={disc._id} value={disc.value}>
                            {disc.name} ({disc.value}% OFF)
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 1 }} sx={{ textAlign: "right" }}>
                    <IconButton size="small" disabled={Boolean(d.booked)} aria-label="Remove date" title={d.booked ? "This date has bookings and can't be deleted" : "Remove date"} onClick={() => setBaseDates(baseDates.filter((_, j) => j !== i))} sx={{ color: "#dc2626" }}>
                      <DeleteRoundedIcon fontSize="small" />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            );
          })}
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
            {loading ? (isEdit ? "Saving..." : "Publishing...") : isEdit ? "Save Changes" : "Publish Tour"}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
