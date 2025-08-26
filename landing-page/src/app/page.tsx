import Banner from '../components/sections/BannerSection';
import BuiltSection from '../components/sections/BuiltSection';
import ContactSection from '../components/sections/ContactSection';
import Features from '../components/sections/FeatureSection';
import UseCaseSection from '../components/sections/UseCaseSection';
import Footer from '../components/ui/Footer';
import GlowEffects from '../components/ui/GlowEffects';
import Navbar from '../components/ui/Navbar';

const LandingPage = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Banner */}
      <Banner />

      {/* Glow Effects */}
      <GlowEffects />

      {/* Data section */}
      <Features />

      {/* Built Section */}
      <BuiltSection />

      {/* Questions and answers */}
      <UseCaseSection />

      {/* explore section */}
      <ContactSection />

      <div className="px-4 md:px-0">
        <div className="bg-content1-foreground h-0.5 w-full opacity-30" />
      </div>

      {/* footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
