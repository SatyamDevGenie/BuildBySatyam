const mongoose = require('mongoose');
const { ensureIndexes } = require('./ensureIndexes');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: Math.max(5, Number(process.env.MONGO_POOL_SIZE || 15)),
            minPoolSize: 1,
            serverSelectionTimeoutMS: 8000,
            socketTimeoutMS: 45000,
        });

        console.log((`✅ Database Connected: ${(conn.connection.host)}`));
        await ensureIndexes();
    } catch (error) {
        console.error((`❌ MongoDB Error: ${error.message}`));
        process.exit(1);
    }
};

module.exports = connectDB;
