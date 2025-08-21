import Banner from '../components/sections/BannerSection';
import BuiltSection from '../components/sections/BuiltSection';
import ExploreSection from '../components/sections/ExploreSection';
import Features from '../components/sections/FeatureSection';
import QuestionSection from '../components/sections/QuestionSection';
import Footer from '../components/ui/Footer';
import Navbar from '../components/ui/Navbar';

const LandingPage = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Banner */}
      <Banner />

      {/* Glow effect - positioned at the top of the page */}
      <div className="absolute -top-5 right-40 w-60 h-[30%] bg-gradient-to-b from-primary-900/30 via-primary-900/10 to-transparent blur-2xl transform rotate-[37deg] origin-top-right z-1" />
      <div className="absolute -top-5 right-0 w-24 h-[35%] bg-gradient-to-b from-primary-900/50 via-primary-900/20 to-transparent blur-2xl transform rotate-[37deg] origin-top-right z-1" />
      <div className="absolute -top-5 -right-56 w-36 h-[35%] bg-gradient-to-b from-primary-900/50 via-primary-900/20 to-transparent blur-2xl transform rotate-[37deg] origin-top-right z-1" />
      <div className="absolute -top-5 -right-96 w-24 h-[45%] bg-gradient-to-b from-primary-900/30 via-primary-900/10 to-transparent blur-2xl transform rotate-[37deg] origin-top-right z-1" />

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
