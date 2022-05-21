const mongoose = require('mongoose')
const Schema = mongoose.Schema

module.exports = mongoose.model('Group', new Schema({
    name: {
        type: String,
        required: true,
        min: 6,
        max: 255,
    },
    joinCode: {
        type: String,
        unique: true,
        required: true,
    },
    host: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    members: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
        }
    ]
    
}, { timestamps: true }))