const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a category name'],
        unique: true,
    },
    description: String,
    created_at: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Category', CategorySchema);
