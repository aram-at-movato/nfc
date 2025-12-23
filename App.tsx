import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import NFCService, {CardData} from './services/NFCService';

export default function App() {
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isNFCEnabled, setIsNFCEnabled] = useState(false);

  useEffect(() => {
    initializeNFC();
    return () => {
      NFCService.cleanup();
    };
  }, []);

  const initializeNFC = async () => {
    const success = await NFCService.init();
    setIsNFCEnabled(success);
  };

  const validateInputs = (): boolean => {
    if (!cardNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter a card number');
      return false;
    }
    if (!cardholderName.trim()) {
      Alert.alert('Validation Error', 'Please enter cardholder name');
      return false;
    }

    return true;
  };

  const handleRegisterCard = async () => {
    if (!validateInputs()) return;

    const cardData: CardData = {
      id: Date.now().toString(),
      cardNumber: cardNumber.trim(),
      cardholderName: cardholderName.trim(),
      timestamp: Date.now(),
    };

    const success = await NFCService.writeCardToNFC(cardData);
    if (success) {
      // Clear form
      setCardNumber('');
      setCardholderName('');
    }
  };

  const handleReadCard = async () => {
    const cardData = await NFCService.readCardFromNFC();
    if (cardData) {
      // Populate form with read data
      setCardNumber(cardData.cardNumber);
      setCardholderName(cardData.cardholderName);
    }
  };

  const formatCardNumber = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    // Add space every 4 digits
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>NFC Wallet</Text>
            <Text style={styles.subtitle}>Register Your Card</Text>
          </View>

          {!isNFCEnabled && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>⚠️ NFC is not available on this device</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Card Number</Text>
              <TextInput
                style={styles.input}
                placeholder="0000 0000 0000 0000"
                placeholderTextColor="#999"
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                keyboardType="number-pad"
                maxLength={19}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cardholder Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#999"
                value={cardholderName}
                onChangeText={setCardholderName}
                autoCapitalize="words"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton, !isNFCEnabled && styles.disabledButton]}
              onPress={handleRegisterCard}
              disabled={!isNFCEnabled}>
              <Text style={styles.buttonText}>📱 Register Card to NFC</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, !isNFCEnabled && styles.disabledButton]}
              onPress={handleReadCard}
              disabled={!isNFCEnabled}>
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>🔍 Read Card from NFC</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>How to use:</Text>
            <Text style={styles.infoText}>1. Fill in your card details</Text>
            <Text style={styles.infoText}>2. Tap "Register Card to NFC"</Text>
            <Text style={styles.infoText}>3. Hold your device near an NFC tag</Text>
            <Text style={styles.infoText}>4. Your card will be registered!</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e4e8',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  infoBox: {
    backgroundColor: '#e7f3ff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#b3d9ff',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066cc',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#0066cc',
    marginBottom: 5,
  },
});

