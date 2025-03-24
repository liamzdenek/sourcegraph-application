package com.example.vulnerable;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

/**
 * A simple application that uses a vulnerable version of Log4j (2.14.1)
 * This version is vulnerable to CVE-2021-44228 (Log4Shell)
 */
public class VulnerableApp {
    private static final Logger logger = LogManager.getLogger(VulnerableApp.class);

    public static void main(String[] args) {
        System.out.println("Starting vulnerable Log4j application...");
        
        // Log a message that could potentially be exploited
        String userInput = System.getProperty("user.input", "Hello, world!");
        logger.info("User input: {}", userInput);
        
        // Log some additional messages
        logger.debug("Debug message");
        logger.info("Info message");
        logger.warn("Warning message");
        logger.error("Error message");
        
        System.out.println("Application completed.");
    }
}