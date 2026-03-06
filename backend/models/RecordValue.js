const mongoose = require('mongoose');

const RecordValueSchema = new mongoose.Schema({
    record_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Record',
        required: true,
    },
    field_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Field',
        required: true,
    },
    value: mongoose.Schema.Types.Mixed,
});

module.exports = mongoose.model('RecordValue', RecordValueSchema);
