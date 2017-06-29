import React from 'react';
import ReactDOM from 'react-dom';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import {List, ListItem} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import FontIcon from 'material-ui/FontIcon';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import injectTapEventPlugin from 'react-tap-event-plugin';
import FloatingActionButton from 'material-ui/FloatingActionButton';
const ipc = require('electron').ipcRenderer;
injectTapEventPlugin();

const StartButton = ({height, pIDValue, onTouchTap, onPIDChange, startEnabled, showSettings, timePerTask, timeTotal, closeSettingsEnabled, onTPTChange, onTTChange
, onCloseSettings, onShowSettings}) => (
  <div style={{height: height, display: "flex", flexDirection:"column", alignItems: "center", justifyContent: "center"}}>
  <div style={{position: "absolute", top: 10, left: 10}}><MuiThemeProvider >
    <FloatingActionButton mini={true}>
      <FontIcon className="material-icons" onTouchTap={onShowSettings}>settings</FontIcon>
    </FloatingActionButton>
  </MuiThemeProvider ></div>
    <MuiThemeProvider >
      <TextField floatingLabelText="ParticipantID & Condition" value={pIDValue} onChange={onPIDChange}/>
    </MuiThemeProvider >
    <div style={{height: "40px"}}/>
    <MuiThemeProvider >
      <RaisedButton label="START" style={{height: 50, width: 140}} disabled={!startEnabled} primary={true} onTouchTap={onTouchTap}/>
    </MuiThemeProvider >
    <MuiThemeProvider >
      <Drawer open={showSettings} docked={false}>
        <div style={{alignItems: "center", textAlign: "center"}}>
          <Subheader>Options</Subheader>
          <TextField style={{ marginRight: 20, marginLeft: 20, width: 210 }} floatingLabelText="Time (seconds)" value={timeTotal} onChange={onTTChange}/>
          <TextField style={{ marginRight: 20, marginLeft: 20, width: 210 }} floatingLabelText="Task Time (seconds)" value={timePerTask} onChange={onTPTChange}/>
          <RaisedButton label="SAVE" style={{margin: 20, height: 50, width: 140, textAlign:"center"}} onTouchTap={onCloseSettings} disabled={!closeSettingsEnabled}/>
        </div>
      </Drawer>
    </MuiThemeProvider >
  </div>
)

const Main = ({height, time, question, word_answer, blocked, onStop, onFalse, onCorrect, ttime, ttime_up}) => (
  <div>
    <div style={{height: height, display: "flex", flexDirection:"column", alignItems: "center", justifyContent: "center"}}>
      <span style={{fontSize: 80, textAlign: "center"}}>{question}</span>
      <span style={{fontSize: 60, color: 'green', textAlign: "center"}}>{word_answer}</span>
    </div>
    <div style={{position: "absolute", bottom: "1%"}}>
      <MuiThemeProvider >
        <div style={{marginLeft: 20, height:60}}>
          <span>Task Timer: {time}</span>
          <RaisedButton label="Stop [A]" style={{height: 50, width: 140, marginRight: 20, marginLeft: 90}} onTouchTap={onStop}/>
          <RaisedButton label="False [S]" disabled={blocked} style={{height: 50, width: 140, marginRight: 20, marginLeft: 40}} onTouchTap={onFalse}/>
          <RaisedButton label="Correct [D]" disabled={blocked} style={{height: 50, width: 140, marginRight: 20}} onTouchTap={onCorrect}/>
          <span style={{color: ttime_up ? "red" : "black"}}>Total time left: {ttime}</span>
        </div>
      </MuiThemeProvider >
    </div>
  </div>
)

// var json = require('./../../settings.json'); //(with path)
var json = require('./../../../../../settings.json'); //(with path)

const timePerTask_std = json["task_time"]
const timeTotal_std = json["total_time"]
const stopImediately_std = json["stop_imediately"]

function createReadable(secs){
  if(secs > 0){
    let minutes = Math.floor(secs / 60)
    let seconds = secs - (minutes * 60)
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds
  }else if(secs < 0){
    let minutes = Math.floor(-secs / 60)
    let seconds = (-secs - (minutes * 60)) % 60
    return "-" + minutes + ":" + (seconds < 10 ? "0" : "") + seconds
  }else{
    return "0:00"
  }
}

