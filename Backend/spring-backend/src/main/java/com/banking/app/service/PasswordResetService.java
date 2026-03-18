package com.banking.app.service;

import com.banking.app.dto.ForgotPasswordResponse;
import com.banking.app.exception.BadRequestException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PasswordResetService {

    private static final Duration TOKEN_TTL = Duration.ofMinutes(30);

    private final Map<String, ResetTokenRecord> resetTokens = new ConcurrentHashMap<>();

    public ForgotPasswordResponse issueDemoToken(String email) {
        clearExpiredTokens();
        invalidateTokensForEmail(email);

        String token = UUID.randomUUID().toString().replace("-", "");
        OffsetDateTime expiresAt = OffsetDateTime.now().plus(TOKEN_TTL);
        resetTokens.put(token, new ResetTokenRecord(email, expiresAt));

        return ForgotPasswordResponse.demoToken(token, expiresAt);
    }

    public String consumeToken(String token) {
        clearExpiredTokens();

        ResetTokenRecord record = resetTokens.remove(token);
        if (record == null || record.expiresAt().isBefore(OffsetDateTime.now())) {
            throw new BadRequestException("Reset token is invalid or expired");
        }

        return record.email();
    }

    private void invalidateTokensForEmail(String email) {
        resetTokens.entrySet().removeIf((entry) -> entry.getValue().email().equalsIgnoreCase(email));
    }

    private void clearExpiredTokens() {
        OffsetDateTime now = OffsetDateTime.now();
        resetTokens.entrySet().removeIf((entry) -> entry.getValue().expiresAt().isBefore(now));
    }

    private record ResetTokenRecord(String email, OffsetDateTime expiresAt) {
    }
}