const document = ({ className = '' }: { className?: string }) => {
  return (
    <svg
      width="40"
      height="41"
      viewBox="0 0 40 41"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className}`}
    >
      <path
        d="M5 17.1185C5 10.8331 5 7.6904 6.95262 5.73778C8.90524 3.78516 12.0479 3.78516 18.3333 3.78516H21.6667C27.9521 3.78516 31.0948 3.78516 33.0474 5.73778C35 7.6904 35 10.8331 35 17.1185V23.7852C35 30.0706 35 33.2132 33.0474 35.1659C31.0948 37.1185 27.9521 37.1185 21.6667 37.1185H18.3333C12.0479 37.1185 8.90524 37.1185 6.95262 35.1659C5 33.2132 5 30.0706 5 23.7852V17.1185Z"
        stroke="url(#paint0_linear_8463_1986)"
        stroke-width="1.5"
      />
      <path d="M13.3335 17.1172H26.6668" stroke="white" stroke-width="1.5" stroke-linecap="round" />
      <path d="M13.3335 23.7852H21.6668" stroke="white" stroke-width="1.5" stroke-linecap="round" />
      <defs>
        <linearGradient
          id="paint0_linear_8463_1986"
          x1="20"
          y1="3.78516"
          x2="20"
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

export default document;
