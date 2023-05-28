import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import { DeviceThemeProvider } from "@salutejs/plasma-ui"
import { GlobalStyle } from "./GlobalStyle"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <DeviceThemeProvider responsiveTypo={true}>
    <App/>
    <GlobalStyle/>
  </DeviceThemeProvider>,
)
