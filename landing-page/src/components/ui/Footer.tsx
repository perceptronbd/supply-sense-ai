import { Mailbox, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { FiFacebook, FiInstagram, FiLinkedin, FiYoutube } from 'react-icons/fi';
import fullLogo from '../../../public/assets/full-logo.svg';

const Footer = () => {
  return (
    <footer className="container px-4 mx-auto py-12 md:px-20 2xl:px-40">
      {/* first row */}
      <div className="flex justify-center flex-col lg:flex-row gap-y-10 md:justify-between items-start mb-12">
        {/* first column */}
        <div className="">
          <Image
            src={fullLogo}
            width={150}
            height={20}
            alt="fullLogo"
            className="w-56 mb-5 mx-auto md:mx-0"
          />
          <p className="text-content1-foreground mb-10 text-center md:text-start">
            Making operational data accessible through natural language.
          </p>
          <div className="flex gap-6 justify-center md:justify-start items-center">
            <FiFacebook size={24} />
            <FiYoutube size={24} />
            <FiLinkedin size={24} />
            <FiInstagram size={24} />
          </div>
        </div>

        {/* second column */}
        <div className="mx-auto md:mx-0">
          <h3 className="text-content1-foreground font-bold font-display text-lg mb-6 text-center md:text-start">
            Quick Links
          </h3>

          <Link href="#" className="">
            <p className="text-content1-foreground mb-6 text-center md:text-start font-medium">
              Features
            </p>
          </Link>
          <Link href="#" className="">
            <p className="text-content1-foreground mb-6 text-center md:text-start font-medium ">
              Use Cases
            </p>
          </Link>
          <Link href="#" className="">
            <p className="text-content1-foreground mb-6 text-center md:text-start font-medium">
              How It Works
            </p>
          </Link>
          <Link href="#" className="">
            <p className="text-content1-foreground mb-6 text-center md:text-start font-medium">
              Contact
            </p>
          </Link>
          <Link href="#" className="">
            <p className="text-content1-foreground mb-6 text-center md:text-start font-medium">
              Request Demo
            </p>
          </Link>
        </div>

        {/* third column */}
        <div className="mx-auto md:mx-0">
          <h3 className="text-content1-foreground font-bold font-display text-lg mb-6 text-center md:text-start">
            Contact Us
          </h3>

          <p className="flex gap-4 text-content1-foreground justify-center md:justify-start items-center mb-9 ">
            <MapPin size={24} /> somewhere anywhere
          </p>

          <p className="flex gap-4 text-content1-foreground justify-center md:justify-start items-center mb-9">
            <Mailbox size={24} /> somewhereanywhere@tesla.com
          </p>

          <p className="flex gap-4 text-content1-foreground justify-center md:justify-start items-center mb-9 ">
            <Phone size={24} /> 01234567891
          </p>
        </div>
      </div>

      {/* second row */}
      <div className="border-t-2 border-content1-foreground rounded-xl flex flex-col md:flex-row justify-center md:justify-between gap-y-5 items-center">
        {/* first column */}
        <div className="flex gap-6 justify-center md:justify-start items-center mt-4">
          <p className="text-content1-foreground font-medium">Terms of Use</p>
          <p className="text-content1-foreground font-medium">|</p>
          <p className="text-content1-foreground font-medium">Privacy Policy</p>
          <p className="text-content1-foreground font-medium">|</p>
          <p className="text-content1-foreground font-medium">Report an Issue</p>
        </div>

        {/* second column */}
        <p className="text-content1-foreground font-data text-sm text-center md:text-end">
          2025 Supply Sense. All rights reserved. @
        </p>
      </div>
    </footer>
  );
};

export default Footer;
