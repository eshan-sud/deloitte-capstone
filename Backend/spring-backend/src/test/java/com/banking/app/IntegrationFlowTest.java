package com.banking.app;

import com.banking.app.entity.Event;
import com.banking.app.entity.EventStatus;
import com.banking.app.entity.Role;
import com.banking.app.entity.User;
import com.banking.app.entity.Venue;
import com.banking.app.repository.EventRepository;
import com.banking.app.repository.UserRepository;
import com.banking.app.repository.VenueRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "app.seed.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:testdb;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
class IntegrationFlowTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
        private UserRepository userRepository;

    @Autowired
        private VenueRepository venueRepository;

    @Autowired
        private EventRepository eventRepository;

    @Autowired
        private PasswordEncoder passwordEncoder;

        @Value("${local.server.port}")
        private int port;

    @Test
    void registerForgotResetAndLoginWithNewPassword() throws Exception {
        String email = "integration-" + System.nanoTime() + "@eventnest.io";
        HttpClient httpClient = HttpClient.newHttpClient();

        HttpResponse<String> registerResponse = postJson(httpClient, "/api/auth/register", Map.of(
                "firstName", "Taylor",
                "lastName", "Tester",
                "email", email,
                "password", "Starter@123"));

        assertThat(registerResponse.statusCode()).isEqualTo(HttpStatus.CREATED.value());
        assertThat(registerResponse.body()).contains("\"success\":true");

        HttpResponse<String> forgotPasswordResponse = postJson(
                httpClient,
                "/api/auth/forgot-password",
                Map.of("email", email));

        assertThat(forgotPasswordResponse.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(forgotPasswordResponse.body()).contains("\"resetTokenIssued\":true");

        JsonNode forgotPasswordJson = objectMapper.readTree(forgotPasswordResponse.body());
        String resetToken = forgotPasswordJson.path("data").path("resetToken").asText();

        HttpResponse<String> resetPasswordResponse = postJson(httpClient, "/api/auth/reset-password", Map.of(
                "token", resetToken,
                "password", "Updated@123",
                "confirmPassword", "Updated@123"));

        assertThat(resetPasswordResponse.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(resetPasswordResponse.body()).contains("\"reset\":true");

        HttpResponse<String> loginResponse = postJson(httpClient, "/api/auth/login", Map.of(
                "email", email,
                "password", "Updated@123"));

        assertThat(loginResponse.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(loginResponse.body()).contains("\"token\":");
    }

    @Test
    void venueAvailabilityReturnsConflictsForOverlappingEvents() throws Exception {
        User organizer = new User();
        organizer.setFirstName("Olivia");
        organizer.setLastName("Organizer");
        organizer.setEmail("organizer-" + System.nanoTime() + "@eventnest.io");
        organizer.setPassword(passwordEncoder.encode("Organizer@123"));
        organizer.setRole(Role.ORGANIZER);
        organizer.setIsActive(true);
        organizer = userRepository.save(organizer);

        Venue venue = new Venue();
        venue.setName("Integration Hall " + System.nanoTime());
        venue.setAddress("Test District");
        venue.setCapacity(200);
        venue.setPricePerHour(new BigDecimal("2500.00"));
        venue.setActive(true);
        venue = venueRepository.save(venue);

        Event event = new Event();
        event.setTitle("Existing Venue Booking");
        event.setCategory("Tech");
        event.setDescription("Existing overlap for integration test");
        event.setVenue(venue);
        event.setOrganizer(organizer);
        event.setStartAt(LocalDateTime.of(2026, 4, 10, 10, 0));
        event.setEndAt(LocalDateTime.of(2026, 4, 10, 12, 0));
        event.setCapacity(100);
        event.setSeatsBooked(10);
        event.setPrice(new BigDecimal("499.00"));
        event.setStatus(EventStatus.PUBLISHED);
        eventRepository.save(event);

        String startAt = event.getStartAt().toInstant(ZoneOffset.UTC).toString();
        String endAt = LocalDateTime.of(2026, 4, 10, 11, 30).toInstant(ZoneOffset.UTC).toString();

        String availabilityUrl = UriComponentsBuilder.fromPath("/api/venues/availability")
                .queryParam("venueId", venue.getId())
                .queryParam("startAt", startAt)
                .queryParam("endAt", endAt)
                .toUriString();

        HttpClient httpClient = HttpClient.newHttpClient();
        HttpRequest availabilityRequest = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl() + availabilityUrl))
                .GET()
                .build();
        HttpResponse<String> availabilityResponse = httpClient.send(
                availabilityRequest,
                HttpResponse.BodyHandlers.ofString());

        assertThat(availabilityResponse.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(availabilityResponse.body()).contains("\"available\":false");
        assertThat(availabilityResponse.body()).contains("Existing Venue Booking");
    }

    private HttpResponse<String> postJson(HttpClient httpClient, String path, Object body) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl() + path))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private String baseUrl() {
        return "http://localhost:" + port;
    }
}