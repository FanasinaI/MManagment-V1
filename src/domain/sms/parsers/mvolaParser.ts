import { extractAmount, extractReference, extractReportedBalance, matchOperationType, MOBILE_MONEY_VERB_MAP, type Parser } from './parser';

export const mvolaParser: Parser = {
  parse(msg) {
    const amount = extractAmount(msg.body);
    const type = matchOperationType(msg.body, MOBILE_MONEY_VERB_MAP);
    if (amount === null || type === null) return null;

    return {
      amount,
      currency: 'MGA',
      type,
      reference: extractReference(msg.body),
      occurredAt: msg.receivedAt,
      reportedBalance: extractReportedBalance(msg.body) ?? undefined,
    };
  },
};
