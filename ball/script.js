// Copyright 2023 The MediaPipe Authors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";
const demosSection = document.getElementById("demos");
let poseLandmarker = undefined;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
const videoWidth = "100vw";
const videoHeight = "100vh";
var p, x, y, i, canvasBall, ctx;
var nose_x_prev, nose_y_prev;
// Before we can use PoseLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
const createPoseLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task`,
            delegate: "GPU"
        },
        runningMode: runningMode,
        numPoses: 2
    });
    demosSection.classList.remove("invisible");
};
createPoseLandmarker();

/********************************************************************
// Demo 2: Continuously grab image from webcam stream and detect it.
********************************************************************/
const video = document.getElementById("webcam");
const canvasElement = canvasBall = document.getElementById("output_canvas");
const [width, height] = await getCameraResolution()
canvasElement.setAttribute("width", width );
    canvasElement.setAttribute("height", height);
    canvasElement.style =
      "left: 0px;" +
      "top: 0px;" +
      "width: " +
      width  +
      "height: " +
      height;
const canvasCtx = ctx = canvasElement.getContext("2d");
const drawingUtils = new DrawingUtils(canvasCtx);
// Check if webcam access is supported.
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;
// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    enableWebcamButton.addEventListener("click", enableCam);
}
else {
    console.warn("getUserMedia() is not supported by your browser");
}
// Enable the live webcam view and start detection.
function enableCam(event) {
    if (!poseLandmarker) {
        console.log("Wait! poseLandmaker not loaded yet.");
        return;
    }
    if (webcamRunning === true) {
        webcamRunning = false;
        enableWebcamButton.innerText = "ENABLE PREDICTIONS";
    }
    else {
        webcamRunning = true;
        enableWebcamButton.innerText = "DISABLE PREDICTIONS";
    }
    // getUsermedia parameters.
    const constraints = {
        video: true
    };
    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
    });
}
let lastVideoTime = -1;
async function predictWebcam() {
    const [videoWidth, videoHeight] = await getCameraResolution()
    canvasElement.style.height = videoHeight;
    video.style.height = videoHeight;
    canvasElement.style.width = videoWidth;
    video.style.width = videoWidth;
    // Now let's start detecting the stream.
    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await poseLandmarker.setOptions({ runningMode: "VIDEO" });
    }
    let startTimeMs = performance.now();
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        poseLandmarker.detectForVideo(video, startTimeMs, (result) => {
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            for (const landmark of result.landmarks) {
                update(landmark[0].x * canvasElement.width , landmark[0].y * canvasElement.height)
                drawingUtils.drawLandmarks(landmark, {
                    color: "#FFA500",
                    fillColor: "#FFA500",
                    lineWidth: 1,
                    radius: 0.5
                });
                drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, {
                    color: "#00FF00",
                    fillColor: "#00FF00",
                    lineWidth: 6,
                    radius: 1
                });
            }
            canvasCtx.restore();
        });
    }
    // Call this function again to keep predicting when the browser is ready.
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}

var ctx,
    centerX, centerY,
    sphere = new Sphere3D(20),
    distance = 300,
    mouse = {
        down: false,
        button: 1,
        x: 0,
        y: 0,
        px: 0,
        py: 0
    },
    modify = 1;

window.requestAnimFrame =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 1000 / 60);
    };

Number.prototype.clamp = function (min, max) {
    return Math.min(Math.max(this, min), max);
};

function Point3D() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
}

function Sphere3D(radius) {
    this.point = new Array();
    this.color = "rgb(100,255,0)"
    this.radius = (typeof (radius) == "undefined") ? 20.0 : radius;
    this.radius = (typeof (radius) != "number") ? 20.0 : radius;

    this.numberOfVertexes = 0;

    for (alpha = 0; alpha <= 6.28; alpha += 0.17) {
        p = this.point[this.numberOfVertexes] = new Point3D();

        p.x = Math.cos(alpha) * this.radius;
        p.y = 0;
        p.z = Math.sin(alpha) * this.radius;
        this.numberOfVertexes++;
    }

    for (var direction = 1; direction >= -1; direction -= 2) {
        for (var beta = 0.19; beta < 1.445; beta += 0.17) {
            var radius = Math.cos(beta) * this.radius;
            var fixedY = Math.sin(beta) * this.radius * direction;

            for (var alpha = 0; alpha < 6.28; alpha += 0.17) {
                p = this.point[this.numberOfVertexes] = new Point3D();

                p.x = Math.cos(alpha) * radius;
                p.y = fixedY;
                p.z = Math.sin(alpha) * radius;

                this.numberOfVertexes++;
            }
        }
    }
}

function rotateX(point, radians) {
    var y = point.y;
    point.y = (y * Math.cos(radians)) + (point.z * Math.sin(radians) * -1.0);
    point.z = (y * Math.sin(radians)) + (point.z * Math.cos(radians));
}

function rotateY(point, radians) {
    var x = point.x;
    point.x = (x * Math.cos(radians)) + (point.z * Math.sin(radians) * -1.0);
    point.z = (x * Math.sin(radians)) + (point.z * Math.cos(radians));
}

function rotateZ(point, radians) {
    var x = point.x;
    point.x = (x * Math.cos(radians)) + (point.y * Math.sin(radians) * -1.0);
    point.y = (x * Math.sin(radians)) + (point.y * Math.cos(radians));
}

function drawPoint(ctx, x, y, size, color) {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, size, 0, 2 * Math.PI, true);
    ctx.fill();
    ctx.restore();
}

function drawPointWithGradient(ctx, x, y, size, gradient) {
    var reflection;

    reflection = size / 4;
    // 0 - 5
    var middle = canvasBall.width / 2;
    var a = mouse.y - middle;

    ctx.save();
    ctx.translate(x, y);
    /*var reflectionX = Math.max(Math.min((mouse.px - (canvas.width / 2)) / (canvas.width / 2) * 5, 4), -4);
    var reflectionY = Math.max(Math.min((mouse.py - (canvas.height / 2)) / (canvas.height / 2) * 5, 4), -4);
    var radgrad = ctx.createRadialGradient(reflectionX, reflectionY, 0.5, 0, 0, size);*/
    var radgrad = ctx.createRadialGradient(-reflection, -reflection, reflection, 0, 0, size);

    var r = 1,
        g = 1,
        b = 200;

    var color = "rgb(" + r + "," + g + "," + b + ")";
    radgrad.addColorStop(0, '#FFFFFF');
    radgrad.addColorStop(gradient, color);
    radgrad.addColorStop(1, 'rgba(1,159,98,0)');

    ctx.fillStyle = radgrad;
    ctx.fillRect(-size, -size, size * 2, size * 2);
    ctx.restore();
}

function projection(xy, z, xyOffset, zOffset, distance) {
    return ((distance * xy) / (z - zOffset)) + xyOffset;
}



function update(nose_x, nose_y) {
    ctx.save();
    ctx.clearRect(0, 0, canvasBall.width, canvasBall.height);

    // nose_x ||= 0
    // nose_y ||= 0
    // if(nose_x_prev == -1){
    //     nose_x_prev = nose_x
    // }
    // if(nose_y_prev == -1){
    //     nose_y_prev = nose_y
    // }
    // const dist = geometric.lineLength([[nose_x, centerX], [nose_y, centerY]])
    // const angle = geometric.lineAngle([[nose_x, centerX], [nose_y, centerY]])
    // console.log(dist, angle)
    // nose_x_prev = nose_x
    // nose_y_prev = nose_y

    // const line = geometric.pointTranslate([centerX, centerY], -angle, dist)
    // centerX = line[0]
    // centerY = line[1]
    // console.log(centerX, centerY)
    console.log(nose_x, nose_y)
    

        
  

    for (i = 0; i < sphere.numberOfVertexes; i++) {

        p.x = sphere.point[i].x;
        p.y = sphere.point[i].y;
        p.z = sphere.point[i].z;

        rotateX(p, Math.sin(+new Date / 360));
        rotateY(p, Math.cos(+new Date / 360));

        //if (mouse.down) 
        modify = Math.min(Math.abs(mouse.px - (canvasBall.width / 2)) / (canvasBall.width / 2) * 1.25, 1.25);
        //}
        //else if(modify > 1) {
        //  modify -= .0001;
        //}
        centerX = nose_x
        centerY = nose_y


        x = projection(p.x, p.z * modify, centerX, 100.0, distance);
        y = projection(p.y, p.z * modify, centerY, 100.0, distance);

        if ((x >= 0) && (x < canvasBall.width)) {
            if ((y >= 0) && (y < canvasBall.height)) {
                if (p.z < 0) {
                    drawPoint(ctx, x, y, 1, "rgba(200,200,200,0.6)");
                } else {
                    drawPointWithGradient(ctx, x, y, 5, 0.8);
                }
            }
        }
    }
    ctx.restore();

}

function start() {

    canvasBall.onmousemove = function (e) {
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        var rect = canvasBall.getBoundingClientRect();
        mouse.x = e.clientX - rect.left,
            mouse.y = e.clientY - rect.top,

            e.preventDefault();
    };

    canvasBall.onmouseup = function (e) {
        mouse.down = false;
        e.preventDefault();
    };

    canvasBall.onmousedown = function (e) {
        mouse.down = true;
        e.preventDefault();
    };

    update();
}

window.onload = function () {

    // canvasBall = document.getElementById('c');
    // centerX = canvasBall.width / 2.0;
    // centerY = canvasBall.height / 2.0;
    // nose_x_prev = -1;
    // nose_y_prev = -1;
    // ctx = canvasBall.getContext('2d');

    // canvas.width = 800;
    // canvas.height = 600;

    start();
};


async function getCameraResolution() {
    // suppose we require a full HD video
    let constraints = { 
                        audio: false, 
                        video: { 
                            width: { ideal: 1920 }, 
                            height: { ideal: 1080 } 
                        }
                    };

    let stream = await navigator.mediaDevices.getUserMedia(constraints);

    let stream_settings = stream.getVideoTracks()[0].getSettings();

    // actual width & height of the camera video
    let stream_width = stream_settings.width;
    let stream_height = stream_settings.height;

    console.log('Width: ' + stream_width + 'px');
    console.log('Height: ' + stream_height + 'px');
    return [stream_width + 'px',stream_height + 'px' ]
}