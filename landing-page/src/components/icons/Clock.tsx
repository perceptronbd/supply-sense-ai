const Clock = ({ className = '' }: { className?: string }) => {
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
        opacity="0.5"
        cx="15.492"
        cy="16.4588"
        r="12.9099"
        stroke="url(#paint0_linear_8396_6037)"
        stroke-width="1.5"
      />
      <path
        d="M15.4917 11.2949V16.4589L18.7192 19.6864"
        stroke="url(#paint1_linear_8396_6037)"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <defs>
        <linearGradient
          id="paint0_linear_8396_6037"
          x1="15.492"
          y1="3.54883"
          x2="15.492"
          y2="29.3687"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#F08977" />
          <stop offset="1" stop-color="#F8C9C0" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_8396_6037"
          x1="17.1054"
          y1="11.2949"
          x2="17.1054"
          y2="19.6864"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#F08977" />
          <stop offset="1" stop-color="#F8C9C0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default Clock;
