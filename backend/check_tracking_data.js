const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const User = require('./models/User');
const Record = require('./models/Record');
const Tracking = require('./models/Tracking');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const agents = await User.find({ role: 'Field Agent' });
        console.log(`Found ${agents.length} agents`);

        for (const agent of agents) {
            console.log(`\nMonitoring: ${agent.name} (${agent._id})`);

            const lastRecord = await Record.findOne({ agent_id: agent._id })
                .sort('-created_at');

            const lastTracking = await Tracking.findOne({ agent_id: agent._id })
                .sort('-timestamp');

            console.log('Last Record:', lastRecord ? `${lastRecord.created_at} (Lat: ${lastRecord.latitude}, Lng: ${lastRecord.longitude})` : 'None');
            console.log('Last Tracking:', lastTracking ? `${lastTracking.timestamp} (Lat: ${lastTracking.latitude}, Lng: ${lastTracking.longitude})` : 'None');
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

checkData();
