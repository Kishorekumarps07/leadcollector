const mongoose = require('mongoose');

const RecordSchema = new mongoose.Schema({
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    subcategory_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subcategory',
        required: false,
    },
    agent_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    latitude: Number,
    longitude: Number,
    created_at: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Record', RecordSchema);
