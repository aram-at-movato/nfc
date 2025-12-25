import {Alert, Platform, Linking} from 'react-native';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';

// Your ngrok URL
const API_URL = 'https://bfcfb8f3840e.ngrok-free.app';

export interface CardData {
  id: string;
  cardKey: string;
  cardholderName: string;
  timestamp: number;
}

class WalletService {
  generateUniqueKey(): string {
    // Generate a unique key using expo-crypto
    const randomBytes = Crypto.getRandomBytes(16);
    return Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  async generateCard(cardholderName: string): Promise<CardData> {
    const uniqueKey = this.generateUniqueKey();
    
    const cardData: CardData = {
      id: Date.now().toString(),
      cardKey: uniqueKey,
      cardholderName: cardholderName.trim(),
      timestamp: Date.now(),
    };

    return cardData;
  }

  async addToAppleWallet(cardData: CardData): Promise<boolean> {
    try {
      console.log('Generating pass for Apple Wallet...');
      
      // Call backend to generate pass and get pass ID
      const response = await fetch(`${API_URL}/api/generate-pass`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardholderName: cardData.cardholderName,
          cardKey: cardData.cardKey,
          passId: cardData.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate pass');
      }

      const result = await response.json();
      const passUrl = `${API_URL}/passes/${result.passId}.pkpass`;
      
      console.log('Pass generated, opening URL:', passUrl);

      // Open the pass URL in an in-app browser - iOS will recognize it and offer to add to Wallet
      const browserResult = await WebBrowser.openBrowserAsync(passUrl, {
        dismissButtonStyle: 'close',
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        controlsColor: '#007AFF',
      });
      
      console.log('Browser result:', browserResult);
      return true;

    } catch (error: any) {
      console.error('Failed to add to wallet:', error);
      
      Alert.alert(
        'Connection Error',
        `Cannot connect to backend server.\n\nMake sure backend is running.\n\nError: ${error.message}`,
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  formatCardKey(key: string): string {
    // Format the key for display: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
    return key.match(/.{1,4}/g)?.join('-') || key;
  }
}

export default new WalletService();
