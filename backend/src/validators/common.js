import { z } from 'zod';

/** Strip angle brackets and control characters from free text (basic input sanitisation). */
export const cleanText = (value) => String(value).replace(/<[^>]*>/g, '').replace(/[<>\u0000-\u001f]/g, '').trim();

export const safeText = (max = 200) => z.string().max(max).transform(cleanText);
export const optionalText = (max = 2000) => z.string().max(max).transform(cleanText).nullish().transform((v) => v ?? null);

export const idField = z.string().min(1).max(80).regex(/^[A-Za-z0-9-]+$/, 'Only letters, numbers and dashes are allowed');
export const isoDateField = z
  .string()
  .min(4)
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Must be a valid date')
  .transform((v) => new Date(v).toISOString());
export const optionalIsoDate = isoDateField.nullish().transform((v) => v ?? null);

export const missionPhase = z.enum(['preflight', 'in-flight', 'postflight']);
export const dataSourceManual = z.literal('manual');

export const listQuery = z.object({
  q: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(200).optional(),
  sortBy: z.string().max(40).regex(/^[A-Za-z]+$/).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  startDate: z.string().max(30).optional(),
  endDate: z.string().max(30).optional(),
  astronautId: z.string().max(80).optional(),
  missionPhase: z.string().max(20).optional(),
});
