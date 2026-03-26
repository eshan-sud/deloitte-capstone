package com.eventnest.app.service;

import com.eventnest.app.dto.EventDtos;
import com.eventnest.app.dto.VenueAvailabilityResponse;
import com.eventnest.app.entity.Event;
import com.eventnest.app.entity.EventStatus;
import com.eventnest.app.entity.Role;
import com.eventnest.app.entity.User;
import com.eventnest.app.entity.Venue;
import com.eventnest.app.exception.BadRequestException;
import com.eventnest.app.repository.EventRepository;
import com.eventnest.app.repository.VenueRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private VenueRepository venueRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private EventService eventService;

    @Test
    void listEventsShouldRejectInvalidStatusFilter() {
        assertThrows(BadRequestException.class, () ->
                eventService.listEvents(null, null, "NOT_A_STATUS", false));
    }

    @Test
    void createEventShouldRejectInactiveVenue() {
        User organizer = new User();
        organizer.setId(1L);
        organizer.setRole(Role.ORGANIZER);

        Venue inactiveVenue = new Venue();
        inactiveVenue.setId(10L);
        inactiveVenue.setActive(false);

        EventDtos.EventRequest request = new EventDtos.EventRequest();
        request.setTitle("Tech Expo");
        request.setCategory("Technology");
        request.setDescription("A full-day event for developers and founders.");
        request.setVenueId(10L);
        request.setStartAt(LocalDateTime.of(2026, 6, 1, 10, 0));
        request.setEndAt(LocalDateTime.of(2026, 6, 1, 12, 0));
        request.setCapacity(100);
        request.setPrice(BigDecimal.valueOf(499));
        request.setStatus(EventStatus.PUBLISHED);

        when(userService.findByEmailOrThrow("organizer@eventnest.io")).thenReturn(organizer);
        when(eventRepository.existsByOrganizerIdAndTitleIgnoreCase(1L, "Tech Expo")).thenReturn(false);
        when(venueRepository.findById(10L)).thenReturn(Optional.of(inactiveVenue));

        assertThrows(BadRequestException.class, () ->
                eventService.createEvent("organizer@eventnest.io", request));
    }

    @Test
    void checkVenueAvailabilityShouldReturnConflictsWhenEventsOverlap() {
        Venue venue = new Venue();
        venue.setId(11L);
        venue.setName("Main Hall");

        User organizer = new User();
        organizer.setId(2L);
        organizer.setFirstName("Ava");
        organizer.setLastName("Shah");

        Event conflict = new Event();
        conflict.setId(77L);
        conflict.setTitle("Existing Booking");
        conflict.setStatus(EventStatus.PUBLISHED);
        conflict.setOrganizer(organizer);
        conflict.setStartAt(LocalDateTime.of(2026, 7, 15, 10, 0));
        conflict.setEndAt(LocalDateTime.of(2026, 7, 15, 12, 0));

        when(venueRepository.findById(11L)).thenReturn(Optional.of(venue));
        when(eventRepository.findVenueConflicts(
                eq(11L),
                any(LocalDateTime.class),
                any(LocalDateTime.class),
                anyLong()))
                .thenReturn(List.of(conflict));

        VenueAvailabilityResponse response = eventService.checkVenueAvailability(
                11L,
                LocalDateTime.of(2026, 7, 15, 11, 0),
                LocalDateTime.of(2026, 7, 15, 13, 0),
                999L);

        assertFalse(response.isAvailable());
        assertEquals(1, response.getConflicts().size());
        assertEquals("Existing Booking", response.getConflicts().get(0).getTitle());
    }
}
