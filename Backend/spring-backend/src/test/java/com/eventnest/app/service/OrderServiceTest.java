package com.eventnest.app.service;

import com.eventnest.app.dto.OrderDtos;
import com.eventnest.app.entity.Event;
import com.eventnest.app.entity.EventStatus;
import com.eventnest.app.entity.OrderStatus;
import com.eventnest.app.entity.Role;
import com.eventnest.app.entity.TicketOrder;
import com.eventnest.app.entity.User;
import com.eventnest.app.exception.BadRequestException;
import com.eventnest.app.repository.EventRepository;
import com.eventnest.app.repository.TicketOrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private TicketOrderRepository ticketOrderRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private OrderService orderService;

    @Test
    void placeOrderShouldRejectNonPublishedEvents() {
        User customer = new User();
        customer.setId(10L);
        customer.setEmail("customer@eventnest.io");

        Event draftEvent = new Event();
        draftEvent.setId(100L);
        draftEvent.setStatus(EventStatus.DRAFT);
        draftEvent.setCapacity(50);
        draftEvent.setSeatsBooked(0);
        draftEvent.setPrice(BigDecimal.valueOf(100));

        OrderDtos.PlaceOrderRequest request = new OrderDtos.PlaceOrderRequest();
        request.setEventId(100L);
        request.setQuantity(1);

        when(userService.findByEmailOrThrow("customer@eventnest.io")).thenReturn(customer);
        when(eventRepository.findWithVenueAndOrganizerById(100L)).thenReturn(Optional.of(draftEvent));

        assertThrows(BadRequestException.class, () ->
                orderService.placeOrder("customer@eventnest.io", request));
    }

    @Test
    void placeOrderShouldRejectWhenQuantityExceedsAvailableSeats() {
        User customer = new User();
        customer.setId(10L);
        customer.setEmail("customer@eventnest.io");

        Event event = new Event();
        event.setId(101L);
        event.setStatus(EventStatus.PUBLISHED);
        event.setCapacity(5);
        event.setSeatsBooked(5);
        event.setPrice(BigDecimal.valueOf(250));

        OrderDtos.PlaceOrderRequest request = new OrderDtos.PlaceOrderRequest();
        request.setEventId(101L);
        request.setQuantity(1);

        when(userService.findByEmailOrThrow("customer@eventnest.io")).thenReturn(customer);
        when(eventRepository.findWithVenueAndOrganizerById(101L)).thenReturn(Optional.of(event));

        assertThrows(BadRequestException.class, () ->
                orderService.placeOrder("customer@eventnest.io", request));
    }

    @Test
    void cancelOrderShouldRejectAlreadyCancelledOrders() {
        User admin = new User();
        admin.setId(1L);
        admin.setRole(Role.ADMIN);

        Event event = new Event();
        event.setCapacity(100);
        event.setSeatsBooked(10);

        TicketOrder cancelledOrder = new TicketOrder();
        cancelledOrder.setId(999L);
        cancelledOrder.setStatus(OrderStatus.CANCELLED);
        cancelledOrder.setEvent(event);
        cancelledOrder.setQuantity(2);

        when(userService.findByEmailOrThrow("admin@eventnest.io")).thenReturn(admin);
        when(ticketOrderRepository.findById(999L)).thenReturn(Optional.of(cancelledOrder));

        assertThrows(BadRequestException.class, () ->
                orderService.cancelOrder("admin@eventnest.io", 999L));
    }
}
