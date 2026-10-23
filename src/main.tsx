import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ImageKitProvider } from "@imagekit/react";
import "./styles/index.css";

// Route-level Code Splitting: Admin panel & Portfolio are loaded on-demand
const App = lazy(() => import("./app/App.tsx"));
const AdminPage = lazy(() => import("./app/AdminPage.tsx"));

// Premium Obsidian Splash Loader while chunk loads (< 100ms)
function PageFallback() {
  return (
    <div className="fixed inset-0 bg-[#070709] flex flex-col items-center justify-center z-50">
      <div className="relative w-14 h-14 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-white/10 animate-ping opacity-25" />
        <div className="w-9 h-9 rounded-full border-2 border-white/10 border-t-white animate-spin" />
      </div>
      <p className="mt-4 text-[10px] font-mono uppercase tracking-[0.25em] text-white/40">
        Loading Cinema Portfolio
      </p>
    </div>
  );
}

const IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/geekykalpesh";

createRoot(document.getElementById("root")!).render(
  <ImageKitProvider urlEndpoint={IMAGEKIT_URL_ENDPOINT}>
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/*" element={<App />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </ImageKitProvider>
);
