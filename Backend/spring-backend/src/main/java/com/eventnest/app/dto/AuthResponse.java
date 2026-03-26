package com.eventnest.app.dto;

public class AuthResponse {

    private boolean success;
    private String token;
    private UserResponse user;
    private String message;

    // Constructors
    public AuthResponse() {
    }

    public AuthResponse(boolean success, String token, UserResponse user) {
        this.success = success;
        this.token = token;
        this.user = user;
    }

    public AuthResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    // Getters & Setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public UserResponse getUser() {
        return user;
    }

    public void setUser(UserResponse user) {
        this.user = user;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
