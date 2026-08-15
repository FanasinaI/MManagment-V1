import { NativeModule, registerWebModule } from 'expo';

import type { SmsReceiverModuleEvents } from './SmsReceiver.types';

class SmsReceiverModule extends NativeModule<SmsReceiverModuleEvents> {
  async requestPermission(): Promise<boolean> {
    return false;
  }

  async isPermissionGranted(): Promise<boolean> {
    return false;
  }
}

export default registerWebModule(SmsReceiverModule, 'SmsReceiverModule');
