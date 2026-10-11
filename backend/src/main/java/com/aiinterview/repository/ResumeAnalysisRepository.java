package com.aiinterview.repository;

import com.aiinterview.document.ResumeAnalysisDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ResumeAnalysisRepository extends MongoRepository<ResumeAnalysisDocument, String> {
}