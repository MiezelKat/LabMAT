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

const StartButton = ({height, pIDValue, onTouchTap, onPIDChange, startEnabled}) => (
  <div style={{height: height, display: "flex", flexDirection:"column", alignItems: "center", justifyContent: "center"}}>
  <div style={{position: "absolute", top: 10, left: 10}}><MuiThemeProvider >
    <FloatingActionButton mini={true}>
      <FontIcon className="material-icons" >settings</FontIcon>
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
      <Drawer open={false} docked={false}>
        <div style={{alignItems: "center", textAlign: "center"}}>
          <Subheader>Options</Subheader>
          <TextField style={{ marginRight: 20, marginLeft: 20, width: 210 }} floatingLabelText="Time (seconds)" value={pIDValue} onChange={onPIDChange}/>
          <TextField style={{ marginRight: 20, marginLeft: 20, width: 210 }} floatingLabelText="Task Time (seconds)" value={pIDValue} onChange={onPIDChange}/>
          <RaisedButton label="SAVE" style={{margin: 20, height: 50, width: 140, textAlign:"center"}} onTouchTap={onTouchTap}/>
          <FloatingActionButton >
            <FontIcon className="material-icons" >settings</FontIcon>
          </FloatingActionButton>
        </div>
      </Drawer>
    </MuiThemeProvider >
  </div>
)

const Main = ({height, time, question, word_answer, blocked, onStop, onFalse, onCorrect, ttime}) => (
  <div>
    <div style={{height: height, display: "flex", flexDirection:"column", alignItems: "center", justifyContent: "center"}}>
      <span style={{fontSize: 80, textAlign: "center"}}>{question}</span>
      <span style={{fontSize: 80, color: 'red', textAlign: "center"}}>{word_answer}</span>
    </div>
    <div style={{position: "absolute", bottom: "1%"}}>
      <MuiThemeProvider >
        <div style={{marginLeft: 20, height:60}}>
          <span>{time}</span>
          <RaisedButton label="Stop [A]" style={{height: 50, width: 140, marginRight: 20, marginLeft: 90}} onTouchTap={onStop}/>
          <RaisedButton label="False [S]" disabled={blocked} style={{height: 50, width: 140, marginRight: 20, marginLeft: 40}} onTouchTap={onFalse}/>
          <RaisedButton label="Correct [D]" disabled={blocked} style={{height: 50, width: 140, marginRight: 20}} onTouchTap={onCorrect}/>
        </div>
      </MuiThemeProvider >
    </div>
  </div>
)

const timePerTask = 5

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
          this.setState({time: timePerTask})
          this.setState({question: message[0]})
          this.setState({word_answer: message[1]})
          this.setState({blocked: false})

          clearInterval(this.timer)
          this.timer = setInterval(() => {
            this.setState({time: this.state.time - 1})

            ipc.send("progress", {progress: this.state.time * (100/timePerTask)})
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
    }

    stop() {
      ipc.send("stop")
      this.setState({start: false})
      this.setState({pIDValue: ""})
      this.setState({startEnabled: false})
      clearInterval(this.timer)
    }

    next(result, reason) {
      clearInterval(this.timer)
      this.setState({ttime: this.state.ttime - 1})
      ipc.send("next", {result: result, reason: reason, question: this.state.question})
    }

    handlePIDChanged(e){
      let newString = e.target.value
      this.setState({startEnabled: newString.length > 0})
      this.setState({pIDValue: e.target.value});
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
                    time={this.state.time}/>
        } else {
          return <StartButton height={this.state.height}
                    pIDValue={this.state.pIDValue}
                    onTouchTap={() => this.start()}
                    startEnabled={this.state.startEnabled}
                    onPIDChange={(e) => this.handlePIDChanged(e)}/>
        }
    }
}

window.onload = () => {
  ReactDOM.render( <MainWindow / > ,
      document.getElementById('content')
  );
}
