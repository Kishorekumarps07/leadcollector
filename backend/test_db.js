const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

console.log('Testing MongoDB connection with URI:', process.env.MONGODB_URI ? 'FOUND (hidden)' : 'NOT FOUND');

async function testConnection() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected successfully!');
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        process.exit(1);
    }
}

testConnection();
