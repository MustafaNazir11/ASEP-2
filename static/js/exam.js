// static/js/exam.js (updated)
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
let frameIntervalHandle = null;

const backendURL = window.location.origin;

// ===================== Helpers =====================
function safeSetLocal(key, value) {
  try { localStorage.setItem(key, value); } catch(e){}
}
function safeGetLocal(key) {
  try { return localStorage.getItem(key); } catch(e){ return null; }
}

// ✅ Send Peer ID to backend
function sendPeerIdToServer(peerId) {
  fetch(`${backendURL}/store-peer-id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ peerId })
  }).catch(err => console.error("Failed to send peer ID:", err));
}

// ===================== PeerJS setup =====================
peer.on("open", (id) => {
  studentPeerId = id;
  safeSetLocal("exam_peer_id", studentPeerId);
  sendPeerIdToServer(studentPeerId);
});

peer.on("call", (call) => {
  if (localStream) {
    call.answer(localStream);
  } else {
    pendingCall = call;
  }
});

// ===================== Violation reporting =====================

function sendTabViolation(reason) {
  const peerId = studentPeerId || safeGetLocal("exam_peer_id") || null;
  // report even if peerId missing — backend will reject if needed
  fetch(`${backendURL}/tab-violation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ peerId, reason })
  })
  .then(res => res.json())
  .then(data => {
    console.log("Tab violation logged:", reason, data);

    // Display inline message
    const focusWarning = document.getElementById("focusWarning");
    if (focusWarning) {
      focusWarning.style.display = "block";
      focusWarning.textContent = `⚠️ ${reason} — Violations: ${data.count || "-"}`;
    }

    // If backend says stop_exam, end exam here
    if (data.action === "stop_exam") {
      endExamDueToViolations();
    }
  })
  .catch(err => console.error("Tab violation send error:", err));
}

function endExamDueToViolations() {
  try {
    const stream = webcam && webcam.srcObject;
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    webcam.srcObject = null;
  } catch(e){}

  // Clear flags
  try { safeSetLocal("exam_active", "0"); } catch(e){}

  // Inform student and redirect
  alert("Exam terminated due to repeated violations.");
  window.location.href = "/";
}

// ===================== Fullscreen & Focus enforcement =====================

function ensureFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      // browsers can block request; log
      console.warn("Fullscreen request failed:", err);
    });
  }
}

document.addEventListener("fullscreenchange", () => {
  // If student exits fullscreen, record violation and try to re-enter
  if (!document.fullscreenElement) {
    sendTabViolation("Exited fullscreen");
    // try to re-request (best-effort)
    try { document.documentElement.requestFullscreen().catch(()=>{}); } catch(e){}
  }
});

// When page visibility changes
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // If page becomes hidden, register violation and pause uploads
    sendTabViolation("Page hidden or switched tab");
    // also change title to alert user
    try { document.title = "⚠ RETURN TO EXAM"; } catch(e){}
  } else {
    try { document.title = "Exam Page"; } catch(e){}
    // attempt to re-enter fullscreen & focus
    ensureFullscreen();
    try { window.focus(); } catch(e){}
  }
});

// When window loses focus
window.addEventListener("blur", () => {
  sendTabViolation("Window lost focus (possible alt+tab)");
});

// Mouse leaves window
document.addEventListener("mouseleave", () => {
  // small abuse prevention measure
  sendTabViolation("Mouse left window");
});

// Prevent certain key combos (best-effort)
window.addEventListener("keydown", function(e) {
  // blocked combos / keys
  const blocked =
    e.key === "F11" ||
    e.key === "F12" || // often devtools
    (e.ctrlKey && (e.key === "t" || e.key === "w" || e.key === "Tab" || e.key === "r")) ||
    (e.metaKey && (e.key === "t" || e.key === "w")) || // mac cmd
    (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i")) || // ctrl+shift+i
    (e.ctrlKey && e.shiftKey && e.key === "C"); // ctrl+shift+c
  if (blocked) {
    e.preventDefault?.();
    e.stopPropagation?.();
    sendTabViolation(`Blocked shortcut attempt: ${e.key}`);
    alert("Shortcut disabled during exam.");
    return false;
  }
}, true);

// Prevent navigation away while exam active
window.addEventListener("beforeunload", function(e) {
  const active = safeGetLocal("exam_active");
  if (active === "1") {
    // some browsers ignore custom messages, but returning a value triggers confirmation
    e.preventDefault();
    e.returnValue = "";
    return "";
  }
});

// ===================== Camera / Frame capture =====================

function startFrameCapture() {
  // clear previous if any
  if (frameIntervalHandle) clearInterval(frameIntervalHandle);

  frameIntervalHandle = setInterval(() => {
    if (!localStream) return;

    // Pause capturing if page is hidden or window not focused to avoid false "no face" detections
    if (document.hidden || !document.hasFocus()) {
      // skip sending frame
      return;
    }

    // ensure canvas matches video size
    if (webcam.videoWidth && webcam.videoHeight) {
      frameCanvas.width = webcam.videoWidth;
      frameCanvas.height = webcam.videoHeight;
    }

    try {
      canvasCtx.drawImage(webcam, 0, 0, frameCanvas.width, frameCanvas.height);
      const imageData = frameCanvas.toDataURL("image/png");

      fetch(`${backendURL}/upload-screenshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData, peerId: studentPeerId || safeGetLocal("exam_peer_id") })
      })
      .then(res => res.json())
      .then(data => {
        if (data.reasons) {
          const vd = document.getElementById("violationDisplay");
          if (vd) vd.innerHTML = data.reasons.join("<br>");
        }
        if (data.action === "stop_exam") {
          endExamDueToViolations();
        }
      })
      .catch(err => console.error("Frame upload error:", err));
    } catch(e) {
      console.error("Frame capture error:", e);
    }
  }, 500); // 2 FPS (every 500ms)
}

// Start webcam & frame capture
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

      // Persist exam active flag and peer id
      safeSetLocal("exam_active", "1");
      safeSetLocal("exam_peer_id", studentPeerId || "");

      // Force fullscreen (best-effort)
      ensureFullscreen();

      // small delay to let things start, then navigate to quiz
      setTimeout(() => {
        // if you want the protections to continue on /quiz, include exam.js on /quiz too.
        window.location.href = "/quiz";
      }, 300);
    })
    .catch((err) => {
      console.error("Webcam access error:", err);
      alert("Failed to access webcam. Please allow permission.");
    });
}

// Camera preview button
document.getElementById('previewBtn').addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    webcam.srcObject = stream;
  } catch (err) {
    alert('Camera access denied or not available.');
  }
});

// Clean up Peer ID on page unload
window.addEventListener("unload", () => {
  const peerIdToDelete = studentPeerId || safeGetLocal("exam_peer_id");
  if (peerIdToDelete) {
    fetch(`${backendURL}/delete-peer-id`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peerId: peerIdToDelete })
    }).catch(() => {});
    try {
      safeSetLocal("exam_peer_id", "");
      safeSetLocal("exam_active", "0");
    } catch(e){}
  }
});

proceedBtn.addEventListener("click", startExamSession);

// If page loads and exam_active flag is set (for example when exam.js is included on /quiz),
// reattach protections (request fullscreen & ensure listeners are active)
(function initIfActive() {
  const active = safeGetLocal("exam_active");
  if (active === "1") {
    // try to request fullscreen when possible
    ensureFullscreen();
    try { window.focus(); } catch(e){}
  }
})();
