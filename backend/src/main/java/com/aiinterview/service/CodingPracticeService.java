package com.aiinterview.service;

import com.aiinterview.dto.CodingChallengeResponse;
import com.aiinterview.dto.CodingChallengeResponse.TestCase;
import com.aiinterview.entity.Interview;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class CodingPracticeService {
    private static final List<ChallengeDefinition> CHALLENGES = List.of(
            new ChallengeDefinition(
                    "first-unique-character",
                    "First unique character",
                    "Return the first character that appears exactly once. Return an empty string if there is no unique character.",
                    "firstNonRepeatingChar",
                    "Frequency maps · strings",
                    "Beginner",
                    "function firstNonRepeatingChar(input) {\n  // Return the first non-repeating character, or ''.\n}\n",
                    List.of(
                            test("common case", List.of("swiss"), "w"),
                            test("unique at end", List.of("aabbc"), "c"),
                            test("no unique character", List.of("aabb"), ""),
                            test("single character", List.of("z"), "z"))),
            new ChallengeDefinition(
                    "valid-anagram",
                    "Check for anagrams",
                    "Return true when two strings contain the same characters with the same frequencies. Ignore spaces and letter case.",
                    "areAnagrams",
                    "Frequency maps · input normalization",
                    "Beginner",
                    "function areAnagrams(first, second) {\n  // Compare normalized character frequencies.\n}\n",
                    List.of(
                            test("same letters", List.of("Dormitory", "Dirty room"), true),
                            test("different counts", List.of("aab", "abb"), false),
                            test("empty strings", List.of("", ""), true),
                            test("different lengths", List.of("cat", "cats"), false))),
            new ChallengeDefinition(
                    "longest-unique-substring",
                    "Longest unique substring",
                    "Return the length of the longest substring that contains no repeated characters.",
                    "longestUniqueSubstring",
                    "Sliding window · problem solving",
                    "Intermediate",
                    "function longestUniqueSubstring(input) {\n  // Use a sliding window to track unique characters.\n}\n",
                    List.of(
                            test("repeated pattern", List.of("abcabcbb"), 3),
                            test("all repeated", List.of("bbbbb"), 1),
                            test("mixed window", List.of("pwwkew"), 3),
                            test("empty string", List.of(""), 0))),
            new ChallengeDefinition(
                    "merge-sorted-arrays",
                    "Merge sorted arrays",
                    "Merge two sorted number arrays into one sorted array without using a built-in sort.",
                    "mergeSortedArrays",
                    "Two pointers · arrays",
                    "Intermediate",
                    "function mergeSortedArrays(first, second) {\n  // Merge the sorted arrays using two pointers.\n}\n",
                    List.of(
                            test("interleaved values", List.of(List.of(1, 4, 7), List.of(2, 3, 8)), List.of(1, 2, 3, 4, 7, 8)),
                            test("one empty array", List.of(List.of(), List.of(1, 2)), List.of(1, 2)),
                            test("duplicates", List.of(List.of(1, 2), List.of(1, 2)), List.of(1, 1, 2, 2)),
                            test("both empty", List.of(List.of(), List.of()), List.of())))
    );

    public List<CodingChallengeResponse> recommendations(Interview interview) {
        List<ScoreFocus> focus = new ArrayList<>();
        if (interview != null) {
            addFocus(focus, "technical", interview.getTechnicalScore());
            addFocus(focus, "problem solving", interview.getProblemSolvingScore());
            addFocus(focus, "relevance", interview.getRelevanceScore());
        }
        String weakestFocus = focus.stream()
                .min(Comparator.comparingInt(ScoreFocus::score))
                .map(ScoreFocus::name)
                .orElse("problem solving");
        boolean personalized = !focus.isEmpty();

        List<ChallengeDefinition> ordered = new ArrayList<>(CHALLENGES);
        ordered.sort(Comparator.comparingInt(challenge -> recommendationRank(challenge, weakestFocus)));
        ChallengeDefinition recommended = ordered.get(0);
        return ordered.stream()
            .map(challenge -> challenge.toResponse(challenge.equals(recommended), personalized))
                .toList();
    }

    private int recommendationRank(ChallengeDefinition challenge, String weakestFocus) {
        if (matchesWeakestFocus(challenge, weakestFocus)) return 0;
        if (challenge.difficulty().equals("Beginner")) return 1;
        return 2;
    }

    private boolean matchesWeakestFocus(ChallengeDefinition challenge, String weakestFocus) {
        String focus = challenge.focus().toLowerCase();
        return switch (weakestFocus) {
            case "technical" -> focus.contains("frequency maps") || focus.contains("arrays");
            case "problem solving" -> focus.contains("sliding window") || focus.contains("two pointers");
            case "relevance" -> focus.contains("input normalization") || focus.contains("strings");
            default -> false;
        };
    }

    private void addFocus(List<ScoreFocus> focus, String name, Integer score) {
        if (score != null) focus.add(new ScoreFocus(name, score));
    }

    private static TestCase test(String label, List<Object> args, Object expected) {
        return new TestCase(args, expected, label);
    }

    private record ScoreFocus(String name, Integer score) { }

    private record ChallengeDefinition(
            String id,
            String title,
            String prompt,
            String functionName,
            String focus,
            String difficulty,
            String starterCode,
            List<TestCase> tests
    ) {
        CodingChallengeResponse toResponse(boolean recommended, boolean personalized) {
            return new CodingChallengeResponse(id, title, prompt, functionName, focus, difficulty, starterCode, tests, recommended, personalized);
        }
    }
}