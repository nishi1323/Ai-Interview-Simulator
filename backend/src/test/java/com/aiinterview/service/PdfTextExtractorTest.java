package com.aiinterview.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;

import static org.assertj.core.api.Assertions.assertThat;

class PdfTextExtractorTest {
    private final PdfTextExtractor extractor = new PdfTextExtractor();

    @Test
    void extractsSelectableTextFromPdf() throws Exception {
        byte[] pdfBytes;
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            document.addPage(page);
            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                content.beginText();
                content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                content.newLineAtOffset(50, 700);
                content.showText("Java Spring Boot resume experience");
                content.endText();
            }
            document.save(output);
            pdfBytes = output.toByteArray();
        }

        assertThat(extractor.extractText(pdfBytes)).contains("Java Spring Boot resume experience");
    }

    @Test
    void returnsBlankForPdfWithoutSelectableText() throws Exception {
        byte[] pdfBytes;
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            document.addPage(new PDPage());
            document.save(output);
            pdfBytes = output.toByteArray();
        }

        assertThat(extractor.extractText(pdfBytes)).isEmpty();
    }
}