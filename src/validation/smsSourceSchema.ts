import { z } from 'zod';

export const smsProviderSchema = z.enum(['mvola', 'airtel_money', 'orange_money', 'bank']);

export const smsSourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  provider: smsProviderSchema,
  senderPattern: z.string().min(1, "L'identifiant d'expéditeur est requis"),
  enabled: z.boolean().default(true),
  parserVersion: z.string().default('v1'),
});

export const newSmsSourceSchema = smsSourceSchema.omit({ id: true, parserVersion: true });

export type SmsSourceRecord = z.infer<typeof smsSourceSchema>;
export type NewSmsSource = z.infer<typeof newSmsSourceSchema>;
