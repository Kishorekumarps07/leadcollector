const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Tracking = require('./models/Tracking');
const Record = require('./models/Record');

async function checkNaN() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        console.log('Fetching Tracking data...');
        const allTracking = await Tracking.find({}).lean();
        console.log(`Fetched ${allTracking.length} tracking records.`);

        console.log('Fetching Record data...');
        const allRecords = await Record.find({}).lean();
        console.log(`Fetched ${allRecords.length} records.`);

        const badTracking = allTracking.filter(t =>
            t.latitude === null || t.longitude === null || isNaN(Number(t.latitude)) || isNaN(Number(t.longitude))
        );

        const badRecords = allRecords.filter(r =>
            r.latitude === null || r.longitude === null || isNaN(Number(r.latitude)) || isNaN(Number(r.longitude))
        );

        console.log('Bad tracking entries:', badTracking.length);
        console.log('Bad record entries:', badRecords.length);

        badTracking.forEach(t => {
            console.log(`Tracking ID: ${t._id}, Lat: ${t.latitude}, Lng: ${t.longitude}`);
        });

        badRecords.forEach(r => {
            console.log(`Record ID: ${r._id}, Lat: ${r.latitude}, Lng: ${r.longitude}`);
        });

        await mongoose.connection.close();
    } catch (err) {
        console.error('CRASH ERROR:', err);
        process.exit(1);
    }
}

checkNaN();
