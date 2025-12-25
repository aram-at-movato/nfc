const express = require('express');
const cors = require('cors');
const { PKPass } = require('passkit-generator');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const passStorage = require('./passStorage');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Apple Wallet Pass Server is running',
    timestamp: new Date().toISOString()
  });
});

// Generate and return Apple Wallet pass
app.post('/api/generate-pass', async (req, res) => {
  try {
    const { cardholderName, cardKey, passId } = req.body;

    if (!cardholderName || !cardKey) {
      return res.status(400).json({ 
        error: 'Missing required fields: cardholderName and cardKey' 
      });
    }

    const id = passId || uuidv4();
    console.log(`Generating pass for ${cardholderName} with key ${cardKey}, ID: ${id}`);

    // Check if certificates exist
    const certsPath = path.join(__dirname, 'certificates');
    const modelPath = path.join(__dirname, 'models', 'cardPass.pass');

    if (!fs.existsSync(certsPath)) {
      return res.status(500).json({
        error: 'Certificates not configured. Please add your Apple certificates to the /certificates folder.',
        instructions: 'See SETUP.md for instructions'
      });
    }

    // Read certificate files
    const wwdrPem = fs.readFileSync(path.join(certsPath, 'wwdr.pem'), 'utf8');
    const signerCertPem = fs.readFileSync(path.join(certsPath, 'signerCert.pem'), 'utf8');
    const signerKeyPem = fs.readFileSync(path.join(certsPath, 'signerKey.pem'), 'utf8');
    
    // Create certificate chain (signerCert + WWDR)
    const certChain = signerCertPem + '\n' + wwdrPem;

    // Create the pass
    const pass = await PKPass.from({
      model: modelPath,
      certificates: {
        wwdr: wwdrPem,
        signerCert: certChain,  // Use full certificate chain
        signerKey: signerKeyPem,
        signerKeyPassphrase: 'LttYzlTfNUnLSWBR#'
      }
    }, {
      serialNumber: id,
      description: 'Digital Card'
    });

    // Modern boarding pass style - minimal and clean
    
    // Header fields: Location and Status
    pass.headerFields.push({
      key: 'location',
      label: 'REGION',
      value: 'Almaty',
      textAlignment: 'PKTextAlignmentLeft'
    });

    pass.headerFields.push({
      key: 'status',
      label: 'STATUS',
      value: 'Active',
      textAlignment: 'PKTextAlignmentRight'
    });

    // Primary field: Customer name (large, prominent)
    pass.primaryFields.push({
      key: 'name',
      label: 'MEMBER',
      value: cardholderName
    });

    // Secondary fields: Card ID and Membership tier
    pass.secondaryFields.push({
      key: 'cardId',
      label: 'CARD ID',
      value: cardKey.substring(0, 16),
      textAlignment: 'PKTextAlignmentLeft'
    });

    pass.secondaryFields.push({
      key: 'membership',
      label: 'TIER',
      value: 'Gold',
      textAlignment: 'PKTextAlignmentRight'
    });

    // Auxiliary fields: Generation date
    pass.auxiliaryFields.push({
      key: 'issued',
      label: 'ISSUED',
      value: new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      textAlignment: 'PKTextAlignmentLeft'
    });

    pass.auxiliaryFields.push({
      key: 'expires',
      label: 'VALID UNTIL',
      value: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      }),
      textAlignment: 'PKTextAlignmentRight'
    });

    // Deep link to Movato app
    pass.appLaunchURL = `https://apps.apple.com/us/app/movato/id6737806089`;

    // Add QR Code/Barcode as visual backup for NFC
    pass.barcodes = [{
      format: 'PKBarcodeFormatQR',
      message: cardKey,
      messageEncoding: 'iso-8859-1',
      altText: `ID: ${id.substring(0, 8).toUpperCase()}`
    }];

    // Add locations - show pass when near service centers
    pass.locations = [
      {
        latitude: 43.2380,
        longitude: 76.8892,
        relevantText: 'Welcome to Almaty Service Center'
      },
      {
        latitude: 43.2094,
        longitude: 76.6639,
        relevantText: 'Ramstore Movato - Tap to collect'
      },
      {
        latitude: 43.2567,
        longitude: 76.9286,
        relevantText: 'Mega Park Movato location nearby'
      }
    ];

    // Set relevant date - pass appears on lock screen near this time
    const relevantDate = new Date();
    relevantDate.setHours(relevantDate.getHours() + 1); // 1 hour from now
    pass.relevantDate = relevantDate.toISOString();

    // Set expiration date - 1 year from now
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    pass.expirationDate = expirationDate.toISOString();

    // Max distance for location-based display (100 meters)
    pass.maxDistance = 100;

    // Grouping identifier - groups all Movato cards together
    pass.groupingIdentifier = 'movato-membership-2025';

    // User info - custom data for your app
    pass.userInfo = {
      userId: id,
      membershipLevel: 'gold',
      region: 'almaty',
      registrationDate: new Date().toISOString(),
      preferences: {
        language: 'en',
        notifications: true
      }
    };

    // Advanced semantic tags for better iOS integration
    const nameParts = cardholderName.split(' ');
    pass.semantics = {
      // Membership info
      membershipProgramName: 'Movato Gold',
      membershipProgramNumber: cardKey.substring(0, 16),
      
      // Person info
      personNameComponents: {
        givenName: nameParts[0] || cardholderName,
        familyName: nameParts.slice(1).join(' ') || ''
      },
      
      // Event-like semantics (treating membership as ongoing event)
      eventName: 'Movato Gold Membership 2025',
      eventType: 'PKEventTypeGeneric',
      
      // Primary venue location
      venueLocation: {
        latitude: 43.2380,
        longitude: 76.8892
      },
      venueName: 'Movato Almaty Service Center',
      venuePhoneNumber: '+7 (727) 123-4567',
      venueRoom: 'Member Services',
      
      // Seat info (using as member tier info)
      seats: [{
        seatDescription: 'Gold Member',
        seatIdentifier: id,
        seatNumber: id.substring(0, 8),
        seatRow: 'Gold',
        seatSection: 'Premium'
      }]
    };
    
    // Back side - Card information
    pass.backFields.push({
      key: 'fullCardId',
      label: 'Full Card ID',
      value: cardKey
    });

    pass.backFields.push({
      key: 'cardHolder',
      label: 'Cardholder',
      value: cardholderName
    });

    pass.backFields.push({
      key: 'membershipTier',
      label: 'Membership Tier',
      value: 'Gold Member'
    });

    pass.backFields.push({
      key: 'issuedDate',
      label: 'Issued Date',
      value: new Date().toLocaleString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    });

    pass.backFields.push({
      key: 'serialNumber',
      label: 'Serial Number',
      value: id
    });

    pass.backFields.push({
      key: 'instructions',
      label: 'How to Use',
      value: 'Present this card at any Movato service center. Tap your phone to the NFC reader for quick verification. Your unique card ID ensures secure access to services.'
    });
    
    pass.backFields.push({
      key: 'support',
      label: 'Support',
      value: 'For assistance, contact Movato support or visit any service center.'
    });

    // Add NFC field so the pass can be scanned
    // The cardKey will be the unique identifier readable via NFC
    pass.nfc = {
      message: cardKey,  // The 32-character unique token
      encryptionPublicKey: undefined
    };

    // Store pass data for future updates
    passStorage.setPassData(id, {
      cardholderName,
      cardKey,
      created: new Date().toISOString()
    });

    // Generate the pass buffer
    const buffer = pass.getAsBuffer();

    // Save to passes directory for later retrieval
    const passesDir = path.join(__dirname, 'passes');
    if (!fs.existsSync(passesDir)) {
      fs.mkdirSync(passesDir);
    }
    fs.writeFileSync(path.join(passesDir, `${id}.pkpass`), buffer);

    // Return pass ID so client can open the URL
    res.json({ 
      success: true,
      passId: id,
      message: 'Pass generated successfully'
    });
    console.log(`Pass generated and saved: ${id}.pkpass`);

  } catch (error) {
    console.error('Error generating pass:', error);
    res.status(500).json({ 
      error: 'Failed to generate pass',
      message: error.message,
      details: 'Make sure certificates are properly configured'
    });
  }
});

