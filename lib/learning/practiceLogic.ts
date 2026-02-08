import {
  LearningItem,
  LearningStructure,
  Lesson,
} from "@/types/learning/lesson";
import { PracticeItem, PracticeMode } from "@/types/learning/practice";
import { SRSData } from "@/types/learning/plan";

export function getModeForDay(day: number): PracticeMode {
  switch (day) {
    case 1:
      return "flashcard_visual";
    case 2:
      return "gap_fill_listening";
    case 3:
      return "sentence_unscramble";
    case 4:
      return "flashcard_recall";
    case 5:
      return "quiz_comprehensive";
    case 6:
      return "listening_choice";
    default:
      return "review_standard";
  }
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function generateQuizItems(
  lessonContext: Lesson,
  mode: PracticeMode,
  srsMap: Map<string, SRSData>,
): PracticeItem[] {
  const items: PracticeItem[] = [];

  if (!lessonContext.quiz || !lessonContext.quiz.quiz_sections) {
    return items;
  }

  for (const section of lessonContext.quiz.quiz_sections) {
    for (const question of section.questions) {
      const id =
        question.relatedLearningItemId ||
        question.relatedLearningStructureId ||
        `quiz-${Math.random().toString(36).substr(2, 9)}`;
      const type: "item" | "structure" = question.relatedLearningStructureId
        ? "structure"
        : "item";

      let audioSegment = undefined;

      // 1. Try to find audio segment if related to an item/structure and transcript exists
      if (lessonContext.transcriptSegments && lessonContext.audioUrl) {
        const relatedId =
          question.relatedLearningItemId || question.relatedLearningStructureId;
        if (relatedId) {
          const segment = lessonContext.transcriptSegments.find(
            (seg) =>
              (seg.learningItemIds &&
                seg.learningItemIds.includes(relatedId)) ||
              (seg.learningStructureIds &&
                seg.learningStructureIds.includes(relatedId)),
          );

          if (segment) {
            audioSegment = {
              start: segment.start,
              end: segment.end,
              url: lessonContext.audioUrl,
            };
          }
        }
      }

      // 2. Fallback: Check for timestamps in text (e.g., "38:15 - 43:20") if no segment found yet
      if (!audioSegment && lessonContext.audioUrl) {
        // Matches "mm:ss - mm:ss" or "m:ss - m:ss"
        const timeMatch = question.text.match(/(\d+):(\d+)\s*-\s*(\d+):(\d+)/);
        if (timeMatch) {
          const startMin = parseInt(timeMatch[1], 10);
          const startSec = parseInt(timeMatch[2], 10);
          const endMin = parseInt(timeMatch[3], 10);
          const endSec = parseInt(timeMatch[4], 10);

          audioSegment = {
            start: startMin * 60 + startSec,
            end: endMin * 60 + endSec,
            url: lessonContext.audioUrl,
          };
        }
      }

      const item: PracticeItem = {
        id: id,
        type: type,
        renderMode: mode,
        mainText: question.text,
        quiz: {
          question: question.text,
          options: question.options,
          correctIndex: question.correctIndex,
          explanation: question.explanation,
          sectionType: section.type,
          audioSegment: audioSegment,
        },
      };

      // Attach SRS Data
      if (srsMap.has(id)) {
        item.srsData = srsMap.get(id);
      }

      items.push(item);
    }
  }

  return items;
}

export function generatePayload(
  dbItem: LearningItem | LearningStructure,
  mode: PracticeMode,
  lessonContext: Lesson,
): PracticeItem {
  const isItem = isLearningItem(dbItem);

  const base: PracticeItem = {
    id: dbItem.id,
    type: isItem ? "item" : "structure",
    renderMode: mode,
    mainText: isItem ? (dbItem as LearningItem).mainText : "Structure",
  };

  switch (mode) {
    case "flashcard_visual": // Dia 1
    case "flashcard_recall": // Dia 4 (Visual is hidden in UI based on mode, but data can be same)
      if (isItem) {
        const item = dbItem as LearningItem;
        base.flashcard = {
          front: item.mainText,
          back:
            item.meanings[0]?.translation || item.meanings[0]?.definition || "",
          imageUrl: item.imageUrl,
          audioUrl: item.phonetic, // Or dedicated audio url if available
        };
      } else {
        // Fallback for structure in flashcard mode
        const struct = dbItem as LearningStructure;
        base.flashcard = {
          front: struct.sentences[0]?.words || "Structure",
          back: "Structure Practice",
        };
      }
      break;

    case "gap_fill_listening": // Dia 2: Ouvir e Escrever
      // Find TranscriptSegment
      // Note: transcriptSegments might be undefined in Lesson type if not populated
      let segmentIndex = lessonContext.transcriptSegments?.findIndex((s) =>
        s.learningItemIds?.includes(dbItem.id),
      );

      // Fallback: Try to match by text if not found by ID
      if (
        (segmentIndex === undefined || segmentIndex === -1) &&
        isItem &&
        lessonContext.transcriptSegments
      ) {
        const item = dbItem as LearningItem;
        segmentIndex = lessonContext.transcriptSegments.findIndex((s) =>
          new RegExp(`\\b${escapeRegExp(item.mainText)}\\b`, "i").test(s.text),
        );
      }

      if (
        segmentIndex !== undefined &&
        segmentIndex !== -1 &&
        isItem &&
        lessonContext.transcriptSegments
      ) {
        const segment = lessonContext.transcriptSegments[segmentIndex];

        // Smart Context Window: Merge if short (< 3s)
        let start = segment.start;
        let end = segment.end;

        // Simple heuristic: check duration. Assuming start/end are in seconds.
        const duration = end - start;
        if (duration < 3) {
          // Try to expand
          const prev = lessonContext.transcriptSegments[segmentIndex - 1];
          const next = lessonContext.transcriptSegments[segmentIndex + 1];

          if (prev) start = prev.start;
          if (next) end = next.end;
        }

        const item = dbItem as LearningItem;
        base.gapFill = {
          sentenceWithGap: segment.text.replace(
            new RegExp(escapeRegExp(item.mainText), "gi"),
            "___",
          ),
          correctAnswer: item.mainText,
          audioSegment: {
            start: start,
            end: end,
            url: lessonContext.audioUrl || "",
          },
        };
      } else {
        // Fallback if no audio found
        if (isItem) {
          // Items fallback to Flashcard
          base.renderMode = "flashcard_visual";
          const item = dbItem as LearningItem;
          base.flashcard = {
            front: item.mainText,
            back: item.meanings[0]?.translation || "",
            imageUrl: item.imageUrl,
          };
        } else {
          // Structures fallback to Unscramble (Day 3 mode) instead of broken Flashcard
          // This ensures the user still practices the structure even without audio
          base.renderMode = "sentence_unscramble";
          const struct = dbItem as LearningStructure;
          const sentenceData = struct.sentences[0]; // Take first example
          if (sentenceData) {
            const words = sentenceData.order
              .sort((a, b) => a.order - b.order)
              .map((o) => o.word);
            base.unscramble = {
              correctOrder: words,
              scrambledWords: [...words].sort(() => Math.random() - 0.5),
            };
          } else {
            // Last resort if no sentence data (should not happen for structures)
            base.renderMode = "flashcard_visual";
            base.flashcard = {
              front: "Structure",
              back: "Practice",
            };
          }
        }
      }
      break;

    case "sentence_unscramble": // Dia 3: Estrutura
      if (!isItem) {
        // Prioritize Structure for Unscramble, but Items can also be unscrambled if they have sentences
        const struct = dbItem as LearningStructure;
        const sentenceData = struct.sentences[0]; // Take first example
        if (sentenceData) {
          const words = sentenceData.order
            .sort((a, b) => a.order - b.order)
            .map((o) => o.word);
          base.unscramble = {
            correctOrder: words,
            scrambledWords: [...words].sort(() => Math.random() - 0.5),
          };
        }
      } else {
        // If it's an Item, check if it has example sentences
        const item = dbItem as LearningItem;
        if (item.meanings[0]?.example) {
          const words = item.meanings[0].example.split(" ");
          base.unscramble = {
            correctOrder: words,
            scrambledWords: [...words].sort(() => Math.random() - 0.5),
          };
        } else {
          base.renderMode = "flashcard_visual"; // Fallback
          base.flashcard = {
            front: item.mainText,
            back: item.meanings[0]?.translation || "",
          };
        }
      }
      break;

    // Implement other cases (Day 5, 6) similarly or fallback
    case "quiz_comprehensive":
    case "listening_choice":
      // Placeholder logic for Quiz - Should not be reached in new flow for active quiz days
      base.quiz = {
        question: `What does "${base.mainText}" mean?`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctIndex: 0,
      };
      break;

    default:
      // Default to flashcard
      if (isItem) {
        const item = dbItem as LearningItem;
        base.flashcard = {
          front: item.mainText,
          back: item.meanings[0]?.translation || "",
          imageUrl: item.imageUrl,
        };
      }
      break;
  }

  return base;
}

// Type Guards
function isLearningItem(item: any): item is LearningItem {
  return (item as LearningItem).meanings !== undefined;
}
