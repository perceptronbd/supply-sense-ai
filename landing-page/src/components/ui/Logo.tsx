import Image from 'next/image';
import logo from '../../../public/assets/full-logo.svg';

const Logo = () => {
  return (
    <div>
      <Image width={220} height={40} src={logo} alt="Logo" className="w-56 h-10" />
    </div>
  );
};

export default Logo;
