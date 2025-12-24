import React, {useState} from 'react';
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
import WalletService, {CardData} from './services/WalletService';

export default function App() {
  const [cardholderName, setCardholderName] = useState('');
  const [generatedCards, setGeneratedCards] = useState<CardData[]>([]);

  const validateInputs = (): boolean => {
    if (!cardholderName.trim()) {
      Alert.alert('Validation Error', 'Please enter cardholder name');
      return false;
    }
    return true;
  };

  const handleGenerateCard = async () => {
    if (!validateInputs()) return;

    // Generate card with unique key
    const cardData = await WalletService.generateCard(cardholderName);

    // Try to add to Apple Wallet
    const addedToWallet = await WalletService.addToAppleWallet(cardData);

    // Add to local list
    setGeneratedCards([cardData, ...generatedCards]);
    
    // Clear form
    setCardholderName('');
    
    if (addedToWallet) {
      // Show success message
      Alert.alert(
        '✅ Ticket Generated!',
        `Pickup ticket for ${cardData.cardholderName} is ready!\n\nTicket #${cardData.id.substring(0, 8).toUpperCase()}\n\nCheck your Apple Wallet!`,
        [{text: 'OK'}]
      );
    } else {
      // Show card generated but not added to wallet
      Alert.alert(
        '✅ Ticket Generated',
        `Ticket for ${cardData.cardholderName}\n\nTicket #${cardData.id.substring(0, 8).toUpperCase()}\n\n(Could not add to Apple Wallet - check backend setup)`,
        [{text: 'OK'}]
      );
    }
  };

  const copyToClipboard = (text: string) => {
    // In a real app, you'd use Clipboard API
    Alert.alert('Card Key', WalletService.formatCardKey(text), [
      {text: 'OK'}
    ]);
  };

  const handleAddCardToWallet = async (card: CardData) => {
    Alert.alert(
      'Add to Wallet',
      `Add pickup ticket for "${card.cardholderName}" to Apple Wallet?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Add to Wallet',
          onPress: async () => {
            const success = await WalletService.addToAppleWallet(card);
            if (success) {
              Alert.alert(
                '✅ Added to Wallet!',
                `Pickup ticket for ${card.cardholderName} has been added to Apple Wallet.`,
                [{text: 'OK'}]
              );
            }
          }
        },
        {
          text: 'View Ticket ID',
          onPress: () => Alert.alert('Ticket ID', `#${card.id.substring(0, 8).toUpperCase()}\n\nNFC ID: ${WalletService.formatCardKey(card.cardKey)}`, [{text: 'OK'}])
        }
      ]
    );
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
            <Text style={styles.title}>Movato Tickets</Text>
            <Text style={styles.subtitle}>Service Center Pickup</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Customer Name</Text>
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
              style={[styles.button, styles.primaryButton]}
              onPress={handleGenerateCard}>
              <Text style={styles.buttonText}>Generate Pickup Ticket</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>How to use:</Text>
            <Text style={styles.infoText}>1. Enter your name</Text>
            <Text style={styles.infoText}>2. Generate your pickup ticket</Text>
            <Text style={styles.infoText}>3. Present at Movato service centers</Text>
            <Text style={styles.infoText}>4. Scan at authorized lockers</Text>
          </View>

          {generatedCards.length > 0 && (
            <View style={styles.cardsSection}>
              <Text style={styles.cardsSectionTitle}>Your Tickets</Text>
              {generatedCards.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  style={styles.cardItem}
                  onPress={() => handleAddCardToWallet(card)}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardName}>{card.cardholderName}</Text>
                    <Text style={styles.cardDate}>
                      {new Date(card.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.cardKey}>
                    Ticket #{card.id.substring(0, 8).toUpperCase()}
                  </Text>
                  <Text style={styles.cardTapHint}>Tap to add to Apple Wallet</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  infoBox: {
    backgroundColor: '#e7f3ff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#b3d9ff',
    marginBottom: 20,
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
  cardsSection: {
    marginTop: 10,
  },
  cardsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  cardItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cardDate: {
    fontSize: 12,
    color: '#999',
  },
  cardKey: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#007AFF',
    marginBottom: 4,
  },
  cardTapHint: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
});
