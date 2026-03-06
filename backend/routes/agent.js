const express = require('express');
const { protect } = require('../middleware/auth');
const Record = require('../models/Record');
const RecordValue = require('../models/RecordValue');
const Tracking = require('../models/Tracking');
const Field = require('../models/Field');
const router = express.Router();

router.use(protect);

// @desc    Submit a new record
// @route   POST /api/agent/submit
router.post('/submit', async (req, res) => {
    try {
        const { category_id, subcategory_id, latitude, longitude, values } = req.body;

        // Check for duplicate phone number if the field exists
        const phoneField = await Field.findOne({ category_id, field_type: 'Phone' });
        if (phoneField && values[phoneField._id]) {
            const existingValue = await RecordValue.findOne({
                field_id: phoneField._id,
                value: values[phoneField._id]
            });
            if (existingValue) {
                return res.status(400).json({ success: false, message: 'A record with this phone number already exists.' });
            }
        }

        // Create record metadata
        const createData = {
            category_id,
            agent_id: req.user.id,
            latitude,
            longitude,
        };

        if (subcategory_id) {
            createData.subcategory_id = subcategory_id;
        }

        const record = await Record.create(createData);

        // Create record values
        const recordValuePromises = Object.keys(values).map((field_id) => {
            return RecordValue.create({
                record_id: record._id,
                field_id,
                value: values[field_id],
            });
        });

        await Promise.all(recordValuePromises);

        // Also update tracking activity
        await Tracking.create({
            agent_id: req.user.id,
            latitude,
            longitude,
            activity_type: 'submission',
        });

        res.status(201).json({ success: true, data: record });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Get agent's own submissions
// @route   GET /api/agent/my-submissions
router.get('/my-submissions', async (req, res) => {
    try {
        const records = await Record.find({ agent_id: req.user.id })
            .populate('category_id', 'name')
            .populate('subcategory_id', 'name')
            .sort('-created_at');
        res.status(200).json({ success: true, data: records });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Update tracking location
// @route   POST /api/agent/track
router.post('/track', async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const tracking = await Tracking.create({
            agent_id: req.user.id,
            latitude,
            longitude,
            activity_type: 'heartbeat',
        });
        res.status(201).json({ success: true, data: tracking });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

module.exports = router;
