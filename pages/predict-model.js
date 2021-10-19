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

let NUM_OF_EPOCHS = 50;

let movements = '';
let count = 0;

export default function CreateModel() {
  const [poseNetLoading, setPoseNetLoading] = useState(true);

  const onPoseNetReady = () => {
    console.log('POSENET is ready to use');
    setPoseNetLoading(false);
  }

  const onPose = (poses) => {
    if (poses.length > 0) {
      poseInfo = (poses[0].pose)
      skeleton = (poses[0].skeleton)
    }
  }

  const onTrainningButtonClick = (label) => {
    if (label === "LOAD_DATA") {
      model.loadData('/squat_data.json')
      alert('Data loaded')
      return;
    }
    else if (label === "TRAIN") {
      model.normalizeData();
      model.train({epochs: NUM_OF_EPOCHS}, ()=>{})
      return;
    }
    else if (label === "DOWN_MODEL") {
      model.save();
      return
    }
    else if (label === "LOAD_MODEL") {
      const modelInfo = {
        model: '/model.json',
        metadata: '/model_meta.json',
        weights: '/model.weights.bin',
      }
      model.load(modelInfo, onClassify)
      return;
    }
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

  const onClassify = () => {
    document.querySelector('#state').innerHTML = 'Expected next movement: UP'
    alert('MODEL LOADED')
    classifyPose();
  }

  const classifyPose = () => {
    if (poseInfo) { 
      let inputs = [];
      for (let i=0; i< poseInfo.keypoints.length; i++) {
        const x = poseInfo.keypoints[i].position.x;
        const y = poseInfo.keypoints[i].position.y;
        inputs.push(x);
        inputs.push(y);
      }
      model.classify(inputs, gotResult);
    } else {
      setTimeout(classifyPose, 100);
    }
  }
  const gotResult = (error, results) => {
    if (movements === '' && results[0].label === 'UP') {
      movements = 'UP';
      document.querySelector('#state').innerHTML = 'Expected next movement: MIDDLE'
    }
    if (movements === 'UP' && results[0].label === 'MIDDLE') {
      movements = 'MIDDLE';
      document.querySelector('#state').innerHTML = 'Expected next movement: DOWN'
    }
    if (movements === 'MIDDLE' && results[0].label === 'DOWN') {
      movements = ''; count++
      document.querySelector('#state').innerHTML = 'Expected next movement: UP'
    }
    // if (movements === '' && results[0].label === 'DOWN') {setMovements(''); setCount(count+1);}

    document.querySelector('#count').innerHTML = `Count: ${count}`
    classifyPose();
  }

  return (
    <div className="main-container">
      <Sketch setup={setup} draw={draw}/>
      {poseNetLoading ? <div>Loading...</div>:<div style={{display:'flex', gap: '30px', flexDirection:'column', width: '40%', paddingLeft: '10px'}}>
        <div style={{display:'flex', justifyContent:'space-between'}}>
          <button onClick={() => onTrainningButtonClick("LOAD_MODEL")}>LOAD_MODEL</button>
          <button onClick={() => onTrainningButtonClick("LOAD_DATA")}>LOAD_DATA</button>
          <button onClick={() => onTrainningButtonClick("TRAIN")}>TRAIN</button>
          <button onClick={() => onTrainningButtonClick("DOWN_MODEL")}>DOWN_MODEL</button>
        </div>
        <h1 id="state">Load model first</h1>
        <h1 id="count">{count}</h1>
      </div>}
    </div>
  )
}
