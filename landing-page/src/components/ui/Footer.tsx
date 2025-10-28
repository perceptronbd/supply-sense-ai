import { Mailbox, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { Icons } from '../icons';
import { FullLogo } from './Logo';

const Footer = () => {
  return (
    <footer className="container px-4 mx-auto py-12 md:px-20 2xl:px-40">
      {/* first row */}
      <div className="flex justify-center flex-col lg:flex-row gap-y-12 lg:justify-between items-start mb-12">
        {/* first column */}
        <div className="mx-auto lg:mx-0 flex-1 w-full">
          <FullLogo className="text-primary w-56 mb-5 mx-auto xl:mx-0" />

          <p className="text-content1-foreground mb-6 lg:mb-10 text-center xl:text-start max-w-72 mx-auto xl:mx-0">
            Making operational data accessible through natural language.
          </p>
          <div className="flex gap-6 justify-center xl:justify-start items-center">
            <Icons.Facebook className="h-6 w-6" />
            <Icons.Youtube className="h-6 w-6" />
            <Icons.Linkedin className="h-6 w-6" />
            <Icons.Instagram className="h-6 w-6" />
          </div>
        </div>

        {/* second column */}
        <div className="mx-auto lg:mx-0 flex-1 w-full">
          <h3 className="text-content1-foreground font-bold font-display text-lg mb-6 text-center xl:text-start">
            Quick Links
          </h3>

          <div className="flex flex-col items-center xl:items-start">
            <Link href="#" className="mb-4 lg:mb-6">
              <p className="text-content1-foreground text-center xl:text-start font-medium">
                Features
              </p>
            </Link>
            <Link href="#" className="mb-4 lg:mb-6">
              <p className="text-content1-foreground text-center xl:text-start font-medium">
                Use Cases
              </p>
            </Link>
            <Link href="#" className="mb-4 lg:mb-6">
              <p className="text-content1-foreground text-center xl:text-start font-medium">
                How It Works
              </p>
            </Link>
            <Link href="#" className="mb-4 lg:mb-6">
              <p className="text-content1-foreground text-center xl:text-start font-medium">
                Contact
              </p>
            </Link>
            <Link href="#" className="mb-0">
              <p className="text-content1-foreground text-center xl:text-start font-medium">
                Request Demo
              </p>
            </Link>
          </div>
        </div>

        {/* third column */}
        <div className="mx-auto lg:mx-0 flex-1 w-full">
          <h3 className="text-content1-foreground font-bold font-display text-lg mb-4 lg:mb-6 text-center xl:text-start">
            Contact Us
          </h3>

          <div className="flex flex-col items-center xl:items-start gap-4 lg:gap-9">
            <p className="flex gap-2 text-content1-foreground items-center">
              <MapPin size={24} className="flex-shrink-0" />
              <span>somewhere anywhere</span>
            </p>

            <p className="flex gap-2 text-content1-foreground items-center">
              <Mailbox size={24} className="flex-shrink-0" />
              <span>somewhereanywhere@tesla.com</span>
            </p>

            <p className="flex gap-2 text-content1-foreground items-center">
              <Phone size={24} className="flex-shrink-0" />
              <span>01234567891</span>
            </p>
          </div>
        </div>
      </div>

      {/* second row */}
      <div className="border-t-2 border-content1-foreground pt-6 flex flex-col md:flex-row justify-center lg:justify-between gap-y-5 items-center">
        {/* first column */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center lg:justify-start items-center">
          <p className="text-content1-foreground font-medium">Terms of Use</p>
          <p className="text-content1-foreground font-medium">|</p>
          <p className="text-content1-foreground font-medium">Privacy Policy</p>
          <p className="text-content1-foreground font-medium">|</p>
          <p className="text-content1-foreground font-medium">Report an Issue</p>
        </div>

        {/* second column */}
        <p className="text-content1-foreground font-data text-sm text-center lg:text-end">
          2025 Supply Sense. All rights reserved. ©
        </p>
      </div>
    </footer>
  );
};

export default Footer;
