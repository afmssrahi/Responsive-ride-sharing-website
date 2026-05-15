import { useEffect } from "react";
import { useLocation } from "react-router";
import { Hero } from "../components/Hero";
import { HowItWorks } from "../components/HowItWorks";
import { RideOptions } from "../components/RideOptions";
import { Features } from "../components/Features";
import { Testimonials } from "../components/Testimonials";
import { DriveWithUs } from "../components/DriveWithUs";
import { Footer } from "../components/Footer";

export function LandingPage() {
  const location = useLocation();

  // When we arrive at the landing page with a hash (from another page), scroll to the section
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      // small timeout so DOM is ready
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 80);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.hash]);

  return (
    <>
      <Hero />
      <HowItWorks />
      <RideOptions />
      <Features />
      <Testimonials />
      <DriveWithUs />
      <Footer />
    </>
  );
}
