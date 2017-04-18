import React from 'react';
import ReactDOM from 'react-dom';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import injectTapEventPlugin from 'react-tap-event-plugin';
const ipc = require('electron').ipcRenderer;
injectTapEventPlugin();

const StartButton = ({height, pIDValue, onTouchTap, onPIDChange, startEnabled}) => (
  <div style={{height: height, display: "flex", flexDirection:"column", alignItems: "center", justifyContent: "center"}}>
    <MuiThemeProvider >
      <TextField floatingLabelText="ParticipantID & Condition" value={pIDValue} onChange={onPIDChange}/>
    </MuiThemeProvider >
    <div style={{height: "40px"}}/>
    <MuiThemeProvider >
      <RaisedButton label="START [A]" style={{height: 50, width: 140}} disabled={!startEnabled} onTouchTap={onTouchTap}/>
    </MuiThemeProvider >
  </div>
)

const Main = ({height, time, question, word_answer, onStop, onFalse, onCorrect}) => (
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
          <RaisedButton label="False [S]" style={{height: 50, width: 140, marginRight: 20, marginLeft: 40}} onTouchTap={onFalse}/>
          <RaisedButton label="Correct [D]" style={{height: 50, width: 140, marginRight: 20}} onTouchTap={onCorrect}/>
        </div>
      </MuiThemeProvider >
    </div>
  </div>
)

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

      window.onresize = (event) => {
          this.setState({height: window.innerHeight})
      };

      window.onkeyup = (event) => {
        console.log(event)
        if(event.keyCode === 65 && this.state.start === true) {
          this.stop()
          // A
        } else if(event.keyCode === 65 && this.state.start === false) {
          this.start()
          // S
        } else if(event.keyCode === 83 && this.state.start === true) {
          this.next(false)
          // D
        } else if(event.keyCode === 68 && this.state.start === true) {
          this.next(true)
        }
      };

      ipc.on('question', (event, message) => {
          this.setState({time: 10})
          this.setState({question: message[0]})
          this.setState({word_answer: message[1]})

          clearInterval(this.timer)
          this.timer = setInterval(() => {
            this.setState({time: this.state.time - 1})
            ipc.send("progress", {progress: this.state.time})
            if(this.state.time === 0) {
              this.next(false, "time over")
              clearInterval(this.timer)
            }
          }, 1000)
      })

      ipc.on('stop', (event, message) => {
        this.stop()
      })
    }

    start() {
      ipc.send("start", this.state.pIDValue)
      this.setState({start: true})
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
      ipc.send("next", {result: result, reason: reason})
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
