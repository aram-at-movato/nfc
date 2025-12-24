// Simple in-memory storage for pass data
// In production, use a real database like PostgreSQL or MongoDB
const passData = new Map();
const registrations = new Map(); // deviceId -> Set of passIds

// Initialize some demo data
function initializeDemoData() {
  const serviceCenters = {
    'almaty_sc': { name: 'Almaty SC', orders: 5 },
    'ramstore': { name: 'Ramstore, Almaty', orders: 7 },
    'mega': { name: 'Mega Park', orders: 3 }
  };
  
  // Store service centers data
  passData.set('serviceCenters', serviceCenters);
}

initializeDemoData();

module.exports = {
  // Get pass data
  getPassData: (passId) => {
    return passData.get(passId);
  },

  // Set pass data
  setPassData: (passId, data) => {
    passData.set(passId, data);
  },

  // Get service centers
  getServiceCenters: () => {
    return passData.get('serviceCenters');
  },

  // Update service center orders
  updateServiceCenter: (centerId, orders) => {
    const centers = passData.get('serviceCenters');
    if (centers[centerId]) {
      centers[centerId].orders = orders;
      passData.set('serviceCenters', centers);
      return true;
    }
    return false;
  },

  // Register device for pass
  registerDevice: (deviceId, passId) => {
    if (!registrations.has(deviceId)) {
      registrations.set(deviceId, new Set());
    }
    registrations.get(deviceId).add(passId);
  },

  // Unregister device
  unregisterDevice: (deviceId, passId) => {
    if (registrations.has(deviceId)) {
      registrations.get(deviceId).delete(passId);
    }
  },

  // Get all devices registered for a pass
  getDevicesForPass: (passId) => {
    const devices = [];
    for (const [deviceId, passes] of registrations.entries()) {
      if (passes.has(passId)) {
        devices.push(deviceId);
      }
    }
    return devices;
  },

  // Get all passes for a device
  getPassesForDevice: (deviceId) => {
    return registrations.has(deviceId) 
      ? Array.from(registrations.get(deviceId)) 
      : [];
  }
};

