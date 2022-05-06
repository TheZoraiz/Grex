const mongoose = require('mongoose')
const Schema = mongoose.Schema

module.exports = mongoose.model('User', new Schema({
    name: {
        type: String,
        required: true,
        min: 6,
        max: 255,
    },
    email: {
        type: String,
        required: true,
        min: 6,
        max: 255,
    },
    emailVerifiedAt: Date,
    password: {
        type: String,
        required: true,
        min: 6,
        max: 1024,
    },
    
}, { timestamps: true }))