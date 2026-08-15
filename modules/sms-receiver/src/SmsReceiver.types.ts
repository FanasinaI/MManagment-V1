export interface OnSmsReceivedEventPayload {
  sender: string;
  body: string;
  receivedAt: string;
}

export type SmsReceiverModuleEvents = {
  onSmsReceived: (event: OnSmsReceivedEventPayload) => void;
};
