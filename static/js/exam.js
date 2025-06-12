const peer = new Peer({
  host: "0.peerjs.com",
  port: 443,
  secure: true
});

const webcam = document.getElementById("webcam");
const proceedBtn = document.getElementById("proceedBtn");

let localStream = null;
let studentPeerId = null;
let pendingCall = null;

const backendURL = window.location.origin;

// ✅ Send Peer ID to backend
function sendPeerIdToServer(peerId) {
  console.log("%c📤 Sending student Peer ID to backend...", "color: blue; font-weight: bold;");
  fetch(`${backendURL}/store-peer-id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ peerId })
  })
    .then(res => res.json())
    .then(data => {
      console.log("%c✅ Peer ID stored on backend", "color: green;");
    })
    .catch(err => {
      console.error("%c❌ Failed to send peer ID to backend!", "color: red;");
      console.error(err);
    });
}

// ✅ Handle PeerJS connection
peer.on("open", (id) => {
  studentPeerId = id;
  console.log("%c✔ PeerJS connected! Student Peer ID:", "color: green;", studentPeerId);
  sendPeerIdToServer(studentPeerId);
});

// ✅ Handle incoming call from admin and answer with webcam
peer.on("call", (call) => {
  console.log("%c📞 Incoming call from admin!", "color: purple;");
  if (localStream) {
    call.answer(localStream);
    console.log("%c📤 Sent webcam stream to admin.", "color: green;");
  } else {
    pendingCall = call;
    console.warn("%c⚠️ Webcam not ready yet. Will answer later.", "color: orange;");
  }
});

// ✅ Wait for webcam to be ready
function waitForVideoReady(videoElement) {
  return new Promise((resolve) => {
    if (videoElement.readyState >= 3) {
      resolve();
    } else {
      videoElement.addEventListener("canplay", resolve, { once: true });
    }
  });
}

// ✅ Start webcam and redirect to student page
function startExamSession() {
  console.log("%c🚀 Starting webcam and redirecting to student page...", "color: blue;");

  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(async (stream) => {
      localStream = stream;
      webcam.srcObject = stream;
      await waitForVideoReady(webcam);

      if (pendingCall) {
        pendingCall.answer(localStream);
        pendingCall = null;
      }

      // ✅ Redirect to student page
      window.location.href = "/quiz"; // update path if needed

    })
    .catch((err) => {
      console.error("❌ Webcam access error:", err);
      alert("Failed to access webcam. Please allow permission.");
    });
}

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
