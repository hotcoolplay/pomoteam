import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { theme } from "./theme";
import { StudyRoom } from "./components/StudyRoom";

// Fonts referenced by theme.ts aren't bundled by Mantine - load them
// wherever your app loads fonts (index.html <head>, next/font, etc.):
// <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700&family=Public+Sans:wght@400;500;600&display=swap" rel="stylesheet">

const roomId = "cram-session"; // from your router, e.g. useParams()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <StudyRoom socketUrl={`wss://api.example.com/ws/${roomId}`} roomName="Thermo final cram" />
    </MantineProvider>
  </StrictMode>,
);
