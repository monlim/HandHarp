//Get HTML elements
const videoElement = document.getElementsByClassName("input_video")[0];
const canvasElement = document.getElementsByClassName("output_canvas")[0];
const canvasCtx = canvasElement.getContext("2d");
const sound = document.getElementById("sound");
canvasElement.width = window.innerWidth;
canvasElement.height = window.innerHeight;

let leftIndex, rightIndex;

//Reset audio context
document.documentElement.addEventListener("mousedown", () => {
  if (Tone.context.state !== "running") Tone.context.resume();
});

//Tone.js nodes
//basic osc
const basic = new Tone.PolySynth().toDestination();
let synth = basic;

//casio sound
const casio = new Tone.Sampler({
  urls: {
    A2: "A1.mp3",
    A3: "A2.mp3",
  },
  baseUrl: "https://tonejs.github.io/audio/casio/",
}).toDestination();

const piano = new Tone.Sampler({
  urls: {
    C4: "C4.mp3",
    "D#4": "Ds4.mp3",
    "F#4": "Fs4.mp3",
    A4: "A4.mp3",
  },
  baseUrl: "https://tonejs.github.io/audio/salamander/",
}).toDestination();

//plucked violin sound
const plucked_violin = new Tone.Sampler({
  urls: {
    C4: "Plucked_Violin.mp3",
    C5: "Plucked_Violin_High.mp3",
  },
  baseUrl: "https://monlim.github.io/Handmate-DoReMi/audio/plucked_violin/",
}).toDestination();

//listen for changes to sound
sound.addEventListener("change", function () {
  if (sound.value === "basic") {
    synth = basic;
  }
  if (sound.value === "casio") {
    synth = casio;
  }
  if (sound.value === "piano") {
    synth = piano;
  }
  if (sound.value === "violin") {
    synth = plucked_violin;
  }
});

let major = [null, "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", null];
let minor = [null, "C4", "D4", "D#4", "F4", "G4", "G#4", "B4", "C5", null];
let currentScale = major;
let scaleArray = [null, "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", null];

tonic.addEventListener("change", function () {
  scaleArray = currentScale
    .map((pc) => Tonal.transpose(pc, tonic.value))
    .map((pc) => Tonal.transpose(pc, octave.value));
  //console.log(scaleArray);
});

mode.addEventListener("change", function () {
  if (mode.value === "major") {
    currentScale = major;
    scaleArray = currentScale
      .map((pc) => Tonal.transpose(pc, tonic.value))
      .map((pc) => Tonal.transpose(pc, octave.value));
  }
  if (mode.value === "minor") {
    currentScale = minor;
    scaleArray = currentScale.map((pc) => Tonal.transpose(pc, tonic.value));
  }
  //console.log(scaleArray);
});

octave.addEventListener("change", function () {
  scaleArray = currentScale
    .map((pc) => Tonal.transpose(pc, tonic.value))
    .map((pc) => Tonal.transpose(pc, octave.value));
  //console.log(scaleArray);
});

//Trigger note if hand moves
let leftNoteTrigger = false;
let rightNoteTrigger = false;
let noteDeactivate = 0.22;
let noteActivate = 2.5;

function triggerLeftNote(finger) {
  let noteIndex = Math.floor(finger.x * 10);
  let note = scaleArray[noteIndex];
  if (accelLeft && note && accelLeft >= noteActivate) {
    if (leftNoteTrigger) return;
    leftNoteTrigger = true;
    synth.triggerAttackRelease([note], 0.5);
  }
  if (accelLeft && accelLeft < noteDeactivate) {
    leftNoteTrigger = false;
  }
}

function triggerRightNote(finger) {
  let noteIndex = Math.floor(finger.x * 10);
  let note = scaleArray[noteIndex];
  if (accelRight && note && accelRight >= noteActivate) {
    if (rightNoteTrigger) return;
    rightNoteTrigger = true;
    synth.triggerAttackRelease([note], 0.5);
  }
  if (accelRight && accelRight < noteDeactivate) {
    rightNoteTrigger = false;
  }
}

//function to calculate velocity
let xNowLeft = 0.4,
  yNowLeft = 0,
  stillLeft = 0,
  stillRight = 0,
  velNowLeft = 0,
  velNowRight = 0,
  accelLeft = 0,
  accelRight = 0; // default values to start off distance calculation;

function leftVelocityCounter(leftIndexX, leftIndexY) {
  xVelocityLeft = (leftIndexX - xNowLeft) / 0.1;
  yVelocityLeft = (leftIndexY - yNowLeft) / 0.1;
  stillLeft =
    Math.sqrt((leftIndexX - xNowLeft) ** 2 + (leftIndexY - yNowLeft) ** 2) /
    0.1;
  accelLeft = Math.abs(stillLeft - velNowLeft) / 0.1;
  xNowLeft = leftIndexX;
  yNowLeft = leftIndexY;
  velNowLeft = stillLeft;
}

let xNowRight = 0.6,
  yNowRight = 0; // default values to start off distance calculation;
function rightVelocityCounter(rightIndexX, rightIndexY) {
  xVelocityRight = (rightIndexX - xNowRight) / 0.1;
  yVelocityRight = (rightIndexY - yNowRight) / 0.1;
  stillRight =
    Math.sqrt((rightIndexX - xNowRight) ** 2 + (rightIndexY - yNowRight) ** 2) /
    0.1;
  accelRight = Math.abs(stillRight - velNowRight) / 0.1;
  xNowRight = rightIndexX;
  yNowRight = rightIndexY;
  velNowRight = stillRight;
}

//function draw(leftIndexX, leftIndexY) {
//canvasCtx.fillStyle = "rgb(150,29,28)";
//canvasCtx.arc(leftIndexX, leftIndexY, 1, 0, Math.PI * 2, false);
//canvasCtx.fill();
//}

function onResults(results) {
  //Draw Hand landmarks on screen
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );
  if (results.multiHandLandmarks && results.multiHandedness) {
    for (let index = 0; index < results.multiHandLandmarks.length; index++) {
      const classification = results.multiHandedness[index];
      const isRightHand = classification.label === "Right";
      const landmarks = results.multiHandLandmarks[index];
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: isRightHand ? "#fff" : "#056df5",
      }),
        drawLandmarks(canvasCtx, landmarks, {
          color: isRightHand ? "#fff" : "#056df5",
          fillColor: isRightHand ? "#056df5" : "#fff",
          radius: (x) => {
            return lerp(x.from.z, -0.15, 0.1, 10, 1);
          },
        });
      if (isRightHand === false) {
        leftIndex = landmarks[12];
        setInterval(leftVelocityCounter(leftIndex.x, leftIndex.y), 100);
        //draw(leftIndex.x, leftIndex.y);
      } else {
        rightIndex = landmarks[12];
        setInterval(rightVelocityCounter(rightIndex.x, rightIndex.y), 100);
        //draw(rightIndex.x, rightIndex.y);
      }
      canvasCtx.restore();
      if (leftIndex) {
        triggerLeftNote(leftIndex);
      }
      if (rightIndex) {
        triggerRightNote(rightIndex);
      }
    }
  }
}

const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  },
});

hands.setOptions({
  selfieMode: true,
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: "100%",
  height: "100%",
});
camera.start();
