package com.eventnest.app.dto;

import com.eventnest.app.entity.Venue;

import java.math.BigDecimal;

public class VenueResponse {
    private Long id;
    private String name;
    private String address;
    private Integer capacity;
    private BigDecimal pricePerHour;

    public static VenueResponse fromEntity(Venue venue) {
        VenueResponse response = new VenueResponse();
        response.id = venue.getId();
        response.name = venue.getName();
        response.address = venue.getAddress();
        response.capacity = venue.getCapacity();
        response.pricePerHour = venue.getPricePerHour();
        return response;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getAddress() {
        return address;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public BigDecimal getPricePerHour() {
        return pricePerHour;
    }
}
