import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ServerStyleSheet, ThemeProvider } from 'styled-components';
import { GlobalStyle } from './GlobalStyle';
import { palettes, type ThemeMode } from './palettes';

// Under jsdom, styled-components injects into a detached sheet, so GlobalStyle's
// theme interpolations never run and its CSS isn't DOM-readable. SSR collection
// forces those interpolations to evaluate and yields the generated CSS, so we
// can assert the global reset/body actually consumes the active palette's tokens.
const globalCss = (mode: ThemeMode): string => {
  const sheet = new ServerStyleSheet();
  try {
    renderToStaticMarkup(
      sheet.collectStyles(
        <ThemeProvider theme={palettes[mode]}>
          <GlobalStyle />
        </ThemeProvider>,
      ),
    );
    return sheet.getStyleTags();
  } finally {
    sheet.seal();
  }
};

describe('GlobalStyle', () => {
  it('applies the dark palette tokens to the global body/base styles', () => {
    const css = globalCss('dark');
    expect(css).toContain(palettes.dark.color.text);
    expect(css).toContain(palettes.dark.color.accent);
    expect(css).not.toContain(palettes.light.color.text);
  });

  it('applies the light palette tokens under the light theme', () => {
    const css = globalCss('light');
    expect(css).toContain(palettes.light.color.text);
    expect(css).toContain(palettes.light.color.accent);
    expect(css).not.toContain(palettes.dark.color.text);
  });
});
