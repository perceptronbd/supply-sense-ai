const dangerCircle = ({ className = '' }: { className?: string }) => {
  return (
    <svg
      width="31"
      height="32"
      viewBox="0 0 31 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className}`}
    >
      <circle
        cx="15.492"
        cy="16.4764"
        r="12.9099"
        stroke="url(#paint0_linear_8396_6031)"
        stroke-width="1.5"
      />
      <path
        d="M15.4917 10.0215V17.7675"
        stroke="url(#paint1_linear_8396_6031)"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <circle cx="15.4922" cy="21.6406" r="1.29099" fill="white" />
      <defs>
        <linearGradient
          id="paint0_linear_8396_6031"
          x1="15.492"
          y1="3.56641"
          x2="15.492"
          y2="29.3863"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#F08977" />
          <stop offset="1" stop-color="#F8C9C0" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_8396_6031"
          x1="15.9917"
          y1="10.0215"
          x2="15.9917"
          y2="17.7675"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#F08977" />
          <stop offset="1" stop-color="#F8C9C0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default dangerCircle;
