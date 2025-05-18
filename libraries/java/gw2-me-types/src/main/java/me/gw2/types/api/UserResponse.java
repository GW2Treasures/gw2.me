package me.gw2.types.api;

import com.fasterxml.jackson.databind.JsonNode;

import javax.annotation.Nullable;
import java.util.Optional;

public record UserResponse(String sub, User user, @Nullable JsonNode settings) {
    public record User(
            String id,
            String name,
            @Nullable String email,
            @Nullable Boolean emailVerified) {

        public Optional<String> emailOptional() {
            return Optional.ofNullable(email);
        }

        public Optional<Boolean> emailVerifiedOptional() {
            return Optional.ofNullable(emailVerified);
        }
    }

    public Optional<JsonNode> settingsOptional() {
        return Optional.ofNullable(settings);
    }
}
