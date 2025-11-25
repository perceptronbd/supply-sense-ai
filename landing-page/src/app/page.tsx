import Banner from '../components/sections/BannerSection';
import BuiltSection from '../components/sections/BuiltSection';
import ContactSection from '../components/sections/ContactSection';
import Features from '../components/sections/FeatureSection';
import PricingSection from '../components/sections/PricingSection';
import QnASection from '../components/sections/QnASection';
import UseCaseSection from '../components/sections/UseCaseSection';
import Footer from '../components/ui/Footer';
import GlowEffects from '../components/ui/GlowEffects';
import Navbar from '../components/ui/Navbar';

const LandingPage = () => {
  return (
    <div id="/" className="relative container h-screen overflow-x-hidden overflow-y-auto">
      {/* Navbar */}
      <Navbar />
      {/* Banner */}
      <Banner />

      {/* Glow Effects */}
      <div>
        <GlowEffects />
      </div>

      {/* Data section */}
      <Features />

      {/* Built Section */}
      <BuiltSection />

      {/* Use Case Section */}
      <UseCaseSection />

      {/* pricing section */}
      <PricingSection />

      {/* QnA Section */}
      <QnASection />

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
