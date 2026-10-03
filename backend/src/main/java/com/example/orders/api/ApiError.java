package com.example.orders.api;

import java.time.Instant;
import java.util.List;

public record ApiError(Instant timestamp, int status, String error, String message, List<FieldViolation> violations) {

    public record FieldViolation(String field, String message) {
    }
}
