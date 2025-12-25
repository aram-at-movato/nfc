const { PKPass } = require('passkit-generator');
const path = require('path');
const fs = require('fs');

console.log('🎨 Generating preview pass with new design...\n');

const certsPath = path.join(__dirname, 'certificates');
const modelPath = path.join(__dirname, 'models', 'cardPass.pass');

async function generatePreviewPass() {
  try {
    console.log('📂 Reading certificate files...');
    
    const wwdrPem = fs.readFileSync(path.join(certsPath, 'wwdr.pem'), 'utf8');
    const signerCertPem = fs.readFileSync(path.join(certsPath, 'signerCert.pem'), 'utf8');
    const signerKeyPem = fs.readFileSync(path.join(certsPath, 'signerKey.pem'), 'utf8');
    const certChain = signerCertPem + '\n' + wwdrPem;
    
    console.log('✓ Certificates loaded');
    
    console.log('\n🎫 Creating pass...');
    
    const pass = await PKPass.from({
      model: modelPath,
      certificates: {
        wwdr: wwdrPem,
        signerCert: certChain,
        signerKey: signerKeyPem,
        signerKeyPassphrase: 'LttYzlTfNUnLSWBR#'
      }
    }, {
      serialNumber: 'PREVIEW-123456',
      description: 'Movato Pickup Card'
    });
    
    console.log('✓ Pass object created');
    
    // Mock data matching your actual implementation
    const cardholderName = 'Aram Baghdasaryan';
    const cardKey = 'A3B7C2D1E5F6A8B9C0D1E2F3A4B5C6D7';
    const id = 'PREVIEW-123456';
    
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

    // Add NFC field
    pass.nfc = {
      message: cardKey,
      encryptionPublicKey: undefined
    };
    
    console.log('✓ All fields added');
    
    const buffer = pass.getAsBuffer();
    
    console.log('✓ Pass generated successfully!');
    console.log('  Buffer size:', buffer.length, 'bytes');
    
    // Save to file
    const outputPath = path.join(__dirname, 'preview.pkpass');
    fs.writeFileSync(outputPath, buffer);
    
    console.log('\n✅ Preview pass saved to: preview.pkpass');
    console.log('\n📱 To view the design:');
    console.log('   1. AirDrop preview.pkpass to your iPhone');
    console.log('   2. Or double-click it on Mac with Wallet enabled');
    console.log('   3. Or use online validator: https://pkpassvalidator.com/');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

generatePreviewPass();

