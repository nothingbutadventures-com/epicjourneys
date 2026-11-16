"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import { FOOD_PLANS, DEFAULT_FOOD_PLAN, type FoodPlanId } from "@/lib/food-plans";

const TOKEN = "epic_partner_token";
const authH = (): Record<string, string> => {
  const t = typeof window !== "undefined" ? localStorage.getItem(TOKEN) : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};

// ── Types ──────────────────────────────────────────────────────────────────────
interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  meals: string;
  stay: string;
  destinations?: { destinationId: string; name: string }[];
}
interface Faq { question: string; answer: string; }
interface TourSuggestion {
  title: string;
  shortDescription: string;
  description: string;
  destination: string;
  durationDays: number;
  durationNights: number;
  maxGroupSize: number;
  basePrice: number;
  singleRoomPrice: number;
  depositType: "amount" | "percentage";
  depositValue: number;
  travelStyles: string[];
  physicalRating: string;
  foodPlan: FoodPlanId;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryDay[];
  faqs: Faq[];
  whyItWorks: string;
}

// ── Step config ────────────────────────────────────────────────────────────────
const STEPS = [
  { id: "basics",      label: "Tour Basics",        desc: "Title, destination, duration & price" },
  { id: "styles",      label: "Style & Audience",   desc: "Travel styles, difficulty, food plan" },
  { id: "content",     label: "Description",         desc: "Overview, highlights & cover image" },
  { id: "inclusions",  label: "Inclusions",          desc: "What's in and what's not" },
  { id: "itinerary",   label: "Day-by-Day",          desc: "Full itinerary AI-drafted for you" },
  { id: "faqs",        label: "FAQs & Deposit",      desc: "Common questions and payment terms" },
  { id: "review",      label: "Review & Publish",    desc: "Confirm everything before publishing" },
];

// ── AI suggestion box ──────────────────────────────────────────────────────────
function AISuggestionBadge({
  loading,
  onClick,
  label = "AI Suggest",
}: { loading?: boolean; onClick: () => void; label?: string }) {
  return (
    <Button
      size="small"
      variant="outlined"
      startIcon={loading ? <CircularProgress size={12} /> : <AutoAwesomeRoundedIcon sx={{ fontSize: 15 }} />}
      onClick={onClick}
      disabled={loading}
      sx={{
        borderColor: "#6366f1",
        color: "#6366f1",
        fontSize: "0.72rem",
        fontWeight: 700,
        borderRadius: "6px",
        height: 28,
        px: 1.25,
        "&:hover": { borderColor: "#4f46e5", bgcolor: "#eef2ff" },
      }}
    >
      {loading ? "Generating…" : label}
    </Button>
  );
}

