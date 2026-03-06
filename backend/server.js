const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Enable CORS
app.use(cors());

// Route files
const auth = require('./routes/auth');
const admin = require('./routes/admin');
const agent = require('./routes/agent');

// Mount routers
app.use('/api/auth', auth);
app.use('/api/admin', admin);
app.use('/api/agent', agent);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
}

module.exports = app;
