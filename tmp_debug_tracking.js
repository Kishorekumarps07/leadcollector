const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const User = require('./backend/models/User');
const Record = require('./backend/models/Record');
const Tracking = require('./backend/models/Tracking');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const agents = await User.find({ role: 'Field Agent' });
        console.log(`Found ${agents.length} agents`);

        for (const agent of agents) {
            console.log(`\nMonitoring: ${agent.name} (${agent.role})`);

            const lastRecord = await Record.findOne({ agent_id: agent._id })
                .sort('-created_at');

            const lastTracking = await Tracking.findOne({ agent_id: agent._id })
                .sort('-created_at');

            console.log('Last Record:', lastRecord ? lastRecord.created_at : 'None');
            console.log('Last Tracking:', lastTracking ? lastTracking.created_at : 'None');
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

checkData();
