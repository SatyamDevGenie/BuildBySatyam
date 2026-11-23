const colors = require('colors');
const Citizen = require('../models/Citizen');
const Incident = require('../models/Incident');
const WalletLedger = require('../models/WalletLedger');

const ensureIndexes = async () => {
    try {
        console.log('📑 Creating database indexes...'.blue);

        // Create indexes for Citizen model
        await Citizen.createIndexes();
        
        // Create indexes for Incident model
        await Incident.createIndexes();
        
        // Create indexes for WalletLedger model
        await WalletLedger.createIndexes();

        console.log('✅ Database indexes created successfully'.green);
    } catch (error) {
        console.error(`❌ Error creating indexes: ${error.message}`.red);
        // Don't exit - indexes might already exist
    }
};

module.exports = { ensureIndexes };
