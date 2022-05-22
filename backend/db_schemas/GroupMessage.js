const mongoose = require('mongoose')
const Schema = mongoose.Schema

module.exports = mongoose.model('GroupMessage', new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    groupId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Group',
    },
    message: {
        type: String,
        required: true,
        min: 6,
    },
}, { timestamps: true, collection: 'groupMessages' }))