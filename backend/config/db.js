const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Field = require('../models/Field');

let connectionError = null;

const connectDB = async () => {
    let mongoServer = null;
    let connected = false;
    connectionError = null;

    // Check if the URI is the dead Atlas URI, and if so, skip to local DB immediately to save time.
    const isDeadAtlas = process.env.MONGODB_URI && process.env.MONGODB_URI.includes('mrcoachfitnesscenter.owrgvwv.mongodb.net');

    if (!isDeadAtlas && process.env.MONGODB_URI) {
        try {
            console.log('Attempting to connect to configured MONGODB_URI...');
            await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 3000
            });
            console.log(`MongoDB Connected to external URI: ${mongoose.connection.host}`);
            connected = true;
        } catch (error) {
            console.warn(`Could not connect to external MONGODB_URI: ${error.message}`);
            connectionError = error;
        }
    }

    if (!connected) {
        // If we are running in a serverless environment (e.g. Vercel), MongoMemoryServer won't work
        if (process.env.VERCEL) {
            const vercelErr = new Error(
                'In-memory MongoDB (mongodb-memory-server) cannot be run on Vercel/serverless environments. ' +
                'Please configure a valid MONGODB_URI environment variable in your Vercel project settings.'
            );
            console.error(vercelErr.message);
            connectionError = vercelErr;
            return;
        }

        try {
            console.log('Starting local in-memory MongoDB server...');
            const { MongoMemoryServer } = require('mongodb-memory-server');
            mongoServer = await MongoMemoryServer.create();
            const localUri = mongoServer.getUri();
            console.log(`In-memory MongoDB started at: ${localUri}`);
            
            await mongoose.connect(localUri);
            console.log('MongoDB Connected to local in-memory instance.');
            connected = true;
            connectionError = null; // reset if successful
        } catch (error) {
            console.error(`Failed to start local MongoDB: ${error.message}`);
            connectionError = error;
        }
    }

    // Auto-seed if database is empty
    if (connected) {
        try {
            const userCount = await User.countDocuments();
            if (userCount === 0) {
                console.log('No users found in database. Seeding default accounts...');
                
                // Seed Admin 1
                await User.create({
                    name: 'System Admin',
                    email: 'admin@mrcoach.xyz',
                    phone: '0000000000',
                    password: 'adminpassword123',
                    role: 'Admin'
                });
                console.log('Admin user seeded: admin@mrcoach.xyz / adminpassword123');

                // Seed Admin 2 (User's choice in UI)
                await User.create({
                    name: 'Promptix Admin',
                    email: 'infopromptix@gmail.com',
                    phone: '1234567890',
                    password: 'password123',
                    role: 'Admin'
                });
                console.log('User seeded: infopromptix@gmail.com / password123');

                // Seed Field Agent
                await User.create({
                    name: 'Field Agent 1',
                    email: 'agent@mrcoach.xyz',
                    phone: '9876543210',
                    password: 'password123',
                    role: 'Field Agent'
                });
                console.log('Agent user seeded: agent@mrcoach.xyz / password123');
            }

            const categoryCount = await Category.countDocuments();
            if (categoryCount === 0) {
                console.log('No categories found. Seeding default category and fields...');
                
                const category = await Category.create({
                    name: 'Retail Stores',
                    description: 'Data collection for local retail outlets and shops.'
                });

                await Field.create([
                    {
                        category_id: category._id,
                        field_name: 'Store Name',
                        field_type: 'Text',
                        required: true,
                        field_order: 1
                    },
                    {
                        category_id: category._id,
                        field_name: 'Contact Phone',
                        field_type: 'Phone',
                        required: true,
                        field_order: 2
                    },
                    {
                        category_id: category._id,
                        field_name: 'Owner Name',
                        field_type: 'Text',
                        required: false,
                        field_order: 3
                    },
                    {
                        category_id: category._id,
                        field_name: 'Store Type',
                        field_type: 'Dropdown',
                        required: true,
                        options: ['Grocery', 'Apparel', 'Electronics', 'Pharmacy', 'Other'],
                        field_order: 4
                    }
                ]);
                console.log('Default Category "Retail Stores" and its fields seeded.');
            }
        } catch (seedError) {
            console.error(`Error seeding default accounts: ${seedError.message}`);
        }
    }
};

module.exports = connectDB;
module.exports.getConnectionError = () => connectionError;
