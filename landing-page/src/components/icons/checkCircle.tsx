const checkCircle = ({ className = '' }: { className?: string }) => {
  return (
    <svg
      width="40"
      height="41"
      viewBox="0 0 40 41"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className}`}
    >
      <circle
        cx="20.0002"
        cy="20.4518"
        r="16.6667"
        stroke="url(#paint0_linear_8463_1894)"
        stroke-width="1.5"
      />
      <path
        d="M14.1665 21.2852L17.4998 24.6185L25.8332 16.2852"
        stroke="white"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <defs>
        <linearGradient
          id="paint0_linear_8463_1894"
          x1="20.0002"
          y1="3.78516"
          x2="20.0002"
          y2="37.1185"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#F08977" />
          <stop offset="1" stop-color="#F8C9C0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default checkCircle;
