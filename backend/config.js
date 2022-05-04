const mongoose = require('mongoose')

const config = {
    apiPort: process.env.PORT || 3001,
    socketPort: process.env.PORT || 3001,

    connectDb: () => {
        try {
            mongoose.connect(process.env.DATABASE_URI)
        } catch(err) {
            console.log(err)
        }
    }
};

module.exports = { ...config }
