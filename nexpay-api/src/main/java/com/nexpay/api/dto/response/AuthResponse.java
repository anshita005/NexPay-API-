package com.nexpay.api.dto.response;

public record AuthResponse(
        String accessToken,
        String tokenType,
        UserDto user
) {
    public AuthResponse(String accessToken, UserDto user) {
        this(accessToken, "Bearer", user);
    }
}
