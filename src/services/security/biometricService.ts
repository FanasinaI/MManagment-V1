import * as LocalAuthentication from 'expo-local-authentication';

export const biometricService = {
  async isAvailable(): Promise<boolean> {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && isEnrolled;
  },

  async authenticate(promptMessage = 'Déverrouiller MManagment'): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage });
    return result.success;
  },
};
