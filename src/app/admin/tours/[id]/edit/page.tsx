"use client";

import { useParams } from "next/navigation";
import TourForm from "@/components/admin/TourForm";

export default function AdminEditTourPage() {
  const params = useParams();
  return <TourForm tourId={params?.id as string} />;
}
