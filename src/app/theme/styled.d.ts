import 'styled-components';

// Augment styled-components' DefaultTheme so every styled component gets
// type-checked access to theme tokens — no magic color strings (design D1).
declare module 'styled-components' {
  export interface DefaultTheme {
    color: {
      background: string;
      gradient: string;
      accent: string;
      glassBg: string;
      glassBorder: string;
      text: string;
      textMuted: string;
      statusDot: string;
      danger: string;
    };
    radii: {
      sm: string;
      md: string;
      lg: string;
    };
    font: {
      sans: string;
      mono: string;
    };
  }
}
