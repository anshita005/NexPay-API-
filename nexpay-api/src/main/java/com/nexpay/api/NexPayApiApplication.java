package com.nexpay.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class NexPayApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(NexPayApiApplication.class, args);
    }
}
