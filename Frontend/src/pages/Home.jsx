import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { springApi } from "../services/springApi";
import "./Home.css";

function Home() {
  const { canManageEvents, isAuthenticated } = useAuth();

  const [stats, setStats] = useState({
    eventCount: "--",
    categories: "--",
    avgRating: "4.8",
  });

  useEffect(() => {
    let ignore = false;

    async function loadHomeStats() {
      try {
        const response = await springApi.getEvents({
          status: "ALL",
        });

        if (!ignore) {
          const events = response.events || [];
          const categories = new Set(events.map((event) => event.category));

          setStats({
            eventCount: `${events.length}+`,
            categories: String(categories.size),
            avgRating: "4.8",
          });
        }
      } catch {
        if (!ignore) {
          setStats({
            eventCount: "120+",
            categories: "8",
            avgRating: "4.8",
          });
        }
      }
    }

    loadHomeStats();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <>
      <section className="hero-section section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Turn ideas into
                <span className="gradient-text"> memorable events</span>
              </h1>
              <p className="hero-subtitle">
                EventNest helps student clubs, teams, & communities plan,
                publish, & manage events from one clean dashboard.
              </p>
              <div className="hero-actions">
                {isAuthenticated ? (
                  <Link
                    to={canManageEvents ? "/create-event" : "/dashboard"}
                    className="btn btn-primary"
                  >
                    {canManageEvents ? "Create An Event" : "Open Dashboard"}
                  </Link>
                ) : (
                  <Link to="/signup" className="btn btn-primary">
                    Start Free
                  </Link>
                )}
                <Link to="/events" className="btn btn-outline">
                  Explore Events
                </Link>
              </div>
              <div className="hero-stats">
                <div className="stat">
                  <div className="stat-number">{stats.eventCount}</div>
                  <div className="stat-label">Live Events</div>
                </div>
                <div className="stat">
                  <div className="stat-number">{stats.categories}</div>
                  <div className="stat-label">Event Categories</div>
                </div>
                <div className="stat">
                  <div className="stat-number">{stats.avgRating}</div>
                  <div className="stat-label">Average Rating</div>
                </div>
              </div>
            </div>
            <div className="hero-image">
              <div className="floating-card card-1">
                <div className="card-icon">PLN</div>
                <div className="card-content">
                  <div className="card-title">Plan Fast</div>
                  <div className="card-desc">Create events in minutes</div>
                </div>
              </div>
              <div className="floating-card card-2">
                <div className="card-icon">RGT</div>
                <div className="card-content">
                  <div className="card-title">Track Seats</div>
                  <div className="card-desc">Real-time registrations</div>
                </div>
              </div>
              <div className="floating-card card-3">
                <div className="card-icon">NTF</div>
                <div className="card-content">
                  <div className="card-title">Keep Everyone Updated</div>
                  <div className="card-desc">Announcement ready</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="features-section section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Core Building Blocks</h2>
            <p className="section-subtitle">
              Full-stack ready front-end scaffold with role-based workflows
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">01</div>
              <h3 className="feature-title">Auth Ready</h3>
              <p className="feature-description">
                Register & login flow that can directly connect to your Spring
                Boot auth APIs.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">02</div>
              <h3 className="feature-title">Event List</h3>
              <p className="feature-description">
                Public event discovery page with cards & category chips.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">03</div>
              <h3 className="feature-title">Organizer Form</h3>
              <p className="feature-description">
                Basic create-event form to validate your UX & route wiring.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Build your first event workspace</h2>
            <p className="cta-subtitle">
              Once your official requirements arrive, this starter can be
              extended quickly.
            </p>
            {isAuthenticated ? (
              <Link
                to={canManageEvents ? "/create-event" : "/events"}
                className="btn btn-primary"
              >
                {canManageEvents ? "Open Event Builder" : "Browse Events"}
              </Link>
            ) : (
              <Link to="/signup" className="btn btn-primary">
                Create Free Account
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
