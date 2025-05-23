const peer = new Peer({
  host: "0.peerjs.com",
  port: 443,
  secure: true
});

const webcam = document.getElementById("webcam");
const proceedBtn = document.getElementById("proceedBtn");

let localStream = null;
let studentPeerId = null;
const backendURL = window.location.origin;

// Start webcam and handle PeerJS events
function startExamSession() {
  if (localStream) {
    alert("Webcam already started.");
    return;
  }

  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then((stream) => {
      localStream = stream;
      webcam.srcObject = stream;

      peer.on("open", (id) => {
        studentPeerId = id;
        console.log("Student Peer ID:", studentPeerId);
        sendPeerIdToServer(studentPeerId);
      });

      peer.on("call", (call) => {
        call.answer(localStream);
        console.log("Answered admin call.");
      });

      // Start auto-screenshot after successful webcam access
      startScreenshotInterval();
    })
    .catch((err) => {
      console.error("Webcam access error:", err);
      alert("Failed to access webcam. Please allow permissions.");
    });
}

// Send Peer ID to backend
function sendPeerIdToServer(peerId) {
  fetch(`${backendURL}/store-peer-id`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ peerId })
  })
    .then(res => res.json())
    .then(data => console.log("Server response:", data))
    .catch(err => console.error("Failed to send peer ID:", err));
}

// Capture screenshot from webcam feed
function captureScreenshot() {
  const canvas = document.createElement("canvas");
  canvas.width = webcam.videoWidth;
  canvas.height = webcam.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(webcam, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png");
}

// Upload screenshot to backend
function uploadScreenshot() {
  const image = captureScreenshot();
  fetch(`${backendURL}/upload-screenshot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ image })
  })
    .then(res => res.json())
    .then(data => console.log("Screenshot uploaded:", data))
    .catch(err => console.error("Screenshot upload failed:", err));
}

// Start interval to take screenshots every 1 minute
function startScreenshotInterval() {
  setInterval(() => {
    if (localStream) {
      uploadScreenshot();
    }
  }, 4000); // 60,000 ms = 1 minute
}
proceedBtn.addEventListener("click", startExamSession);