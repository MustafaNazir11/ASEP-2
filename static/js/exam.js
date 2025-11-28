const peer = new Peer({
  host: "0.peerjs.com",
  port: 443,
  secure: true
});

const webcam = document.getElementById("webcam");
const proceedBtn = document.getElementById("proceedBtn");
const frameCanvas = document.getElementById("frameCanvas");
const canvasCtx = frameCanvas.getContext("2d");

let localStream = null;
let studentPeerId = null;
let pendingCall = null;

const backendURL = window.location.origin;

// ✅ Send Peer ID to backend
function sendPeerIdToServer(peerId) {
  fetch(`${backendURL}/store-peer-id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ peerId })
  }).catch(err => console.error("Failed to send peer ID:", err));
}

// ✅ PeerJS setup
peer.on("open", (id) => {
  studentPeerId = id;
  sendPeerIdToServer(studentPeerId);
});

peer.on("call", (call) => {
  if (localStream) {
    call.answer(localStream);
  } else {
    pendingCall = call;
  }
});

// ✅ Start webcam & frame capture
function startExamSession() {
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(async (stream) => {
      localStream = stream;
      webcam.srcObject = stream;

      if (pendingCall) {
        pendingCall.answer(localStream);
        pendingCall = null;
      }

      // Start sending frames to backend
      startFrameCapture();

      // Redirect to quiz page
      window.location.href = "/quiz";
    })
    .catch((err) => {
      console.error("Webcam access error:", err);
      alert("Failed to access webcam. Please allow permission.");
    });
}

// ✅ Capture frame and send to backend every 200ms (~2 FPS)
function startFrameCapture() {
  setInterval(() => {
    if (!localStream) return;

    canvasCtx.drawImage(webcam, 0, 0, frameCanvas.width, frameCanvas.height);
    const imageData = frameCanvas.toDataURL("image/png");

    fetch(`${backendURL}/upload-screenshot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageData, peerId: studentPeerId })
    })
    .then(res => res.json())
    .then(data => {
      if (data.reasons) {
        document.getElementById("violationDisplay").innerHTML = data.reasons.join("<br>");
      }
    })
    .catch(err => console.error("Frame upload error:", err));

  }, 500); // 2 FPS
}

// ✅ Camera preview button
document.getElementById('previewBtn').addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    webcam.srcObject = stream;
  } catch (err) {
    alert('Camera access denied or not available.');
  }
});

// ✅ Clean up Peer ID on page unload
window.addEventListener("beforeunload", () => {
  if (studentPeerId) {
    fetch(`${backendURL}/delete-peer-id`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peerId: studentPeerId })
    }).catch(() => {});
  }
});

proceedBtn.addEventListener("click", startExamSession);
