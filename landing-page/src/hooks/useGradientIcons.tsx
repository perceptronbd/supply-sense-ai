'use client';
import { useTheme } from 'next-themes';
import { useEffect, useMemo, useState } from 'react';
import { IconType } from '../components/icons';

const useGradientIcons = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  const icons = useMemo(() => {
    // Use system theme as fallback during hydration or when theme is undefined
    const isDark = mounted ? resolvedTheme === 'dark' : false;
    const color1 = isDark ? '#F08977' : '#bf3d26';
    const color2 = isDark ? '#F8C9C0' : '#6e2316';

    const themeId = mounted ? resolvedTheme || 'light' : 'light';

    const Icons = {
      Settings: (props: IconType) => (
        <svg viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
          <circle
            cx="15.4921"
            cy="15.4921"
            r="3.87298"
            stroke={`url(#paint0_linear_settings_${themeId})`}
            strokeWidth="1.5"
          />
          <path
            d="M17.7712 2.77857C17.2967 2.58203 16.6951 2.58203 15.4921 2.58203C14.289 2.58203 13.6875 2.58203 13.213 2.77857C12.5803 3.04063 12.0777 3.54328 11.8156 4.17594C11.696 4.46474 11.6492 4.80061 11.6309 5.29053C11.604 6.0105 11.2347 6.67693 10.6108 7.03716C9.98683 7.39739 9.22508 7.38394 8.58811 7.04727C8.15466 6.81817 7.84038 6.69078 7.53045 6.64998C6.85152 6.56059 6.16489 6.74457 5.62162 7.16145C5.21416 7.4741 4.91339 7.99504 4.31187 9.03692C3.71034 10.0788 3.40958 10.5997 3.34254 11.1089C3.25316 11.7879 3.43714 12.4745 3.85401 13.0178C4.04428 13.2657 4.3117 13.4742 4.72673 13.735C5.33687 14.1183 5.72945 14.7714 5.72941 15.492C5.72938 16.2125 5.33681 16.8655 4.72673 17.2488C4.31163 17.5096 4.04418 17.7181 3.85388 17.9661C3.43701 18.5094 3.25303 19.196 3.34241 19.8749C3.40945 20.3841 3.71021 20.9051 4.31174 21.9469C4.91327 22.9888 5.21403 23.5098 5.62149 23.8224C6.16477 24.2393 6.8514 24.4233 7.53032 24.3339C7.84023 24.2931 8.1545 24.1657 8.58791 23.9366C9.22492 23.5999 9.98673 23.5865 10.6107 23.9467C11.2347 24.307 11.6039 24.9735 11.6309 25.6935C11.6492 26.1834 11.696 26.5192 11.8156 26.808C12.0777 27.4407 12.5803 27.9433 13.213 28.2054C13.6875 28.4019 14.289 28.4019 15.4921 28.4019C16.6951 28.4019 17.2967 28.4019 17.7712 28.2054C18.4038 27.9433 18.9065 27.4407 19.1685 26.808C19.2882 26.5192 19.335 26.1833 19.3533 25.6934C19.3802 24.9734 19.7494 24.307 20.3733 23.9467C20.9973 23.5864 21.7591 23.5999 22.3962 23.9366C22.8296 24.1656 23.1438 24.293 23.4537 24.3338C24.1326 24.4232 24.8193 24.2392 25.3625 23.8223C25.77 23.5097 26.0708 22.9887 26.6723 21.9469C27.2738 20.905 27.5746 20.384 27.6416 19.8748C27.731 19.1959 27.547 18.5093 27.1302 17.966C26.9399 17.718 26.6724 17.5096 26.2574 17.2488C25.6473 16.8654 25.2547 16.2124 25.2547 15.4919C25.2548 14.7714 25.6473 14.1185 26.2574 13.7352C26.6725 13.4743 26.94 13.2659 27.1303 13.0178C27.5471 12.4746 27.7311 11.7879 27.6417 11.109C27.5747 10.5998 27.2739 10.0789 26.6724 9.037C26.0709 7.99513 25.7701 7.47419 25.3627 7.16153C24.8194 6.74466 24.1328 6.56068 23.4538 6.65006C23.1439 6.69087 22.8297 6.81825 22.3963 7.04732C21.7592 7.384 20.9974 7.39746 20.3734 7.0372C19.7495 6.67694 19.3802 6.01047 19.3533 5.29046C19.335 4.80058 19.2881 4.46473 19.1685 4.17594C18.9065 3.54328 18.4038 3.04063 17.7712 2.77857Z"
            stroke={`url(#paint1_linear_settings_${themeId})`}
            strokeWidth="1.5"
          />
          <defs>
            <linearGradient
              id={`paint0_linear_settings_${themeId}`}
              x1="15.4921"
              y1="11.6191"
              x2="15.4921"
              y2="19.3651"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor={color1} />
              <stop offset="1" stopColor={color2} />
            </linearGradient>
            <linearGradient
              id={`paint1_linear_settings_${themeId}`}
              x1="15.4921"
              y1="2.58203"
              x2="15.4921"
              y2="28.4019"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor={color1} />
              <stop offset="1" stopColor={color2} />
            </linearGradient>
          </defs>
        </svg>
      ),
      Search: (props: IconType) => (
        <svg
          width="40"
          height="41"
          viewBox="0 0 40 41"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          {...props}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M19.1668 5.03516C11.1127 5.03516 4.5835 11.5643 4.5835 19.6185C4.5835 27.6726 11.1127 34.2018 19.1668 34.2018C27.221 34.2018 33.7502 27.6726 33.7502 19.6185C33.7502 11.5643 27.221 5.03516 19.1668 5.03516ZM2.0835 19.6185C2.0835 10.1836 9.73197 2.53516 19.1668 2.53516C28.6017 2.53516 36.2502 10.1836 36.2502 19.6185C36.2502 23.886 34.6854 27.7881 32.0983 30.7822L37.5507 36.2346C38.0389 36.7228 38.0389 37.5142 37.5507 38.0024C37.0626 38.4905 36.2711 38.4905 35.7829 38.0024L30.3305 32.5499C27.3364 35.137 23.4344 36.7018 19.1668 36.7018C9.73197 36.7018 2.0835 29.0534 2.0835 19.6185Z"
            fill="white"
            stroke={`url(#paint0_linear_search_${themeId})`}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient
              id={`paint0_linear_search_${themeId}`}
              x1="20.0002"
              y1="2.53516"
              x2="20.0002"
              y2="38.3685"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor={color1} />
              <stop offset="1" stopColor={color2} />
            </linearGradient>
          </defs>
        </svg>
      ),
      DangerCircle: (props: IconType) => (
        <svg
          width="31"
          height="32"
          viewBox="0 0 31 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          {...props}
        >
          <circle
            cx="15.492"
            cy="16.4764"
            r="12.9099"
            stroke={`url(#paint0_linear_danger_${themeId})`}
            strokeWidth="1.5"
          />
          <path
            d="M15.4917 10.0215V17.7675"
            stroke={`url(#paint1_linear_danger_${themeId})`}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="15.4922" cy="21.6406" r="1.29099" fill={color2} />
          <defs>
            <linearGradient
              id={`paint0_linear_danger_${themeId}`}
              x1="15.492"
              y1="3.56641"
              x2="15.492"
              y2="29.3863"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor={color1} />
              <stop offset="1" stopColor={color2} />
            </linearGradient>
            <linearGradient
              id={`paint1_linear_danger_${themeId}`}
              x1="15.9917"
              y1="10.0215"
              x2="15.9917"
              y2="17.7675"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor={color1} />
              <stop offset="1" stopColor={color2} />
            </linearGradient>
          </defs>
        </svg>
      ),
      Clock: (props: IconType) => (
        <svg
          width="31"
          height="32"
          viewBox="0 0 31 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          {...props}
        >
          <circle
            opacity="0.5"
            cx="15.492"
            cy="16.4588"
            r="12.9099"
            stroke={`url(#paint0_linear_clock_${themeId})`}
            strokeWidth="1.5"
          />
          <path
            d="M15.4917 11.2949V16.4589L18.7192 19.6864"
            stroke={`url(#paint1_linear_clock_${themeId})`}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient
              id={`paint0_linear_clock_${themeId}`}
              x1="15.492"
              y1="3.54883"
              x2="15.492"
              y2="29.3687"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor={color1} />
              <stop offset="1" stopColor={color2} />
            </linearGradient>
            <linearGradient
              id={`paint1_linear_clock_${themeId}`}
              x1="17.1054"
              y1="11.2949"
              x2="17.1054"
              y2="19.6864"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor={color1} />
              <stop offset="1" stopColor={color2} />
            </linearGradient>
          </defs>
        </svg>
      ),
    };

    return Icons;
  }, [mounted, resolvedTheme]);

  return icons;
};

export default useGradientIcons;
