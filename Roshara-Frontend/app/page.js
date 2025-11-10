// // app/page.jsx

"use client";

import HeroSection from "@components/home/HeroSection";
import NewArrivals from "@components/NewArrivals/NewArrivals";
import AllCollectionsSection from "./components/AllCollectionsSection";

export default function Homepage() {
  return (
    <main>
      <HeroSection />
      <NewArrivals />
      <AllCollectionsSection/>
    </main>
  );
}

