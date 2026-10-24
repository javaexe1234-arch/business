import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import AdminPage from "./pages/AdminPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";

export default function App() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return undefined;
    const lenis = new Lenis({ autoRaf: true, duration: 1.1 });
    return () => lenis.destroy();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
