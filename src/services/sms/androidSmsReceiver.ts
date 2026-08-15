import { requireOptionalNativeModule } from 'expo';

import type { SmsReceiver } from '@/domain/sms/nativeSmsReceiver';
import type { RawSmsMessage } from '@/domain/sms/types';
import type { OnSmsReceivedEventPayload } from '@modules/sms-receiver/src/SmsReceiver.types';

interface NativeSmsReceiverModule {
  requestPermission(): Promise<boolean>;
  isPermissionGranted(): Promise<boolean>;
  addListener(
    eventName: 'onSmsReceived',
    listener: (event: OnSmsReceivedEventPayload) => void
  ): { remove: () => void };
}

let cachedModule: NativeSmsReceiverModule | null | undefined;

/**
 * `requireOptionalNativeModule` (unlike `requireNativeModule`) returns null
 * instead of throwing when the native module isn't linked — true in Expo
 * Go, in the web bundle (though Metro resolves modules/sms-receiver's
 * `.web.ts` variant there anyway), and on Android before the first
 * Development Build that includes modules/sms-receiver. Cached because
 * repeated lookups are pointless once resolved.
 */
function getNativeModule(): NativeSmsReceiverModule | null {
  if (cachedModule === undefined) {
    cachedModule = requireOptionalNativeModule<NativeSmsReceiverModule>('SmsReceiver');
  }
  return cachedModule;
}

export function isNativeSmsReceiverAvailable(): boolean {
  return getNativeModule() !== null;
}

/** Real Android implementation, backed by the local module in modules/sms-receiver/ (TODO(P5), see its Kotlin source). */
export class AndroidSmsReceiver implements SmsReceiver {
  async requestPermission(): Promise<boolean> {
    return (await getNativeModule()?.requestPermission()) ?? false;
  }

  async isPermissionGranted(): Promise<boolean> {
    return (await getNativeModule()?.isPermissionGranted()) ?? false;
  }

  subscribe(onMessage: (msg: RawSmsMessage) => void): () => void {
    const native = getNativeModule();
    if (!native) return () => {};

    const subscription = native.addListener('onSmsReceived', (event) => {
      onMessage({ sender: event.sender, body: event.body, receivedAt: event.receivedAt });
    });
    return () => subscription.remove();
  }
}