// ── Step header ────────────────────────────────────────────────────────────────
function StepHeader({ step, total, label, desc }: { step: number; total: number; label: string; desc: string }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <Chip
          label={`Step ${step} of ${total}`}
          size="small"
          sx={{ bgcolor: "#0f172a", color: "#fff", fontWeight: 700, borderRadius: "4px", fontSize: "0.68rem", height: 20 }}
        />
      </Box>
      <Typography sx={{ fontWeight: 800, fontSize: "1.25rem", color: "#0f172a", lineHeight: 1.3 }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.82rem", color: "#64748b", mt: 0.25 }}>{desc}</Typography>
    </Box>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function PartnerCreateTourPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<TourSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const suggestionsStartedRef = useRef(false);

  // ── Meta ───────────────────────────────────────────────────────────────────
  const [destinations, setDestinations] = useState<any[]>([]);
  const [travelStylesList, setTravelStylesList] = useState<any[]>([]);
  const [physicalRatingsList, setPhysicalRatingsList] = useState<any[]>([]);

  // ── Step 1: Basics ─────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [destinationName, setDestinationName] = useState("");
  const [startCity, setStartCity] = useState("");           // base city name (partner's city)
  const [durationDays, setDurationDays] = useState<number | "">(3);
  const [durationNights, setDurationNights] = useState<number | "">(2);
  const [maxGroupSize, setMaxGroupSize] = useState<number | "">(15);
  const [basePrice, setBasePrice] = useState<number | "">("");
  const [singleRoomPrice, setSingleRoomPrice] = useState<number | "">(0);
  const [depositType, setDepositType] = useState<"amount" | "percentage">("percentage");
  const [depositValue, setDepositValue] = useState<number | "">(30);

  // ── Step 2: Styles ─────────────────────────────────────────────────────────
  const [selectedTravelStyles, setSelectedTravelStyles] = useState<string[]>([]);
  const [physicalRating, setPhysicalRating] = useState("");
  const [foodPlan, setFoodPlan] = useState<FoodPlanId>(DEFAULT_FOOD_PLAN);

  // ── Step 3: Content ────────────────────────────────────────────────────────
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [newHighlight, setNewHighlight] = useState("");
  const [coverImage, setCoverImage] = useState("");

  // ── Step 4: Inclusions ─────────────────────────────────────────────────────
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [newInclusion, setNewInclusion] = useState("");
  const [newExclusion, setNewExclusion] = useState("");

  // ── Step 5: Itinerary ──────────────────────────────────────────────────────
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);

  // ── Step 6: FAQs ──────────────────────────────────────────────────────────
  const [faqs, setFaqs] = useState<Faq[]>([]);

  // ── Load meta ──────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch("/api/destinations?limit=50").then((r) => r.json()),
      fetch("/api/travel-styles").then((r) => r.json()),
      fetch("/api/physical-ratings").then((r) => r.json()),
    ]).then(([dRes, sRes, pRes]) => {
      if (dRes.success) setDestinations(dRes.data || []);
      if (sRes.success) setTravelStylesList(sRes.data || []);
      if (pRes.success) setPhysicalRatingsList(pRes.data || []);
    }).catch(() => {});

    // Pre-fill start city from partner profile
    const t = localStorage.getItem(TOKEN);
    if (t) {
      fetch("/api/partners", { headers: { Authorization: `Bearer ${t}` } })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.data?.[0]?.assignedDestination?.name) {
            setStartCity(d.data[0].assignedDestination.name);
          }
        })
        .catch(() => {});
    }
  }, []);

  const generateTourSuggestions = useCallback(async () => {
    if (!destinations.length || !startCity) return;
    setSuggestionsLoading(true);
    setSuggestionsError(null);
    try {
      const res = await fetch("/api/partner/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "tourSuggestions",
          context: {
            startCity,
            availableDestinations: destinations.map((d) => ({ name: d.name, state: d.state })),
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success || !Array.isArray(json.data?.suggestions)) {
        throw new Error(json.error || "Could not generate tour suggestions");
      }
      setSuggestions(json.data.suggestions.slice(0, 8));
    } catch (e: any) {
      setSuggestionsError(e.message || "Could not generate tour suggestions");
    } finally {
      setSuggestionsLoading(false);
    }
  }, [destinations, startCity]);

  useEffect(() => {
    if (destinations.length && startCity && !suggestionsStartedRef.current) {
      suggestionsStartedRef.current = true;
      generateTourSuggestions();
    }
  }, [destinations.length, startCity, generateTourSuggestions]);

  // Auto-sync nights from days
  useEffect(() => {
    if (typeof durationDays === "number" && durationDays >= 1) {
      setDurationNights(durationDays - 1);
    }
  }, [durationDays]);

  // Build AI context from all current state
  const buildContext = () => ({
    destination: destinationName,
    startCity,
    days: durationDays,
    nights: durationNights,
    maxGroupSize,
    price: basePrice,
    travelStyles: selectedTravelStyles,
    physicalRating,
    foodPlan,
    highlights,
  });

  // ── AI call ────────────────────────────────────────────────────────────────
  const callAI = async (step: string, apply: (data: any) => void) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/partner/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, context: buildContext() }),
      });
      const json = await res.json();
      if (json.success) apply(json.data);
      else setAiError(json.error || "AI suggestion failed");
    } catch (e: any) {
      setAiError(e.message || "Network error");
    } finally {
      setAiLoading(false);
    }
  };

  const applySuggestion = (suggestion: TourSuggestion) => {
    const destination = destinations.find(
      (d) => d.name.toLowerCase() === suggestion.destination.toLowerCase()
        || `${d.name}, ${d.state}`.toLowerCase() === suggestion.destination.toLowerCase(),
    );
    setTitle(suggestion.title || "");
    setShortDescription(suggestion.shortDescription || "");
    setDescription(suggestion.description || "");
    setDestinationId(destination?._id || "");
    setDestinationName(destination ? `${destination.name}, ${destination.state}` : suggestion.destination || "");
    setDurationDays(suggestion.durationDays || 3);
    setDurationNights(suggestion.durationNights || Math.max(0, (suggestion.durationDays || 3) - 1));
    setMaxGroupSize(suggestion.maxGroupSize || 15);
    setBasePrice(suggestion.basePrice || "");
    setSingleRoomPrice(suggestion.singleRoomPrice || 0);
    setDepositType(suggestion.depositType === "amount" ? "amount" : "percentage");
    setDepositValue(suggestion.depositValue || 30);
    setSelectedTravelStyles(Array.isArray(suggestion.travelStyles) ? suggestion.travelStyles : []);
    setPhysicalRating(suggestion.physicalRating || "");
    setFoodPlan(suggestion.foodPlan || DEFAULT_FOOD_PLAN);
    setHighlights(Array.isArray(suggestion.highlights) ? suggestion.highlights : []);
    setInclusions(Array.isArray(suggestion.inclusions) ? suggestion.inclusions : []);
    setExclusions(Array.isArray(suggestion.exclusions) ? suggestion.exclusions : []);
    setItinerary(Array.isArray(suggestion.itinerary) ? suggestion.itinerary : []);
    setFaqs(Array.isArray(suggestion.faqs) ? suggestion.faqs : []);
    setManualMode(true);
    setCurrentStep(0);
  };

  // ── Navigation & validation ────────────────────────────────────────────────
  const stepErrors: Record<number, string | null> = {
    0: !destinationId ? "Select a destination" : selectedTravelStyles.length === 0 ? "Select at least one travel style" : null,
    1: !basePrice ? "Enter a base price" : null,
    2: !durationDays ? "Enter duration" : !maxGroupSize ? "Enter group size" : !title ? "Enter a tour title" : !description ? "Enter a description" : null,
    3: inclusions.length === 0 ? "Add at least one inclusion" : null,
    4: itinerary.length === 0 ? "Add at least one itinerary day" : null,
    5: null,
    6: null,
  };

  const canGoNext = !stepErrors[currentStep];

  const goNext = () => {
    if (canGoNext && currentStep < STEPS.length - 1) setCurrentStep((s) => s + 1);
  };
  const goBack = () => { if (currentStep > 0) setCurrentStep((s) => s - 1); };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/partner/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authH() },
        body: JSON.stringify({
          title,
          shortDescription,
          description,
          state: destinations.find((d) => d._id === destinationId)?.state || "",
          destinationId,
          durationDays: Number(durationDays),
          durationNights: Number(durationNights),
          maxGroupSize: Number(maxGroupSize) || 15,
          basePriceInr: Number(basePrice),
          singleRoomPriceInr: Number(singleRoomPrice) || 0,
          depositType,
          depositValue: Number(depositValue) || 0,
          coverImage,
          highlights,
          inclusions,
          exclusions,
          itinerary,
          faqs: faqs.filter((f) => f.question.trim() && f.answer.trim()),
          travelStyles: selectedTravelStyles,
          physicalRating,
          foodPlan,
          isActive: true,
          createdByPartner: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/partner/tours?created=1");
      } else {
        setSubmitError(data.error || "Failed to submit tour");
      }
    } catch (e: any) {
      setSubmitError(e.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helper: add/remove list items ─────────────────────────────────────────
  const addToList = (list: string[], setList: (v: string[]) => void, val: string, setVal: (v: string) => void) => {
    if (val.trim()) { setList([...list, val.trim()]); setVal(""); }
  };
  const removeFromList = (list: string[], setList: (v: string[]) => void, idx: number) =>
    setList(list.filter((_, i) => i !== idx));

  // ── Progress bar ───────────────────────────────────────────────────────────
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  // ── Render steps ───────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {

      // ════════════════════════════════════════════════════════════════════════
      // STEP 1: BASICS
      // ════════════════════════════════════════════════════════════════════════
      case 0:
        return (
          <Box>
            <StepHeader step={1} total={STEPS.length} label="Tour Basics" desc="Where are you going, how long is it and who is this tour for?" />
            <Grid container spacing={2}>
              {/* Destination */}
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth required>
                  <InputLabel>Tour Destination</InputLabel>
                  <Select
                    value={destinationId}
                    label="Tour Destination"
                    onChange={(e) => {
                      const id = e.target.value;
                      setDestinationId(id);
                      const d = destinations.find((x) => x._id === id);
                      setDestinationName(d ? `${d.name}, ${d.state}` : "");
                    }}
                    sx={{ borderRadius: "4px" }}
                  >
                    {destinations.map((d) => (
                      <MenuItem key={d._id} value={d._id}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <PlaceRoundedIcon sx={{ fontSize: 15, color: "#64748b" }} />
                          {d.name}, {d.state}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Start city (readonly from partner profile) */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Your Pickup City"
                  fullWidth
                  value={startCity}
                  onChange={(e) => setStartCity(e.target.value)}
                  helperText="Your city where travellers will be picked up. Pre-filled from your partner profile."
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
                />
              </Grid>

              {/* Travel styles */}
              <Grid size={{ xs: 12 }}>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", mb: 1.25 }}>
                  Travel Styles <span style={{ color: "#ef4444" }}>*</span>
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {travelStylesList.map((s) => {
                    const on = selectedTravelStyles.includes(s.name);
                    return (
                      <Chip
                        key={s._id}
                        label={s.name}
                        onClick={() =>
                          setSelectedTravelStyles(on
                            ? selectedTravelStyles.filter((x) => x !== s.name)
                            : [...selectedTravelStyles, s.name])
                        }
                        icon={on ? <CheckRoundedIcon sx={{ fontSize: "14px !important" }} /> : undefined}
                        sx={{
                          borderRadius: "4px",
                          fontWeight: 600,
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          bgcolor: on ? "#0f172a" : "#f1f5f9",
                          color: on ? "#fff" : "#475569",
                          border: on ? "1px solid #0f172a" : "1px solid #e2e8f0",
                          "&:hover": { bgcolor: on ? "#1e293b" : "#e2e8f0" },
                        }}
                      />
                    );
                  })}
                </Box>
              </Grid>

              {/* Physical rating */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Physical Difficulty</InputLabel>
                  <Select
                    value={physicalRating}
                    label="Physical Difficulty"
                    onChange={(e) => setPhysicalRating(e.target.value)}
                    sx={{ borderRadius: "4px" }}
                  >
                    <MenuItem value=""><em>Not specified</em></MenuItem>
                    {physicalRatingsList.map((r) => (
                      <MenuItem key={r._id} value={r.name}>
                        Level {r.level}: {r.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Deposit */}
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 0.5 }}>
                  <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600 }}>Booking Deposit</Typography>
                </Divider>
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
                    <MenuItem value="percentage">% of total price</MenuItem>
                    <MenuItem value="amount">Fixed ₹ per person</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={depositType === "percentage" ? "Deposit %" : "Deposit ₹ per person"}
                  type="number"
                  fullWidth
                  size="small"
                  value={depositValue}
                  onChange={(e) => setDepositValue(e.target.value === "" ? "" : Number(e.target.value))}
                  helperText="Amount travellers pay now to hold seats. Rest due 30 days before tour."
                  slotProps={{ htmlInput: { min: 0, max: depositType === "percentage" ? 100 : undefined } }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      // ════════════════════════════════════════════════════════════════════════
      // STEP 2: PRICING & STYLE
      // ════════════════════════════════════════════════════════════════════════
      case 1:
        return (
          <Box>
            <StepHeader step={2} total={STEPS.length} label="Pricing & Style" desc="Set a fair price and describe the travellers this tour is for." />
            <Paper
              elevation={0}
              sx={{ mb: 2.5, p: 1.75, bgcolor: "#f5f3ff", border: "1px solid #c4b5fd", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}
            >
              <Box>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#4f46e5" }}>✨ AI recommends your pricing</Typography>
                <Typography sx={{ fontSize: "0.74rem", color: "#6d28d9" }}>
                  Based on {destinationName || "your destination"}, {durationDays}D/{durationNights}N, pickup from {startCity || "your city"} and your selected style.
                </Typography>
              </Box>
              <AISuggestionBadge
                loading={aiLoading}
                label="Recommend Price"
                onClick={() =>
                  callAI("pricing", (d) => {
                    if (typeof d.basePrice === "number") setBasePrice(d.basePrice);
                    if (typeof d.singleRoomPrice === "number") setSingleRoomPrice(d.singleRoomPrice);
                    if (d.depositType === "amount" || d.depositType === "percentage") setDepositType(d.depositType);
                    if (typeof d.depositValue === "number") setDepositValue(d.depositValue);
                  })
                }
              />
            </Paper>
            {aiError && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setAiError(null)}>{aiError}</Alert>}
            <Grid container spacing={3}>
              {/* Price */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Base Price per Person (₹)"
                  type="number"
                  required
                  fullWidth
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value === "" ? "" : Number(e.target.value))}
                  helperText="All-inclusive price per traveller from your city."
                  slotProps={{ htmlInput: { min: 500 } }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Single Room Supplement (₹)"
                  type="number"
                  fullWidth
                  value={singleRoomPrice}
                  onChange={(e) => setSingleRoomPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  helperText="Extra charge per person for a private room. 0 = not offered."
                  slotProps={{ htmlInput: { min: 0 } }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
                />
              </Grid>

              {/* Food Plan */}
              <Grid size={{ xs: 12 }}>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", mb: 1.25 }}>
                  Food Plan
                </Typography>
                <ToggleButtonGroup
                  value={foodPlan}
                  exclusive
                  onChange={(_, v) => v && setFoodPlan(v)}
                  sx={{ flexWrap: "wrap", gap: 1, "& .MuiToggleButtonGroup-grouped": { borderRadius: "4px !important", border: "1px solid #e2e8f0 !important", mr: 0 } }}
                >
                  {FOOD_PLANS.map((p) => (
                    <ToggleButton
                      key={p.id}
                      value={p.id}
                      sx={{
                        px: 2,
                        py: 1,
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        textTransform: "none",
                        "&.Mui-selected": { bgcolor: "#0f172a", color: "#fff", "&:hover": { bgcolor: "#1e293b" } },
                      }}
                    >
                      <Box sx={{ textAlign: "left" }}>
                        <div>{p.title}</div>
                        <div style={{ fontSize: "0.68rem", fontWeight: 400, opacity: 0.75 }}>{p.description}</div>
                      </Box>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Grid>
            </Grid>
          </Box>
        );

      // ════════════════════════════════════════════════════════════════════════
      // STEP 3: CONTENT
      // ════════════════════════════════════════════════════════════════════════
      case 2:
        return (
          <Box>
            <StepHeader step={3} total={STEPS.length} label="Description & Highlights" desc="Tell travellers what makes this tour special." />

            {/* AI suggest banner */}
            <Paper
              elevation={0}
              sx={{
                mb: 2.5,
                p: 1.75,
                bgcolor: "#f5f3ff",
                border: "1px solid #c4b5fd",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Box>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#4f46e5" }}>
                  ✨ AI can write this for you
                </Typography>
                <Typography sx={{ fontSize: "0.74rem", color: "#6d28d9" }}>
                  Based on {destinationName || "your destination"}, {durationDays}D/{durationNights}N at ₹{Number(basePrice).toLocaleString("en-IN")}/person
                </Typography>
              </Box>
              <AISuggestionBadge
                loading={aiLoading}
                label="Generate Title, Description & Highlights"
                onClick={() =>
                  callAI("basics", (d) => {
                    if (d.title) setTitle(d.title);
                    if (d.shortDescription) setShortDescription(d.shortDescription);
                    if (d.description) setDescription(d.description);
                    if (Array.isArray(d.highlights)) setHighlights(d.highlights);
                    if (typeof d.durationDays === "number") setDurationDays(d.durationDays);
                    if (typeof d.durationNights === "number") setDurationNights(d.durationNights);
                    if (typeof d.maxGroupSize === "number") setMaxGroupSize(d.maxGroupSize);
                  })
                }
              />
            </Paper>

            {aiError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setAiError(null)}>
                {aiError}
              </Alert>
            )}

            <Grid container spacing={2}>
              {/* AI-filled trip size */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Days"
                  type="number"
                  required
                  fullWidth
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value === "" ? "" : Number(e.target.value))}
                  slotProps={{ htmlInput: { min: 1, max: 30 } }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
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
                  slotProps={{ htmlInput: { min: 0 } }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Max Group Size"
                  type="number"
                  required
                  fullWidth
                  value={maxGroupSize}
                  onChange={(e) => setMaxGroupSize(e.target.value === "" ? "" : Number(e.target.value))}
                  slotProps={{ htmlInput: { min: 1, max: 50 } }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Tour Title"
                  required
                  fullWidth
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Golden Temple & Wagah Border — 2 Days from Delhi"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Short Description (for tour cards)"
                  fullWidth
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="One-line preview shown on the listing page"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Detailed Description"
                  multiline
                  rows={4}
                  required
                  fullWidth
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the journey, the sights, the experience…"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
                />
              </Grid>

              {/* Highlights */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>Key Highlights</Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mb: 1.25 }}>
                  {highlights.map((h, i) => (
                    <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "center", p: "6px 10px", bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "4px" }}>
                      <CheckRoundedIcon sx={{ fontSize: 14, color: "#059669", flexShrink: 0 }} />
                      <Typography sx={{ fontSize: "0.82rem", color: "#334155", flex: 1 }}>{h}</Typography>
                      <IconButton size="small" onClick={() => removeFromList(highlights, setHighlights, i)} sx={{ p: 0.25, color: "#ef4444" }}>
                        <DeleteRoundedIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="e.g. Witness the Beating Retreat ceremony at Wagah Border"
                    value={newHighlight}
                    onChange={(e) => setNewHighlight(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(highlights, setHighlights, newHighlight, setNewHighlight))}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
                  />
                  <Button
                    onClick={() => addToList(highlights, setHighlights, newHighlight, setNewHighlight)}
                    variant="outlined"
                    sx={{ borderRadius: "4px", borderColor: "#e2e8f0", color: "#475569", px: 1.5, flexShrink: 0 }}
                  >
                    <AddRoundedIcon sx={{ fontSize: 16 }} />
                  </Button>
                </Box>
              </Grid>

              {/* Cover image */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Cover Image URL"
                  fullWidth
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://…"
                  helperText="Paste a direct image URL. Recommended: 1600 × 900px. Leave blank and we'll use a destination default."
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
                />
                {coverImage && (
                  <Box
                    component="img"
                    src={coverImage}
                    alt="Preview"
                    sx={{ mt: 1.5, width: "100%", height: 200, objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
              </Grid>
            </Grid>
          </Box>
        );

      // ════════════════════════════════════════════════════════════════════════
      // STEP 4: INCLUSIONS
      // ════════════════════════════════════════════════════════════════════════
      case 3:
        return (
          <Box>
            <StepHeader step={4} total={STEPS.length} label="Inclusions & Exclusions" desc="Be transparent about what travellers get (and don't)." />

            <Paper
              elevation={0}
              sx={{ mb: 2.5, p: 1.75, bgcolor: "#f5f3ff", border: "1px solid #c4b5fd", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}
            >
              <Box>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#4f46e5" }}>✨ AI can suggest inclusions</Typography>
                <Typography sx={{ fontSize: "0.74rem", color: "#6d28d9" }}>Based on your budget of ₹{Number(basePrice).toLocaleString("en-IN")} and {foodPlan} food plan</Typography>
              </Box>
              <AISuggestionBadge
                loading={aiLoading}
                label="Suggest Inclusions & Exclusions"
                onClick={() =>
                  callAI("inclusions", (d) => {
                    if (Array.isArray(d.inclusions)) setInclusions(d.inclusions);
                    if (Array.isArray(d.exclusions)) setExclusions(d.exclusions);
                  })
                }
              />
            </Paper>

            {aiError && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setAiError(null)}>{aiError}</Alert>}

            <Grid container spacing={3}>
              {/* Inclusions */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#059669", mb: 1 }}>✓ What&apos;s Included</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mb: 1.25 }}>
                  {inclusions.map((inc, i) => (
                    <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "flex-start", p: "6px 10px", bgcolor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "4px" }}>
                      <CheckRoundedIcon sx={{ fontSize: 14, color: "#059669", mt: "2px", flexShrink: 0 }} />
                      <Typography sx={{ fontSize: "0.82rem", color: "#334155", flex: 1, lineHeight: 1.5 }}>{inc}</Typography>
                      <IconButton size="small" onClick={() => removeFromList(inclusions, setInclusions, i)} sx={{ p: 0.25, color: "#ef4444" }}>
                        <DeleteRoundedIcon sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField size="small" fullWidth placeholder="e.g. Overnight AC bus both ways" value={newInclusion} onChange={(e) => setNewInclusion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(inclusions, setInclusions, newInclusion, setNewInclusion))} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }} />
                  <Button onClick={() => addToList(inclusions, setInclusions, newInclusion, setNewInclusion)} variant="outlined" sx={{ borderRadius: "4px", borderColor: "#e2e8f0", color: "#475569", px: 1.5, flexShrink: 0 }}>
                    <AddRoundedIcon sx={{ fontSize: 16 }} />
                  </Button>
                </Box>
              </Grid>

              {/* Exclusions */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#ef4444", mb: 1 }}>✗ Not Included</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mb: 1.25 }}>
                  {exclusions.map((exc, i) => (
                    <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "flex-start", p: "6px 10px", bgcolor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "4px" }}>
                      <Typography sx={{ fontSize: "0.82rem", color: "#ef4444", fontWeight: 700, flexShrink: 0 }}>✗</Typography>
                      <Typography sx={{ fontSize: "0.82rem", color: "#334155", flex: 1, lineHeight: 1.5 }}>{exc}</Typography>
                      <IconButton size="small" onClick={() => removeFromList(exclusions, setExclusions, i)} sx={{ p: 0.25, color: "#ef4444" }}>
                        <DeleteRoundedIcon sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField size="small" fullWidth placeholder="e.g. Personal shopping expenses" value={newExclusion} onChange={(e) => setNewExclusion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(exclusions, setExclusions, newExclusion, setNewExclusion))} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }} />
                  <Button onClick={() => addToList(exclusions, setExclusions, newExclusion, setNewExclusion)} variant="outlined" sx={{ borderRadius: "4px", borderColor: "#e2e8f0", color: "#475569", px: 1.5, flexShrink: 0 }}>
                    <AddRoundedIcon sx={{ fontSize: 16 }} />
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );

      // ════════════════════════════════════════════════════════════════════════
      // STEP 5: ITINERARY
      // ════════════════════════════════════════════════════════════════════════
      case 4:
        return (
          <Box>
            <StepHeader step={5} total={STEPS.length} label="Day-by-Day Itinerary" desc="The AI drafts a full itinerary — you refine it." />

            <Paper
              elevation={0}
              sx={{ mb: 2.5, p: 1.75, bgcolor: "#f5f3ff", border: "1px solid #c4b5fd", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}
            >
              <Box>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#4f46e5" }}>✨ AI drafts your itinerary</Typography>
                <Typography sx={{ fontSize: "0.74rem", color: "#6d28d9" }}>
                  {durationDays} days to {destinationName || "destination"} · {selectedTravelStyles.join(", ")}
                </Typography>
              </Box>
              <AISuggestionBadge
                loading={aiLoading}
                label={`Draft ${durationDays}-Day Itinerary`}
                onClick={() =>
                  callAI("itinerary", (d) => {
                    if (Array.isArray(d.itinerary)) setItinerary(d.itinerary);
                  })
                }
              />
            </Paper>

            {aiError && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setAiError(null)}>{aiError}</Alert>}

            {/* Manual add button */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1.5 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddRoundedIcon sx={{ fontSize: 15 }} />}
                onClick={() => {
                  const n = itinerary.length + 1;
                  setItinerary([...itinerary, { day: n, title: `Day ${n} — Activities`, description: "", meals: "Breakfast, Lunch, Dinner", stay: "Standard Hotel" }]);
                }}
                sx={{ borderRadius: "4px", borderColor: "#e2e8f0", color: "#475569", fontSize: "0.75rem" }}
              >
                Add Day Manually
              </Button>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {itinerary.map((day, idx) => (
                <Paper key={idx} elevation={0} sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: "6px", bgcolor: "#f8fafc" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                    <Chip
                      label={`Day ${day.day}`}
                      size="small"
                      sx={{ bgcolor: "#0f172a", color: "#fff", fontWeight: 700, borderRadius: "4px", fontSize: "0.68rem", height: 20 }}
                    />
                    <IconButton size="small" onClick={() => setItinerary(itinerary.filter((_, i) => i !== idx).map((x, i) => ({ ...x, day: i + 1 })))} sx={{ color: "#ef4444", p: 0.5 }}>
                      <DeleteRoundedIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Box>
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Day Title"
                        fullWidth
                        size="small"
                        value={day.title}
                        onChange={(e) => setItinerary(itinerary.map((x, i) => i === idx ? { ...x, title: e.target.value } : x))}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Description"
                        multiline
                        rows={3}
                        fullWidth
                        size="small"
                        value={day.description}
                        onChange={(e) => setItinerary(itinerary.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Meals"
                        fullWidth
                        size="small"
                        value={day.meals}
                        onChange={(e) => setItinerary(itinerary.map((x, i) => i === idx ? { ...x, meals: e.target.value } : x))}
                        placeholder="Breakfast, Lunch, Dinner"
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Accommodation"
                        fullWidth
                        size="small"
                        value={day.stay}
                        onChange={(e) => setItinerary(itinerary.map((x, i) => i === idx ? { ...x, stay: e.target.value } : x))}
                        placeholder="Standard Hotel / Overnight Bus"
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ))}

              {itinerary.length === 0 && (
                <Box sx={{ textAlign: "center", py: 5, border: "2px dashed #e2e8f0", borderRadius: "8px" }}>
                  <Typography sx={{ color: "#94a3b8", fontSize: "0.85rem", mb: 1.5 }}>
                    Click <strong>Draft {durationDays}-Day Itinerary</strong> above and the AI will fill this in for you.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        );

      // ════════════════════════════════════════════════════════════════════════
      // STEP 6: FAQs & DEPOSIT
      // ════════════════════════════════════════════════════════════════════════
      case 5:
        return (
          <Box>
            <StepHeader step={6} total={STEPS.length} label="FAQs" desc="Answer common questions travellers have before booking." />

            <Paper
              elevation={0}
              sx={{ mb: 2.5, p: 1.75, bgcolor: "#f5f3ff", border: "1px solid #c4b5fd", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}
            >
              <Box>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#4f46e5" }}>✨ AI suggests FAQs</Typography>
                <Typography sx={{ fontSize: "0.74rem", color: "#6d28d9" }}>Based on {destinationName} · {physicalRating || "moderate difficulty"}</Typography>
              </Box>
              <AISuggestionBadge
                loading={aiLoading}
                label="Generate FAQs"
                onClick={() =>
                  callAI("faqs", (d) => {
                    if (Array.isArray(d.faqs)) setFaqs(d.faqs);
                  })
                }
              />
            </Paper>

            {aiError && <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setAiError(null)}>{aiError}</Alert>}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
              {faqs.map((faq, i) => (
                <Paper key={i} elevation={0} sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: "6px" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#6366f1" }}>FAQ {i + 1}</Typography>
                    <IconButton size="small" onClick={() => setFaqs(faqs.filter((_, fi) => fi !== i))} sx={{ p: 0.25, color: "#ef4444" }}>
                      <DeleteRoundedIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                  <TextField
                    label="Question"
                    fullWidth
                    size="small"
                    value={faq.question}
                    onChange={(e) => setFaqs(faqs.map((f, fi) => fi === i ? { ...f, question: e.target.value } : f))}
                    sx={{ mb: 1, "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
                  />
                  <TextField
                    label="Answer"
                    multiline
                    rows={2}
                    fullWidth
                    size="small"
                    value={faq.answer}
                    onChange={(e) => setFaqs(faqs.map((f, fi) => fi === i ? { ...f, answer: e.target.value } : f))}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "4px" } }}
                  />
                </Paper>
              ))}
            </Box>

            <Button
              size="small"
              variant="outlined"
              startIcon={<AddRoundedIcon sx={{ fontSize: 15 }} />}
              onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}
              sx={{ borderRadius: "4px", borderColor: "#e2e8f0", color: "#475569", fontSize: "0.75rem" }}
            >
              Add FAQ Manually
            </Button>
          </Box>
        );

      // ════════════════════════════════════════════════════════════════════════
      // STEP 7: REVIEW
      // ════════════════════════════════════════════════════════════════════════
      case 6:
        return (
          <Box>
            <StepHeader step={7} total={STEPS.length} label="Review & Publish" desc="Check everything before publishing your tour." />

            <Alert severity="success" sx={{ mb: 2.5, borderRadius: "6px", fontSize: "0.82rem" }}>
              <strong>Publishing your tour:</strong> Once published, your tour goes live immediately on EpicJourneys. You can then schedule departure dates and start taking bookings right away.
            </Alert>

            {submitError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: "4px" }} onClose={() => setSubmitError(null)}>{submitError}</Alert>
            )}

            {/* Summary cards */}
            {[
              {
                label: "Tour Basics",
                step: 0,
                rows: [
                  ["Destination", destinationName || "—"],
                  ["Duration", `${durationDays} days / ${durationNights} nights`],
                  ["Group size", `Up to ${maxGroupSize} travellers`],
                  ["Base price", `₹${Number(basePrice).toLocaleString("en-IN")} /person`],
                  ["Deposit", `${depositValue}${depositType === "percentage" ? "%" : " ₹"} to hold seats`],
                ],
              },
              {
                label: "Style & Audience",
                step: 1,
                rows: [
                  ["Travel styles", selectedTravelStyles.join(", ") || "—"],
                  ["Difficulty", physicalRating || "—"],
                  ["Food plan", FOOD_PLANS.find((p) => p.id === foodPlan)?.title || foodPlan],
                ],
              },
              {
                label: "Content",
                step: 2,
                rows: [
                  ["Title", title || "—"],
                  ["Highlights", `${highlights.length} added`],
                  ["Description", description ? `${description.slice(0, 80)}…` : "—"],
                ],
              },
              {
                label: "Inclusions",
                step: 3,
                rows: [
                  ["Included", `${inclusions.length} items`],
                  ["Excluded", `${exclusions.length} items`],
                ],
              },
              {
                label: "Itinerary",
                step: 4,
                rows: [["Days planned", `${itinerary.length} of ${durationDays}`]],
              },
              {
                label: "FAQs",
                step: 5,
                rows: [["FAQs", `${faqs.filter((f) => f.question.trim()).length} questions`]],
              },
            ].map((section) => (
              <Paper
                key={section.label}
                elevation={0}
                sx={{ p: 2, mb: 1.5, border: "1px solid #e2e8f0", borderRadius: "6px" }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a" }}>{section.label}</Typography>
                  <Button
                    size="small"
                    onClick={() => setCurrentStep(section.step)}
                    sx={{ fontSize: "0.72rem", color: "#6366f1", p: 0.5, minWidth: 0 }}
                  >
                    Edit
                  </Button>
                </Box>
                {section.rows.map(([k, v]) => (
                  <Box key={k} sx={{ display: "flex", gap: 1, py: "3px" }}>
                    <Typography sx={{ fontSize: "0.78rem", color: "#64748b", width: 120, flexShrink: 0 }}>{k}</Typography>
                    <Typography sx={{ fontSize: "0.78rem", color: "#334155", fontWeight: 500 }}>{v}</Typography>
                  </Box>
                ))}
              </Paper>
            ))}

            <Box sx={{ mt: 3, p: 2, bgcolor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px" }}>
              <Typography sx={{ fontSize: "0.82rem", color: "#166534" }}>
                <strong>Ready to Publish:</strong> Your tour will be published live immediately on EpicJourneys and travelers can explore and request it.
              </Typography>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  const renderSuggestionLanding = () => (
    <Box sx={{ maxWidth: 1180, mx: "auto", pb: 8 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.35rem", sm: "1.6rem" }, color: "#0f172a" }}>
            Turn your local knowledge into a tour
          </Typography>
          <Typography sx={{ fontSize: "0.86rem", color: "#64748b", mt: 0.5 }}>
            AI suggestions built around departures from <strong>{startCity || "your city"}</strong>
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<EditNoteRoundedIcon />}
          onClick={() => setManualMode(true)}
          sx={{ borderColor: "#0f172a", color: "#0f172a", borderRadius: "6px", fontWeight: 700, whiteSpace: "nowrap" }}
        >
          Create manually
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{ p: { xs: 2, sm: 2.5 }, mb: 3, bgcolor: "#f5f3ff", border: "1px solid #c4b5fd", borderRadius: "10px" }}
      >
        <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
            <AutoAwesomeRoundedIcon sx={{ color: "#6366f1", mt: 0.15 }} />
            <Box>
              <Typography sx={{ fontWeight: 800, color: "#4338ca", fontSize: "0.95rem" }}>
                Start with a smart tour idea
              </Typography>
              <Typography sx={{ color: "#6d28d9", fontSize: "0.78rem", mt: 0.35 }}>
                Each idea includes a destination, pickup city, pricing, highlights and a ready-to-edit itinerary.
                Use one to save time and launch a tour that fits your local customers.
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={suggestionsLoading ? <CircularProgress size={15} /> : <RefreshRoundedIcon />}
            onClick={() => {
              generateTourSuggestions();
            }}
            disabled={suggestionsLoading || !startCity}
            sx={{ borderColor: "#6366f1", color: "#4f46e5", borderRadius: "6px", fontWeight: 700, whiteSpace: "nowrap" }}
          >
            {suggestionsLoading ? "Rethinking…" : "Rethink suggestions"}
          </Button>
        </Box>
      </Paper>

      {suggestionsError && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: "6px" }}
          action={
            <Button color="inherit" size="small" onClick={generateTourSuggestions}>
              Try again
            </Button>
          }
        >
          {suggestionsError}
        </Alert>
      )}

      {suggestionsLoading && suggestions.length === 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 10, color: "#64748b" }}>
          <CircularProgress size={32} sx={{ color: "#6366f1", mb: 2 }} />
          <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>Finding promising journeys for your city…</Typography>
          <Typography sx={{ fontSize: "0.78rem", mt: 0.5 }}>This usually takes a few seconds.</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {suggestions.map((suggestion, index) => (
            <Grid key={`${suggestion.title}-${index}`} size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper
                elevation={0}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid #e2e8f0",
                  borderRadius: "9px",
                  overflow: "hidden",
                  transition: "box-shadow 0.2s, transform 0.2s",
                  "&:hover": { boxShadow: "0 8px 24px rgba(15, 23, 42, 0.1)", transform: "translateY(-2px)" },
                }}
              >
                <Box sx={{ p: 2, flex: 1 }}>
                  <Chip
                    label={`${suggestion.durationDays || 3}D / ${suggestion.durationNights || 2}N`}
                    size="small"
                    sx={{ bgcolor: "#eef2ff", color: "#4338ca", fontWeight: 700, borderRadius: "4px", fontSize: "0.68rem", mb: 1.25 }}
                  />
                  <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem", lineHeight: 1.35 }}>
                    {suggestion.title}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                    <PlaceRoundedIcon sx={{ fontSize: 15, color: "#ef4444" }} />
                    <Typography sx={{ color: "#475569", fontSize: "0.74rem", fontWeight: 600 }}>
                      {startCity} → {suggestion.destination}
                    </Typography>
                  </Box>
                  <Typography sx={{ color: "#64748b", fontSize: "0.76rem", lineHeight: 1.5, mt: 1.25 }}>
                    {suggestion.shortDescription || suggestion.description}
                  </Typography>
                  <Typography sx={{ color: "#334155", fontSize: "0.74rem", fontWeight: 700, mt: 1 }}>
                    From ₹{Number(suggestion.basePrice || 0).toLocaleString("en-IN")} / person
                    {suggestion.travelStyles?.length ? ` · ${suggestion.travelStyles.slice(0, 2).join(" · ")}` : ""}
                  </Typography>
                  <Typography sx={{ color: "#166534", bgcolor: "#f0fdf4", borderRadius: "5px", p: 1, mt: 1.5, fontSize: "0.72rem", lineHeight: 1.45 }}>
                    <strong>Why it works:</strong> {suggestion.whyItWorks}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 15 }} />}
                    onClick={() => applySuggestion(suggestion)}
                    sx={{ bgcolor: "#0f172a", color: "#fff", borderRadius: "5px", fontWeight: 700, fontSize: "0.75rem", "&:hover": { bgcolor: "#1e293b" } }}
                  >
                    Use this idea
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  // ── Layout ─────────────────────────────────────────────────────────────────
  if (!manualMode) return renderSuggestionLanding();

  return (
    <Box sx={{ maxWidth: 1080, mx: "auto", pb: 8 }}>
      {/* Page title */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.3rem", color: "#0f172a" }}>Create a New Tour</Typography>
        <Typography sx={{ fontSize: "0.8rem", color: "#64748b" }}>
          AI-assisted tour builder · all fields match the EpicJourneys standard
        </Typography>
      </Box>

      {/* Step progress bar */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 1 }, mb: 1, flexWrap: "wrap" }}>
          {STEPS.map((s, i) => (
            <Box
              key={s.id}
              onClick={() => { if (i < currentStep) setCurrentStep(i); }}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                flex: { sm: 1 },
                minWidth: 0,
                cursor: i < currentStep ? "pointer" : "default",
              }}
            >
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: i < currentStep ? "#059669" : i === currentStep ? "#0f172a" : "#e2e8f0",
                  color: i <= currentStep ? "#fff" : "#94a3b8",
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  flexShrink: 0,
                  transition: "all 0.2s",
                }}
              >
                {i < currentStep ? <CheckRoundedIcon sx={{ fontSize: 12 }} /> : i + 1}
              </Box>
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: i === currentStep ? 700 : 500,
                  color: i === currentStep ? "#0f172a" : i < currentStep ? "#059669" : "#94a3b8",
                  display: { xs: i === currentStep ? "block" : "none", sm: "block" },
                }}
              >
                {s.label}
              </Typography>
            </Box>
          ))}
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 3,
            borderRadius: 2,
            bgcolor: "#e2e8f0",
            "& .MuiLinearProgress-bar": { bgcolor: "#0f172a", borderRadius: 2 },
          }}
        />
      </Box>

      {/* Step content */}
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: "1px solid #e2e8f0", borderRadius: "8px", bgcolor: "#fff", minHeight: 400 }}>
        {renderStep()}
      </Paper>

      {/* Navigation */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
        <Button
          onClick={goBack}
          disabled={currentStep === 0}
          startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 16 }} />}
          sx={{ color: "#64748b", borderRadius: "6px", fontWeight: 600 }}
        >
          Back
        </Button>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {stepErrors[currentStep] && currentStep < STEPS.length - 1 && (
            <Typography sx={{ fontSize: "0.75rem", color: "#ef4444" }}>
              {stepErrors[currentStep]}
            </Typography>
          )}
          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={goNext}
              disabled={!canGoNext}
              endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />}
              variant="contained"
              sx={{
                bgcolor: "#0f172a",
                color: "#fff",
                borderRadius: "6px",
                fontWeight: 700,
                px: 2.5,
                "&:hover": { bgcolor: "#1e293b" },
                "&.Mui-disabled": { bgcolor: "#e2e8f0", color: "#94a3b8" },
              }}
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              variant="contained"
              startIcon={submitting ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <SendRoundedIcon sx={{ fontSize: 16 }} />}
              sx={{
                bgcolor: "#059669",
                color: "#fff",
                borderRadius: "6px",
                fontWeight: 700,
                px: 3,
                "&:hover": { bgcolor: "#047857" },
              }}
            >
              {submitting ? "Publishing…" : "Publish Tour"}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
