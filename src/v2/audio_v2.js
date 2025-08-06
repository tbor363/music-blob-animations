import { animateStep } from "./blob-components_v2.js";

let isAnalyzing = false;
let beats = 0;


function setupAudio(blobInfo, buffers, gl, programInfo) {
  // get the audio element 
  const audioElement = document.querySelector('audio');

  const audioCtx = new AudioContext();
  // pass it into the audio context
  const track = audioCtx.createMediaElementSource(audioElement);
  // const filter = audioCtx.createBiquadFilter();
  // filter.type = 'lowpass'; 
  const analyser = audioCtx.createAnalyser();

  track.connect(analyser);
  // track.connect(filter);
  // filter.connect(audioCtx.destination);
  analyser.connect(audioCtx.destination);
  analyser.fftSize = 2048; // set the FFT size for frequency analysis
  const bufferLength = analyser.frequencyBinCount; // number of frequency bins
  const dataArray = new Uint8Array(bufferLength);

  analyser.getByteTimeDomainData(dataArray);

  const playButton = document.getElementById('play-pause-button');

  playButton.addEventListener('click', () => {
    // check if context is in suspended state (autoplay policy)
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    // play or pause track depending on state 
    if (playButton.dataset.playing === "false") {
      audioCtx.resume().then(() => {
        audioElement.play();
      });
      isAnalyzing = true;
      detectBeats(analyser, dataArray, blobInfo, buffers, gl, programInfo);
      playButton.dataset.playing = 'true';
    } else if (playButton.dataset.playing === "true") {
      isAnalyzing = false;
      audioElement.pause();
      playButton.dataset.playing = "false";
    }

    },
    false,
  );


  audioElement.addEventListener('ended', () => {
    playButton.dataset.playing = false;
    console.log("Audio ended");
    console.log("Total beats detected:", beats);
    console.log("bpm:", (beats / (audioElement.duration / 60)).toFixed(2));
  },
  false,
  );

}

function detectBeats(analyser, dataArray, blobInfo, buffers, gl, programInfo) {
  const threshold = 5; 
  let lastBeatTime = 0; 
  const minInterval = 200;
  let pushFrames = 10; 
  let node = Math.floor(Math.random() * blobInfo.nodes.length);
  let beatDetected = false;

  function analyze() {
    analyser.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      let val = Math.abs((dataArray[i] - 128)); 
      sum += val; 
    }
    const now = performance.now();
    let rms = sum / dataArray.length; // root mean square 

    if (rms > threshold && now - lastBeatTime > minInterval) {
      // console.log("beat detected");
      // beatFunc(blobInfo, buffers, gl, programInfo);
      lastBeatTime = now;
      beats++;
      beatDetected = true;
    } else if (pushFrames < 1) {
      beatDetected = false;
    }

    if (beatDetected && pushFrames > 0) {
        pushFrames--;
        const forceMag = Math.sqrt(rms) * 6;
        animateStep(blobInfo, buffers, gl, programInfo, node, forceMag);
      } else {
        // console.log("Pushing frame");
        pushFrames = 10; // Reset push frames
        node = Math.floor(Math.random() * blobInfo.nodes.length);
      }
    

    if (isAnalyzing) requestAnimationFrame(analyze);
  }

  analyze();
}

export { setupAudio, detectBeats };
