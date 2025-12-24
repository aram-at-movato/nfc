const fs = require('fs');
const path = require('path');
const forge = require('node-forge');

const certsPath = path.join(__dirname, 'certificates');

console.log('Testing certificate files...\n');

// Test WWDR
try {
  const wwdrPem = fs.readFileSync(path.join(certsPath, 'wwdr.pem'), 'utf8');
  console.log('✓ wwdr.pem read successfully');
  console.log('  Length:', wwdrPem.length);
  const wwdrCert = forge.pki.certificateFromPem(wwdrPem);
  console.log('✓ wwdr.pem parsed successfully');
  console.log('  Subject:', wwdrCert.subject.getField('CN').value);
} catch (err) {
  console.log('✗ Error with wwdr.pem:', err.message);
}

console.log('');

// Test signerCert
try {
  const certPem = fs.readFileSync(path.join(certsPath, 'signerCert.pem'), 'utf8');
  console.log('✓ signerCert.pem read successfully');
  console.log('  Length:', certPem.length);
  const cert = forge.pki.certificateFromPem(certPem);
  console.log('✓ signerCert.pem parsed successfully');
  console.log('  Subject:', cert.subject.getField('CN').value);
} catch (err) {
  console.log('✗ Error with signerCert.pem:', err.message);
}

console.log('');

// Test signerKey
try {
  const keyPem = fs.readFileSync(path.join(certsPath, 'signerKey.pem'), 'utf8');
  console.log('✓ signerKey.pem read successfully');
  console.log('  Length:', keyPem.length);
  const key = forge.pki.privateKeyFromPem(keyPem);
  console.log('✓ signerKey.pem parsed successfully');
} catch (err) {
  console.log('✗ Error with signerKey.pem:', err.message);
}

