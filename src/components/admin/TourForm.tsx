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
  Tooltip,
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

interface DepartureRow {
  addressId?: string;
  _id?: string;
  booked?: number;
  cityId: string;
  price: number | "";
  startDate: string;
  endDate: string;
  seats: number | "";
  discountPercentage: number;
}

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  meals: string;
  stay: string;
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
  const [singleRoomPrice, setSingleRoomPrice] = useState<number | "">("");
  const [depositType, setDepositType] = useState<"amount" | "percentage">("percentage");
  const [depositValue, setDepositValue] = useState<number | "">(30);
  const [coverImage, setCoverImage] = useState("");

  // Highlights
  const [highlights, setHighlights] = useState<string[]>([]);
  const [newHighlight, setNewHighlight] = useState("");

  // Tour Classifications (Admin Created)
  const [travelStylesList, setTravelStylesList] = useState<any[]>([]);
  const [selectedTravelStyles, setSelectedTravelStyles] = useState<string[]>([]);
  const [physicalRatingsList, setPhysicalRatingsList] = useState<any[]>([]);
  const [selectedPhysicalRating, setSelectedPhysicalRating] = useState<string>("");
  const [discountsList, setDiscountsList] = useState<any[]>([]);

  // Available dates (departures)
  const [departures, setDepartures] = useState<DepartureRow[]>([]);
  // Destination-first date management: pick a destination, then add its dates.
  const [activeCityId, setActiveCityId] = useState("");
  const [extraCities, setExtraCities] = useState<string[]>([]); // destinations added but without dates yet
  const [pickingCity, setPickingCity] = useState(false);

  // Inclusions & Exclusions
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
        setDepositType(t.depositType === "amount" ? "amount" : "percentage");
        setDepositValue(t.depositValue ?? 30);
        setCoverImage(t.coverImage || "");
        setHighlights(t.highlights || []);
        setInclusions(t.inclusions || []);
        setExclusions(t.exclusions || []);
        setItinerary(t.itinerary || []);
        setSelectedTravelStyles(t.travelStyles || []);
        setSelectedPhysicalRating(t.physicalRating || "");
        setDepartures(
          (t.departures || []).map((d: any) => ({
            _id: d._id,
            booked: d.booked || 0,
            cityId: d.cityId || "",
            addressId: d.addressId || "",
            price: d.price ?? t.priceInr ?? "",
            startDate: String(d.startDate).split("T")[0],
            endDate: String(d.endDate).split("T")[0],
            seats: d.seats,
            discountPercentage: d.discountPercentage || 0,
          }))
        );
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
      if (resRatings.success && resRatings.data) {
        setPhysicalRatingsList(resRatings.data);
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

  const updateDeparture = (index: number, field: keyof DepartureRow, val: any) => {
    const updated = [...departures];
    updated[index] = { ...updated[index], [field]: val };
    if (field === "cityId") {
      // Starting addresses belong to a city: reset, and auto-pick when the city has just one.
      const city = destinations.find((c) => c._id === val);
      const addrs = city?.addresses || [];
      updated[index].addressId = addrs.length === 1 ? addrs[0]._id : "";
    }
    // Suggest an end date from the tour length when a start date is picked
    if (field === "startDate" && val && !updated[index].endDate) {
      const end = new Date(val);
      end.setDate(end.getDate() + Math.max(0, (Number(durationDays) || 1) - 1));
      updated[index].endDate = end.toISOString().split("T")[0];
    }
    setDepartures(updated);
  };

  const cityIds = React.useMemo(() => {
    const ids: string[] = [];
    for (const d of departures) if (d.cityId && !ids.includes(d.cityId)) ids.push(d.cityId);
    for (const c of extraCities) if (!ids.includes(c)) ids.push(c);
    return ids;
  }, [departures, extraCities]);

  // Select the first destination automatically (e.g. when an existing tour loads).
  useEffect(() => {
    if (!activeCityId || !cityIds.includes(activeCityId)) setActiveCityId(cityIds[0] || "");
  }, [cityIds, activeCityId]);

  const cityName = (id: string) => destinations.find((c) => c._id === id)?.name || "Destination";

  const addDestination = (id: string) => {
    if (!id) return;
    if (!cityIds.includes(id)) setExtraCities((prev) => [...prev, id]);
    setActiveCityId(id);
    setPickingCity(false);
  };

  const addDateFor = (id: string) => {
    const city = destinations.find((c) => c._id === id);
    const addrs = city?.addresses || [];
    setDepartures((prev) => [
      ...prev,
      { cityId: id, addressId: addrs.length === 1 ? addrs[0]._id : "", startDate: "", endDate: "", seats: maxGroupSize || "", price: "", discountPercentage: 0 },
    ]);
  };

  const removeDestination = (id: string) => {
    if (departures.some((d) => d.cityId === id && d.booked)) {
      setError(`${cityName(id)} has dates with bookings, so it can't be removed.`);
      return;
    }
    if (!window.confirm(`Remove ${cityName(id)} and all its dates from this tour?`)) return;
    setDepartures((prev) => prev.filter((d) => d.cityId !== id));
    setExtraCities((prev) => prev.filter((c) => c !== id));
  };

  const removeDeparture = (index: number) => {
    setDepartures(departures.filter((_, i) => i !== index));
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
    setError(null);

    if (!destinationId) {
      setError("Select a target city.");
      return;
    }
    if (!(Number(durationDays) >= 1) || durationNights === "") {
      setError("Enter the tour duration (days and nights).");
      return;
    }
    if (departures.length === 0) {
      setError("Add at least one available date.");
      return;
    }
    const empty = cityIds.find((id) => !departures.some((d) => d.cityId === id));
    if (empty) {
      setError(`Add at least one date for ${cityName(empty)}, or remove it.`);
      return;
    }
    for (const [i, d] of departures.entries()) {
      if (!d.cityId) {
        setError(`Date ${i + 1}: select a start & end city.`);
        return;
      }
      if (!(Number(d.price) > 0)) {
        setError(`Date ${i + 1}: enter a valid price.`);
        return;
      }
      if (!d.startDate || !d.endDate) {
        setError(`Date ${i + 1}: start and end dates are required.`);
        return;
      }
      if (d.booked && Number(d.seats) < d.booked) {
        setError(`Date ${i + 1}: already has ${d.booked} travellers booked, so seats can't go below that.`);
        return;
      }
      if (d.endDate < d.startDate) {
        setError(`Date ${i + 1}: end date cannot be before start date.`);
        return;
      }
      if (!(Number(d.seats) >= 1)) {
        setError(`Date ${i + 1}: number of travellers must be at least 1.`);
        return;
      }
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
          departures: departures.map(({ booked, ...d }) => ({ ...d, addressId: d.addressId || null, seats: Number(d.seats), price: Number(d.price) })),
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

        {/* Section 3: Target City & Duration */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: "#0f172a" }}>
            3. Target City & Duration
          </Typography>

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Target City</InputLabel>
                <Select
                  value={destinationId}
                  label="Target City"
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

        {/* Section 6: Available Dates */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: "4px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a" }}>
              6. Available Dates
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Customers can only book these dates. Seats left are tracked per date.
            </Typography>
          </Box>

          {/* Destinations on this tour */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap", mb: 2 }}>
            {cityIds.map((id) => {
              const count = departures.filter((d) => d.cityId === id).length;
              const on = id === activeCityId;
              return (
                <Chip
                  key={id}
                  label={`${cityName(id)} · ${count} ${count === 1 ? "date" : "dates"}`}
                  clickable
                  onClick={() => setActiveCityId(id)}
                  sx={{
                    borderRadius: "4px",
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    bgcolor: on ? "#0f172a" : "#f1f5f9",
                    color: on ? "#ffffff" : "#334155",
                    "&:hover": { bgcolor: on ? "#1e293b" : "#e2e8f0" },
                  }}
                />
              );
            })}
            {pickingCity ? (
              <>
                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel>Choose destination</InputLabel>
                  <Select
                    autoFocus
                    value=""
                    label="Choose destination"
                    onChange={(e) => addDestination(e.target.value as string)}
                    sx={{ borderRadius: "4px" }}
                  >
                    {destinations.filter((c) => !cityIds.includes(c._id)).map((c) => (
                      <MenuItem key={c._id} value={c._id}>
                        {c.name} ({c.state})
                      </MenuItem>
                    ))}
                    {destinations.filter((c) => !cityIds.includes(c._id)).length === 0 && (
                      <MenuItem disabled value="">All destinations already added</MenuItem>
                    )}
                  </Select>
                </FormControl>
                <Button size="small" onClick={() => setPickingCity(false)} sx={{ color: "#64748b" }}>Cancel</Button>
              </>
            ) : (
              <Button size="small" startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />} onClick={() => setPickingCity(true)} sx={{ borderRadius: "4px" }}>
                Add Destination
              </Button>
            )}
          </Box>

          {cityIds.length === 0 && (
            <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8" }}>
              No destinations added yet. Add a destination, then add its dates.
            </Typography>
          )}

          {/* Dates of the selected destination */}
          {activeCityId && cityIds.includes(activeCityId) && (() => {
            const city = destinations.find((c) => c._id === activeCityId);
            const addrs: any[] = city?.addresses || [];
            const rows = departures.map((d, index) => ({ d, index })).filter((x) => x.d.cityId === activeCityId);
            return (
              <Box sx={{ border: "1px solid #e2e8f0", borderRadius: "4px", p: 2, bgcolor: "#f8fafc" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>
                      {city?.name || "Destination"}{city?.state ? ` (${city.state})` : ""}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Start & end city for the dates below
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button size="small" variant="outlined" startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />} onClick={() => addDateFor(activeCityId)} sx={{ borderRadius: "4px" }}>
                      Add Date
                    </Button>
                    <Button size="small" color="error" onClick={() => removeDestination(activeCityId)} sx={{ borderRadius: "4px" }}>
                      Remove destination
                    </Button>
                  </Box>
                </Box>

                {rows.length === 0 && (
                  <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8" }}>No dates for this destination yet — click Add Date.</Typography>
                )}

                {rows.map(({ d, index }, n) => (
                  <Box key={index} sx={{ mb: 1.5, p: 1.75, border: "1px solid #cbd5e1", borderRadius: "4px", bgcolor: "#ffffff", "&:last-child": { mb: 0 } }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1.25 }}>
                      Date {n + 1}
                    </Typography>
                    <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <TextField
                          label="Start Date"
                          type="date"
                          required
                          fullWidth
                          size="small"
                          value={d.startDate}
                          onChange={(e) => updateDeparture(index, "startDate", e.target.value)}
                          slotProps={{ inputLabel: { shrink: true } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <TextField
                          label="End Date"
                          type="date"
                          required
                          fullWidth
                          size="small"
                          value={d.endDate}
                          onChange={(e) => updateDeparture(index, "endDate", e.target.value)}
                          slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: d.startDate || undefined } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <TextField
                          label="Travellers"
                          type="number"
                          required
                          fullWidth
                          size="small"
                          value={d.seats}
                          onChange={(e) => updateDeparture(index, "seats", e.target.value === "" ? "" : Number(e.target.value))}
                          slotProps={{ htmlInput: { min: 1 } }}
                          helperText={d.booked ? `${d.booked} booked` : undefined}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <TextField
                          label="Price (INR ₹)"
                          type="number"
                          required
                          fullWidth
                          size="small"
                          value={d.price}
                          onChange={(e) => updateDeparture(index, "price", e.target.value === "" ? "" : Number(e.target.value))}
                          slotProps={{ htmlInput: { min: 1 } }}
                        />
                      </Grid>
                    </Grid>
                    <Grid container spacing={1.5} sx={{ alignItems: "center" }}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Discount</InputLabel>
                          <Select
                            value={d.discountPercentage}
                            label="Discount"
                            onChange={(e) => updateDeparture(index, "discountPercentage", Number(e.target.value))}
                            sx={{ borderRadius: "4px" }}
                          >
                            <MenuItem value={0}>No Discount (0%)</MenuItem>
                            {discountsList.map((disc) => (
                              <MenuItem key={disc._id} value={disc.value}>
                                {disc.name} ({disc.value}% OFF)
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 10, sm: 7 }}>
                        <FormControl fullWidth size="small" disabled={addrs.length === 0}>
                          <InputLabel>Starting Address</InputLabel>
                          <Select
                            value={d.addressId || ""}
                            label="Starting Address"
                            onChange={(e) => updateDeparture(index, "addressId", e.target.value)}
                            sx={{ borderRadius: "4px" }}
                          >
                            <MenuItem value=""><em>No address selected</em></MenuItem>
                            {addrs.map((a) => (
                              <MenuItem key={a._id} value={a._id}>
                                {a.label} — {a.address}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        {addrs.length === 0 && (
                          <Typography variant="caption" sx={{ color: "#64748b", display: "block", mt: 0.5 }}>
                            No addresses for {city?.name || "this city"} yet — add them under Destinations & Cities.
                          </Typography>
                        )}
                      </Grid>
                      <Grid size={{ xs: 2, sm: 1 }} sx={{ textAlign: "right" }}>
                        <Tooltip title={d.booked ? `${d.booked} traveller${d.booked === 1 ? "" : "s"} booked — this date can't be deleted` : "Remove date"}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={Boolean(d.booked)}
                              onClick={() => removeDeparture(index)}
                              aria-label="Remove date"
                              sx={{ color: "#dc2626" }}
                            >
                              <DeleteRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Box>
            );
          })()}
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
