const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const User = require('./backend/models/User');

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log('Users found:', users.map(u => ({ name: u.name, role: u.role, email: u.email })));

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

checkUsers();
