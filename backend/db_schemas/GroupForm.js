const mongoose = require('mongoose')
const Schema = mongoose.Schema

module.exports = mongoose.model('GroupForm', new Schema({
    groupId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Group',
    },
    formTitle: {
        type: String,
        required: true,
    },
    formQuestions: {
        type: String,
        required: true,
    },
}, { timestamps: true, collection: 'groupForms' }))