package com.banking.app.dto;

import com.banking.app.entity.Event;
import com.banking.app.entity.EventStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class EventDtos {

    private EventDtos() {
    }

    public static EventResponse fromEntity(Event event) {
        EventResponse response = new EventResponse();
        response.setId(event.getId());
        response.setTitle(event.getTitle());
        response.setCategory(event.getCategory());
        response.setDescription(event.getDescription());
        response.setVenueId(event.getVenue().getId());
        response.setVenueName(event.getVenue().getName());
        response.setOrganizerId(event.getOrganizer().getId());
        response.setOrganizerName(event.getOrganizer().getFirstName() + " " + event.getOrganizer().getLastName());
        response.setStartAt(event.getStartAt());
        response.setEndAt(event.getEndAt());
        response.setCapacity(event.getCapacity());
        response.setSeatsBooked(event.getSeatsBooked());
        response.setSeatsLeft(Math.max(event.getCapacity() - event.getSeatsBooked(), 0));
        response.setPrice(event.getPrice());
        response.setStatus(event.getStatus());
        response.setCreatedAt(event.getCreatedAt());
        response.setUpdatedAt(event.getUpdatedAt());
        return response;
    }

    public static class EventRequest {

        @NotBlank(message = "Title is required")
        @Size(min = 3, max = 140)
        private String title;

        @NotBlank(message = "Category is required")
        @Size(min = 2, max = 80)
        private String category;

        @NotBlank(message = "Description is required")
        @Size(min = 10, max = 4000)
        private String description;

        @NotNull(message = "Venue ID is required")
        private Long venueId;

        @NotNull(message = "Start datetime is required")
        private LocalDateTime startAt;

        @NotNull(message = "End datetime is required")
        private LocalDateTime endAt;

        @NotNull(message = "Capacity is required")
        @Min(value = 1, message = "Capacity must be at least 1")
        private Integer capacity;

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.0", inclusive = true, message = "Price must be 0 or greater")
        private BigDecimal price;

        @NotNull(message = "Status is required")
        private EventStatus status;

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public Long getVenueId() {
            return venueId;
        }

        public void setVenueId(Long venueId) {
            this.venueId = venueId;
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

        public Integer getCapacity() {
            return capacity;
        }

        public void setCapacity(Integer capacity) {
            this.capacity = capacity;
        }

        public BigDecimal getPrice() {
            return price;
        }

        public void setPrice(BigDecimal price) {
            this.price = price;
        }

        public EventStatus getStatus() {
            return status;
        }

        public void setStatus(EventStatus status) {
            this.status = status;
        }
    }

    public static class EventResponse {
        private Long id;
        private String title;
        private String category;
        private String description;
        private Long venueId;
        private String venueName;
        private Long organizerId;
        private String organizerName;
        private LocalDateTime startAt;
        private LocalDateTime endAt;
        private Integer capacity;
        private Integer seatsBooked;
        private Integer seatsLeft;
        private BigDecimal price;
        private EventStatus status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
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

        public Integer getCapacity() {
            return capacity;
        }

        public void setCapacity(Integer capacity) {
            this.capacity = capacity;
        }

        public Integer getSeatsBooked() {
            return seatsBooked;
        }

        public void setSeatsBooked(Integer seatsBooked) {
            this.seatsBooked = seatsBooked;
        }

        public Integer getSeatsLeft() {
            return seatsLeft;
        }

        public void setSeatsLeft(Integer seatsLeft) {
            this.seatsLeft = seatsLeft;
        }

        public BigDecimal getPrice() {
            return price;
        }

        public void setPrice(BigDecimal price) {
            this.price = price;
        }

        public EventStatus getStatus() {
            return status;
        }

        public void setStatus(EventStatus status) {
            this.status = status;
        }

        public LocalDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }

        public LocalDateTime getUpdatedAt() {
            return updatedAt;
        }

        public void setUpdatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
        }
    }
}