// Serve pass file
app.get('/passes/:passId.pkpass', (req, res) => {
  const passId = req.params.passId;
  const passPath = path.join(__dirname, 'passes', `${passId}.pkpass`);
  
  if (!fs.existsSync(passPath)) {
    return res.status(404).json({ error: 'Pass not found' });
  }

  res.set({
    'Content-Type': 'application/vnd.apple.pkpass',
    'Content-Disposition': `attachment; filename="${passId}.pkpass"`
  });

  res.sendFile(passPath);
  console.log(`Served pass: ${passId}.pkpass`);
});

// Admin API: Get current service center data
app.get('/api/admin/service-centers', (req, res) => {
  const centers = passStorage.getServiceCenters();
  res.json(centers);
});

// Admin API: Update service center order count
app.post('/api/admin/service-centers/:centerId', (req, res) => {
  const { centerId } = req.params;
  const { orders } = req.body;

  if (typeof orders !== 'number' || orders < 0) {
    return res.status(400).json({ error: 'Invalid order count' });
  }

  const success = passStorage.updateServiceCenter(centerId, orders);
  
  if (success) {
    res.json({ 
      success: true, 
      message: `Updated ${centerId} to ${orders} orders`,
      centers: passStorage.getServiceCenters()
    });
    
    console.log(`Updated service center ${centerId}: ${orders} orders`);
    
    // In a real implementation, you would:
    // 1. Get all devices registered for passes
    // 2. Send push notifications to Apple
    // 3. Apple would then fetch updated passes
    console.log('Note: To update passes in Wallet, implement APNs push notifications');
  } else {
    res.status(404).json({ error: 'Service center not found' });
  }
});

// Apple Wallet Web Service endpoints (for future dynamic updates)
// These endpoints allow iOS to register/unregister devices and fetch updated passes

// Register device
app.post('/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber', (req, res) => {
  const { deviceLibraryIdentifier, serialNumber } = req.params;
  const { pushToken } = req.body;
  
  passStorage.registerDevice(deviceLibraryIdentifier, serialNumber);
  console.log(`Device registered: ${deviceLibraryIdentifier} for pass ${serialNumber}`);
  
  res.status(201).json({ success: true });
});

// Get passes for device
app.get('/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier', (req, res) => {
  const { deviceLibraryIdentifier } = req.params;
  const { passesUpdatedSince } = req.query;
  
  const passes = passStorage.getPassesForDevice(deviceLibraryIdentifier);
  
  res.json({
    lastUpdated: new Date().toISOString(),
    serialNumbers: passes
  });
});

// Unregister device
app.delete('/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber', (req, res) => {
  const { deviceLibraryIdentifier, serialNumber } = req.params;
  
  passStorage.unregisterDevice(deviceLibraryIdentifier, serialNumber);
  console.log(`Device unregistered: ${deviceLibraryIdentifier} from pass ${serialNumber}`);
  
  res.status(200).json({ success: true });
});

// Format card key for display
function formatCardKey(key) {
  return key.match(/.{1,4}/g)?.join('-') || key;
}

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Wallet Pass Server running on port ${PORT}`);
  console.log(`📱 Local: http://localhost:${PORT}`);
  console.log(`🌍 Use ngrok to expose: ngrok http ${PORT}\n`);
});

