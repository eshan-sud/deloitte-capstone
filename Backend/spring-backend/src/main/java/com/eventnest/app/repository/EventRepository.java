package com.eventnest.app.repository;

import com.eventnest.app.entity.Event;
import com.eventnest.app.entity.EventStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    @EntityGraph(attributePaths = {"venue", "organizer"})
    Optional<Event> findWithVenueAndOrganizerById(Long id);

    @EntityGraph(attributePaths = {"venue", "organizer"})
    @Query("""
            SELECT e FROM Event e
            WHERE (:status IS NULL OR e.status = :status)
              AND (:category IS NULL OR LOWER(e.category) = LOWER(:category))
              AND (
                    :query IS NULL
                    OR LOWER(e.title) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(e.description) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(e.venue.name) LIKE LOWER(CONCAT('%', :query, '%'))
                  )
              AND (:includeDrafts = TRUE OR e.status <> com.eventnest.app.entity.EventStatus.DRAFT)
            ORDER BY e.startAt ASC
            """)
    List<Event> searchEvents(
            @Param("query") String query,
            @Param("category") String category,
            @Param("status") EventStatus status,
            @Param("includeDrafts") boolean includeDrafts);

        boolean existsByOrganizerIdAndTitleIgnoreCase(Long organizerId, String title);

        boolean existsByOrganizerIdAndTitleIgnoreCaseAndIdNot(Long organizerId, String title, Long id);

        @EntityGraph(attributePaths = {"venue", "organizer"})
        @Query("""
          SELECT e FROM Event e
          WHERE e.venue.id = :venueId
            AND (:excludeEventId IS NULL OR e.id <> :excludeEventId)
            AND e.status <> com.eventnest.app.entity.EventStatus.CANCELLED
            AND e.startAt < :endAt
            AND e.endAt > :startAt
          ORDER BY e.startAt ASC
          """)
        List<Event> findVenueConflicts(
          @Param("venueId") Long venueId,
          @Param("startAt") LocalDateTime startAt,
          @Param("endAt") LocalDateTime endAt,
          @Param("excludeEventId") Long excludeEventId);
}
