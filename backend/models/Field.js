const mongoose = require('mongoose');

const FieldSchema = new mongoose.Schema({
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    field_name: {
        type: String,
        required: [true, 'Please add a field name'],
    },
    field_type: {
        type: String,
        enum: ['Text', 'Number', 'Phone', 'Email', 'Dropdown', 'Checkbox', 'Date', 'Textarea', 'Location', 'Image upload'],
        required: true,
    },
    required: {
        type: Boolean,
        default: false,
    },
    options: [String], // For dropdowns
    field_order: {
        type: Number,
        default: 0,
    },
    is_system: {
        type: Boolean,
        default: false,
    }
});

module.exports = mongoose.model('Field', FieldSchema);
