const mongoose = require('mongoose');

const TrackingSchema = new mongoose.Schema({
    agent_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    latitude: {
        type: Number,
        required: true,
    },
    longitude: {
        type: Number,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    activity_type: {
        type: String,
        enum: ['submission', 'heartbeat'],
        default: 'heartbeat'
    },
});

module.exports = mongoose.model('Tracking', TrackingSchema);
