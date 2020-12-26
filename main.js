
const path = require('path');
const os = require('os');
const { app, BrowserWindow, Menu, ipcMain, shell} = require('electron');

const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const slash = require('slash'); 
//Set ENV
process.env.NODE_ENV = 'development';  

const isDev = process.env.NODE_ENV !== 'production' ? true : false;
const isMac = process.platform === 'darwin' ? true : false;

let mainWindow;

let aboutWindow;
function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: 'IMageShrink',
    width:  isDev ? 800 : 500,
    height: 600,
    icon: `${__dirname}/assets/icons/icons/Icon_256x256.png`,
    resizable: isDev,
    backgroundColor: 'white',
    webPreferences: {
        nodeIntegration: true
    }
  })

 if(isDev) {
     mainWindow.webContents.openDevTools() 
 }
mainWindow.loadFile('./app/index.html')
}

function createAboutWindow() {
    aboutWindow = new BrowserWindow({
      title: 'IMageShrink',
      width: 300,
      height: 300,
      icon: `${__dirname}/assets/icons/icons/Icon_256x256.png`,
      resizable: false,
      backgroundColor: 'white'
    })
  
  //   mainWindow.loadURL(`file://${__dirname}/app/index.html`)
  aboutWindow.loadFile('./app/about.html')
  }

async function shrinkImage({ imgPath, quality, dest}) {
    try {
        const pngQuality  = quality / 100;
        const files = await imagemin([slash(imgPath)], {
            destination: dest,
            plugins: [
                imageminMozjpeg({ quality }),
                imageminPngquant({
                    quality: [pngQuality, pngQuality]
                })
            ]
        })
        console.log(files);
        shell.openPath(dest)
          
        mainWindow.webContents.send('image:done')
    } catch (error) {
        console.log(error);
    }
}

app.on('ready', () => {
    createMainWindow();

      const mainMenu = Menu.buildFromTemplate(menu)
    Menu.setApplicationMenu(mainMenu)


    mainWindow.on('closed', ()=>mainWindow = null)
});

const menu = [
    ...(isMac ? [{ label: app.name, 
    submenu: [
        {
            label: 'About',
            click: createMainWindow
        }
    ]}] : []),
  
        {
            role: 'fileMenu'
        },
    ...(!isMac ? [
        {
            label: 'Help',
            submenu: [{
                label: 'About',
            click: createAboutWindow
            }]

        }
    ]: []),
    ...(isDev ? [
        {
            label: 'Developer',
            submenu: [
                {role: 'reload'},
                {role: 'forcereload'},
                {role: 'separator'},
                {role: 'toggledevtools'}
            ]
        }
    ]: [])
];

ipcMain.on('image:minimize', (e, options) => {
    options.dest = path.join(os.homedir(), 'imageshrink')
    shrinkImage(options);
})

app.on('window-all-closed', () => {
    if(!isMac){
        app.quit()
    }
  })

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
    }
})
app.allowRendererProcessReuse = true;