import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { reportsApi } from "../services/reportsApi";
import { springApi } from "../services/springApi";
import "./Portal.css";
import "./CreateEvent.css";

function toDateTimeParts(isoDateTime) {
  if (!isoDateTime) {
    return { date: "", time: "" };
  }

  const dateObject = new Date(isoDateTime);
  if (Number.isNaN(dateObject.getTime())) {
    return { date: "", time: "" };
  }

  const year = dateObject.getFullYear();
  const month = String(dateObject.getMonth() + 1).padStart(2, "0");
  const day = String(dateObject.getDate()).padStart(2, "0");
  const hours = String(dateObject.getHours()).padStart(2, "0");
  const minutes = String(dateObject.getMinutes()).padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

function combineDateAndTime(dateValue, timeValue) {
  return new Date(`${dateValue}T${timeValue}:00`).toISOString();
}

function CreateEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const isEditMode = Boolean(eventId);

  const [formData, setFormData] = useState({
    title: "",
    category: "Tech",
    venueId: "",
    date: "",
    startTime: "",
    endTime: "",
    capacity: "",
    price: "",
    status: "DRAFT",
    budgetAmount: "",
    budgetNote: "",
    description: "",
  });
  const [venues, setVenues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const venueLabel = useMemo(() => {
    return venues.find((venue) => venue.id === formData.venueId)?.name || "";
  }, [formData.venueId, venues]);

  useEffect(() => {
    let ignore = false;

    async function loadFormData() {
      setIsLoading(true);
      setError("");

      try {
        const venueResponse = await springApi.getVenues();

        if (!ignore) {
          setVenues(venueResponse.venues || []);

          if (venueResponse.venues?.length > 0) {
            setFormData((prev) => ({
              ...prev,
              venueId: prev.venueId || venueResponse.venues[0].id,
            }));
          }
        }

        if (isEditMode) {
          const eventResponse = await springApi.getEventById(eventId);
          const targetEvent = eventResponse.event;
          const startParts = toDateTimeParts(targetEvent.startAt);
          const endParts = toDateTimeParts(targetEvent.endAt);

          if (!ignore) {
            setFormData((prev) => ({
              ...prev,
              title: targetEvent.title || "",
              category: targetEvent.category || "Tech",
              venueId: targetEvent.venueId || prev.venueId,
              date: startParts.date,
              startTime: startParts.time,
              endTime: endParts.time,
              capacity: String(targetEvent.capacity || ""),
              price: String(targetEvent.price || ""),
              status: targetEvent.status || "DRAFT",
              description: targetEvent.description || "",
            }));
          }
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || "Failed to load event form data.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadFormData();

    return () => {
      ignore = true;
    };
  }, [eventId, isEditMode]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.title.trim()) {
      setError("Event title is required.");
      return;
    }

    if (!formData.venueId) {
      setError("Please select a venue.");
      return;
    }

    if (!formData.date || !formData.startTime || !formData.endTime) {
      setError("Date, start time, & end time are required.");
      return;
    }

    const startAt = combineDateAndTime(formData.date, formData.startTime);
    const endAt = combineDateAndTime(formData.date, formData.endTime);

    if (new Date(endAt) <= new Date(startAt)) {
      setError("End time must be after start time.");
      return;
    }

    const nextCapacity = Number(formData.capacity);
    if (!nextCapacity || nextCapacity < 1) {
      setError("Capacity must be at least 1.");
      return;
    }

    const nextPrice = Number(formData.price);
    if (Number.isNaN(nextPrice) || nextPrice < 0) {
      setError("Price must be 0 or greater.");
      return;
    }

    const payload = {
      title: formData.title,
      category: formData.category,
      venueId: formData.venueId,
      description: formData.description,
      startAt,
      endAt,
      capacity: nextCapacity,
      price: nextPrice,
      status: formData.status,
      budgetAmount: Number(formData.budgetAmount) || 0,
      budgetNote: formData.budgetNote,
    };

    setIsSubmitting(true);

    try {
      let warningMessage = "";

      if (isEditMode) {
        const response = await springApi.updateEvent(token, eventId, payload);
        navigate(`/events/${response.event.id}`, {
          replace: true,
          state: {
            successMessage: "Event updated successfully.",
          },
        });
      } else {
        const response = await springApi.createEvent(token, payload);

        if (Number(formData.budgetAmount) > 0) {
          try {
            await reportsApi.createBudget({
              eventId: response.event.id,
              plannedAmount: Number(formData.budgetAmount),
              note: formData.budgetNote || undefined,
            });
          } catch (budgetError) {
            warningMessage = `Event created, but the budget entry could not be synced: ${budgetError.message}`;
          }
        }

        navigate(`/events/${response.event.id}`, {
          replace: true,
          state: {
            successMessage: "Event created successfully.",
            warningMessage,
          },
        });
      }
    } catch (submitError) {
      setError(submitError.message || "Failed to save event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="section">
        <div className="container">
          <div className="card">
            <h2>Loading event form...</h2>
            <p className="page-subtitle" style={{ marginBottom: 0 }}>
              Preparing venue & schedule details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-event-page section">
      <div className="container">
        <div className="create-event-head">
          <h1 className="page-title">
            {isEditMode ? "Edit Event" : "Create Event"}
          </h1>
          <p className="page-subtitle">
            Configure event details, pricing, capacity, & publishing status.
          </p>
        </div>

        {error ? <div className="alert error">{error}</div> : null}
        {success ? <div className="alert success">{success}</div> : null}

        <form className="create-event-form card" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Event Title
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Campus Coding Night"
                required
              />
            </label>

            <label>
              Category
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option>Tech</option>
                <option>Design</option>
                <option>Community</option>
                <option>Workshop</option>
              </select>
            </label>

            <label>
              Venue
              <select
                name="venueId"
                value={formData.venueId}
                onChange={handleChange}
                required
              >
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Date
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Start Time
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              End Time
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Capacity
              <input
                name="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="120"
                required
              />
            </label>

            <label>
              Ticket Price (INR)
              <input
                name="price"
                type="number"
                min="0"
                value={formData.price}
                onChange={handleChange}
                placeholder="499"
                required
              />
            </label>

            <label>
              Status
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="PUBLISHED">PUBLISHED</option>
              </select>
            </label>

            <label>
              Budget Amount (optional)
              <input
                name="budgetAmount"
                type="number"
                min="0"
                value={formData.budgetAmount}
                onChange={handleChange}
                placeholder="100000"
              />
            </label>
          </div>

          <label className="description-row">
            Budget Note (optional)
            <input
              name="budgetNote"
              value={formData.budgetNote}
              onChange={handleChange}
              placeholder={
                venueLabel
                  ? `Example: Venue & production spend for ${venueLabel}`
                  : "Example: Venue & production spend"
              }
            />
          </label>

          <label className="description-row">
            Description
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your event goals & agenda"
              rows={5}
            />
          </label>

          <div className="submit-row">
            <Link to="/events" className="btn btn-outline">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                  ? "Save Changes"
                  : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEvent;
