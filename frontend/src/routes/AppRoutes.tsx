import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "../pages/HomePage";
import AdminPage from "../pages/AdminPage/AdminPage";
import ContactPage from "../pages/ContactPage/ContactPage";
import NotFoundPage from "../pages/NotFoundPage";
import ServicesPage from "../pages/ServicesPage/ServicesPage";
import BookingPage from "../pages/BookingPage/BookingPage";
function AppRoutes() {
    return (
        <BrowserRouter>
        <Routes>
            <Route path = "/" element={<HomePage />} />
            <Route path = "/admin-booking" element={<Navigate to="/admin" replace />} />
            <Route path = "/admin" element={<AdminPage />} />
            <Route path = "/contact" element={<ContactPage />} />
            <Route path = "/not-found" element={<NotFoundPage />} />
            <Route path = "/services" element={<ServicesPage />} />
            <Route path = "/booking" element={<BookingPage />} />

            </Routes>
            
            </BrowserRouter>
    )
}

export default AppRoutes