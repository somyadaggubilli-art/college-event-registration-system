
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:5000/api";

function App() {
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);

  const [activePage, setActivePage] = useState("Overview");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationEvent, setRegistrationEvent] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All Events");

  // Fetch all events from the backend
  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_URL}/events`);
      setEvents(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Unable to load events. Please check your backend server.");
    } finally {
      setLoading(false);
    }
  };

  // Get participants from all events
  const fetchParticipants = async () => {
    try {
      const response = await axios.get(`${API_URL}/events`);

      const allParticipants = response.data.flatMap((event) =>
        (event.registrations || []).map((registration) => ({
          ...registration,
          eventName: event.name,
          eventId: event._id,
        }))
      );

      setParticipants(allParticipants);
    } catch (err) {
      console.error("Error fetching participants:", err);
    }
  };

  // Load data when the application starts
  useEffect(() => {
    fetchEvents();
    fetchParticipants();
  }, []);

  // Refresh events and participants
  const refreshData = async () => {
    await Promise.all([fetchEvents(), fetchParticipants()]);
  };

  // Check whether an event is full
  const isFull = (event) => {
    return event.available <= 0;
  };

  // Open event details page
  const openDetails = async (event) => {
    try {
      const response = await axios.get(
        `${API_URL}/events/${event._id}`
      );

      setSelectedEvent(response.data);
    } catch (err) {
      console.error("Error fetching event details:", err);
      setSelectedEvent(event);
    }

    setActivePage("Event Details");
  };

  // Open registration form
  const openRegistration = (event) => {
    setRegistrationEvent(event);
    setShowRegistration(true);
  };

  // Run after successful registration
  const handleRegistrationSuccess = async () => {
    setShowRegistration(false);

    await refreshData();

    if (selectedEvent?._id) {
      try {
        const response = await axios.get(
          `${API_URL}/events/${selectedEvent._id}`
        );

        setSelectedEvent(response.data);
      } catch (err) {
        console.error("Error refreshing event details:", err);
      }
    }
  };

  // Change sidebar page
  const changePage = (page) => {
    setActivePage(page);
    setSelectedEvent(null);
    setSearchTerm("");
    setSelectedFilter("All Events");
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <h2>College Event Registration System</h2>
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div className="app-layout">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">C</div>

          <div>
            <h2>CampusConnect</h2>
            <span>EVENT MANAGEMENT</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">MENU</p>

          <button
            className={`nav-item ${
              activePage === "Overview" ? "active" : ""
            }`}
            onClick={() => changePage("Overview")}
          >
            <span>▦</span>
            Overview
          </button>

          <button
            className={`nav-item ${
              activePage === "Events" ||
              activePage === "Event Details"
                ? "active"
                : ""
            }`}
            onClick={() => changePage("Events")}
          >
            <span>▣</span>
            Events
          </button>

          <button
            className={`nav-item ${
              activePage === "Participants" ? "active" : ""
            }`}
            onClick={() => changePage("Participants")}
          >
            <span>♙</span>
            Participants
          </button>
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">A</div>

          <div>
            <h4>Admin</h4>
            <p>Event Coordinator</p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        {/* TOPBAR */}
        <header className="topbar">
          <div>
            <h2>College Event Registration System</h2>
            <p>Manage and explore college events</p>
          </div>

          <div className="topbar-right">
            <span className="topbar-avatar">A</span>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="page-content">

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* OVERVIEW PAGE */}
          {activePage === "Overview" && (
            <>
              <section className="welcome-banner">
                <div>
                  <span className="welcome-label">
                    CAMPUS CONNECT
                  </span>

                  <h1>Welcome to Campus Events!</h1>

                  <p>
                    Discover upcoming events, explore new
                    opportunities, and be part of campus life.
                  </p>

                  <button
                    className="banner-btn"
                    onClick={() => changePage("Events")}
                  >
                    Explore Events →
                  </button>
                </div>

                <div className="banner-decoration">
                  ✦
                </div>
              </section>

              <section className="section-heading">
                <div>
                  <h2>Upcoming Events</h2>
                  <p>
                    Take a look at some of our upcoming campus events.
                  </p>
                </div>

                <button
                  className="text-btn"
                  onClick={() => changePage("Events")}
                >
                  View All Events →
                </button>
              </section>

              {/* OVERVIEW USES SIMPLE PREVIEW CARDS */}
              <EventPreview
                events={events.slice(0, 4)}
                onDetails={openDetails}
              />
            </>
          )}

          {/* EVENTS PAGE */}
          {activePage === "Events" && (
            <>
              <section className="section-heading page-heading">
                <div>
                  <h1>All Events</h1>
                  <p>
                    Explore all college events and view their
                    registration details.
                  </p>
                </div>
              </section>

              {/* EVENTS PAGE USES COMPLETE EVENT CARDS */}
              <EventGrid
                events={events}
                onDetails={openDetails}
                onRegister={openRegistration}
                isFull={isFull}
              />
            </>
          )}

          {/* EVENT DETAILS PAGE */}
          {activePage === "Event Details" && selectedEvent && (
            <EventDetails
              event={selectedEvent}
              onBack={() => changePage("Events")}
              onRegister={openRegistration}
              isFull={isFull}
            />
          )}

          {/* PARTICIPANTS PAGE */}
          {activePage === "Participants" && (
            <ParticipantsPage
              participants={participants}
              events={events}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedFilter={selectedFilter}
              setSelectedFilter={setSelectedFilter}
            />
          )}
        </div>
      </main>

      {/* REGISTRATION MODAL */}
      {showRegistration && registrationEvent && (
        <RegistrationModal
          event={registrationEvent}
          onClose={() => setShowRegistration(false)}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </div>
  );
}


// ======================================================
// OVERVIEW EVENT PREVIEW CARDS
// Shows only basic event information
// ======================================================

function EventPreview({ events, onDetails }) {
  if (!events.length) {
    return (
      <div className="empty-state">
        <h3>No Events Available</h3>
        <p>There are no upcoming events right now.</p>
      </div>
    );
  }

  return (
    <div className="event-grid">
      {events.map((event, index) => (
        <article className="event-card" key={event._id}>
          <div className={`event-cover cover-${index % 3}`}>
            <span className="cover-symbol">
              {index % 3 === 0
                ? "✦"
                : index % 3 === 1
                ? "◈"
                : "✧"}
            </span>

            <span className="cover-tag">
              CAMPUS EVENT
            </span>
          </div>

          <div className="event-card-body">
            <div className="event-meta">
              <span>
                ▣ {event.date?.slice(0, 10) || "Date TBA"}
              </span>
            </div>

            <h3>{event.name}</h3>

            <p>
              {event.description ||
                "Join us for this exciting campus event."}
            </p>

            <div className="event-actions">
              <button
                className="primary-btn"
                onClick={() => onDetails(event)}
              >
                View Details →
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}


// ======================================================
// COMPLETE EVENT CARDS
// Shows registration information on the Events page
// ======================================================

function EventGrid({ events, onDetails, onRegister, isFull }) {
  if (!events.length) {
    return (
      <div className="empty-state">
        <h3>No Events Available</h3>
        <p>There are no events to display.</p>
      </div>
    );
  }

  return (
    <div className="event-grid">
      {events.map((event, index) => {
        const registered = event.registered ?? (
          event.registrations?.length || 0
        );

        const available = event.available ?? Math.max(
          0,
          event.capacity - registered
        );

        const capacity = event.capacity || 0;

        const progress = capacity > 0
          ? Math.min((registered / capacity) * 100, 100)
          : 0;

        const full = isFull(event);

        return (
          <article className="event-card" key={event._id}>
            <div className={`event-cover cover-${index % 3}`}>
              <span className="cover-symbol">
                {index % 3 === 0
                  ? "✦"
                  : index % 3 === 1
                  ? "◈"
                  : "✧"}
              </span>

              <span className="cover-tag">
                CAMPUS EVENT
              </span>
            </div>

            <div className="event-card-body">
              <div className="event-meta">
                <span>
                  ▣ {event.date?.slice(0, 10) || "Date TBA"}
                </span>

                <StatusBadge full={full} />
              </div>

              <h3>{event.name}</h3>

              <p>
                {event.description ||
                  "Join us for this exciting campus event."}
              </p>

              <div className="event-location">
                <span>⌖</span>
                {event.venue || "Venue to be announced"}
              </div>

              <div className="event-numbers">
                <div>
                  <strong>{registered}</strong>
                  <span>Registered</span>
                </div>

                <div>
                  <strong>{available}</strong>
                  <span>Available</span>
                </div>

                <div>
                  <strong>{capacity}</strong>
                  <span>Capacity</span>
                </div>
              </div>

              <div className="progress-heading">
                <span>Registration Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <div className="event-actions">
                <button
                  className="secondary-btn"
                  onClick={() => onDetails(event)}
                >
                  Details
                </button>

                <button
                  className="primary-btn"
                  onClick={() => onRegister(event)}
                  disabled={full}
                >
                  {full ? "Registration Full" : "Register"}
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}


// ======================================================
// EVENT STATUS BADGE
// ======================================================

function StatusBadge({ full }) {
  return (
    <span className={`status-badge ${full ? "full" : "open"}`}>
      {full ? "Full" : "Open"}
    </span>
  );
}


// ======================================================
// EVENT DETAILS PAGE
// ======================================================

function EventDetails({ event, onBack, onRegister, isFull }) {
  const [participants, setParticipants] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingParticipants, setLoadingParticipants] = useState(true);

  useEffect(() => {
    const fetchEventParticipants = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/events/${event._id}/participants`,
          {
            params: { search },
          }
        );

        setParticipants(
          Array.isArray(response.data)
            ? response.data
            : response.data.participants || []
        );
      } catch (err) {
        console.error("Error fetching event participants:", err);
        setParticipants(
          (event.registrations || []).filter((participant) => {
            const term = search.toLowerCase();

            return (
              participant.name?.toLowerCase().includes(term) ||
              participant.rollNo?.toLowerCase().includes(term) ||
              participant.email?.toLowerCase().includes(term)
            );
          })
        );
      } finally {
        setLoadingParticipants(false);
      }
    };

    fetchEventParticipants();
  }, [event._id, event.registrations, search]);

  const registered = event.registered ?? (
    event.registrations?.length || 0
  );

  const available = event.available ?? Math.max(
    0,
    event.capacity - registered
  );

  const capacity = event.capacity || 0;

  const progress = capacity > 0
    ? Math.min((registered / capacity) * 100, 100)
    : 0;

  const full = isFull(event);

  return (
    <div>
      <button className="back-btn" onClick={onBack}>
        ← Back to Events
      </button>

      <div className="details-header">
        <div>
          <span className="welcome-label">EVENT INFORMATION</span>

          <h1>{event.name}</h1>

          <p>{event.description}</p>
        </div>

        <StatusBadge full={full} />
      </div>

      <div className="details-info-grid">
        <div className="details-info-card">
          <span>Event Date</span>
          <h3>{event.date?.slice(0, 10) || "Date TBA"}</h3>
        </div>

        <div className="details-info-card">
          <span>Venue</span>
          <h3>{event.venue || "Venue TBA"}</h3>
        </div>

        <div className="details-info-card">
          <span>Total Capacity</span>
          <h3>{capacity}</h3>
        </div>
      </div>

      <section className="details-registration-section">
        <div className="section-heading">
          <div>
            <h2>Registration Overview</h2>
            <p>Current registration status for this event.</p>
          </div>

          <button
            className="primary-btn"
            onClick={() => onRegister(event)}
            disabled={full}
          >
            {full ? "Registration Full" : "Register Now"}
          </button>
        </div>

        <div className="details-stats">
          <StatCard
            label="Registered Students"
            value={registered}
          />

          <StatCard
            label="Available Seats"
            value={available}
          />

          <StatCard
            label="Total Capacity"
            value={capacity}
          />
        </div>

        <div className="progress-heading">
          <span>Registration Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </section>

      <section className="participants-section">
        <div className="section-heading">
          <div>
            <h2>Registered Participants</h2>
            <p>Students who have registered for this event.</p>
          </div>
        </div>

        <input
          type="text"
          className="search-input"
          placeholder="Search by name, roll number or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loadingParticipants ? (
          <p>Loading participants...</p>
        ) : (
          <ParticipantTable participants={participants} />
        )}
      </section>
    </div>
  );
}


