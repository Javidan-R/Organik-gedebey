import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    screens: {
      xs: '475px',
      ...defaultTheme.screens,
      '3xl': '1920px',
    },
    extend: {
      // ========================
      // TAM RƏNG SİSTEMİ
      // ========================
      colors: {
        organic: {
          50: '#f0f9f0',
          100: '#daf1da',
          200: '#b7e4b7',
          300: '#8fd18f',
          400: '#6eba6e',
          500: '#4f9f4f',
          600: '#3d8140',
          700: '#2f6633',
          800: '#234f27',
          900: '#1b3a1e',
          950: '#0f2611',
        },
        cream: {
          50: '#fefcf5',
          100: '#fdf8e8',
          200: '#faf0cf',
          300: '#f6e5b3',
          400: '#f1d994',
          500: '#ecca73',
          600: '#e1b454',
          700: '#c99436',
          800: '#a9742a',
          900: '#8a5b22',
          950: '#6e471b',
        },
        earth: {
          50: '#faf7f4',
          100: '#f3ede7',
          200: '#e5dbd0',
          300: '#d4c5b6',
          400: '#c0ad98',
          500: '#ab947b',
          600: '#947b62',
          700: '#7b644e',
          800: '#614f3e',
          900: '#4c3d30',
          950: '#33281f',
        },
        accent: {
          50: '#fffbeb',
          100: '#fff4c9',
          200: '#ffe89a',
          300: '#ffd868',
          400: '#ffc642',
          500: '#ffb020',
          600: '#e89218',
          700: '#c57014',
          800: '#9d5310',
          900: '#7a3e0e',
          950: '#542708',
        },
      },
      // ========================
      // TİPOQRAFİYA SİSTEMİ
      // ========================
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        serif: ['Merriweather', ...defaultTheme.fontFamily.serif],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
        display: ['"Clash Display"', 'Inter', ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.2' }],
        '6xl': ['3.75rem', { lineHeight: '1.1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
      },
      // ========================
      // BOŞLUQ SİSTEMİ (SPACING)
      // ========================
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      // ========================
      // KÜNCƏ YUVARLAQLAŞDIRMA
      // ========================
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
      },
      // ========================
      // ANİMASİYA VƏ KEYFRAMES
      // ========================
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-down': 'fadeDown 0.6s ease-out forwards',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards',
        'slide-in-left': 'slideInLeft 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'shimmer': 'shimmer 3s infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-8px) translateX(4px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(79, 159, 79, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(79, 159, 79, 0)' },
        },
      },
      // ========================
      // KÖLGƏLƏR
      // ========================
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        glow: '0 0 15px rgba(79, 159, 79, 0.5)',
        innerMd: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        innerLg: 'inset 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
        card: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
        cardHover: '0 20px 30px -12px rgba(0, 0, 0, 0.1)',
      },
      // ========================
      // QRADYENT ARXA FONLAR
      // ========================
      backgroundImage: {
        'gradient-organic': 'linear-gradient(135deg, #2f6633 0%, #6eba6e 100%)',
        'gradient-cream': 'linear-gradient(120deg, #fefcf5 0%, #fdf8e8 100%)',
      },
      // ========================
      // KEÇİD FUNKSİYALARI
      // ========================
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
   
    function ({ addUtilities, addComponents, theme }: any) {
      // ========================
      // UTILITY CLASS'LAR
      // ========================
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
        '.text-shadow-sm': { textShadow: '0 1px 1px rgba(0,0,0,0.05)' },
        '.text-shadow': { textShadow: '0 2px 4px rgba(0,0,0,0.1)' },
        '.text-shadow-lg': { textShadow: '0 4px 8px rgba(0,0,0,0.12)' },
        '.text-shadow-none': { textShadow: 'none' },
        '.no-tap-highlight': {
          '-webkit-tap-highlight-color': 'transparent',
        },
      });

      // ========================
      // KOMPONENT CLASS'LAR (BÖYÜK BLOKLAR)
      // ========================
      addComponents({
        '.container-page': {
          maxWidth: theme('screens.2xl'),
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: theme('spacing.4'),
          paddingRight: theme('spacing.4'),
          '@screen sm': {
            paddingLeft: theme('spacing.6'),
            paddingRight: theme('spacing.6'),
          },
          '@screen lg': {
            paddingLeft: theme('spacing.8'),
            paddingRight: theme('spacing.8'),
          },
          '@screen xl': {
            paddingLeft: theme('spacing.10'),
            paddingRight: theme('spacing.10'),
          },
        },

        // SEASON BANNER KOMPONENTİ
        '.season-banner': {
          display: 'flex',
          alignItems: 'center',
          gap: theme('spacing.3'),
          borderRadius: theme('borderRadius.2xl'),
          borderWidth: '1px',
          padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
          boxShadow: theme('boxShadow.soft'),
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme('boxShadow.card'),
          },
          '&-emoji': {
            fontSize: theme('fontSize.2xl'),
            flexShrink: 0,
          },
          '&-content': {
            flex: 1,
          },
          '&-label': {
            fontSize: theme('fontSize.xs'),
            fontWeight: '900',
            lineHeight: theme('lineHeight.tight'),
          },
          '&-text': {
            fontSize: '0.6875rem', // 11px
            lineHeight: theme('lineHeight.tight'),
          },
        },

        // TOP BARN BANNER
        '.top-barn-banner': {
          position: 'relative',
          overflow: 'hidden',
          borderRadius: theme('borderRadius.3xl'),
          borderWidth: '1px',
          borderColor: theme('colors.amber.200'),
          backgroundImage: 'linear-gradient(to right, theme(colors.cream.50), theme(colors.cream.100), theme(colors.cream.50))',
          boxShadow: theme('boxShadow.soft'),
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: theme('boxShadow.card'),
          },
          '&-shimmer': {
            position: 'absolute',
            insetY: 0,
            width: '33.333%',
            backgroundImage: 'linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent)',
            transform: 'skewX(-12deg)',
            pointerEvents: 'none',
            animation: 'shimmer 3s infinite',
          },
          '&-content': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: theme('spacing.3'),
            padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
          },
          '&-offer': {
            display: 'flex',
            alignItems: 'center',
            gap: theme('spacing.3'),
            flex: 1,
            overflow: 'hidden',
          },
          '&-emoji': {
            fontSize: theme('fontSize.2xl'),
            flexShrink: 0,
          },
          '&-text-wrapper': {
            flex: 1,
            overflow: 'hidden',
            height: theme('spacing.6'),
          },
          '&-text': {
            fontSize: '0.6875rem',
            color: theme('colors.amber.800'),
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
          '&-bold': {
            fontWeight: '900',
            color: theme('colors.amber.900'),
          },
          '&-badge': {
            marginLeft: theme('spacing.2'),
            padding: `${theme('spacing.0.5')} ${theme('spacing.1.5')}`,
            borderRadius: '9999px',
            backgroundColor: theme('colors.amber.600'),
            color: 'white',
            fontSize: '0.5625rem', // 9px
            fontWeight: '900',
          },
          '&-controls': {
            display: 'flex',
            alignItems: 'center',
            gap: theme('spacing.3'),
            flexShrink: 0,
          },
          '&-dots': {
            display: 'flex',
            gap: theme('spacing.1'),
            alignItems: 'center',
          },
          '&-dot': {
            height: theme('spacing.1.5'),
            borderRadius: '9999px',
            transition: 'all 0.2s',
            '&-active': {
              width: theme('spacing.4'),
              backgroundColor: theme('colors.amber.600'),
            },
            '&-inactive': {
              width: theme('spacing.1.5'),
              backgroundColor: theme('colors.amber.300'),
              '&:hover': { backgroundColor: theme('colors.amber.400') },
            },
          },
          '&-close': {
            color: theme('colors.amber.400'),
            transition: 'color 0.2s',
            '&:hover': { color: theme('colors.amber.700') },
          },
        },

        // STORY STRIP
        '.story-strip': {
          position: 'relative',
          overflow: 'hidden',
          borderRadius: theme('borderRadius.3xl'),
          backgroundImage: 'linear-gradient(to bottom right, theme(colors.organic.900), theme(colors.organic.800), theme(colors.organic.950))',
          padding: `${theme('spacing.6')} ${theme('spacing.6')}`,
          color: 'white',
          boxShadow: theme('boxShadow.2xl'),
          transition: 'box-shadow 0.2s ease',
          '@screen md': {
            padding: `${theme('spacing.8')} ${theme('spacing.8')}`,
          },
          '&-bg-blob': {
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            '& > div': {
              position: 'absolute',
              borderRadius: '9999px',
              filter: 'blur(64px)',
            },
            '&-1': {
              top: 0,
              right: 0,
              width: theme('spacing.72'),
              height: theme('spacing.72'),
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
            },
            '&-2': {
              bottom: 0,
              left: 0,
              width: theme('spacing.56'),
              height: theme('spacing.56'),
              backgroundColor: 'rgba(163, 230, 53, 0.1)',
            },
          },
          '&-tree': {
            position: 'absolute',
            right: theme('spacing.6'),
            top: theme('spacing.6'),
            opacity: 0.1,
          },
          '&-header': {
            display: 'flex',
            alignItems: 'center',
            gap: theme('spacing.2'),
            marginBottom: theme('spacing.5'),
            '&-icon': {
              fontSize: theme('fontSize.4xl'),
              animation: 'bounceSubtle 3s infinite',
            },
            '&-label': {
              fontSize: '0.6875rem',
              color: theme('colors.emerald.400'),
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: '700',
            },
          },
          '&-title': {
            fontSize: theme('fontSize.2xl'),
            fontWeight: '900',
            marginBottom: theme('spacing.3'),
            lineHeight: 1.2,
            '&-animated': {
              display: 'inline-block',
              animation: 'pulseSoft 4s infinite',
            },
          },
          '&-description': {
            fontSize: theme('fontSize.sm'),
            color: 'rgba(209, 250, 229, 0.8)',
            lineHeight: 1.625,
            marginBottom: theme('spacing.6'),
            maxWidth: '32rem',
          },
          '&-milestones': {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: theme('spacing.3'),
            marginBottom: theme('spacing.6'),
            '@screen md': {
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            },
          },
          '&-milestone': {
            borderRadius: theme('borderRadius.2xl'),
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: '1px',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            padding: `${theme('spacing.3')} ${theme('spacing.3')}`,
            textAlign: 'center',
            transition: 'all 0.2s',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              transform: 'translateY(-2px)',
            },
            '&-year': {
              fontSize: theme('fontSize.lg'),
              fontWeight: '900',
              color: theme('colors.emerald.300'),
            },
            '&-text': {
              fontSize: '0.6875rem',
              color: 'rgba(209, 250, 229, 0.7)',
              marginTop: theme('spacing.0.5'),
            },
          },
          '&-ctas': {
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: theme('spacing.3'),
          },
        },

        // CATEGORY STRIP
        '.category-strip': {
          display: 'flex',
          flexDirection: 'column',
          gap: theme('spacing.5'),
          '@screen sm': {
            gap: theme('spacing.6'),
          },
          '&-header': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: theme('spacing.3'),
          },
          '&-title-wrapper': {
            display: 'flex',
            alignItems: 'center',
            gap: theme('spacing.2.5'),
            '@screen sm': {
              gap: theme('spacing.3'),
            },
            flexShrink: 0,
          },
          '&-icon': {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: theme('spacing.9'),
            height: theme('spacing.9'),
            borderRadius: theme('borderRadius.xl'),
            backgroundImage: 'linear-gradient(to bottom right, theme(colors.organic.600), theme(colors.organic.700))',
            boxShadow: theme('boxShadow.md'),
            '@screen sm': {
              width: theme('spacing.10'),
              height: theme('spacing.10'),
              borderRadius: theme('borderRadius.2xl'),
            },
            '&-pulse': {
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              backgroundColor: 'rgba(79, 159, 79, 0.2)',
              animation: 'glowPulse 2.5s infinite',
            },
            '&-svg': {
              width: theme('spacing.4'),
              height: theme('spacing.4'),
              color: 'white',
              '@screen sm': {
                width: theme('spacing.5'),
                height: theme('spacing.5'),
              },
            },
          },
          '&-title': {
            fontSize: theme('fontSize.sm'),
            fontWeight: '900',
            color: theme('colors.organic.950'),
            letterSpacing: '-0.025em',
            '@screen sm': {
              fontSize: theme('fontSize.base'),
            },
          },
          '&-subtitle': {
            fontSize: '0.625rem',
            fontWeight: '500',
            color: 'rgba(21, 128, 61, 0.7)',
            '@screen sm': {
              fontSize: '0.6875rem',
            },
          },
          '&-controls': {
            display: 'flex',
            alignItems: 'center',
            gap: theme('spacing.1.5'),
            '@screen sm': {
              gap: theme('spacing.2'),
            },
            flexShrink: 0,
          },
          '&-view-toggle': {
            display: 'none',
            alignItems: 'center',
            borderRadius: theme('borderRadius.lg'),
            backgroundColor: 'rgba(241, 245, 249, 0.8)',
            padding: theme('spacing.0.5'),
            '@screen sm': {
              display: 'flex',
            },
          },
          '&-view-btn': {
            display: 'flex',
            alignItems: 'center',
            gap: theme('spacing.1.5'),
            padding: `${theme('spacing.1.5')} ${theme('spacing.2.5')}`,
            borderRadius: theme('borderRadius.md'),
            fontSize: theme('fontSize.xs'),
            fontWeight: '500',
            transition: 'all 0.2s',
            '&-active': {
              backgroundColor: 'white',
              boxShadow: theme('boxShadow.sm'),
              color: theme('colors.organic.700'),
            },
            '&-inactive': {
              color: theme('colors.slate.500'),
              '&:hover': {
                color: theme('colors.slate.700'),
              },
            },
          },
          '&-scroll-buttons': {
            display: 'flex',
            alignItems: 'center',
            gap: theme('spacing.0.5'),
            '@screen sm': {
              gap: theme('spacing.1'),
            },
          },
          '&-scroll-btn': {
            width: theme('spacing.8'),
            height: theme('spacing.8'),
            borderRadius: theme('borderRadius.lg'),
            borderWidth: '1px',
            borderColor: theme('colors.organic.200'),
            backgroundColor: 'white',
            color: theme('colors.organic.700'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            '&:hover': {
              backgroundColor: theme('colors.organic.50'),
              borderColor: theme('colors.organic.300'),
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
            '@screen sm': {
              width: theme('spacing.9'),
              height: theme('spacing.9'),
              borderRadius: theme('borderRadius.xl'),
            },
          },
          '&-view-all': {
            display: 'flex',
            alignItems: 'center',
            gap: theme('spacing.1'),
            fontSize: '0.6875rem',
            fontWeight: '700',
            color: 'white',
            backgroundImage: 'linear-gradient(to right, theme(colors.organic.600), theme(colors.organic.700))',
            padding: `${theme('spacing.1.5')} ${theme('spacing.3')}`,
            borderRadius: theme('borderRadius.lg'),
            transition: 'all 0.2s',
            '&:hover': {
              backgroundImage: 'linear-gradient(to right, theme(colors.organic.700), theme(colors.organic.800))',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
            '@screen sm': {
              fontSize: theme('fontSize.xs'),
              padding: `${theme('spacing.1.5')} ${theme('spacing.3.5')}`,
              borderRadius: theme('borderRadius.xl'),
            },
          },
          '&-scroll-container': {
            position: 'relative',
          },
          '&-fade': {
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: theme('spacing.12'),
            zIndex: 10,
            pointerEvents: 'none',
            '@screen sm': {
              width: theme('spacing.16'),
            },
            '&-left': {
              left: 0,
              backgroundImage: 'linear-gradient(to right, rgba(243, 249, 231, 1), rgba(243, 249, 231, 0))',
              borderTopLeftRadius: theme('borderRadius.2xl'),
              borderBottomLeftRadius: theme('borderRadius.2xl'),
            },
            '&-right': {
              right: 0,
              backgroundImage: 'linear-gradient(to left, rgba(243, 249, 231, 1), rgba(243, 249, 231, 0))',
              borderTopRightRadius: theme('borderRadius.2xl'),
              borderBottomRightRadius: theme('borderRadius.2xl'),
            },
          },
          '&-scroll-content': {
            display: 'flex',
            gap: theme('spacing.3'),
            overflowX: 'auto',
            paddingTop: theme('spacing.3'),
            paddingBottom: theme('spacing.3'),
            scrollSnapType: 'x mandatory',
            '@apply scrollbar-hide': {},
            '@screen sm': {
              gap: theme('spacing.4'),
            },
          },
          '&-scroll-item': {
            scrollSnapAlign: 'start',
          },
          '&-grid': {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: theme('spacing.2.5'),
            '@screen sm': {
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: theme('spacing.3'),
            },
            '@screen md': {
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            },
            '@screen lg': {
              gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
            },
          },
          '&-dots': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme('spacing.1.5'),
            marginTop: theme('spacing.3'),
          },
          '&-dot': {
            borderRadius: '9999px',
            transition: 'all 0.3s',
            '&-active': {
              width: theme('spacing.5'),
              height: theme('spacing.2'),
              backgroundImage: 'linear-gradient(to right, theme(colors.organic.500), theme(colors.teal.500))',
              boxShadow: theme('boxShadow.sm'),
            },
            '&-inactive': {
              width: theme('spacing.2'),
              height: theme('spacing.2'),
              backgroundColor: theme('colors.organic.200'),
              '&:hover': {
                backgroundColor: theme('colors.organic.300'),
              },
            },
          },
          '&-popular': {
            display: 'flex',
            alignItems: 'center',
            gap: theme('spacing.2'),
            paddingLeft: theme('spacing.0.5'),
            paddingRight: theme('spacing.0.5'),
            '@screen sm': {
              gap: theme('spacing.3'),
            },
          },
          '&-popular-icon': {
            display: 'flex',
            alignItems: 'center',
            gap: theme('spacing.1.5'),
            flexShrink: 0,
          },
          '&-popular-label': {
            fontSize: '0.625rem',
            fontWeight: '700',
            color: theme('colors.stone.500'),
            '@screen sm': {
              fontSize: '0.6875rem',
            },
          },
          '&-popular-links': {
            display: 'flex',
            flexWrap: 'wrap',
            gap: theme('spacing.1'),
            '@screen sm': {
              gap: theme('spacing.1.5'),
            },
          },
          '&-popular-link': {
            fontSize: '0.625rem',
            fontWeight: '500',
            color: theme('colors.organic.700'),
            backgroundColor: theme('colors.organic.50'),
            padding: `${theme('spacing.0.5')} ${theme('spacing.2')}`,
            borderRadius: '9999px',
            transition: 'all 0.2s',
            '&:hover': {
              backgroundColor: theme('colors.organic.100'),
              color: theme('colors.organic.800'),
              boxShadow: theme('boxShadow.sm'),
            },
            '@screen sm': {
              fontSize: '0.6875rem',
              padding: `${theme('spacing.0.5')} ${theme('spacing.2.5')}`,
            },
          },
        },
        '.story-strip-cta-primary': {
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme('spacing.2'),
  backgroundColor: 'rgba(16, 185, 129, 0.2)',
  borderWidth: '1px',
  borderColor: 'rgba(52, 211, 153, 0.4)',
  color: theme('colors.emerald.200'),
  fontSize: theme('fontSize.xs'),
  fontWeight: '700',
  padding: `${theme('spacing.2.5')} ${theme('spacing.4')}`,
  borderRadius: theme('borderRadius.2xl'),
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
},
'.story-strip-cta-secondary': {
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme('spacing.2'),
  color: theme('colors.emerald.400'),
  fontSize: theme('fontSize.xs'),
  fontWeight: '600',
  transition: 'color 0.2s',
  '&:hover': {
    color: theme('colors.emerald.300'),
  },
},
'.category-strip-view-all-card': {
  width: theme('spacing.16'),
  height: theme('spacing.16'),
  borderRadius: '9999px',
  borderWidth: '2px',
  borderStyle: 'dashed',
  borderColor: theme('colors.organic.300'),
  backgroundColor: 'rgba(79, 159, 79, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme('spacing.2'),
  transition: 'all 0.3s',
  '@screen sm': {
    width: theme('spacing.18'),
    height: theme('spacing.18'),
  },
  '@screen md': {
    width: theme('spacing.20'),
    height: theme('spacing.20'),
  },
  '&:hover': {
    borderColor: theme('colors.organic.400'),
    backgroundColor: theme('colors.organic.50'),
    transform: 'scale(1.05)',
  },
},
'.category-strip-view-all-text': {
  fontSize: '0.6875rem',
  fontWeight: '700',
  color: theme('colors.organic.700'),
  transition: 'color 0.2s',
  '@screen sm': {
    fontSize: theme('fontSize.xs'),
  },
  '&:hover': {
    color: theme('colors.organic.800'),
  },
},
'.category-strip-popular-icon-svg': {
  width: theme('spacing.3.5'),
  height: theme('spacing.3.5'),
  color: theme('colors.accent.500'),
  fill: theme('colors.accent.500'),
  '@screen sm': {
    width: theme('spacing.4'),
    height: theme('spacing.4'),
  },
},
      });
    },
  ],
};

export default config;