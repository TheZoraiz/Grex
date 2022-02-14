const { app, BrowserWindow, Tray, nativeImage } = require("electron")
const path = require('path')

let window

const createWindow = () => {
    // Create the browser window.
    window = new BrowserWindow({
        width: 900,
        height: 650,
        minWidth: 800,
        minHeight: 600,
        show: false,
        // frame: false,
        webPreferences: {
            devTools: !app.isPackaged,
            // preload: path.join(__dirname, "preload.js")
        }
    })

    window.on("closed", () => window = null)

    // and load the index.html of the app.
    window.loadURL("http://localhost:3000")

    window.once("ready-to-show", () => {
        window.show()
    })

    // Open the DevTools.
    // window.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow()

    app.on("activate", function () {
        // MacOS specific
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// MacOS specific
app.on("window-all-closed", function () {
    if (process.platform !== "darwin") app.quit()
})
