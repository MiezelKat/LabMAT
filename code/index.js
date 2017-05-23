const {app, BrowserWindow} = require('electron')
const ipc = require('electron').ipcMain;
const path = require('path')
const url = require('url')
const fs = require('fs');
const parse = require('csv-parse/lib/sync');

const currDirName = __dirname
const csvData = fs.readFileSync(path.join(currDirName, '/input.csv'), {encoding: 'utf8'})
const inputData = parse(csvData, {columns: true})
let inputDataIndex = 0
let outputData = [[]]

let win
let presWin

var sinceStarted = new Date()
var sinceTaskStart = new Date()

var pIDValue = ""

function createWindow () {
  win = new BrowserWindow({width: 800, height: 600})

  win.loadURL(url.format({
    pathname: path.join(__dirname, '/src/main_window.html'),
    protocol: 'file:',
    slashes: true
  }))

  //win.webContents.openDevTools()

  win.on('closed', () => {
    win = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})

ipc.on('start', (event, message) => {

  pIDValue = message
  if(presWin === undefined) {
    presWin = new BrowserWindow({width: 800, height: 600});
    presWin.loadURL(url.format({
      pathname: path.join(__dirname, '/src/presentation_window.html'),
      protocol: 'file:',
      slashes: true
    }))

    //presWin.webContents.openDevTools()

    presWin.on('closed', () => {
      presWin = undefined
    })

    presWin.webContents.on('did-finish-load', () => {
      win.webContents.send('question', [inputData[inputDataIndex].question_answer,inputData[inputDataIndex].word_answer]);
      presWin.webContents.send('question', inputData[inputDataIndex].question);
    })
  } else {
    win.webContents.send('question', [inputData[inputDataIndex].question_answer,inputData[inputDataIndex].word_answer]);
    presWin.webContents.send('question', inputData[inputDataIndex].question);
  }
  sinceStarted = new Date()
  sinceTaskStart = new Date()
})

ipc.on('stop', (event, message) => {
  presWin.webContents.send('stop');

  if(outputData.length > 0) {
    let res = "result,time[ms]\n";
    outputData.forEach((d) => {
      res += d + "\n";
    });
// /../../../../
    fs.writeFileSync(path.join(currDirName, `/output/${pIDValue}_${new Date().toISOString()}.csv`), res);
    outputData = [];

    if(inputData.length === inputDataIndex) {
      inputDataIndex = 0;
    }
  }
})

ipc.on('next', (event, message) => {
    inputDataIndex++
    outputData.push([message.reason,Math.abs(sinceTaskStart.getTime() - (new Date()).getTime())])

    if(inputData.length === inputDataIndex) {
      return win.webContents.send('stop');
    }

    if(message.result === true) {
      presWin.webContents.send('result', true);
      win.webContents.send('block');
      setTimeout(() => {
        win.webContents.send('question', [inputData[inputDataIndex].question_answer,inputData[inputDataIndex].word_answer]);
        presWin.webContents.send('question', inputData[inputDataIndex].question);
        sinceTaskStart = new Date()
      }, 1000)
    } else {
      presWin.webContents.send('result', false);
      win.webContents.send('block');
      setTimeout(() => {
        win.webContents.send('question', [inputData[inputDataIndex].question_answer,inputData[inputDataIndex].word_answer]);
        presWin.webContents.send('question', inputData[inputDataIndex].question);
        sinceTaskStart = new Date()
      }, 1000)
    }
})

ipc.on("progress", (event, message) => {
  presWin.webContents.send('progress', message);
})
