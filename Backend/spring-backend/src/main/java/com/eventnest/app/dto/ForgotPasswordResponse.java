package com.eventnest.app.dto;

import java.time.OffsetDateTime;

public class ForgotPasswordResponse {

    private boolean demoMode;
    private boolean resetTokenIssued;
    private String resetToken;
    private OffsetDateTime expiresAt;

    public static ForgotPasswordResponse generic() {
        ForgotPasswordResponse response = new ForgotPasswordResponse();
        response.demoMode = true;
        response.resetTokenIssued = false;
        return response;
    }

    public static ForgotPasswordResponse demoToken(String resetToken, OffsetDateTime expiresAt) {
        ForgotPasswordResponse response = new ForgotPasswordResponse();
        response.demoMode = true;
        response.resetTokenIssued = true;
        response.resetToken = resetToken;
        response.expiresAt = expiresAt;
        return response;
    }

    public boolean isDemoMode() {
        return demoMode;
    }

    public void setDemoMode(boolean demoMode) {
        this.demoMode = demoMode;
    }

    public boolean isResetTokenIssued() {
        return resetTokenIssued;
    }

    public void setResetTokenIssued(boolean resetTokenIssued) {
        this.resetTokenIssued = resetTokenIssued;
    }

    public String getResetToken() {
        return resetToken;
    }

    public void setResetToken(String resetToken) {
        this.resetToken = resetToken;
    }

    public OffsetDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(OffsetDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
}