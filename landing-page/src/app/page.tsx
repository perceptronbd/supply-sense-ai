import Banner from '../components/sections/BannerSection';
import BuiltSection from '../components/sections/BuiltSection';
import ExploreSection from '../components/sections/ExploreSection';
import Features from '../components/sections/FeatureSection';
import QuestionSection from '../components/sections/QuestionSection';
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
      <QuestionSection />

      {/* explore section */}
      <ExploreSection />
      <div className="bg-content1-foreground h-0.5 w-full px-0 opacity-30" />

      {/* footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
