const mongoose = require('mongoose')
const Schema = mongoose.Schema

module.exports = mongoose.model('Session', new Schema({
    groupId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Group',
    },
    status: {
        type: String,
        enum: ['ongoing', 'finished'],
        required: true,
        min: 6,
        max: 255,
    },
    
}, { timestamps: true }))