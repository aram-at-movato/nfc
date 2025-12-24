# 🚀 Complete Setup Guide: Apple Wallet Integration

This guide will walk you through setting up the complete system to add cards to Apple Wallet.

## 📋 Overview

The system consists of:
1. **React Native Mobile App** - Generates cards and displays them
2. **Node.js Backend Server** - Creates signed Apple Wallet passes
3. **ngrok** - Exposes local backend to the internet
4. **Apple Developer Certificates** - Signs the wallet passes

---

## 🎯 Step-by-Step Setup

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2: Set Up Apple Developer Account & Certificates

#### A. Create Pass Type ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** button
4. Select **Pass Type IDs** → Continue
5. Enter:
   - **Description**: NFC Wallet Card Pass
   - **Identifier**: `pass.com.nfcwallet.card`
6. Click **Continue** → **Register**

#### B. Create Certificate

1. Click on your new Pass Type ID
2. Click **Create Certificate**
3. Create a Certificate Signing Request (CSR):
   - Open **Keychain Access** (Mac)
   - Menu: **Keychain Access** → **Certificate Assistant** → **Request a Certificate from a Certificate Authority**
   - Enter your email and name
   - Select "Saved to disk"
   - Save the CSR file
4. Upload CSR to Apple Developer Portal
5. Download the certificate (.cer file)

#### C. Convert Certificates

```bash
# 1. Download WWDR Certificate
curl https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer -o wwdr.cer

# 2. Create certificates folder
mkdir -p backend/certificates

# 3. Convert your Pass Type certificate to PEM
openssl x509 -inform DER -in ~/Downloads/pass.cer -out backend/certificates/signerCert.pem

# 4. Export your certificate from Keychain:
#    - Open Keychain Access
#    - Find your Pass Type ID certificate
#    - Right-click → Export → Save as certificate.p12 (set password if you want)

# 5. Convert .p12 to PEM
openssl pkcs12 -in ~/Downloads/certificate.p12 -out backend/certificates/signerKey.pem -nodes

# 6. Convert WWDR certificate
openssl x509 -inform DER -in wwdr.cer -out backend/certificates/wwdr.pem
```

### Step 3: Configure Backend

Edit `backend/models/cardPass.pass/pass.json`:

```json
{
  "passTypeIdentifier": "pass.com.nfcwallet.card",
  "teamIdentifier": "YOUR_TEAM_ID_HERE",
  "organizationName": "NFC Wallet"
}
```

**Find your Team ID:**
- Apple Developer Portal → Account → Membership → Team ID

### Step 4: Start Backend Server

```bash
cd backend
npm start
```

You should see:
```
🚀 Wallet Pass Server running on port 3000
```

### Step 5: Install & Start ngrok

```bash
# Install ngrok
brew install ngrok

# Or download from: https://ngrok.com/download

# Start ngrok in a NEW terminal
ngrok http 3000
```

You'll get output like:
```
Forwarding   https://abc123xyz.ngrok.io -> http://localhost:3000
```

**Copy the https URL** (e.g., `https://abc123xyz.ngrok.io`)

### Step 6: Update Mobile App

Edit `services/WalletService.ts` and update line 4:

```javascript
const API_URL = 'https://abc123xyz.ngrok.io'; // Your ngrok URL here
```

### Step 7: Rebuild Mobile App

Since you changed the code, rebuild the app:

```bash
# If using development server (faster)
# Just reload the app on your phone

# If you need a new build
eas build --profile development --platform ios
```

---

## ✅ Testing

1. Open the app on your iPhone
2. Enter a cardholder name
3. Tap "Generate Card & Add to Wallet"
4. You should see a prompt to add the pass to Apple Wallet!

---

## 🧪 Testing Backend Directly

Test the backend is working:

```bash
# Test health check
curl https://your-ngrok-url.ngrok.io

# Test pass generation
curl -X POST https://your-ngrok-url.ngrok.io/api/generate-pass \
  -H "Content-Type: application/json" \
  -d '{"cardholderName": "Test User", "cardKey": "TEST123456789"}' \
  --output test.pkpass

# Open test.pkpass on your iPhone to verify it works
```

---

## 📁 Final Folder Structure

```
nfc/
├── App.tsx                          # Mobile app
├── services/
│   └── WalletService.ts            # Updated with API_URL
├── backend/
│   ├── server.js                   # Backend server
│   ├── package.json
│   ├── .env
│   ├── certificates/               # YOUR APPLE CERTIFICATES
│   │   ├── signerCert.pem
│   │   ├── signerKey.pem
│   │   └── wwdr.pem
│   └── models/
│       └── cardPass.pass/
│           └── pass.json           # Updated with your Team ID
└── COMPLETE_SETUP.md               # This file
```

---

## 🎉 Success Checklist

- [ ] Backend server running (`npm start`)
- [ ] ngrok exposing backend (`ngrok http 3000`)
- [ ] Certificates in `backend/certificates/` folder
- [ ] Team ID updated in `pass.json`
- [ ] API_URL updated in `WalletService.ts`
- [ ] Mobile app rebuilt/reloaded
- [ ] Test pass generation works

---

## ⚠️ Common Issues

### "Certificates not configured"
- Make sure all 3 .pem files exist in `backend/certificates/`
- Check file names match exactly: `signerCert.pem`, `signerKey.pem`, `wwdr.pem`

### "Connection Error"
- Verify backend is running on port 3000
- Check ngrok is active and URL is correct
- Update API_URL in WalletService.ts
- Make sure your phone can reach the ngrok URL

### "Invalid Pass"
- Verify Pass Type ID matches in pass.json and your certificate
- Check Team ID is correct
- Ensure WWDR certificate is valid

### "Cannot add to Wallet"
- Pass might be already in wallet - check Wallet app
- Try deleting old passes and regenerating
- Check iPhone is signed in to iCloud

---

## 🔒 Security Notes

**For Production:**
- Don't use ngrok free tier (URL changes on restart)
- Use a real domain with SSL certificate
- Add API authentication
- Store certificates securely (AWS Secrets Manager, etc.)
- Never commit certificates to git
- Add rate limiting

---

## 📞 Support

If you run into issues:
1. Check backend logs for errors
2. Test backend endpoint directly with curl
3. Verify all certificates are valid
4. Check Apple Developer Portal for certificate status

---

## 🎯 What Happens When You Generate a Card

1. User enters name → Taps "Generate Card & Add to Wallet"
2. App generates unique UUID key
3. App sends request to backend via ngrok URL
4. Backend creates .pkpass file with Apple certificates
5. Backend returns signed pass
6. App opens the pass
7. iOS prompts to add to Apple Wallet
8. Card appears in Wallet app! 🎉

---

**You're all set!** Generate your first card and watch it appear in Apple Wallet! 📱✨

