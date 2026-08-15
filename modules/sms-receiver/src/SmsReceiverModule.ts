import { NativeModule, requireNativeModule } from 'expo';

import type { SmsReceiverModuleEvents } from './SmsReceiver.types';

declare class SmsReceiverModule extends NativeModule<SmsReceiverModuleEvents> {
  requestPermission(): Promise<boolean>;
  isPermissionGranted(): Promise<boolean>;
}

export default requireNativeModule<SmsReceiverModule>('SmsReceiver');
