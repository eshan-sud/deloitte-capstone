package com.eventnest.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.List;
import java.util.stream.Stream;

@SpringBootApplication
@EnableJpaAuditing
public class EventNestApplication {

    private static final Map<String, String> EXACT_PROPERTY_ALIASES = Map.ofEntries(
            Map.entry("SPRING_PROFILES_ACTIVE", "spring.profiles.active"),
            Map.entry("SPRING_DATASOURCE_URL", "spring.datasource.url"),
            Map.entry("SPRING_DATASOURCE_DRIVER_CLASS_NAME", "spring.datasource.driver-class-name"),
            Map.entry("SPRING_DATASOURCE_USERNAME", "spring.datasource.username"),
            Map.entry("SPRING_DATASOURCE_PASSWORD", "spring.datasource.password"),
            Map.entry("SPRING_JPA_HIBERNATE_DIALECT", "spring.jpa.properties.hibernate.dialect"),
            Map.entry("SPRING_JPA_HIBERNATE_DDL_AUTO", "spring.jpa.hibernate.ddl-auto"),
            Map.entry("SERVER_PORT", "server.port"),
            Map.entry("SERVER_SERVLET_CONTEXT_PATH", "server.servlet.context-path"),
            Map.entry("JWT_SECRET", "jwt.secret"),
            Map.entry("JWT_EXPIRATION", "jwt.expiration")
    );

    public static void main(String[] args) {
        loadLocalEnvFile();
        SpringApplication.run(EventNestApplication.class, args);
    }

    private static void loadLocalEnvFile() {
        List<Path> candidatePaths = List.of(
                Path.of(".env"),
                Path.of("Backend", "spring-backend", ".env")
        );

        for (Path candidatePath : candidatePaths) {
            if (Files.isRegularFile(candidatePath)) {
                applyEnvFile(candidatePath);
                return;
            }
        }
    }

    private static void applyEnvFile(Path envFilePath) {
        try (Stream<String> lines = Files.lines(envFilePath)) {
            lines.map(String::trim)
                    .filter(line -> !line.isEmpty())
                    .filter(line -> !line.startsWith("#"))
                    .forEach(EventNestApplication::applyEnvLine);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to load environment variables from " + envFilePath, exception);
        }
    }

    private static void applyEnvLine(String line) {
        int separatorIndex = line.indexOf('=');
        if (separatorIndex <= 0) {
            return;
        }

        String key = line.substring(0, separatorIndex).trim();
        if (key.startsWith("export ")) {
            key = key.substring("export ".length()).trim();
        }

        if (key.isEmpty() || System.getenv(key) != null || System.getProperty(key) != null) {
            return;
        }

        String rawValue = line.substring(separatorIndex + 1).trim();
        String resolvedValue = stripWrappingQuotes(rawValue);
        setPropertyIfAbsent(key, resolvedValue);

        String exactAliasKey = EXACT_PROPERTY_ALIASES.get(key);
        if (exactAliasKey != null) {
            setPropertyIfAbsent(exactAliasKey, resolvedValue);
        }

        String relaxedBindingKey = toRelaxedPropertyKey(key);
        if (!relaxedBindingKey.equals(key) && !relaxedBindingKey.equals(exactAliasKey)) {
            setPropertyIfAbsent(relaxedBindingKey, resolvedValue);
        }
    }

    private static void setPropertyIfAbsent(String key, String value) {
        if (System.getProperty(key) == null) {
            System.setProperty(key, value);
        }
    }

    private static String toRelaxedPropertyKey(String key) {
        boolean envStyleKey = key.chars().allMatch(character ->
                Character.isUpperCase(character) || Character.isDigit(character) || character == '_');
        if (!envStyleKey) {
            return key;
        }

        return key.toLowerCase().replace('_', '.');
    }

    private static String stripWrappingQuotes(String value) {
        if (value.length() >= 2) {
            char firstCharacter = value.charAt(0);
            char lastCharacter = value.charAt(value.length() - 1);
            if ((firstCharacter == '"' && lastCharacter == '"') || (firstCharacter == '\'' && lastCharacter == '\'')) {
                return value.substring(1, value.length() - 1);
            }
        }

        return value;
    }

}
