import type { SmsProvider, SmsSourceConfig } from '../types';
import { airtelMoneyParser } from './airtelMoneyParser';
import { bankParser } from './bankParser';
import { mvolaParser } from './mvolaParser';
import { orangeMoneyParser } from './orangeMoneyParser';
import type { Parser } from './parser';

const REGISTRY: Record<SmsProvider, Parser> = {
  mvola: mvolaParser,
  airtel_money: airtelMoneyParser,
  orange_money: orangeMoneyParser,
  bank: bankParser,
};

export function getParserFor(source: SmsSourceConfig): Parser {
  return REGISTRY[source.provider];
}

export type { Parser } from './parser';
