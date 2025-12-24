# Apple Wallet Pass Server Setup Guide

This backend server generates Apple Wallet passes (.pkpass files) for your digital cards.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Apple Developer Certificates

You need to create certificates from Apple Developer Portal:

#### Step A: Create Pass Type ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** button
4. Select **Pass Type IDs** → Continue
5. Enter:
   - **Description**: NFC Wallet Card Pass
   - **Identifier**: `pass.com.nfcwallet.card` (or your custom ID)
6. Click **Continue** → **Register**

#### Step B: Create Certificate

1. In the Pass Type IDs list, click your new Pass Type ID
2. Click **Create Certificate**
3. Follow instructions to create a Certificate Signing Request (CSR):
   - Open **Keychain Access** on Mac
   - Menu: **Keychain Access** → **Certificate Assistant** → **Request a Certificate from a Certificate Authority**
   - Enter your email, name, select "Saved to disk"
   - Save the CSR file
4. Upload the CSR file to Apple Developer Portal
5. Download the certificate (.cer file)

#### Step C: Export Certificate Files

1. **Download WWDR Certificate**:
   - Go to [Apple PKI](https://www.apple.com/certificateauthority/)
   - Download **Apple Worldwide Developer Relations G4** certificate
   - Open it to install in Keychain

2. **Export Signing Certificate**:
   - Open **Keychain Access**
   - Find your Pass Type ID certificate (in "My Certificates")
   - Right-click → **Export** → Save as `.p12` file (set a password if you want)

3. **Convert Certificates to PEM format**:

```bash
# Create certificates folder
mkdir -p backend/certificates

# Convert the .cer file to PEM
openssl x509 -inform DER -in /path/to/your/pass_certificate.cer -out backend/certificates/signerCert.pem

# Convert the .p12 file to PEM (you'll be asked for the export password)
openssl pkcs12 -in /path/to/your/certificate.p12 -out backend/certificates/signerKey.pem -nodes

# Download and convert WWDR certificate
curl https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer -o wwdr.cer
openssl x509 -inform DER -in wwdr.cer -out backend/certificates/wwdr.pem
```

### 3. Update Configuration

Edit `backend/models/cardPass.pass/pass.json`:

```json
{
  "passTypeIdentifier": "pass.com.nfcwallet.card",  // Match your Pass Type ID
  "teamIdentifier": "XXXXXXXXXX",  // Your Team ID from Apple Developer
  "organizationName": "Your Company Name"
}
```

Find your Team ID:
- Go to Apple Developer Portal
- Click your name → **Membership**
- Copy the **Team ID**

### 4. Start the Server

```bash
cd backend
npm start
```

You should see:
```
🚀 Wallet Pass Server running on port 3000
📱 Local: http://localhost:3000
🌍 Use ngrok to expose: ngrok http 3000
```

### 5. Expose with ngrok

In a new terminal:

```bash
# Install ngrok if you haven't
brew install ngrok

# Or download from https://ngrok.com/download

# Start ngrok
ngrok http 3000
```

You'll get a public URL like: `https://abc123.ngrok.io`

### 6. Update Mobile App

Edit `App.tsx` and update the API URL:

```javascript
const API_URL = 'https://abc123.ngrok.io';  // Your ngrok URL
```

## 🧪 Testing

### Test the server:

```bash
curl http://localhost:3000
```

Should return:
```json
{
  "status": "ok",
  "message": "Apple Wallet Pass Server is running"
}
```

### Test pass generation:

```bash
curl -X POST http://localhost:3000/api/generate-pass \
  -H "Content-Type: application/json" \
  -d '{"cardholderName": "John Doe", "cardKey": "ABC123XYZ789"}' \
  --output test.pkpass
```

Open `test.pkpass` on your iPhone to add to Wallet!

## 📁 Folder Structure

```
backend/
├── server.js              # Main server file
├── package.json           # Dependencies
├── .env                   # Environment variables
├── certificates/          # Apple certificates (YOU CREATE THIS)
│   ├── signerCert.pem    # Your signing certificate
│   ├── signerKey.pem     # Your signing key
│   └── wwdr.pem          # Apple WWDR certificate
└── models/
    └── cardPass.pass/
        └── pass.json      # Pass template
```

## ⚠️ Important Notes

1. **Keep certificates private** - Never commit them to git
2. **Team ID** - Must match your Apple Developer account
3. **Pass Type ID** - Must match exactly in pass.json and certificates
4. **ngrok URL** - Changes each time you restart (free tier), update in app

## 🔒 Security

For production:
- Use a permanent domain (not ngrok free tier)
- Add authentication
- Validate inputs
- Use HTTPS
- Store certificates securely (e.g., AWS Secrets Manager)

## 📞 Troubleshooting

**Error: Certificates not configured**
- Make sure all 3 .pem files exist in `certificates/` folder

**Error: Invalid signature**
- Check that Pass Type ID matches in both pass.json and certificates
- Verify Team ID is correct

**Pass won't install**
- Check pass.json format
- Verify all required fields are present
- Check certificate expiration dates

## 🎉 Success!

Once everything is set up, your mobile app will generate passes that can be added directly to Apple Wallet!

