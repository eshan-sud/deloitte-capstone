import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { reportsApi } from "../services/reportsApi";
import "./Portal.css";
import "./AdminReports.css";

function AdminReports() {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadReport() {
      setIsLoading(true);
      setError("");

      try {
        const response = await reportsApi.getAdminReports();
        if (!ignore) {
          setReport(response);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || "Failed to load admin reports.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      ignore = true;
    };
  }, []);

  const maxCategoryValue = useMemo(() => {
    if (!report) {
      return 1;
    }

    const values = Object.values(report.ordersByCategory);
    return Math.max(...values, 1);
  }, [report]);

  return (
    <div className="portal-page section">
      <div className="container">
        <div className="portal-header">
          <div>
            <h1 className="page-title">Admin Reporting Summary</h1>
            <p className="page-subtitle">
              Monitor platform health, order performance, & budget variance.
            </p>
          </div>
          <div className="portal-actions">
            <Link className="btn btn-outline" to="/admin/users">
              Manage Users
            </Link>
          </div>
        </div>

        {error ? <div className="alert error">{error}</div> : null}

        {isLoading ? (
          <div className="card">
            <h2>Generating report...</h2>
            <p className="muted">Calculating totals & budget metrics.</p>
          </div>
        ) : null}

        {!isLoading && report ? (
          <>
            <section className="kpi-grid">
              <article className="kpi-card">
                <p className="kpi-label">Users</p>
                <p className="kpi-value">{report.summary.totalUsers}</p>
              </article>
              <article className="kpi-card">
                <p className="kpi-label">Events</p>
                <p className="kpi-value">{report.summary.totalEvents}</p>
              </article>
              <article className="kpi-card">
                <p className="kpi-label">Confirmed Orders</p>
                <p className="kpi-value">{report.summary.confirmedOrders}</p>
              </article>
              <article className="kpi-card">
                <p className="kpi-label">Gross Revenue</p>
                <p className="kpi-value">INR {report.summary.grossRevenue}</p>
              </article>
              <article className="kpi-card">
                <p className="kpi-label">Expenses</p>
                <p className="kpi-value">INR {report.summary.totalExpenses}</p>
              </article>
              <article className="kpi-card">
                <p className="kpi-label">Net Revenue</p>
                <p className="kpi-value">INR {report.summary.netRevenue}</p>
              </article>
            </section>

            <section className="card" style={{ marginBottom: "1rem" }}>
              <h2 className="panel-title">Orders By Event Category</h2>
              <div className="category-list">
                {Object.entries(report.ordersByCategory).map(
                  ([category, count]) => (
                    <div className="category-row" key={category}>
                      <span className="category-name">{category}</span>
                      <div className="category-bar-wrap">
                        <div
                          className="category-bar"
                          style={{
                            width: `${Math.round((count / maxCategoryValue) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="category-count">{count}</span>
                    </div>
                  ),
                )}
              </div>
            </section>

            <section className="card">
              <h2 className="panel-title">Budget Vs Actual</h2>
              <table className="table-shell">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Planned</th>
                    <th>Actual</th>
                    <th>Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {report.budgetRows.map((row) => (
                    <tr key={row.budgetId}>
                      <td>{row.eventTitle}</td>
                      <td>INR {row.plannedAmount}</td>
                      <td>INR {row.actualAmount}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            row.variance >= 0 ? "active" : "cancelled"
                          }`}
                        >
                          INR {row.variance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default AdminReports;
