const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        const adminExists = await User.findOne({ email: 'admin@mrcoach.xyz' });
        if (adminExists) {
            console.log('Admin already exists.');
            process.exit(0);
        }

        await User.create({
            name: 'System Admin',
            email: 'admin@mrcoach.xyz',
            phone: '0000000000',
            password: 'adminpassword123',
            role: 'Admin'
        });

        console.log('Admin user created successfully!');
        console.log('Email: admin@mrcoach.xyz');
        console.log('Password: adminpassword123');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAdmin();
