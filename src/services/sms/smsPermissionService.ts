import { smsListenerService } from './smsListenerService';

/** Thin convenience wrapper around the active SmsReceiver's permission methods, for Settings UI. */
export const smsPermissionService = {
  isGranted: () => smsListenerService.getReceiver().isPermissionGranted(),
  request: () => smsListenerService.getReceiver().requestPermission(),
};
