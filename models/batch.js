const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
    batch_id: {
        type: String,
        required: true,
        unique: true
    },
    ingestion_id: {
        type: String,
        required: true,
        ref: 'Ingestion'
    },
    ids: [{
        type: Number,
        required: true
    }],
    status: {
        type: String,
        enum: ['yet_to_start', 'triggered', 'completed'],
        default: 'yet_to_start'
    },
    created_time: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Batch', batchSchema);