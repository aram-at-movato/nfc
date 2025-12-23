# NFC Wallet App

A React Native mobile application for iOS that allows users to register credit/debit cards to NFC tags, making them readable by NFC readers.

## Features

- 📱 Register card information to NFC tags
- 🔍 Read card data from NFC tags
- ✅ Input validation for card details
- 🎨 Modern, user-friendly interface
- 🔒 iOS-optimized NFC implementation

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Xcode** (latest version for iOS development)
- **CocoaPods** (for iOS dependencies)
- **Expo CLI** (will be installed with dependencies)

## Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd /Users/abaghdasarya/Work/Random/nfc
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install iOS pods:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

## iOS Configuration

### Required Capabilities

Your iOS app requires the following capabilities to work with NFC:

1. **Near Field Communication Tag Reading** capability must be enabled in Xcode
2. **NFCReaderUsageDescription** is already configured in `app.json`

### Setting up in Xcode

1. Open the iOS project:
   ```bash
   cd ios
   open nfc-wallet-app.xcworkspace
   ```

2. Select your project in the navigator

3. Go to **Signing & Capabilities**

4. Click **+ Capability** and add **Near Field Communication Tag Reading**

5. Make sure you have a valid **Team** selected for signing

### Info.plist Configuration

The following entries are already configured in `app.json`:
- `NFCReaderUsageDescription`: Explains why the app needs NFC access
- `com.apple.developer.nfc.readersession.formats`: Enables NDEF and TAG formats

## Running the App

### Development Mode

Start the Expo development server:

```bash
npm start
```

Then press `i` to run on iOS simulator, or scan the QR code with Expo Go on a physical device.

### Running on Physical Device (Recommended for NFC)

**Note:** NFC functionality requires a physical iOS device (iPhone 7 or later). The iOS simulator does not support NFC.

1. Connect your iPhone via USB
2. Run:
   ```bash
   npm run ios
   ```

## Usage

### Registering a Card

1. Open the app on your iOS device
2. Fill in the card details:
   - **Card Number**: 16-digit card number (automatically formatted with spaces)
   - **Cardholder Name**: Name as it appears on the card
   - **Expiry Date**: Format MM/YY
3. Tap **"Register Card to NFC"**
4. Hold your device near a writable NFC tag
5. Wait for the success message

### Reading a Card

1. Tap **"Read Card from NFC"**
2. Hold your device near the NFC tag with registered card data
3. The card information will be displayed and populated in the form

## Device Requirements

- **iOS Device**: iPhone 7 or later
- **iOS Version**: iOS 11.0 or higher
- **NFC**: Device must have NFC capability
- **Writable NFC Tags**: Required for registering cards

## Project Structure

```
nfc-wallet-app/
├── App.tsx                 # Main application component
├── services/
│   └── NFCService.ts      # NFC functionality service
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript configuration
└── babel.config.js        # Babel configuration
```

## Technologies Used

- **React Native** - Mobile framework
- **Expo** - Development platform
- **TypeScript** - Type-safe JavaScript
- **react-native-nfc-manager** - NFC functionality
- **iOS PassKit** - Apple Wallet integration

## Troubleshooting

### NFC Not Working

- Ensure you're testing on a physical device (not simulator)
- Check that NFC is enabled in device settings
- Verify the app has NFC permissions
- Make sure the Near Field Communication Tag Reading capability is enabled in Xcode

### Build Errors

- Clean the build folder in Xcode: `Product > Clean Build Folder`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Reinstall pods: `cd ios && pod install && cd ..`

### Permission Issues

- Check that `Info.plist` includes the `NFCReaderUsageDescription`
- Ensure entitlements are properly configured
- Verify your Apple Developer account has the necessary capabilities

## Security Considerations

⚠️ **Important Security Notes:**

- This app stores card data on NFC tags in **plain text**
- Do NOT use this for production without implementing proper encryption
- Consider using tokenization for sensitive card data
- NFC tags can be read by any compatible device
- This is a demonstration app for educational purposes

## Future Enhancements

- 🔐 Add encryption for stored card data
- 💳 Support for multiple card types (credit, debit, loyalty)
- 📊 Card usage history and analytics
- 🔄 Cloud backup and sync
- 🌐 Android support
- 🎨 Customizable card themes
- 🔔 Transaction notifications

## License

MIT License - Feel free to use this project for learning and development purposes.

## Support

For issues and questions:
1. Check the Troubleshooting section above
2. Review [react-native-nfc-manager documentation](https://github.com/revtel/react-native-nfc-manager)
3. Check [Expo documentation](https://docs.expo.dev/)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Note:** This app is for educational and demonstration purposes. Always follow security best practices when handling sensitive payment information in production applications.

