const mongoose = require('mongoose')
const Schema = mongoose.Schema

module.exports = mongoose.model('SessionAttendance', new Schema({
    groupId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Group',
    },
    sessionId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Session',
    },
    title: {
        type: String,
        required: true,
    },
    present: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
        }
    ],
    absent: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
        }
    ],
    
}, { timestamps: true, collection: 'sessionAttendances' }))