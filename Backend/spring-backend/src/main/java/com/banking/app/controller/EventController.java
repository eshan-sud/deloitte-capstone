package com.banking.app.controller;

import com.banking.app.dto.ApiResponse;
import com.banking.app.dto.EventDtos;
import com.banking.app.dto.VenueResponse;
import com.banking.app.entity.Role;
import com.banking.app.entity.User;
import com.banking.app.service.EventService;
import com.banking.app.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping
public class EventController {

    private final EventService eventService;
    private final UserService userService;

    public EventController(EventService eventService, UserService userService) {
        this.eventService = eventService;
        this.userService = userService;
    }

    @GetMapping("/venues")
    public ResponseEntity<ApiResponse<List<VenueResponse>>> listVenues() {
        List<VenueResponse> venues = eventService.listVenues();
        return ResponseEntity.ok(ApiResponse.success("Venues fetched", venues));
    }

    @GetMapping("/events")
    public ResponseEntity<ApiResponse<List<EventDtos.EventResponse>>> listEvents(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "false") boolean includeDrafts,
            @AuthenticationPrincipal UserDetails userDetails) {

        boolean includeDraftsEffective = includeDrafts && isEventManager(userDetails);
        List<EventDtos.EventResponse> events = eventService.listEvents(query, category, status, includeDraftsEffective);
        return ResponseEntity.ok(ApiResponse.success("Events fetched", events));
    }

    @GetMapping("/events/{id}")
    public ResponseEntity<ApiResponse<EventDtos.EventResponse>> getEvent(@PathVariable Long id) {
        EventDtos.EventResponse event = eventService.getEvent(id);
        return ResponseEntity.ok(ApiResponse.success("Event fetched", event));
    }

    @PostMapping("/events")
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER')")
    public ResponseEntity<ApiResponse<EventDtos.EventResponse>> createEvent(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody EventDtos.EventRequest request) {
        EventDtos.EventResponse event = eventService.createEvent(userDetails.getUsername(), request);
        return new ResponseEntity<>(ApiResponse.success("Event created", event), HttpStatus.CREATED);
    }

    @PutMapping("/events/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER')")
    public ResponseEntity<ApiResponse<EventDtos.EventResponse>> updateEvent(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody EventDtos.EventRequest request) {
        EventDtos.EventResponse event = eventService.updateEvent(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Event updated", event));
    }

    @DeleteMapping("/events/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER')")
    public ResponseEntity<ApiResponse<Object>> deleteEvent(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        eventService.deleteEvent(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Event deleted", new Object()));
    }

    private boolean isEventManager(UserDetails userDetails) {
        if (userDetails == null) {
            return false;
        }

        User user = userService.findByEmailOrThrow(userDetails.getUsername());
        return user.getRole() == Role.ADMIN || user.getRole() == Role.ORGANIZER;
    }
}
