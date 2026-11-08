import React, { useState } from "react";
import {
  X, Lock, ShieldCheck, CheckCircle2, Clock, Phone,
  Calendar, IndianRupee, Scissors, Users, LogOut, Check
} from "lucide-react";
import "./AdminPanel.css";

interface Appointment {
  id: number;
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  status: "Confirmed" | "Pending" | "Completed";
  billAmount: number;
}

const AUTHORIZED_EMAIL = "theviiisalon88@gmail.com";

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 1,
    name: "Niveditha R.",
    phone: "+91 93539 14271",
    service: "Signature Makeup",
    date: "2026-11-09",
    time: "11:30 AM",
    status: "Confirmed",
    billAmount: 1499
  },
  {
    id: 2,
    name: "Ananya Sharma",
    phone: "+91 98450 12345",
    service: "Advanced Skin Care",
    date: "2026-11-09",
    time: "02:00 PM",
    status: "Pending",
    billAmount: 799
  },
  {
    id: 3,
    name: "Vikram Malhotra",
    phone: "+91 99001 88765",
    service: "Hair Styling & Care",
    date: "2026-11-08",
    time: "05:00 PM",
    status: "Completed",
    billAmount: 699
  }
];

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [emailInput, setEmailInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [activeTab, setActiveTab] = useState<"bookings" | "analytics">("bookings");

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim().toLowerCase() === AUTHORIZED_EMAIL.toLowerCase()) {
      setIsAuthenticated(true);
      setErrorMessage("");
    } else {
      setErrorMessage("Unauthorized email address. Access denied.");
    }
  };

  const updateStatus = (id: number, status: Appointment["status"]) => {
    setAppointments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setEmailInput("");
    setErrorMessage("");
  };

  const totalRevenue = appointments.reduce((sum, item) => sum + item.billAmount, 0);

  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal-container">
        {/* Header */}
        <div className="admin-header">
          <div className="admin-title-box">
            <span className="gold-text-tag">VIII SALON DESK</span>
            <h2>Owner Administration Portal</h2>
          </div>
          <button className="close-admin-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* AUTHENTICATION VIEW */}
        {!isAuthenticated ? (
          <div className="admin-login-wrapper">
            <div className="admin-auth-card">
              <div className="lock-icon-circle">
                <Lock size={30} />
              </div>
              <h3>Restricted Salon Access</h3>
              <p>Please enter your registered salon owner email to unlock management tools.</p>

              <form onSubmit={handleLogin} className="admin-login-form">
                <input
                  type="email"
                  placeholder="e.g. theviiisalon88@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                />
                {errorMessage && <span className="error-text">{errorMessage}</span>}

                <button type="submit" className="btn-luxury-primary w-full">
                  <ShieldCheck size={18} /> Authenticate & Enter
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED DASHBOARD */
          <div className="admin-dashboard-wrapper">
            <div className="dashboard-topbar">
              <div className="admin-profile-badge">
                <ShieldCheck size={18} color="#e5b95f" />
                <span>Verified Owner: <strong>{AUTHORIZED_EMAIL}</strong></span>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                <LogOut size={15} /> Exit Portal
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-icon"><Users size={20} /></div>
                <div>
                  <small>Total Appointments</small>
                  <h3>{appointments.length}</h3>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon"><IndianRupee size={20} /></div>
                <div>
                  <small>Gross Scheduled Value</small>
                  <h3>₹{totalRevenue.toLocaleString("en-IN")}</h3>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon"><Scissors size={20} /></div>
                <div>
                  <small>Active Outlet</small>
                  <h3>BTM 2nd Stage</h3>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="admin-tabs">
              <button
                className={`tab-btn ${activeTab === "bookings" ? "active" : ""}`}
                onClick={() => setActiveTab("bookings")}
              >
                Appointment Desk
              </button>
              <button
                className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
                onClick={() => setActiveTab("analytics")}
              >
                Outlet Overview
              </button>
            </div>

            {/* Tab: Appointments Desk */}
            {activeTab === "bookings" && (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Service</th>
                      <th>Slot (Date & Time)</th>
                      <th>Expected Value</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((apt) => (
                      <tr key={apt.id}>
                        <td>
                          <strong>{apt.name}</strong>
                          <div className="sub-phone">
                            <Phone size={12} /> {apt.phone}
                          </div>
                        </td>
                        <td>{apt.service}</td>
                        <td>
                          <div className="slot-pill">
                            <Calendar size={13} /> {apt.date}
                          </div>
                          <div className="slot-pill mt-4">
                            <Clock size={13} /> {apt.time}
                          </div>
                        </td>
                        <td><strong>₹{apt.billAmount}</strong></td>
                        <td>
                          <span className={`status-badge ${apt.status.toLowerCase()}`}>
                            {apt.status}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            {apt.status !== "Confirmed" && (
                              <button
                                className="action-btn confirm"
                                title="Mark Confirmed"
                                onClick={() => updateStatus(apt.id, "Confirmed")}
                              >
                                <Check size={14} /> Confirm
                              </button>
                            )}
                            {apt.status !== "Completed" && (
                              <button
                                className="action-btn complete"
                                title="Mark Completed"
                                onClick={() => updateStatus(apt.id, "Completed")}
                              >
                                <CheckCircle2 size={14} /> Complete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab: Analytics / Outlet */}
            {activeTab === "analytics" && (
              <div className="outlet-overview-grid">
                <div className="overview-card">
                  <h4>Salon Location Info</h4>
                  <p><strong>Branch:</strong> The VIII | Unisex Salon</p>
                  <p><strong>Address:</strong> 2nd Floor, No. 75, 100 Feet Ring Road, Vysya Bank Colony, BTM Layout 2nd Stage, Bengaluru, Karnataka – 560076</p>
                  <p><strong>Helpline:</strong> +91 63624 29259</p>
                </div>

                <div className="overview-card">
                  <h4>Daily Operating Shifts</h4>
                  <p><strong>Mon – Sat:</strong> 9:00 AM – 8:00 PM</p>
                  <p><strong>Sunday:</strong> On Call / Appointment Only</p>
                  <p><strong>WhatsApp Inquiries:</strong> Active</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};