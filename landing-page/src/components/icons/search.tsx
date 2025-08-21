const search = ({
  className,
  color1,
  color2,
}: {
  className?: string;
  color1?: string;
  color2?: string;
}) => {
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
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M19.1668 5.03516C11.1127 5.03516 4.5835 11.5643 4.5835 19.6185C4.5835 27.6726 11.1127 34.2018 19.1668 34.2018C27.221 34.2018 33.7502 27.6726 33.7502 19.6185C33.7502 11.5643 27.221 5.03516 19.1668 5.03516ZM2.0835 19.6185C2.0835 10.1836 9.73197 2.53516 19.1668 2.53516C28.6017 2.53516 36.2502 10.1836 36.2502 19.6185C36.2502 23.886 34.6854 27.7881 32.0983 30.7822L37.5507 36.2346C38.0389 36.7228 38.0389 37.5142 37.5507 38.0024C37.0626 38.4905 36.2711 38.4905 35.7829 38.0024L30.3305 32.5499C27.3364 35.137 23.4344 36.7018 19.1668 36.7018C9.73197 36.7018 2.0835 29.0534 2.0835 19.6185Z"
        fill="white"
        stroke="url(#paint0_linear_8463_1958)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient
          id="paint0_linear_8463_1958"
          x1="20.0002"
          y1="2.53516"
          x2="20.0002"
          y2="38.3685"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={color1 || '#F08977'} />
          <stop offset="1" stopColor={color2 || '#F8C9C0'} />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default search;
