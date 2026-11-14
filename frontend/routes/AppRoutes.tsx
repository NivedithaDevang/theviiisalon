import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Header } from "../src/components/Header/Header";
import { Footer } from "../src/components/Footer/Footer";
import AdminPage from "../src/pages/AdminPage";
import BookingPage from "../src/pages/BookingPage";
import ContactPage from "../src/pages/ContactPage";
import HomePage from "../src/pages/HomePage";
import NotFoundPage from "../src/pages/NotFoundPage";
import ServicesPage from "../src/pages/ServicesPage";
import "./AppRoutes.css";

function ServicesRoute() {
  const navigate = useNavigate();
  return (
    <ServicesPage
      onReserveService={(service) => navigate(`/booking?service=${encodeURIComponent(service.name)}`)}
    />
  );
}

function RouteScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (hash) {
        document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
      } else {
        window.scrollTo(0, 0);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, hash]);

  return null;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <RouteScrollManager />
      <div className="site-shell">
        <Header />
        <main className="site-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/services" element={<ServicesRoute />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
