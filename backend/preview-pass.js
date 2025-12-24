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
    const totalOrders = 15; // 5 + 7 + 3 from service centers
    const id = 'PREVIEW-123456';
    
    // White card with membership, balance, and order info
    // Header: Membership tier
    pass.headerFields.push({
      key: 'membership',
      label: 'MEMBERSHIP',
      value: 'Gold Member'
    });

    // Primary field: Customer name (large)
    pass.primaryFields.push({
      key: 'name',
      label: '',
      value: cardholderName
    });

    // Secondary fields: Balance and Orders (two columns)
    pass.secondaryFields.push({
      key: 'balance',
      label: 'BALANCE',
      value: '$250.00',
      textAlignment: 'PKTextAlignmentLeft'
    });

    pass.secondaryFields.push({
      key: 'orders',
      label: 'ORDERS',
      value: totalOrders.toString(),
      textAlignment: 'PKTextAlignmentRight'
    });

    // Auxiliary field: Points (single field)
    pass.auxiliaryFields.push({
      key: 'points',
      label: 'POINTS',
      value: '1,250',
      textAlignment: 'PKTextAlignmentCenter'
    });
    
    // Back side fields
    pass.backFields.push({
      key: 'orderSummary',
      label: 'Order Summary',
      value: `You have ${totalOrders} orders ready for pickup at Movato service centers.`
    });

    pass.backFields.push({
      key: 'almaty_sc',
      label: 'Almaty SC',
      value: '5 orders ready',
      textAlignment: 'PKTextAlignmentLeft'
    });

    pass.backFields.push({
      key: 'ramstore',
      label: 'Ramstore, Almaty',
      value: '7 orders ready',
      textAlignment: 'PKTextAlignmentLeft'
    });

    pass.backFields.push({
      key: 'mega',
      label: 'Mega Park',
      value: '3 orders ready',
      textAlignment: 'PKTextAlignmentLeft'
    });

    pass.backFields.push({
      key: 'instructions',
      label: 'How to Pick Up',
      value: '1. Present this card at any Movato service center\n2. Tap your phone to the NFC reader\n3. Collect your orders\n\nOrder counts update automatically.'
    });
    
    pass.backFields.push({
      key: 'support',
      label: 'Need Help?',
      value: 'Contact Movato support or visit any service center. Your unique card number ensures secure order pickup.'
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

