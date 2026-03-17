package com.banking.app.config;

import com.banking.app.entity.Role;
import com.banking.app.entity.User;
import com.banking.app.entity.Venue;
import com.banking.app.repository.UserRepository;
import com.banking.app.repository.VenueRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final VenueRepository venueRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    public DataSeeder(
            UserRepository userRepository,
            VenueRepository venueRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.venueRepository = venueRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!seedEnabled) {
            return;
        }

        seedUsers();
        seedVenues();
    }

    private void seedUsers() {
        if (!userRepository.existsByEmailIgnoreCase("admin@eventnest.io")) {
            User admin = new User();
            admin.setFirstName("Ava");
            admin.setLastName("Admin");
            admin.setEmail("admin@eventnest.io");
            admin.setPassword(passwordEncoder.encode("Admin@123"));
            admin.setRole(Role.ADMIN);
            admin.setIsActive(true);
            userRepository.save(admin);
        }

        if (!userRepository.existsByEmailIgnoreCase("organizer@eventnest.io")) {
            User organizer = new User();
            organizer.setFirstName("Owen");
            organizer.setLastName("Organizer");
            organizer.setEmail("organizer@eventnest.io");
            organizer.setPassword(passwordEncoder.encode("Organizer@123"));
            organizer.setRole(Role.ORGANIZER);
            organizer.setIsActive(true);
            userRepository.save(organizer);
        }

        if (!userRepository.existsByEmailIgnoreCase("customer@eventnest.io")) {
            User customer = new User();
            customer.setFirstName("Casey");
            customer.setLastName("Customer");
            customer.setEmail("customer@eventnest.io");
            customer.setPassword(passwordEncoder.encode("Customer@123"));
            customer.setRole(Role.CUSTOMER);
            customer.setIsActive(true);
            userRepository.save(customer);
        }
    }

    private void seedVenues() {
        if (venueRepository.count() > 0) {
            return;
        }

        venueRepository.save(createVenue("Innovation Hall", "City Center Campus", 220, "2200"));
        venueRepository.save(createVenue("Studio Commons", "Design District", 140, "1600"));
        venueRepository.save(createVenue("Main Auditorium", "Riverside Block", 420, "3500"));
    }

    private static Venue createVenue(String name, String address, int capacity, String pricePerHour) {
        Venue venue = new Venue();
        venue.setName(name);
        venue.setAddress(address);
        venue.setCapacity(capacity);
        venue.setPricePerHour(new BigDecimal(pricePerHour));
        venue.setActive(true);
        return venue;
    }
}
