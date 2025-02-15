import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import "@mantine/dropzone/styles.css";
import { WebSocketProvider } from "./config/websocket.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider>
      <WebSocketProvider>
        <App />
      </WebSocketProvider>
    </MantineProvider>
  </StrictMode>
);
