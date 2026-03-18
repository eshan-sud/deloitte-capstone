package com.banking.app.dto;

import com.banking.app.entity.Event;

import java.time.LocalDateTime;
import java.util.List;

public class VenueAvailabilityResponse {

    private Long venueId;
    private String venueName;
    private LocalDateTime requestedStartAt;
    private LocalDateTime requestedEndAt;
    private boolean available;
    private List<ConflictSummary> conflicts;

    public static VenueAvailabilityResponse of(
            Long venueId,
            String venueName,
            LocalDateTime requestedStartAt,
            LocalDateTime requestedEndAt,
            List<Event> conflictingEvents) {
        VenueAvailabilityResponse response = new VenueAvailabilityResponse();
        response.venueId = venueId;
        response.venueName = venueName;
        response.requestedStartAt = requestedStartAt;
        response.requestedEndAt = requestedEndAt;
        response.available = conflictingEvents.isEmpty();
        response.conflicts = conflictingEvents.stream().map(ConflictSummary::fromEntity).toList();
        return response;
    }

    public Long getVenueId() {
        return venueId;
    }

    public void setVenueId(Long venueId) {
        this.venueId = venueId;
    }

    public String getVenueName() {
        return venueName;
    }

    public void setVenueName(String venueName) {
        this.venueName = venueName;
    }

    public LocalDateTime getRequestedStartAt() {
        return requestedStartAt;
    }

    public void setRequestedStartAt(LocalDateTime requestedStartAt) {
        this.requestedStartAt = requestedStartAt;
    }

    public LocalDateTime getRequestedEndAt() {
        return requestedEndAt;
    }

    public void setRequestedEndAt(LocalDateTime requestedEndAt) {
        this.requestedEndAt = requestedEndAt;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public List<ConflictSummary> getConflicts() {
        return conflicts;
    }

    public void setConflicts(List<ConflictSummary> conflicts) {
        this.conflicts = conflicts;
    }

    public static class ConflictSummary {

        private Long eventId;
        private String title;
        private String status;
        private Long organizerId;
        private String organizerName;
        private LocalDateTime startAt;
        private LocalDateTime endAt;

        public static ConflictSummary fromEntity(Event event) {
            ConflictSummary summary = new ConflictSummary();
            summary.eventId = event.getId();
            summary.title = event.getTitle();
            summary.status = event.getStatus().name();
            summary.organizerId = event.getOrganizer().getId();
            summary.organizerName = event.getOrganizer().getFirstName() + " " + event.getOrganizer().getLastName();
            summary.startAt = event.getStartAt();
            summary.endAt = event.getEndAt();
            return summary;
        }

        public Long getEventId() {
            return eventId;
        }

        public void setEventId(Long eventId) {
            this.eventId = eventId;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public Long getOrganizerId() {
            return organizerId;
        }

        public void setOrganizerId(Long organizerId) {
            this.organizerId = organizerId;
        }

        public String getOrganizerName() {
            return organizerName;
        }

        public void setOrganizerName(String organizerName) {
            this.organizerName = organizerName;
        }

        public LocalDateTime getStartAt() {
            return startAt;
        }

        public void setStartAt(LocalDateTime startAt) {
            this.startAt = startAt;
        }

        public LocalDateTime getEndAt() {
            return endAt;
        }

        public void setEndAt(LocalDateTime endAt) {
            this.endAt = endAt;
        }
    }
}