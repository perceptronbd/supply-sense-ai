import {
  ArrowRight,
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  User,
  X,
  YoutubeIcon,
} from 'lucide-react';
import { SVGProps } from 'react';

export type IconType = SVGProps<SVGSVGElement>;

export const Icons = {
  SendIcon: (props: IconType) => (
    <svg viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M13.6074 3.89258C15.2179 3.35575 16.2819 3.58481 16.8262 4.12988C17.371 4.67553 17.5992 5.74185 17.0664 7.35254L14.5586 14.8682V14.8691C14.1485 16.1014 13.6844 16.9866 13.2158 17.5537C12.7459 18.1224 12.317 18.3203 11.9658 18.3203C11.6147 18.3201 11.1865 18.1222 10.7168 17.5537C10.2482 16.9866 9.78413 16.1014 9.37402 14.8691L8.63281 12.6357L8.55371 12.3975L8.31543 12.3184L6.08203 11.5771C4.84971 11.167 3.96458 10.7033 3.39746 10.2354C2.82878 9.76607 2.63091 9.3387 2.63086 8.98828C2.63086 8.63776 2.82872 8.20962 3.39746 7.73926C3.96478 7.27019 4.8505 6.80478 6.08301 6.39258L6.08203 6.3916L13.6074 3.89258ZM14.0703 6.66504C13.6334 6.22811 12.9164 6.22811 12.4795 6.66504L12.4785 6.66602L9.3125 9.84766C8.87563 10.2845 8.87574 11.0015 9.3125 11.4385C9.53621 11.6622 9.82461 11.7686 10.1084 11.7686C10.392 11.7684 10.6797 11.6621 10.9033 11.4385L10.9043 11.4375L14.0693 8.25391L14.0703 8.25488C14.5067 7.81803 14.5067 7.10186 14.0703 6.66504Z"
        stroke="currentColor"
      />
    </svg>
  ),
  ArrowRight: (props: IconType) => <ArrowRight {...props} />,
  User: (props: IconType) => <User {...props} />,
  Facebook: (props: IconType) => <FacebookIcon {...props} />,
  Instagram: (props: IconType) => <InstagramIcon {...props} />,
  Linkedin: (props: IconType) => <LinkedinIcon {...props} />,
  Youtube: (props: IconType) => <YoutubeIcon {...props} />,
  List: (props: IconType) => (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M26.6665 9.33398L5.33317 9.33398"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      />
      <path d="M20 16H5.33333" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      <path d="M12 22.666H5.33333" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
  ),
  X: (props: IconType) => <X {...props} />,
};