// ======================================================
// STAT CARD
// ======================================================

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <h2>{value}</h2>
    </div>
  );
}


// ======================================================
// REGISTRATION MODAL
// ======================================================

function RegistrationModal({ event, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    rollNo: "",
    email: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      await axios.post(
        `${API_URL}/events/${event._id}/register`,
        formData
      );

      alert("Registration successful!");

      onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="registration-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="welcome-label">EVENT REGISTRATION</span>
            <h2>Register for Event</h2>
            <p>{event.name}</p>
          </div>

          <button
            className="close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Student Name</label>

          <input
            type="text"
            name="name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label>Roll Number</label>

          <input
            type="text"
            name="rollNo"
            placeholder="Enter your roll number"
            value={formData.rollNo}
            onChange={handleChange}
            required
          />

          <label>Email Address</label>

          <input
            type="email"
            name="email"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={handleChange}
            required
          />

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-btn"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Registration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ======================================================
// PARTICIPANTS PAGE
// ======================================================

function ParticipantsPage({
  participants,
  events,
  searchTerm,
  setSearchTerm,
  selectedFilter,
  setSelectedFilter,
}) {
  const filteredParticipants = participants.filter((participant) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      participant.name?.toLowerCase().includes(search) ||
      participant.rollNo?.toLowerCase().includes(search) ||
      participant.email?.toLowerCase().includes(search);

    const matchesEvent =
      selectedFilter === "All Events" ||
      participant.eventId === selectedFilter;

    return matchesSearch && matchesEvent;
  });

  return (
    <div>
      <section className="section-heading page-heading">
        <div>
          <h1>Participants</h1>
          <p>
            View and search students registered for college events.
          </p>
        </div>
      </section>

      <div className="participant-filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name, roll number or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="filter-select"
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
        >
          <option value="All Events">All Events</option>

          {events.map((event) => (
            <option key={event._id} value={event._id}>
              {event.name}
            </option>
          ))}
        </select>
      </div>

      <ParticipantTable participants={filteredParticipants} />
    </div>
  );
}


// ======================================================
// PARTICIPANT TABLE
// ======================================================

function ParticipantTable({ participants }) {
  if (!participants.length) {
    return (
      <div className="empty-state">
        <h3>No Participants Found</h3>
        <p>
          Registered participants will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="participants-table">
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Roll Number</th>
            <th>Email Address</th>
            {participants.some((p) => p.eventName) && (
              <th>Event</th>
            )}
          </tr>
        </thead>

        <tbody>
          {participants.map((participant, index) => (
            <tr key={participant._id || index}>
              <td>{participant.name}</td>
              <td>{participant.rollNo}</td>
              <td>{participant.email}</td>

              {participants.some((p) => p.eventName) && (
                <td>{participant.eventName}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
