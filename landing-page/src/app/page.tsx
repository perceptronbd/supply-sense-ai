import Banner from '../components/sections/Banner';
import Data from '../components/sections/Data';
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
    </div>
  );
};

export default LandingPage;
