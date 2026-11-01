"use client";

import React from "react";
import HomeHeader from "@/components/home/HomeHeader";

interface NavbarProps {
  userLocationName?: string;
  onLocationClick?: () => void;
}

/** The site-wide header (same as the homepage's), as a solid bar on inner pages. */
export default function Navbar(props: NavbarProps) {
  return <HomeHeader {...props} />;
}
