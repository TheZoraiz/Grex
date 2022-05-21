const promiseSleep = (sleepMilliseconds) => new Promise((resolve, reject) => {
    setTimeout(() => resolve(), sleepMilliseconds)
})

module.exports = {
    promiseSleep,
}