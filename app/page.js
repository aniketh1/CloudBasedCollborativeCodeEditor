import Companion from "@/components/Companion";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <Companion />
      <Footer />
      <p>This is cold CICD of the Collab Dev</p>
    </>
  );
}
