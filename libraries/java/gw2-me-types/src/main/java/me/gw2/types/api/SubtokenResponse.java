package me.gw2.types.api;

import java.time.OffsetDateTime;

public record SubtokenResponse(String subtoken, OffsetDateTime expiresAt) {}
