import { createGlobalStyle } from "styled-components"
import {salutejs_sber__dark} from "@salutejs/plasma-tokens"
import {
  text,
  background,
  gradient,
} from "@salutejs/plasma-tokens"

const DocumentStyle = createGlobalStyle`
    html {
        color: ${text};
        background-color: ${background};
        background-image: ${gradient};
    }
    
    body {
      margin: 0;
      color: ${text};
    }
`;
const ThemeStyle = createGlobalStyle(salutejs_sber__dark);

export const GlobalStyle = () => (
  <>
    <DocumentStyle />
    <ThemeStyle />
  </>
);