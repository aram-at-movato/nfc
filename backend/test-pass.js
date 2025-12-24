const { PKPass } = require('passkit-generator');
const path = require('path');

console.log('Testing pass generation...\n');

const certsPath = path.join(__dirname, 'certificates');
const modelPath = path.join(__dirname, 'models', 'cardPass.pass');

async function testPass() {
  try {
    console.log('Creating pass with certificates...');
    
    const pass = await PKPass.from({
      model: modelPath,
      certificates: {
        wwdr: path.join(certsPath, 'wwdr.pem'),
        signerCert: path.join(certsPath, 'signerCert.pem'),
        signerKey: path.join(certsPath, 'signerKey.pem'),
        signerKeyPassphrase: 'LttYzlTfNUnLSWBR#'
      }
    }, {
      serialNumber: 'TEST-123',
      description: 'Test Pass'
    });
    
    console.log('✓ Pass object created successfully!');
    
    // Try to add fields
    pass.primaryFields.push({
      key: 'name',
      label: 'NAME',
      value: 'Test User'
    });
    
    console.log('✓ Fields added successfully!');
    
    // Try to generate the buffer
    const buffer = pass.getAsBuffer();
    
    console.log('✓ Pass buffer generated successfully!');
    console.log('  Buffer size:', buffer.length, 'bytes');
    
  } catch (error) {
    console.log('✗ Error:', error.message);
    console.log('\nFull error:');
    console.log(error);
  }
}

testPass();

