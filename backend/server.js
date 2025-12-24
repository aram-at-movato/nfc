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

    // Update pass fields
    pass.primaryFields.push({
      key: 'customer',
      label: 'CUSTOMER',
      value: cardholderName,
      textAlignment: 'PKTextAlignmentLeft'
    });

    pass.secondaryFields.push({
      key: 'ticketNumber',
      label: 'TICKET',
      value: id.substring(0, 8).toUpperCase(),
      textAlignment: 'PKTextAlignmentLeft'
    });

    pass.secondaryFields.push({
      key: 'issued',
      label: 'DATE',
      value: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      textAlignment: 'PKTextAlignmentRight'
    });

    // Get service centers with order counts
    const serviceCenters = passStorage.getServiceCenters();
    
    // Add service center order counts
    Object.values(serviceCenters).forEach((center, index) => {
      pass.backFields.push({
        key: `center_${index}`,
        label: center.name,
        value: `${center.orders} order${center.orders !== 1 ? 's' : ''} ready`,
        textAlignment: 'PKTextAlignmentLeft'
      });
    });

    // Back side - instructions
    pass.backFields.push({
      key: 'instructions',
      label: 'Pickup Instructions',
      value: 'Present this ticket at any Movato service center or authorized locker to collect your order. Order counts are updated in real-time.'
    });
    
    pass.backFields.push({
      key: 'terms',
      label: 'Terms & Conditions',
      value: 'This ticket is valid for order pickup at Movato service centers and authorized lockers. The unique identifier can be scanned by NFC readers for verification.'
    });

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