class MainWindow extends React.Component {
    constructor() {
      super();
      this.state = {}
      this.state.height = window.innerHeight;
      this.state.start = false;
      this.state.question = "";
      this.state.word_answer = "";
      this.state.time = "-";
      this.state.pIDValue = ""
      this.state.startEnabled = false
      this.state.blocked = false

      this.state.timePerTask = timePerTask_std
      this.state.timeTotal = timeTotal_std
      this.state.timeTotal_str = this.state.timeTotal + ""
      this.state.timePerTask_str = this.state.timePerTask + ""

      this.state.showSettings = false
      this.state.closeSettingsEnabled = true

      this.state.startTimeStamp = Date()

      this.state.timeLeftTotal = this.state.timeTotal
      this.state.timeLeftTotal_str = createReadable(this.state.timeLeftTotal)

      this.state.totaltime_up = false

      window.onresize = (event) => {
          this.setState({height: window.innerHeight})
      };

      window.onkeyup = (event) => {
        console.log(event)

        if(event.keyCode === 65 && this.state.start === true) {
          this.stop()
          // A
        // } else if(event.keyCode === 65 && this.state.start === false) {
        //   this.start()
        //   // S
      } else if(event.keyCode === 83 && this.state.start === true && !this.state.blocked) {
          this.next(false, "wrong")
          // D
        } else if(event.keyCode === 68 && this.state.start === true && !this.state.blocked) {
          this.next(true, "right")
        }
      };

      ipc.on('question', (event, message) => {
          this.setState({time: this.state.timePerTask })
          this.setState({question: message[0]})
          this.setState({word_answer: message[1]})
          this.setState({blocked: false})

          clearInterval(this.timer)
          this.timer = setInterval(() => {
            this.setState({time: this.state.time - 1})

            //this.setState({timeLeftTotal_str: createReadable((Date().getTime() - this.state.startTimeStamp.getTime())/1000)})

            ipc.send("progress", {progress: this.state.time * (100/this.state.timePerTask )})
            if(this.state.time === 0) {
              this.next(false, "time over")
              clearInterval(this.timer)
            }
          }, 1000)
      })

      ipc.on('stop', (event, message) => {
        this.stop()
      })

      ipc.on('block', (event, message) => {
        this.setState({blocked: true})
      })
    }

    start() {
      ipc.send("start", this.state.pIDValue)
      this.setState({start: true})
      this.setState({blocked: false})
      this.state.startTimeStamp = Date()

      this.setState({totaltime_up: false})

      this.state.timeLeftTotal = this.state.timeTotal
      this.setState({timeLeftTotal_str : createReadable(this.state.timeLeftTotal)})

      clearInterval(this.total_timer)
      this.total_timer = setInterval(() => {
        this.setState({timeLeftTotal: this.state.timeLeftTotal - 1})
        this.setState({timeLeftTotal_str : createReadable(this.state.timeLeftTotal)})

        if(this.state.timeLeftTotal <= 0) {
          this.setState({totaltime_up: true})
        }
      }, 1000)
    }

    stop() {
      ipc.send("stop")
      this.setState({start: false})
      this.setState({pIDValue: ""})
      this.setState({startEnabled: false})
      clearInterval(this.timer)
      clearInterval(this.total_timer)
      this.setState({totaltime_up: false})
    }

    next(result, reason) {
      clearInterval(this.timer)
      //this.setState({ttime: this.state.ttime - 1})
      ipc.send("next", {result: result, reason: reason, question: this.state.question})
    }

    handlePIDChanged(e){
      let newString = e.target.value
      this.setState({startEnabled: newString.length > 0})
      this.setState({pIDValue: e.target.value});
    }

    handleTPTChanged(e){
      let newString = e.target.value
      this.setState({timePerTask_str: e.target.value});
      let nan1 = isNaN(parseInt(this.state.timeTotal_str))
      let nan2 = isNaN(parseInt(newString))
      let newState = !nan1 && !nan2
      this.setState({closeSettingsEnabled: newState})
    }

    handleTTChanged(e){
      let newString = e.target.value
      this.setState({timeTotal_str: e.target.value});
      let nan1 = isNaN(parseInt(newString))
      let nan2 = isNaN(parseInt(this.state.timePerTask_str))
      let newState = !nan1 && !nan2
      this.setState({closeSettingsEnabled: newState})
    }

    onShowSettings(e){
      this.setState({showSettings: true})
    }

    onCloseSettings(e){
      this.setState({showSettings: false})
      this.state.timePerTask = parseInt(this.state.timePerTask_str)
      this.state.timeTotal = parseInt(this.state.timeTotal_str)
      this.state.timeLeftTotal = this.state.timeTotal
      this.setState({timeLeftTotal_str : createReadable(this.state.timeLeftTotal)})
    }

    render() {
        if(this.state.start) {
          return <Main height={this.state.height}
                    question={this.state.question}
                    word_answer={this.state.word_answer}
                    blocked = {this.state.blocked}
                    onStop={() => this.stop()}
                    onFalse={() => this.next(false, "wrong")}
                    onCorrect={() => this.next(true, "correct")}
                    timerEnabled={this.state.timerEnabled}
                    time={this.state.time}
                    ttime={this.state.timeLeftTotal_str}
                    ttime_up={this.state.totaltime_up}
                    />
        } else {
          return <StartButton height={this.state.height}
                    pIDValue={this.state.pIDValue}
                    onTouchTap={() => this.start()}
                    startEnabled={this.state.startEnabled}
                    onPIDChange={(e) => this.handlePIDChanged(e)}

                    showSettings={this.state.showSettings}
                    timePerTask= {this.state.timePerTask_str}
                    timeTotal = {this.state.timeTotal_str}
                    closeSettingsEnabled = {this.state.closeSettingsEnabled}

                    onTPTChange={(e) => this.handleTPTChanged(e)}
                    onTTChange={(e) => this.handleTTChanged(e)}

                    onCloseSettings={(e) => this.onCloseSettings(e)}
                    onShowSettings={(e) => this.onShowSettings(e)}
                    />
        }
    }
}

window.onload = () => {
  ReactDOM.render( <MainWindow / > ,
      document.getElementById('content')
  );
}
