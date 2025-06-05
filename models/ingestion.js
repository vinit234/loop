const mongoose = require('mongoose');

const ingestionSchema = new mongoose.Schema({
    ingestion_id: {
        type: String,
        required: true,
        unique: true
    },
    priority: {
        type: String,
        enum: ['HIGH', 'MEDIUM', 'LOW'],
        required: true
    },
    created_time: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['yet_to_start', 'triggered', 'completed'],
        default: 'yet_to_start'
    }
});

module.exports = mongoose.model('Ingestion', ingestionSchema);