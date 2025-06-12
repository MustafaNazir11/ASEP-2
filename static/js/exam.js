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
let screenshotIntervalId = null;

const backendURL = window.location.origin;

// ✅ PeerJS connection
peer.on("open", (id) => {
  studentPeerId = id;
  console.log("%c✔ PeerJS connection established!", "color: green; font-weight: bold;");
  console.log("🎓 Student Peer ID generated:", studentPeerId);
  sendPeerIdToServer(studentPeerId);
});

// ✅ Handle incoming call from admin
peer.on("call", (call) => {
  console.log("%c📞 Incoming call received from admin!", "color: purple; font-weight: bold;");

  if (localStream) {
    console.log("%c✅ Webcam stream already available, answering call now...", "color: green;");
    call.answer(localStream);
    console.log("%c📤 Webcam stream sent to admin!", "color: green;");
  } else {
    console.warn("%c⚠️ Webcam not ready yet. Storing call to answer later...", "color: orange;");
    pendingCall = call;
  }
});

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
    console.log("%c✅ Peer ID successfully stored on backend", "color: green;");
  })
  .catch(err => {
    console.error("%c❌ Failed to send peer ID to backend!", "color: red;");
    console.error(err);
  });
}

// ✅ Delete Peer ID from backend
function deletePeerIdFromServer(peerId) {
  if (!peerId) return;
  console.log("%c🗑️ Deleting student Peer ID from backend...", "color: orange; font-weight: bold;");
  fetch(`${backendURL}/delete-peer-id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ peerId })
  })
  .then(res => res.json())
  .then(data => {
    console.log("%c✅ Peer ID successfully deleted from backend", "color: green;");
  })
  .catch(err => {
    console.error("%c❌ Failed to delete peer ID from backend!", "color: red;");
    console.error(err);
  });
}

// ✅ Wait for webcam readiness
function waitForVideoReady(videoElement) {
  return new Promise((resolve) => {
    if (videoElement.readyState >= 3) {
      console.log("🎥 Video is ready to play (readyState >= 3).");
      resolve();
    } else {
      videoElement.addEventListener("canplay", () => {
        console.log("🎥 Video can play now (canplay event).");
        resolve();
      }, { once: true });
    }
  });
}

// ✅ Capture screenshot safely
function captureScreenshot() {
  const width = webcam.videoWidth;
  const height = webcam.videoHeight;
  if (!width || !height) {
    console.warn("⚠️ Webcam not ready yet. Skipping screenshot.");
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(webcam, 0, 0, width, height);
  console.log("📸 Screenshot captured from webcam.");
  return canvas.toDataURL("image/png");
}

// ✅ Upload screenshot
function uploadScreenshot() {
  const image = captureScreenshot();
  if (!image || !studentPeerId) return;

  fetch(`${backendURL}/upload-screenshot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: image,
      peerId: studentPeerId
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log("%c📤 Screenshot uploaded to backend.", "color: teal;");
    if (data.reasons) {
      console.warn("🚨 Reasons:", data.reasons.join(", "));
    }
    if (data.action === "stop_exam") {
      alert("⚠️ Exam terminated due to repeated violations.");
      stopExamSession();
    }
  })
  .catch(err => {
    console.error("%c❌ Screenshot upload failed:", "color: red;");
    console.error(err);
  });
}

// ✅ Stop the exam session (called on violation)
function stopExamSession() {
  if (screenshotIntervalId) clearInterval(screenshotIntervalId);
  deletePeerIdFromServer(studentPeerId);

  // Stop video
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }

  // Replace content on page
  const container = document.getElementById("exam-form") || document.body;
  container.innerHTML = `<h2 style="color:red; text-align:center;">🚫 Exam Terminated due to Policy Violation</h2>`;
}

// ✅ Start webcam and screenshot loop
function startExamSession() {
  if (localStream) {
    alert("Webcam already started.");
    return;
  }

  console.log("%c🚀 Starting exam session and webcam...", "color: purple; font-weight: bold;");
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(async (stream) => {
      localStream = stream;
      webcam.srcObject = stream;
      console.log("🎥 Webcam stream successfully captured and attached to video element.");

      await waitForVideoReady(webcam);
      console.log("✅ Webcam video confirmed ready for display and screenshots.");

      if (pendingCall) {
        console.log("%c📞 Answering previously received call from admin...", "color: purple;");
        pendingCall.answer(localStream);
        console.log("%c📤 Webcam stream sent to admin from stored call!", "color: green;");
        pendingCall = null;
      }

      screenshotIntervalId = setInterval(uploadScreenshot, 1000); // Every 1 seconds
      console.log("📷 Screenshot capture loop started.");
    })
    .catch((err) => {
      console.error("❌ Webcam access error:", err);
      alert("Failed to access webcam. Please allow permissions.");
    });
}

// ✅ Cleanup on unload - clear interval & delete peer ID
window.addEventListener("beforeunload", () => {
  if (screenshotIntervalId) clearInterval(screenshotIntervalId);
  deletePeerIdFromServer(studentPeerId);
});

proceedBtn.addEventListener("click", startExamSession);
