import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ImageKitProvider } from "@imagekit/react";
import App from "./app/App.tsx";
import AdminPage from "./app/AdminPage.tsx";
import "./styles/index.css";

const IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/geekykalpesh";

createRoot(document.getElementById("root")!).render(
  <ImageKitProvider urlEndpoint={IMAGEKIT_URL_ENDPOINT}>
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<App />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  </ImageKitProvider>
);
