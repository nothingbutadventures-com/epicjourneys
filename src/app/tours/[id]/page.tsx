"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Box, Button } from "@mui/material";
import { combinedItinerary } from "@/lib/launch-shared";
import { depositAmount } from "@/lib/deposit";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TourHero from "@/components/tour/TourHero";
import TourSkeleton from "@/components/tour/TourSkeleton";
import PlanTrip from "@/components/tour/PlanTrip";
import Aside from "@/components/tour/Aside";
import { OtherTours, DatesRequest } from "@/components/tour/Bottom";
import { TitleBlock, SectionBar, Overview, Photos, GettingThere, Itinerary, Included, Safety, Food, Reviews, Faqs } from "@/components/tour/sections";
import { Rule } from "@/components/tour/ui";

/** A date belongs to "base" (Joining / Leaving at the tour's own start) or to a partner city. */
const depKey = (d: any) => (d.isBase ? "base" : d.cityId);
const utc = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleDateString("en-IN", { ...o, timeZone: "UTC" });

export default function TourDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDepartureId, setSelectedDepartureId] = useState<string>("");
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [numberOfTravelers, setNumberOfTravelers] = useState<number>(2);
  const [reviews, setReviews] = useState<any[]>([]);
  const [allTours, setAllTours] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tours/${id}`);
        const data = await res.json();
        if (data.success && data.data) setTour(data.data);
        else setError(data.error || "Tour not found");
      } catch (e: any) {
        setError(e.message || "Failed to load tour details");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    fetch("/api/reviews").then((r) => r.json()).then((d) => d.success && setReviews(d.data || [])).catch(() => {});
    fetch("/api/tours").then((r) => r.json()).then((d) => d.success && setAllTours(d.data || [])).catch(() => {});
  }, []);

  // Where the visitor leaves from: ?from=<cityId> from the listing, else the first city with a partner.
  const initialised = useRef(false);
  const cityOptions = useMemo(() => {
    if (!tour) return [] as { id: string; name: string; short: string; disabled: boolean }[];
    const deps: any[] = tour.departures || [];
    const baseName = tour.baseStartCity?.name;
    const opts = [{ id: "base", name: `Joining / Leaving${baseName ? ` — ${baseName}` : ""}`, short: baseName || "Tour start", disabled: !deps.some((d) => d.isBase) }];
    const seen = new Set<string>();
    for (const c of tour.startCities || []) {
      seen.add(c.id);
      opts.push({ id: c.id, name: c.name, short: c.name, disabled: !deps.some((d) => !d.isBase && d.cityId === c.id) });
    }
    for (const d of deps) {
      if (!d.isBase && d.cityId && !seen.has(d.cityId)) {
        seen.add(d.cityId);
        opts.push({ id: d.cityId, name: d.cityName, short: d.cityName, disabled: false });
      }
    }
    return opts;
  }, [tour]);
  const partnerCities = cityOptions.filter((c) => c.id !== "base" && !c.disabled);

  const fromParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("from") : null;
  const homeCityId = partnerCities.find((c) => c.id === fromParam)?.id || partnerCities[0]?.id || "";

  useEffect(() => {
    if (!tour || initialised.current) return;
    initialised.current = true;
    const deps: any[] = tour.departures || [];
    if (fromParam && deps.some((d) => depKey(d) === fromParam)) setSelectedCityId(fromParam);
    else if (fromParam && deps.some((d) => d.isBase && d.cityId === fromParam)) setSelectedCityId("base");
    else if (homeCityId) setSelectedCityId(homeCityId);
    else if (cityOptions[0] && !cityOptions[0].disabled) setSelectedCityId("base");
  }, [tour, homeCityId, cityOptions, fromParam]);

  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
    setSelectedDepartureId("");
    const url = new URL(window.location.href);
    if (cityId) url.searchParams.set("from", cityId);
    else url.searchParams.delete("from");
    window.history.replaceState(null, "", url.toString());
  };

  // Remember this tour so the homepage can offer "Pick up where you left off".
  useEffect(() => {
    if (!tour?._id) return;
    try {
      const item = { id: String(tour._id), slug: tour.slug || String(tour._id), title: tour.title, image: tour.coverImage, days: tour.durationDays, nights: tour.durationNights, price: tour.priceInr };
      const prev = JSON.parse(localStorage.getItem("ej_recent") || "[]");
      const next = [item, ...(Array.isArray(prev) ? prev.filter((x: any) => x?.id !== item.id) : [])].slice(0, 4);
      localStorage.setItem("ej_recent", JSON.stringify(next));
    } catch {}
  }, [tour?._id]);

  const allDepartures: any[] = tour?.departures || [];
  const selectedCity = cityOptions.find((c) => c.id === selectedCityId) || null;
  const departures: any[] = selectedCity ? allDepartures.filter((d) => depKey(d) === selectedCityId) : [];

  // The first open date is picked for the visitor, as in the design.
  useEffect(() => {
    if (!departures.length || selectedDepartureId) return;
    const first = departures.find((d) => d.available > 0);
    if (first) {
      setSelectedDepartureId(first._id);
      setNumberOfTravelers((n) => Math.min(Math.max(1, n), first.available));
    }
  }, [departures, selectedDepartureId]);

  const reviewsForTour = useMemo(() => (tour ? reviews.filter((r) => (r.tourId && r.tourId === tour._id) || r.tourTitle === tour.title) : []), [reviews, tour]);
  const rating = useMemo(() => {
    const n = reviewsForTour.length;
    return { n, avg: n ? reviewsForTour.reduce((s, r) => s + r.rating, 0) / n : 0 };
  }, [reviewsForTour]);

  const others = useMemo(() => {
    if (!tour) return [];
    const rest = allTours.filter((t) => t._id !== tour._id);
    const here = (t: any) => (t.departures || []).some((d: any) => d.cityId?._id && d.cityId._id === selectedCityId);
    return [...rest.filter(here), ...rest.filter((t) => !here(t))].slice(0, 4);
  }, [allTours, tour, selectedCityId]);

  if (loading) return <TourSkeleton />;
  if (error || !tour) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <Box sx={{ flexGrow: 1, maxWidth: 560, mx: "auto", py: 10, px: 2, textAlign: "center" }}>
          <Box sx={{ fontFamily: "var(--font-baloo), sans-serif", fontSize: 36, mb: 2 }}>{error || "Tour not found"}</Box>
          <Button component={Link} href="/tours" variant="contained" sx={{ borderRadius: 0, bgcolor: "#0C0C0C", "&:hover": { bgcolor: "#262626" } }}>Back to all tours</Button>
        </Box>
        <Footer />
      </Box>
    );
  }

  const selectedDeparture = departures.find((d) => d._id === selectedDepartureId) || null;
  const itineraryDep: any = selectedDeparture || departures[0] || null;
  const itineraryDays: any[] = itineraryDep
    ? combinedItinerary(tour.itinerary || [], itineraryDep.startItinerary || [], itineraryDep.endItinerary || [])
    : (tour.itinerary || []).map((d: any, i: number) => ({ ...d, day: d.day ?? i + 1, segment: "main" }));
  const tripDays: number = itineraryDep?.durationDays || tour.durationDays;
  const tripNights = Math.max(0, tripDays - 1);

  const discount = selectedDeparture?.discountPercentage || 0;
  const pricePool = (selectedCity ? departures : allDepartures).map((d) => d.price);
  const basePrice = selectedDeparture ? selectedDeparture.price : pricePool.length ? Math.min(...pricePool) : tour.priceInr || 0;
  const unitPrice = Math.round(basePrice * (1 - discount / 100));
  const totalPrice = unitPrice * numberOfTravelers;
  const maxTravelers = selectedDeparture ? selectedDeparture.available : 0;
  const canBook = Boolean(selectedDeparture) && maxTravelers >= numberOfTravelers && numberOfTravelers >= 1;
  const depositCfg = { type: tour.depositType, value: tour.depositValue };
  const payNow = depositAmount(totalPrice, numberOfTravelers, depositCfg);

  const cityName = selectedCity?.short || "your town";
  const place = tour.targetCity || tour.state || "the destination";
  const dateLabel = selectedDeparture ? utc(selectedDeparture.startDate, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : null;

  const selectDeparture = (d: any) => {
    if (d.available <= 0) return;
    setSelectedDepartureId(d._id);
    setNumberOfTravelers((n) => Math.min(Math.max(1, n), d.available));
  };
  const goToCheckout = () => {
    if (!canBook) return;
    const qs = new URLSearchParams({ tour: tour.slug || tour._id, from: selectedCityId, departure: selectedDepartureId, travellers: String(numberOfTravelers), step: "travellers" });
    router.push(`/checkout?${qs.toString()}`);
  };

  const hasIncluded = (tour.inclusions || []).length + (tour.exclusions || []).length > 0;
  const tabs = [
    { id: "photos", label: "Photos & videos" },
    { id: "plan", label: "Dates & prices" },
    { id: "getting-there", label: "Getting there" },
    { id: "itinerary", label: "Day by day" },
    ...(hasIncluded ? [{ id: "included", label: "What's included" }] : []),
    { id: "safety", label: "Safety" },
    { id: "food", label: "Food" },
    ...(reviewsForTour.length ? [{ id: "reviews", label: "Reviews" }] : []),
    { id: "faqs", label: "FAQs" },
  ];

  return (
    <Box sx={{ bgcolor: "#fff", color: "#0C0C0C" }}>
      <TourHero image={tour.coverImage} cities={cityOptions} cityId={selectedCityId} cityLabel={cityName} onCity={handleCityChange} />

      <Box sx={{ maxWidth: 1160, mx: "auto", px: { xs: 2, lg: 0 }, display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", lg: "716px 380px" }, columnGap: "64px", alignItems: "start" }}>
        <Box sx={{ minWidth: 0, pb: "72px" }}>
          <TitleBlock tour={tour} city={cityName} rating={rating} />
          <SectionBar tabs={tabs} />
          <Overview tour={tour} city={cityName} partner="" days={tripDays} nights={tripNights} />
          <Rule />
          <Photos tour={tour} city={cityName} />
          <Rule />
          <PlanTrip
            cities={cityOptions}
            cityId={selectedCityId}
            onCity={handleCityChange}
            homeCityId={homeCityId}
            departures={departures}
            selected={selectedDeparture}
            onSelect={selectDeparture}
            travellers={numberOfTravelers}
            setTravellers={setNumberOfTravelers}
            max={maxTravelers}
            unit={unitPrice}
            total={totalPrice}
            pay={payNow}
            canBook={canBook}
            onBook={goToCheckout}
            cityName={cityName}
            partner=""
          />
          <Rule />
          <GettingThere city={cityName} partner="" place={place} />
          <Rule />
          <Itinerary days={itineraryDays} />
          {hasIncluded && (<><Rule /><Included price={unitPrice} city={cityName} inc={tour.inclusions || []} exc={tour.exclusions || []} /></>)}
          <Rule />
          <Safety place={place} />
          <Rule />
          <Food plan={tour.foodPlan} />
          {reviewsForTour.length > 0 && (<><Rule /><Reviews reviews={reviewsForTour} city={cityName} /></>)}
          <Rule />
          <Faqs faqs={tour.faqs} />
        </Box>

        <Box sx={{ pt: { lg: "40px" }, pb: { xs: 6, lg: 0 }, minWidth: 0, alignSelf: "stretch" }}>
          <Aside
            tour={tour}
            city={cityName}
            partner=""
            lounge={selectedCityId && selectedCityId !== "base" ? { city: cityName, ...((tour.startCities || []).find((c: any) => c.id === selectedCityId)?.partner || {}) } : null}
            rating={rating}
            from={unitPrice}
            was={discount > 0 ? basePrice : null}
            discount={discount}
            dateLabel={dateLabel}
            depositPerPerson={depositAmount(unitPrice, 1, depositCfg)}
            days={tripDays}
            nights={tripNights}
          />
        </Box>
      </Box>

      <OtherTours tours={others} city={cityName} cityId={selectedCityId} />
      <DatesRequest tourTitle={tour.title} city={selectedCity && selectedCity.id !== "base" ? selectedCity.short : ""} state={tour.state || ""} />
      <Footer />
    </Box>
  );
}
