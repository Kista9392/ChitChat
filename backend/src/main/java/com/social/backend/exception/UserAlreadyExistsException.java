package com.social.backend.exception;

// Creating our own custom exception makes our code much more readable
public class UserAlreadyExistsException extends RuntimeException {
    public UserAlreadyExistsException(String message) {
        super(message);
    }
}
