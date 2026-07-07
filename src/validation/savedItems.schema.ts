import { z } from 'zod';

// JSONB payload — any plain object (not array/primitive), so it round-trips
// through Postgres JSONB and back to the exact frontend record. express.json
// already caps the body at 64kb, so no per-field size limit is needed here.
const JsonObject = z.record(z.string(), z.unknown());

// POST /api/<entity> — upsert one frontend record. `id` is the client-generated
// identity (stored as client_id); `data` is the whole record, verbatim.
export const SaveItemSchema = z.object({
  id:   z.string().trim().min(1).max(200),
  data: JsonObject,
});
export type SaveItemInput = z.infer<typeof SaveItemSchema>;
