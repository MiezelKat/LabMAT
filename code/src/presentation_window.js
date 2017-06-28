import React from 'react';
import ReactDOM from 'react-dom';
import RaisedButton from 'material-ui/RaisedButton';
import LinearProgress from 'material-ui/LinearProgress';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import injectTapEventPlugin from 'react-tap-event-plugin';
import Sound from 'react-sound'

const ipc = require('electron').ipcRenderer;
injectTapEventPlugin();

const Progress = ({completed, visible}) => {
  if(visible === true) {
    return (
      <div style={{position: "absolute", bottom: "5%", width: "98%"}}>
        <MuiThemeProvider>
          <LinearProgress mode="determinate" color="red" value={completed} />
        </MuiThemeProvider >
      </div>
    )
  } else {
    return <div></div>
  }
};

const Main = ({height, backgroundColor, question, completed, visible, buzzOn, buzzOnFinished}) => (
  <div style={{backgroundColor: backgroundColor}}>
    <div style={{height: height, display: "flex", alignItems: "center", justifyContent: "center"}}>
      <span style={{fontSize: 80}}>{question}</span>
    </div>
    <Sound
          url="sounds/buzzer_x.wav"
          playStatus={buzzOn ? Sound.status.PLAYING : Sound.status.STOPPED}
          onFinishedPlaying={buzzOnFinished}
          />
    <Progress completed={completed} visible={visible}/>
  </div>
)

class PresentationWindow extends React.Component {
    constructor() {
      super();
      this.state = {}
      this.state.height = window.innerHeight;
      this.state.question = "";
      this.state.visible = false;
      this.state.background = "white";
      this.state.completed = 100;
      this.state.buzzOn = false;

      this.state.terminated = false;

      window.onresize = (event) => {
          this.setState({height: window.innerHeight})
      };

      ipc.on('question', (event, message) => {
        if(!this.state.terminated){
          this.setState({completed: 100});
          this.setState({question: message})
          this.setState({background: "white"})
          this.setState({visible: true});
        }
      })

      ipc.on('start', (event, message) => {
        this.state.terminated = false
      })

      ipc.on('stop', (event, message) => {
          this.setState({question: ""})
          this.setState({background: "white"})
          this.setState({visible: false});
          this.state.terminated = true;
      })

      ipc.on('result', (event, message) => {

          if(message.result === true) {
            this.setState({background: "green"})
            this.setState({visible: false});
          } else {
            this.setState({background: "red"})
            this.setState({visible: false});
            this.setState({buzzOn: true});
          }

          this.setState({question: message.reason})
      })

      ipc.on('progress', (event, message) => {
          this.setState({completed: message.progress})
      })

    }

    render() {
        return <Main height={this.state.height}
                     question={this.state.question}
                     backgroundColor={this.state.background}
                     completed={this.state.completed}
                     visible={this.state.visible}
                     buzzOn={this.state.buzzOn}
                     buzzOnFinished={() => this.setState({buzzOn: false})}/>
    }
}

window.onload = () => {
  ReactDOM.render( <PresentationWindow / > ,
      document.getElementById('content')
  );
}
