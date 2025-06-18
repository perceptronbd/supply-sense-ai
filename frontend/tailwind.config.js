const { heroui } = require('@heroui/react');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './{src,pages,components,app}/**/*.{ts,tsx,js,jsx,html}',
    '!./{src,pages,components,app}/**/*.{stories,spec}.{ts,tsx,js,jsx,html}',
    '../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: [
          'var(--font-display)',
          'Manrope',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
        ],
        sans: [
          'var(--font-sans)',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
        ],
        mono: [
          'var(--font-mono)',
          'JetBrains Mono',
          'SF Mono',
          'Monaco',
          'Inconsolata',
          'Roboto Mono',
          'Source Code Pro',
          'monospace',
        ],
        data: ['var(--font-sans)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        bigStone: {
          50: '#75AFD7',
          100: '#699FC6',
          200: '#5181A2',
          300: '#3A627F',
          400: '#22445B',
          500: '#0A2538',
          600: '#081E2D',
          700: '#061622',
          800: '#040F16',
          900: '#02070B',
          950: '#010406',
        },
        pomegranate: {
          50: '#FDEDEA',
          100: '#FADBD5',
          200: '#F6B7AB',
          300: '#F19282',
          400: '#ED6E58',
          500: '#E84A2E',
          600: '#BA3B25',
          700: '#8B2C1C',
          800: '#5D1E12',
          900: '#2E0F09',
          950: '#170705',
        },
        pavlova: {
          50: '#FCFAF5',
          100: '#F9F5EB',
          200: '#F3EBD7',
          300: '#EEE0C4',
          400: '#E8D6B0',
          500: '#E2CC9C',
          600: '#C2AE81',
          700: '#A28F66',
          800: '#83714A',
          900: '#63522F',
          950: '#534322',
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [
    heroui({
      addCommonColors: true,
      themes: {
        light: {
          layout: {
            fontSize: {
              tiny: '0.75rem',
              small: '0.875rem',
              medium: '1rem',
              large: '1.125rem',
            },
            lineHeight: {
              tiny: '1rem',
              small: '1.25rem',
              medium: '1.5rem',
              large: '1.75rem',
            },
            radius: {
              small: '8px',
              medium: '12px',
              large: '14px',
            },
            borderWidth: {
              small: '1px',
              medium: '2px',
              large: '3px',
            },
            disabledOpacity: '0.5',
          },
          colors: {
            default: {
              50: '#FCFAF5', // pavlova.50
              100: '#F9F5EB', // pavlova.100
              200: '#F3EBD7', // pavlova.200
              300: '#EEE0C4', // pavlova.300
              400: '#E8D6B0', // pavlova.400
              500: '#E2CC9C', // pavlova.500
              600: '#C2AE81', // pavlova.600
              700: '#A28F66', // pavlova.700
              800: '#83714A', // pavlova.800
              900: '#63522F', // pavlova.900
              foreground: '#0A2538', // bigStone.500
              DEFAULT: '#E2CC9C', // pavlova.500
            },
            primary: {
              50: '#75AFD7', // bigStone.50
              100: '#699FC6', // bigStone.100
              200: '#5181A2', // bigStone.200
              300: '#3A627F', // bigStone.300
              400: '#22445B', // bigStone.400
              500: '#0A2538', // bigStone.500
              600: '#081E2D', // bigStone.600
              700: '#061622', // bigStone.700
              800: '#040F16', // bigStone.800
              900: '#02070B', // bigStone.900
              foreground: '#FCFAF5', // pavlova.50
              DEFAULT: '#0A2538', // bigStone.500
            },
            secondary: {
              50: '#FDEDEA', // pomegranate.50
              100: '#FADBD5', // pomegranate.100
              200: '#F6B7AB', // pomegranate.200
              300: '#F19282', // pomegranate.300
              400: '#ED6E58', // pomegranate.400
              500: '#E84A2E', // pomegranate.500
              600: '#BA3B25', // pomegranate.600
              700: '#8B2C1C', // pomegranate.700
              800: '#5D1E12', // pomegranate.800
              900: '#2E0F09', // pomegranate.900
              foreground: '#FCFAF5', // pavlova.50
              DEFAULT: '#E84A2E', // pomegranate.500
            },
            success: {
              50: '#eff8f0',
              100: '#d9eeda',
              200: '#c3e4c5',
              300: '#addbaf',
              400: '#97d19a',
              500: '#81c784',
              600: '#6aa46d',
              700: '#548156',
              800: '#3d5f3f',
              900: '#273c28',
              foreground: '#000',
              DEFAULT: '#81c784',
            },
            warning: {
              50: '#fff6e9',
              100: '#ffe9ca',
              200: '#ffddaa',
              300: '#ffd08b',
              400: '#ffc46c',
              500: '#ffb74d',
              600: '#d29740',
              700: '#a67732',
              800: '#795725',
              900: '#4d3717',
              foreground: '#000',
              DEFAULT: '#ffb74d',
            },
            danger: {
              50: '#fceeee',
              100: '#f7d5d5',
              200: '#f3bdbd',
              300: '#eea4a4',
              400: '#ea8c8c',
              500: '#e57373',
              600: '#bd5f5f',
              700: '#954b4b',
              800: '#6d3737',
              900: '#452323',
              foreground: '#000',
              DEFAULT: '#e57373',
            },
            background: '#FCFAF5', // pavlova.50 for warm, clean background
            foreground: '#0A2538', // bigStone.500 for readable text
            content1: {
              DEFAULT: '#F9F5EB', // pavlova.100
              foreground: '#0A2538',
            },
            content2: {
              DEFAULT: '#F3EBD7', // pavlova.200
              foreground: '#0A2538',
            },
            content3: {
              DEFAULT: '#EEE0C4', // pavlova.300
              foreground: '#0A2538',
            },
            content4: {
              DEFAULT: '#E8D6B0', // pavlova.400
              foreground: '#0A2538',
            },
            focus: '#db924b',
            overlay: '#000000',
          },
        },
        dark: {
          layout: {
            fontSize: {
              tiny: '0.75rem',
              small: '0.875rem',
              medium: '1rem',
              large: '1.125rem',
            },
            lineHeight: {
              tiny: '1rem',
              small: '1.25rem',
              medium: '1.5rem',
              large: '1.75rem',
            },
            radius: {
              small: '8px',
              medium: '12px',
              large: '14px',
            },
            borderWidth: {
              small: '1px',
              medium: '2px',
              large: '3px',
            },
            disabledOpacity: '0.5',
          },
          colors: {
            default: {
              50: '#02070B', // bigStone.900 (inverted)
              100: '#040F16', // bigStone.800
              200: '#061622', // bigStone.700
              300: '#081E2D', // bigStone.600
              400: '#0A2538', // bigStone.500
              500: '#22445B', // bigStone.400
              600: '#3A627F', // bigStone.300
              700: '#5181A2', // bigStone.200
              800: '#699FC6', // bigStone.100
              900: '#75AFD7', // bigStone.50
              foreground: '#F9F5EB', // pavlova.100
              DEFAULT: '#22445B', // bigStone.400
            },
            primary: {
              50: '#63522F', // pavlova.900 (inverted for dark)
              100: '#83714A', // pavlova.800
              200: '#A28F66', // pavlova.700
              300: '#C2AE81', // pavlova.600
              400: '#E2CC9C', // pavlova.500
              500: '#E8D6B0', // pavlova.400
              600: '#EEE0C4', // pavlova.300
              700: '#F3EBD7', // pavlova.200
              800: '#F9F5EB', // pavlova.100
              900: '#FCFAF5', // pavlova.50
              foreground: '#63522F', // pavlova.900
              DEFAULT: '#C2AE81', // pavlova.600
            },
            secondary: {
              50: '#2E0F09', // pomegranate.900 (inverted for dark)
              100: '#5D1E12', // pomegranate.800
              200: '#8B2C1C', // pomegranate.700
              300: '#BA3B25', // pomegranate.600
              400: '#E84A2E', // pomegranate.500
              500: '#ED6E58', // pomegranate.400
              600: '#F19282', // pomegranate.300
              700: '#F6B7AB', // pomegranate.200
              800: '#FADBD5', // pomegranate.100
              900: '#FDEDEA', // pomegranate.50
              foreground: '#FDEDEA', // pomegranate.50
              DEFAULT: '#BA3B25', // pomegranate.600
            },
            success: {
              50: '#112b12',
              100: '#1b431d',
              200: '#245c27',
              300: '#2e7532',
              400: '#388e3c',
              500: '#5ba25e',
              600: '#7eb680',
              700: '#a0c9a2',
              800: '#c3ddc5',
              900: '#e6f1e7',
              foreground: '#000',
              DEFAULT: '#388e3c',
            },
            warning: {
              50: '#4a2500',
              100: '#743b00',
              200: '#9f5100',
              300: '#ca6600',
              400: '#f57c00',
              500: '#f7932d',
              600: '#f9aa59',
              700: '#fac186',
              800: '#fcd8b3',
              900: '#feefdf',
              foreground: '#000',
              DEFAULT: '#f57c00',
            },
            danger: {
              50: '#3f0e0e',
              100: '#641616',
              200: '#891f1f',
              300: '#ae2727',
              400: '#d32f2f',
              500: '#db5353',
              600: '#e27878',
              700: '#ea9c9c',
              800: '#f2c1c1',
              900: '#fae5e5',
              foreground: '#fff',
              DEFAULT: '#d32f2f',
            },
            background: '#02070B', // bigStone.900 for dark background
            foreground: '#F9F5EB', // pavlova.100 for readable text
            content1: {
              DEFAULT: '#040F16', // bigStone.800
              foreground: '#F9F5EB',
            },
            content2: {
              DEFAULT: '#061622', // bigStone.700
              foreground: '#F9F5EB',
            },
            content3: {
              DEFAULT: '#081E2D', // bigStone.600
              foreground: '#F9F5EB',
            },
            content4: {
              DEFAULT: '#0A2538', // bigStone.500
              foreground: '#F9F5EB',
            },
            focus: '#000000',
            overlay: '#ffffff',
          },
        },
      },
    }),
  ],
};
