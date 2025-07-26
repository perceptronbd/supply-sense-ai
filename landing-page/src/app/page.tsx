import Banner from '../components/sections/BannerSection';
import BuiltSection from '../components/sections/BuiltSection';
import Data from '../components/sections/DataSection';
import ExploreSection from '../components/sections/ExploreSection';
import QuestionSection from '../components/sections/QuestionSection';
import SupplySense from '../components/sections/SupplySense';
import Footer from '../components/ui/Footer';

const LandingPage = () => {
  return (
    <div className="relative overflow-x-hidden">
      {/* Banner */}
      <Banner />

      {/* Data section */}
      <Data />

      {/* Supply sense */}
      <SupplySense />

      {/* background radial effect */}

      {/* Questions and answers */}
      <QuestionSection />

      {/* Built Section */}
      <BuiltSection />

      {/* explore section */}
      <ExploreSection />
      <div className="bg-content1-foreground h-0.5 w-full px-0 opacity-30" />

      {/* footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
