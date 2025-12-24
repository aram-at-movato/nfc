const { PKPass } = require('passkit-generator');
const path = require('path');
const fs = require('fs');

console.log('Testing pass generation with PEM strings...\n');

const certsPath = path.join(__dirname, 'certificates');
const modelPath = path.join(__dirname, 'models', 'cardPass.pass');

async function testPass() {
  try {
    console.log('Reading certificate files...');
    
    const wwdrPem = fs.readFileSync(path.join(certsPath, 'wwdr.pem'), 'utf8');
    const signerCertPem = fs.readFileSync(path.join(certsPath, 'signerCert.pem'), 'utf8');
    const signerKeyPem = fs.readFileSync(path.join(certsPath, 'signerKey.pem'), 'utf8');
    
    console.log('✓ All certificate files read');
    console.log('  wwdr.pem:', wwdrPem.length, 'chars');
    console.log('  signerCert.pem:', signerCertPem.length, 'chars');
    console.log('  signerKey.pem:', signerKeyPem.length, 'chars');
    
    // Try with certificate chain (wwdr + signerCert combined)
    const certChain = signerCertPem + '\n' + wwdrPem;
    
    console.log('\nCreating pass with certificate chain...');
    
    const pass = await PKPass.from({
      model: modelPath,
      certificates: {
        wwdr: wwdrPem,
        signerCert: certChain,  // Try with chain
        signerKey: signerKeyPem,
        signerKeyPassphrase: 'LttYzlTfNUnLSWBR#'
      }
    }, {
      serialNumber: 'TEST-123',
      description: 'Test Pass'
    });
    
    console.log('✓ Pass object created!');
    
    pass.primaryFields.push({
      key: 'name',
      label: 'NAME',
      value: 'Test User'
    });
    
    console.log('✓ Fields added!');
    
    const buffer = pass.getAsBuffer();
    
    console.log('✓ SUCCESS! Pass generated!');
    console.log('  Buffer size:', buffer.length, 'bytes');
    
    // Write test pass
    fs.writeFileSync('test.pkpass', buffer);
    console.log('✓ Saved to test.pkpass');
    
  } catch (error) {
    console.log('✗ Error:', error.message);
  }
}

testPass();

