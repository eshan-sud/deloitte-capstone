import { Link } from "react-router-dom";
import "./Portal.css";
import "./NotFound.css";

function NotFound() {
  return (
    <div className="portal-page section">
      <div className="container">
        <section className="card not-found-shell">
          <p className="not-found-code">404</p>
          <h1 className="page-title">That page does not exist</h1>
          <p className="page-subtitle">
            The route may have moved, or the URL was typed incorrectly.
          </p>
          <div className="not-found-actions">
            <Link className="btn" to="/dashboard">
              Go To Dashboard
            </Link>
            <Link className="btn btn-outline" to="/events">
              Browse Events
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default NotFound;
