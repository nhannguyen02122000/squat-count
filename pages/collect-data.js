import Head from 'next/head'
import Script from 'next/script'
import styles from '../styles/Home.module.css'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const Sketch = dynamic(import('react-p5'),{
  ssr: false,
  loading: () => <div>Loading ...</div>
})

let poseNet;
let video;
let model;
let poseInfo;
let skeleton;
let state;
let targetLabel

let TIME_TO_WAIT = 5000;
let TIME_TO_COLLECT = 20000;
export default function CollectData() {
  const [poseNetLoading, setPoseNetLoading] = useState(true);

  const onPoseNetReady = () => {
    console.log('POSENET is ready to use');
    setPoseNetLoading(false);
  }

  const onPose = (poses) => {
    if (poses.length > 0) {
      poseInfo = (poses[0].pose)
      skeleton = (poses[0].skeleton)
  
      //Flatten pose co-ordinate when (has pose) + (state == collecting)
      if (state === 'collecting' && targetLabel) {
        let inputs = [];
        for (let i=0; i< poseInfo.keypoints.length; i++) {
          const x = poseInfo.keypoints[i].position.x;
          const y = poseInfo.keypoints[i].position.y;
          inputs.push(x);
          inputs.push(y);
        }
  
        let target = [targetLabel];
        model.addData(inputs, target);
      }
    }
  }

  const onTrainningButtonClick = (label) => {
    if (label === "SAVE") {
      model.saveData('squat_data');
      return;
    }
    document.querySelector('#state').innerHTML = "State : Waiting - get ready to pose for 5 seconds"
    targetLabel = (label)
    document.querySelector('#label').innerHTML = "Label: " + label
    setTimeout(function() {
      state = ('collecting')
      document.querySelector('#state').innerHTML = "State : Collecting"
      setTimeout(function() {
        state = ('waiting');
        targetLabel = (null);
        document.querySelector('#state').innerHTML = "State : Waiting"
        document.querySelector('#label').innerHTML = "Label: "
      }, TIME_TO_COLLECT)
    }, TIME_TO_WAIT);
  }

  const setup = (p5, parent) => {
    p5.createCanvas(900, 600).parent(parent);
    let constraints = {
      video: {
        mandatory: {
          minWidth: 1280,
          minHeight: 720
        },
        optional: [{ maxFrameRate: 30 }]
      },
      audio: false
    };
    video = p5.createCapture(constraints);
    video.hide();

    // For detecting pose
    poseNet = ml5.poseNet(video, onPoseNetReady);
    poseNet.on('pose', onPose);

    // For training model
    model = ml5.neuralNetwork({
      inputs: 34, //2 toạ độ x,y cho 17 điểm
      output: 3, // Up, middle, down
      task: 'classification',
      debug: true
    });
  }

  const draw = (p5) => {
    p5.translate(video.width, 0);
    p5.scale(-1, 1);
    p5.image(video, 0, 0, video.width, video.height);

    if (poseInfo) { 
      //Draw 17 points of skeleton
      for (let i=0; i< poseInfo.keypoints.length; i++) {
        const x = poseInfo.keypoints[i].position.x;
        const y = poseInfo.keypoints[i].position.y;
        p5.fill(0,255,0);
        p5.ellipse(x,y,16,16);
      }
  
      //Draw line between skeleton
      for (let i=0; i<skeleton.length; i++) {
        const point_a = skeleton[i][0];
        const point_b = skeleton[i][1];
        p5.strokeWeight(2);
        p5.stroke(255);
        p5.line(point_a.position.x, point_a.position.y, point_b.position.x, point_b.position.y);
      }
    }
  }


  return (
    <div className="main-container">
      <Sketch setup={setup} draw={draw}/>
      {poseNetLoading ? <div>Loading...</div>:<div style={{display:'flex', gap: '30px', flexDirection:'column', width: '40%', paddingLeft: '10px'}}>
        <div style={{display:'flex', justifyContent:'space-between'}}>
          <button onClick={() => onTrainningButtonClick("UP")}>UP</button>
          <button onClick={() => onTrainningButtonClick("DOWN")}>DOWN</button>
          <button onClick={() => onTrainningButtonClick("MIDDLE")}>MIDDLE</button>
          <button onClick={() => onTrainningButtonClick("SAVE")}>SAVE DATA</button>
        </div>
        <h1 id="state">State: Waiting</h1>
        <h2 id="label">Label: </h2>
      </div>}
    </div>
  )
}
