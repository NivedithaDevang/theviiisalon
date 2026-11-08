import { useState } from "react";
import { Header } from "./components/Header/Header";
import { Hero } from "./components/Hero/Hero";
import { About } from "./components/About/About";
import { Services } from "./components/Services/Services";
import { Booking } from "./components/Booking/Booking";
import { Contact } from "./components/Contact/Contact";
import { Footer } from "./components/Footer/Footer";
import { AdminPanel } from "./components/AdminPanel/AdminPanel";
import "./App.css";

function App() {
  const [selectedService, setSelectedService] = useState("");
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const handleSelectService = (serviceName: string) => {
    setSelectedService(serviceName);
    const bookingSection = document.getElementById("booking");
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="app-container">
      <Header />
      <main>
        <Hero />
        <About />
        <Services onSelectService={handleSelectService} />
        <Booking
          selectedService={selectedService}
          setSelectedService={setSelectedService}
        />
        <Contact />
      </main>
      <Footer onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* SECURE ADMIN MODAL */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
}

export default App;