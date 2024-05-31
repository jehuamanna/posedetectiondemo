import DeviceDetector from "https://cdn.skypack.dev/device-detector-js@2.2.10";
import { checkActions } from "./emoji-detector.js"
// Usage: testSupport({client?: string, os?: string}[])
// Client and os are regular expressions.
// See: https://cdn.jsdelivr.net/npm/device-detector-js@2.2.10/README.md for
// legal values for client and os
testSupport([
    { client: 'Chrome' },
]);
const emojies = {
    'upward_palm': '\u{1F91A}',
    'thumbs_up': '\u{1F44D}',
    'victory': '\u{270C}',
    'left_pointing': '\u{1F448}',
    'right_pointing': '\u{1F449}',
    'upward_pointing': '\u{1F446}',
    'downward_pointing': '\u{1F447}',
    'left_palm': '\u{1FAF2}',
    'right_palm': '\u{1FAF1}'
}


function getShuffledDictionary() {
    const items = Object.entries(emojies);
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }
    return Object.fromEntries(items)
}

let seqDict = getShuffledDictionary();
let emoji_ = Object.values(seqDict)[0];
let string_ = Object.keys(seqDict)[0]

function testSupport(supportedDevices) {
    const deviceDetector = new DeviceDetector();
    const detectedDevice = deviceDetector.parse(navigator.userAgent);
    let isSupported = false;
    for (const device of supportedDevices) {
        if (device.client !== undefined) {
            const re = new RegExp(`^${device.client}$`);
            if (!re.test(detectedDevice.client.name)) {
                continue;
            }
        }
        if (device.os !== undefined) {
            const re = new RegExp(`^${device.os}$`);
            if (!re.test(detectedDevice.os.name)) {
                continue;
            }
        }
        isSupported = true;
        break;
    }
    if (!isSupported) {
        alert(`This demo, running on ${detectedDevice.client.name}/${detectedDevice.os.name}, ` +
            `is not well supported at this time, continue at your own risk.`);
    }
}
const controls = window;
const mpHolistic = window;
const drawingUtils = window;
const config = {
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1675471629/${file}`;
    }
};
// Our input frames will come from here.
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const controlsElement = document.getElementsByClassName('control-panel')[0];
const canvasCtx = canvasElement.getContext('2d');
// We'll add this to our control panel later, but we'll save it here so we can
// call tick() each time the graph runs.
const fpsControl = new controls.FPS();
// Optimization: Turn off animated spinner after its hiding animation is done.
const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
    spinner.style.display = 'none';
};
function removeElements(landmarks, elements) {
    for (const element of elements) {
        delete landmarks[element];
    }
}
function removeLandmarks(results) {
    if (results.poseLandmarks) {
        removeElements(results.poseLandmarks, [1, 2, 3, 4, 5, 6, 7, 8, 15, 16, 17, 18, 19, 20, 21, 22]);
        // removeElements(results.poseLandmarks, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 20, 21, 22]);
    }
}
function connect(ctx, connectors) {
    const canvas = ctx.canvas;
    for (const connector of connectors) {
        const from = connector[0];
        const to = connector[1];
        if (from && to) {
            if (from.visibility && to.visibility &&
                (from.visibility < 0.1 || to.visibility < 0.1)) {
                continue;
            }
            ctx.beginPath();
            ctx.moveTo(from.x * canvas.width, from.y * canvas.height);
            ctx.lineTo(to.x * canvas.width, to.y * canvas.height);
            ctx.stroke();
        }
    }
}
let activeEffect = 'mask';
let fillStyle = 'white'

function onResults(results) {
    // Hide the spinner.
    document.body.classList.add('loaded');

    seqDict = getShuffledDictionary();

    // Remove landmarks we don't want to draw.
    removeLandmarks(results);
    // Update the frame rate.
    fpsControl.tick();
    // Draw the overlays.
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    // requestAnimationFrame(bubblesFn.animate.bind(bubblesFn))

    if (results.segmentationMask) {
        canvasCtx.drawImage(results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height);
        // Only overwrite existing pixels.
        if (activeEffect === 'mask' || activeEffect === 'both') {
            canvasCtx.globalCompositeOperation = 'source-in';
            // This can be a color or a texture or whatever...
            canvasCtx.fillStyle = '#00FF007F';
            canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
        }
        else {
            canvasCtx.globalCompositeOperation = 'source-out';
            canvasCtx.fillStyle = '#0000FF7F';
            canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
        }
        // Only overwrite missing pixels.
        canvasCtx.globalCompositeOperation = 'destination-atop';
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.globalCompositeOperation = 'source-over';
    }
    else {
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    }
    // Connect elbows to hands. Do this first so that the other graphics will draw
    // on top of these marks.
    canvasCtx.lineWidth = 5;
    if (results.poseLandmarks) {
        if (results.rightHandLandmarks) {
            canvasCtx.strokeStyle = 'white';
            connect(canvasCtx, [[
                results.poseLandmarks[mpHolistic.POSE_LANDMARKS.RIGHT_ELBOW],
                results.rightHandLandmarks[0]
            ]]);
        }
        if (results.leftHandLandmarks) {
            canvasCtx.strokeStyle = 'white';
            connect(canvasCtx, [[
                results.poseLandmarks[mpHolistic.POSE_LANDMARKS.LEFT_ELBOW],
                results.leftHandLandmarks[0]
            ]]);
        }

        // Hands...
        drawingUtils.drawConnectors(canvasCtx, results.rightHandLandmarks, mpHolistic.HAND_CONNECTIONS, { color: 'white' });
        drawingUtils.drawLandmarks(canvasCtx, results.rightHandLandmarks, {
            color: 'white',
            fillColor: 'rgb(0,217,231)',
            lineWidth: 2,
            radius: (data) => {
                return drawingUtils.lerp(data.from.z, -0.15, .1, 10, 1);
            }
        });
        drawingUtils.drawConnectors(canvasCtx, results.leftHandLandmarks, mpHolistic.HAND_CONNECTIONS, { color: 'white' });
        drawingUtils.drawLandmarks(canvasCtx, results.leftHandLandmarks, {
            color: 'white',
            fillColor: 'rgb(255,138,0)',
            lineWidth: 2,
            radius: (data) => {
                return drawingUtils.lerp(data.from.z, -0.15, .1, 10, 1);
            }
        });

    }


    function drawEmoji(emoji, color) {
        let fillStyle = color
        canvasCtx.fillStyle = fillStyle
        canvasCtx.fillRect(10, 10, 150, 130);

        canvasCtx.font = '100px sans-serif';
        var emoji = emoji_; // Unicode for raised hand emoji
        canvasCtx.fillText(emoji, 25, 110);

        canvasCtx.stroke();
    }


    if (results.leftHandLandmarks || results.rightHandLandmarks) {

        const x = checkActions(string_, results.leftHandLandmarks || results.rightHandLandmarks)
        console.log(x, string_, emoji_)

        if (x) {
            drawEmoji(emoji_, "green")
            setTimeout(() => {
                drawEmoji(emoji_, "white")

            }, 1000)
            seqDict = getShuffledDictionary();
            emoji_ = Object.values(seqDict)[0];
            string_ = Object.keys(seqDict)[0]
        } else {
            drawEmoji(emoji_, "white")
        }


    } else {
        drawEmoji(emoji_, "white")
    }
    canvasCtx.restore();
}
const holistic = new mpHolistic.Holistic(config);
holistic.onResults(onResults);
// Present a control panel through which the user can manipulate the solution
// options.

new controls
    .ControlPanel(controlsElement, {
        selfieMode: true,
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        effect: 'background',
    })
    .add([
        new controls.StaticText({ title: 'MediaPipe Holistic' }),
        fpsControl,
        new controls.Toggle({ title: 'Selfie Mode', field: 'selfieMode' }),
        new controls.SourcePicker({
            onSourceChanged: () => {
                // Resets because the pose gives better results when reset between
                // source changes.
                holistic.reset();
            },
            onFrame: async (input, size) => {
                const aspect = size.height / size.width;
                let width, height;
                if (window.innerWidth > window.innerHeight) {
                    height = window.innerHeight;
                    width = height / aspect;
                }
                else {
                    width = window.innerWidth;
                    height = width * aspect;
                }
                canvasElement.width = width;
                canvasElement.height = height;
                await holistic.send({ image: input });
            },
        }),
        new controls.Slider({
            title: 'Model Complexity',
            field: 'modelComplexity',
            discrete: ['Lite', 'Full', 'Heavy'],
        }),
        new controls.Toggle({ title: 'Smooth Landmarks', field: 'smoothLandmarks' }),
        new controls.Toggle({ title: 'Enable Segmentation', field: 'enableSegmentation' }),
        new controls.Toggle({ title: 'Smooth Segmentation', field: 'smoothSegmentation' }),
        new controls.Slider({
            title: 'Min Detection Confidence',
            field: 'minDetectionConfidence',
            range: [0, 1],
            step: 0.01
        }),
        new controls.Slider({
            title: 'Min Tracking Confidence',
            field: 'minTrackingConfidence',
            range: [0, 1],
            step: 0.01
        }),
        new controls.Slider({
            title: 'Effect',
            field: 'effect',
            discrete: { 'background': 'Background', 'mask': 'Foreground' },
        }),
    ])
    .on(x => {
        const options = x;
        videoElement.classList.toggle('selfie', options.selfieMode);
        activeEffect = x['effect'];
        holistic.setOptions(options);
    });


