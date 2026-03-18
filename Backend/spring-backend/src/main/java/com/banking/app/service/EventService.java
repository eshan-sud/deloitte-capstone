package com.banking.app.service;

import com.banking.app.dto.EventDtos;
import com.banking.app.dto.VenueAvailabilityResponse;
import com.banking.app.dto.VenueResponse;
import com.banking.app.entity.Event;
import com.banking.app.entity.EventStatus;
import com.banking.app.entity.Role;
import com.banking.app.entity.User;
import com.banking.app.entity.Venue;
import com.banking.app.exception.BadRequestException;
import com.banking.app.exception.ResourceNotFoundException;
import com.banking.app.repository.EventRepository;
import com.banking.app.repository.VenueRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final VenueRepository venueRepository;
    private final UserService userService;

    public EventService(
            EventRepository eventRepository,
            VenueRepository venueRepository,
            UserService userService) {
        this.eventRepository = eventRepository;
        this.venueRepository = venueRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<VenueResponse> listVenues() {
        return venueRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(VenueResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EventDtos.EventResponse> listEvents(String query, String category, String status, boolean includeDrafts) {
        EventStatus eventStatus = null;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            try {
                eventStatus = EventStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException("Invalid status filter");
            }
        }

        String normalizedQuery = (query == null || query.isBlank()) ? null : query.trim();
        String normalizedCategory = (category == null || category.isBlank() || "ALL".equalsIgnoreCase(category))
                ? null
                : category.trim();

        return eventRepository.searchEvents(normalizedQuery, normalizedCategory, eventStatus, includeDrafts)
                .stream()
                .map(EventDtos::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public EventDtos.EventResponse getEvent(Long id) {
        Event event = eventRepository.findWithVenueAndOrganizerById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        return EventDtos.fromEntity(event);
    }

    @Transactional
    public EventDtos.EventResponse createEvent(String userEmail, EventDtos.EventRequest request) {
        User requester = userService.findByEmailOrThrow(userEmail);
        requireManagerRole(requester);

        validateEventSchedule(request.getStartAt(), request.getEndAt());
        validateOrganizerTitle(requester.getId(), request.getTitle(), null);

        Venue venue = venueRepository.findById(request.getVenueId())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found"));
        requireActiveVenue(venue);
        requireVenueAvailability(venue.getId(), request.getStartAt(), request.getEndAt(), null);

        Event event = new Event();
        applyEventRequest(event, request, venue);
        event.setOrganizer(requester);
        event.setSeatsBooked(0);

        Event saved = eventRepository.save(event);
        return EventDtos.fromEntity(saved);
    }

    @Transactional
    public EventDtos.EventResponse updateEvent(String userEmail, Long eventId, EventDtos.EventRequest request) {
        User requester = userService.findByEmailOrThrow(userEmail);
        Event event = eventRepository.findWithVenueAndOrganizerById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        requireEventAccess(requester, event);
        validateEventSchedule(request.getStartAt(), request.getEndAt());
        validateOrganizerTitle(event.getOrganizer().getId(), request.getTitle(), event.getId());

        if (request.getCapacity() < event.getSeatsBooked()) {
            throw new BadRequestException("Capacity cannot be lower than booked seats");
        }

        Venue venue = venueRepository.findById(request.getVenueId())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found"));
    requireActiveVenue(venue);
    requireVenueAvailability(venue.getId(), request.getStartAt(), request.getEndAt(), event.getId());

        applyEventRequest(event, request, venue);

        Event saved = eventRepository.save(event);
        return EventDtos.fromEntity(saved);
    }

    @Transactional
    public void deleteEvent(String userEmail, Long eventId) {
        User requester = userService.findByEmailOrThrow(userEmail);
        Event event = eventRepository.findWithVenueAndOrganizerById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        requireEventAccess(requester, event);
        eventRepository.delete(event);
    }

    @Transactional(readOnly = true)
    public VenueAvailabilityResponse checkVenueAvailability(
            Long venueId,
            LocalDateTime startAt,
            LocalDateTime endAt,
            Long excludeEventId) {
        validateEventSchedule(startAt, endAt);

        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found"));

        List<Event> conflicts = eventRepository.findVenueConflicts(venueId, startAt, endAt, excludeEventId);
        return VenueAvailabilityResponse.of(venue.getId(), venue.getName(), startAt, endAt, conflicts);
    }

    private static void applyEventRequest(Event event, EventDtos.EventRequest request, Venue venue) {
        event.setTitle(request.getTitle().trim());
        event.setCategory(request.getCategory().trim());
        event.setDescription(request.getDescription().trim());
        event.setVenue(venue);
        event.setStartAt(request.getStartAt());
        event.setEndAt(request.getEndAt());
        event.setCapacity(request.getCapacity());
        event.setPrice(request.getPrice());
        event.setStatus(request.getStatus());
    }

    private static void validateEventSchedule(java.time.LocalDateTime startAt, java.time.LocalDateTime endAt) {
        if (endAt.isBefore(startAt) || endAt.isEqual(startAt)) {
            throw new BadRequestException("End time must be after start time");
        }
    }

    private void validateOrganizerTitle(Long organizerId, String title, Long eventId) {
        String normalizedTitle = title.trim();

        boolean exists = eventId == null
                ? eventRepository.existsByOrganizerIdAndTitleIgnoreCase(organizerId, normalizedTitle)
                : eventRepository.existsByOrganizerIdAndTitleIgnoreCaseAndIdNot(organizerId, normalizedTitle, eventId);

        if (exists) {
            throw new BadRequestException("You already have an event with this title");
        }
    }

    private void requireVenueAvailability(
            Long venueId,
            LocalDateTime startAt,
            LocalDateTime endAt,
            Long excludeEventId) {
        List<Event> conflicts = eventRepository.findVenueConflicts(venueId, startAt, endAt, excludeEventId);
        if (!conflicts.isEmpty()) {
            throw new BadRequestException("Selected venue is not available for the requested time slot");
        }
    }

    private static void requireActiveVenue(Venue venue) {
        if (!Boolean.TRUE.equals(venue.getActive())) {
            throw new BadRequestException("Selected venue is not active");
        }
    }

    private static void requireManagerRole(User requester) {
        if (requester.getRole() != Role.ADMIN && requester.getRole() != Role.ORGANIZER) {
            throw new BadRequestException("Only organizers or admins can manage events");
        }
    }

    private static void requireEventAccess(User requester, Event event) {
        boolean isAdmin = requester.getRole() == Role.ADMIN;
        boolean isOwner = event.getOrganizer().getId().equals(requester.getId());

        if (!isAdmin && !isOwner) {
            throw new BadRequestException("You can only modify events you created");
        }
    }
}
