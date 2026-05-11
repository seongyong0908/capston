package com.capston.date_app;

import org.springframework.boot.SpringApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@EnableAsync
@SpringBootApplication
public class DateAppApplication {

	public static void main(String[] args) {
		SpringApplication.run(DateAppApplication.class, args);
	}

}
