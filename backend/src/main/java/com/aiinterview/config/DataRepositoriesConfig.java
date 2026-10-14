package com.aiinterview.config;

import com.aiinterview.repository.ResumeAnalysisRepository;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@Configuration
@EnableJpaRepositories(
        basePackages = "com.aiinterview.repository",
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = ResumeAnalysisRepository.class
        )
)
@EnableMongoRepositories(
        basePackageClasses = ResumeAnalysisRepository.class
)
@EntityScan(basePackages = "com.aiinterview.entity")
public class DataRepositoriesConfig {
}
