import Banner from '../components/sections/Banner';
import Data from '../components/sections/Data';
import QuestionSection from '../components/sections/QuestionSection';
import SupplySense from '../components/sections/SupplySense';
import Navbar from '../components/ui/Navbar';

const LandingPage = () => {
  return (
    <div className="">
      {/* navbar with horizontal line */}
      <Navbar />
      <div className="border-b-[1px] border-secondary" />

      {/* Banner */}
      <Banner />

      {/* Data section */}
      <Data />

      {/* Supply sense */}
      <SupplySense />

      {/* Questions and answers */}
      <QuestionSection />
    </div>
  );
};

export default LandingPage;
