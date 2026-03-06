const mongoose = require('mongoose');

const SubcategorySchema = new mongoose.Schema({
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Please add a subcategory name'],
    },
});

module.exports = mongoose.model('Subcategory', SubcategorySchema);
