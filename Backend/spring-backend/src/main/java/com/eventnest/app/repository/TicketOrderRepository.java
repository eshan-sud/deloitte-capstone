package com.eventnest.app.repository;

import com.eventnest.app.entity.TicketOrder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketOrderRepository extends JpaRepository<TicketOrder, Long> {

    @Override
    @EntityGraph(attributePaths = {"event", "event.venue", "event.organizer", "user"})
    Optional<TicketOrder> findById(Long id);

    @EntityGraph(attributePaths = {"event", "event.venue", "event.organizer", "user"})
    List<TicketOrder> findByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"event", "event.venue", "event.organizer", "user"})
    Optional<TicketOrder> findByIdAndUserId(Long id, Long userId);
}
