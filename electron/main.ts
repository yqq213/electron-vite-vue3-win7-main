import { app, BrowserWindow, session, ipcMain, globalShortcut } from 'electron'
import Store from 'electron-store'
import path from 'node:path'
import { checkUpdate } from './update'
import Logger from 'electron-log'
// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public')

const store = new Store()
Store.initRenderer() // 如果未在主进程创建实例，要在渲染层中使用时，需要进行初始化
let win: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  session.defaultSession.loadExtension(
    path.resolve(__dirname, '../plugins/vuetools6.5.1')
  )
  win = new BrowserWindow({
    width: 1300,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC as string, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true
      // nodeIntegration:true,
      // contextIsolation:false
    },
    autoHideMenuBar: true // 添加这一行来自动隐藏菜单栏
  })

  try {
    checkUpdate(win)
  } catch (error) {
    Logger.error(error)
  }
  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
    //版本更新
  })

  win.webContents.openDevTools()

  if (VITE_DEV_SERVER_URL) {
    // win.loadURL(VITE_DEV_SERVER_URL)
    // win.webContents.openDevTools()
    win.loadFile('lixin/index.html')
  } else {
    win.loadFile('lixin/index.html')
    // win.loadFile(path.join(process.env.DIST as string, 'index.html'))
  }
  // 打开配置页面
  globalShortcut.register('CommandOrControl+Shift+F', () => {
    win?.webContents.send('openConfig')
  })
  //在编辑器中打开系统配置
  globalShortcut.register('CommandOrControl+Shift+Alt+L', () => {
    store.openInEditor()
  })
}

// 只允许单体实例
function singleInstance() {
  const gotTheLock = app.requestSingleInstanceLock()
  if (!gotTheLock) {
    app.quit()
  } else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      // 用户正在尝试运行第二个实例，我们需要让焦点指向我们的窗口
      if (win) {
        win.show()
        if (win.isMinimized()) win.restore()
        win.focus()
      }
    })
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  singleInstance()
  createWindow()
})

/**
 * ipc通信
 */
/**打开控制台 */
ipcMain.on('openDevtools', (event: Electron.IpcMainEvent) => {
  event.sender.openDevTools()
})

/**获取electron-store的配置文件 */
ipcMain.handle(
  'getStore',
  (_event: Electron.IpcMainInvokeEvent, arg: string) => {
    return store.get(arg)
  }
)

/**设置electron-store的配置文件 */
ipcMain.on(
  'setStore',
  (_event: Electron.IpcMainInvokeEvent, ...args: any[]) => {
    ;(store.set as (...args: any[]) => void)(...args)
  }
)
