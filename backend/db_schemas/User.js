const mongoose = require('mongoose')
const Schema = mongoose.Schema

module.exports = mongoose.model('User', new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    emailVerifiedAt: Date,
    password: {
        type: String,
        required: true,
    },
    refreshToken: String,
    
}, { timestamps: true }))