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
    profPicPath: String,
    emailVerifiedAt: Date,
    password: {
        type: String,
        required: true,
        min: 6,
        max: 1024,
        select: false,
    },
    
}, { timestamps: true }))