import { z } from "zod";
import { dateStringSchema, NAME_MAX, SAFE_STRING_MAX, safeString } from "./safeSchema";

/** 1回の調査で対象にする駒の上限（重い応答を避けるため小さめにしている） */
export const SLOT_RESEARCH_MAX_PIECES = 8;

export const slotResearchPieceSchema = z.object({
  pieceName: safeString(NAME_MAX, 1),
  substituteSuggestion: safeString(SAFE_STRING_MAX)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  acquisitionNote: safeString(SAFE_STRING_MAX)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
});

export const slotResearchResponseSchema = z.object({
  schemaVersion: z.literal(1),
  checkedAt: dateStringSchema,
  pieces: z
    .array(slotResearchPieceSchema)
    .min(1, "piecesが空です")
    .max(SLOT_RESEARCH_MAX_PIECES, `piecesが多すぎます（上限${SLOT_RESEARCH_MAX_PIECES}件）`),
});

export type SlotResearchPiece = z.infer<typeof slotResearchPieceSchema>;
export type SlotResearchResponse = z.infer<typeof slotResearchResponseSchema>;

export type SlotResearchValidationResult =
  | { ok: true; errors: []; data: SlotResearchResponse }
  | { ok: false; errors: string[]; data?: undefined };

export function validateSlotResearchResponse(data: unknown): SlotResearchValidationResult {
  const result = slotResearchResponseSchema.safeParse(data);
  if (!result.success) {
    return { ok: false, errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
  }
  return { ok: true, errors: [], data: result.data };
}
