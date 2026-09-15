import { z } from "zod";
import { dateStringSchema, NAME_MAX, SAFE_STRING_MAX, safeString, urlSchema } from "./safeSchema";

export const DECK_SEARCH_MAX_PIECES_PER_DECK = 16;
export const DECK_SEARCH_MAX_DECKS = 10;

export const deckCandidateSchema = z.object({
  deckName: safeString(NAME_MAX, 1),
  concept: safeString(SAFE_STRING_MAX)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  pieces: z
    .array(safeString(NAME_MAX, 1))
    .min(1, "piecesが空です")
    .max(DECK_SEARCH_MAX_PIECES_PER_DECK, `piecesが多すぎます（上限${DECK_SEARCH_MAX_PIECES_PER_DECK}件）`),
  sourceUrl: urlSchema
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  sourceTitle: safeString(NAME_MAX)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
});

export const deckSearchResponseSchema = z.object({
  schemaVersion: z.literal(1),
  checkedAt: dateStringSchema,
  decks: z
    .array(deckCandidateSchema)
    .min(1, "decksが空です")
    .max(DECK_SEARCH_MAX_DECKS, `decksが多すぎます（上限${DECK_SEARCH_MAX_DECKS}件）`),
});

export type DeckCandidate = z.infer<typeof deckCandidateSchema>;
export type DeckSearchResponse = z.infer<typeof deckSearchResponseSchema>;

export type DeckSearchValidationResult =
  | { ok: true; errors: []; data: DeckSearchResponse }
  | { ok: false; errors: string[]; data?: undefined };

export function validateDeckSearchResponse(data: unknown): DeckSearchValidationResult {
  const result = deckSearchResponseSchema.safeParse(data);
  if (!result.success) {
    return { ok: false, errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
  }
  return { ok: true, errors: [], data: result.data };
}
