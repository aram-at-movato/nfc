import NfcManager, {NfcTech, Ndef} from 'react-native-nfc-manager';
import {Alert, Platform} from 'react-native';

export interface CardData {
  id: string;
  cardNumber: string;
  cardholderName: string;
  timestamp: number;
}

class NFCService {
  private isInitialized: boolean = false;

  async init(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      Alert.alert('Platform Not Supported', 'NFC is only supported on iOS devices in this version');
      return false;
    }

    try {
      const supported = await NfcManager.isSupported();
      if (!supported) {
        Alert.alert('NFC Not Supported', 'Your device does not support NFC');
        return false;
      }

      await NfcManager.start();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('NFC initialization failed:', error);
      Alert.alert('Initialization Error', 'Failed to initialize NFC');
      return false;
    }
  }

  async writeCardToNFC(cardData: CardData): Promise<boolean> {
    if (!this.isInitialized) {
      const initialized = await this.init();
      if (!initialized) return false;
    }

    try {
      // Request NFC technology
      await NfcManager.requestTechnology(NfcTech.Ndef);

      // Create NDEF message with card data
      const bytes = Ndef.encodeMessage([
        Ndef.textRecord(JSON.stringify(cardData)),
      ]);

      if (!bytes) {
        throw new Error('Failed to encode message');
      }

      // Write to tag
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
      
      Alert.alert('Success', 'Card registered successfully! You can now use NFC readers to access your card data.');
      return true;
    } catch (error: any) {
      console.error('Write failed:', error);
      if (error.toString().includes('cancelled')) {
        Alert.alert('Cancelled', 'NFC writing was cancelled');
      } else {
        Alert.alert('Write Error', 'Failed to write card data to NFC tag');
      }
      return false;
    } finally {
      // Cancel the technology request
      NfcManager.cancelTechnologyRequest();
    }
  }

  async readCardFromNFC(): Promise<CardData | null> {
    if (!this.isInitialized) {
      const initialized = await this.init();
      if (!initialized) return null;
    }

    try {
      // Request NFC technology
      await NfcManager.requestTechnology(NfcTech.Ndef);

      // Read the tag
      const tag = await NfcManager.getTag();
      
      if (tag && tag.ndefMessage && tag.ndefMessage.length > 0) {
        const record = tag.ndefMessage[0];
        const text = Ndef.text.decodePayload(record.payload);
        const cardData: CardData = JSON.parse(text);
        
        Alert.alert('Card Read', `Card: ${cardData.cardNumber}\nName: ${cardData.cardholderName}`);
        return cardData;
      }

      Alert.alert('No Data', 'No card data found on the NFC tag');
      return null;
    } catch (error: any) {
      console.error('Read failed:', error);
      if (!error.toString().includes('cancelled')) {
        Alert.alert('Read Error', 'Failed to read card data from NFC tag');
      }
      return null;
    } finally {
      NfcManager.cancelTechnologyRequest();
    }
  }

  async cleanup(): Promise<void> {
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

export default new NFCService();

