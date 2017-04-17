import React from 'react';
import ReactDOM from 'react-dom';
import RaisedButton from 'material-ui/RaisedButton';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import injectTapEventPlugin from 'react-tap-event-plugin';
const ipc = require('electron').ipcRenderer;
injectTapEventPlugin();

const StartButton = ({height, onTouchTap}) => (
    <div style={{height: height, display: "flex", alignItems: "center", justifyContent: "center"}}>
      <MuiThemeProvider >
        <RaisedButton label="START" style={{height: 50, width: 140}} onTouchTap={onTouchTap}/>
      </MuiThemeProvider >
    </div>
)

const Main = ({height, time, question, onStop, onFalse, onCorrect}) => (
  <div>
    <div style={{height: height, display: "flex", alignItems: "center", justifyContent: "center"}}>
      <span style={{fontSize: 80}}>{question}</span>
    </div>
    <div style={{position: "absolute", bottom: "1%"}}>
      <MuiThemeProvider >
        <div style={{marginLeft: 20, height:60}}>
          <span>{time}</span>
          <RaisedButton label="Stop" style={{height: 50, width: 140, marginRight: 20, marginLeft: 90}} onTouchTap={onStop}/>
          <RaisedButton label="False" style={{height: 50, width: 140, marginRight: 20, marginLeft: 40}} onTouchTap={onFalse}/>
          <RaisedButton label="Correct" style={{height: 50, width: 140, marginRight: 20}} onTouchTap={onCorrect}/>
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
      this.state.time = "-";

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
          this.setState({question: message})

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
      ipc.send("start")
      this.setState({start: true})
    }

    stop() {
      ipc.send("stop")
      this.setState({start: false})
      clearInterval(this.timer)
    }

    next(result, reason) {
      clearInterval(this.timer)
      ipc.send("next", {result: result, reason: reason})
    }

    render() {
        if(this.state.start) {
          return <Main height={this.state.height} question={this.state.question}
                    onStop={() => this.stop()}
                    onFalse={() => this.next(false, "wrong")}
                    onCorrect={() => this.next(true, "correct")}
                    timerEnabled={this.state.timerEnabled}
                    time={this.state.time}/>
        } else {
          return <StartButton height={this.state.height} onTouchTap={() => this.start()}/>
        }
    }
}

window.onload = () => {
  ReactDOM.render( <MainWindow / > ,
      document.getElementById('content')
  );
}
