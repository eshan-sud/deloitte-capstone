package com.banking.app.service;

import com.banking.app.dto.OrderDtos;
import com.banking.app.entity.Event;
import com.banking.app.entity.EventStatus;
import com.banking.app.entity.OrderStatus;
import com.banking.app.entity.Role;
import com.banking.app.entity.TicketOrder;
import com.banking.app.entity.User;
import com.banking.app.exception.BadRequestException;
import com.banking.app.exception.ResourceNotFoundException;
import com.banking.app.repository.EventRepository;
import com.banking.app.repository.TicketOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    private final TicketOrderRepository ticketOrderRepository;
    private final EventRepository eventRepository;
    private final UserService userService;

    public OrderService(
            TicketOrderRepository ticketOrderRepository,
            EventRepository eventRepository,
            UserService userService) {
        this.ticketOrderRepository = ticketOrderRepository;
        this.eventRepository = eventRepository;
        this.userService = userService;
    }

    @Transactional
    public OrderDtos.OrderResponse placeOrder(String userEmail, OrderDtos.PlaceOrderRequest request) {
        User user = userService.findByEmailOrThrow(userEmail);

        Event event = eventRepository.findWithVenueAndOrganizerById(request.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new BadRequestException("This event is not open for registrations");
        }

        int seatsLeft = Math.max(event.getCapacity() - event.getSeatsBooked(), 0);
        if (request.getQuantity() > seatsLeft) {
            throw new BadRequestException("Not enough seats available");
        }

        event.setSeatsBooked(event.getSeatsBooked() + request.getQuantity());

        TicketOrder order = new TicketOrder();
        order.setUser(user);
        order.setEvent(event);
        order.setQuantity(request.getQuantity());
        order.setStatus(OrderStatus.CONFIRMED);
        order.setTotalAmount(event.getPrice().multiply(BigDecimal.valueOf(request.getQuantity())));
        order.setTicketCode(generateTicketCode());

        TicketOrder saved = ticketOrderRepository.save(order);
        return OrderDtos.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<OrderDtos.OrderResponse> getMyOrders(String userEmail) {
        User user = userService.findByEmailOrThrow(userEmail);
        return ticketOrderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(OrderDtos::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderDtos.OrderResponse getOrderById(String userEmail, Long orderId) {
        User user = userService.findByEmailOrThrow(userEmail);

        TicketOrder order;
        if (user.getRole() == Role.ADMIN) {
            order = ticketOrderRepository.findById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        } else {
            order = ticketOrderRepository.findByIdAndUserId(orderId, user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        }

        return OrderDtos.fromEntity(order);
    }

    @Transactional
    public OrderDtos.OrderResponse cancelOrder(String userEmail, Long orderId) {
        User user = userService.findByEmailOrThrow(userEmail);

        TicketOrder order;
        if (user.getRole() == Role.ADMIN) {
            order = ticketOrderRepository.findById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        } else {
            order = ticketOrderRepository.findByIdAndUserId(orderId, user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Order is already cancelled");
        }

        order.setStatus(OrderStatus.CANCELLED);

        Event event = order.getEvent();
        event.setSeatsBooked(Math.max(event.getSeatsBooked() - order.getQuantity(), 0));

        return OrderDtos.fromEntity(ticketOrderRepository.save(order));
    }

    private static String generateTicketCode() {
        return "TKT-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }
}
