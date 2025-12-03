// static/js/exam.js (refactored, safe)
(() => {
  "use strict";

  // ------------------ Config ------------------
  const backendURL = window.location.origin;
  const FRAME_INTERVAL_MS = 500;      // 2 FPS
  const VIOLATION_COOLDOWN_MS = 5000; // throttle repeated identical violation reports
  const PEER_HOST = "0.peerjs.com";
  const PEER_PORT = 443;
  const PEER_SECURE = true;

  // ------------------ Elements ------------------
  const webcam = document.getElementById("webcam");
  const proceedBtn = document.getElementById("proceedBtn");
  const frameCanvas = document.getElementById("frameCanvas");
  const canvasCtx = frameCanvas ? frameCanvas.getContext("2d") : null;
  const focusWarning = document.getElementById("focusWarning");
  const violationDisplay = document.getElementById("violationDisplay");

  // ------------------ State ------------------
  let localStream = null;
  let studentPeerId = null;
  let pendingCall = null;
  let frameIntervalHandle = null;
  let lastFrameSentAt = 0;
  let lastViolationSent = new Map(); // reason -> timestamp

  // ------------------ Utilities ------------------
  function safeSetLocal(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }
  function safeGetLocal(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  // ------------------ PeerJS ------------------
  const peer = new Peer({
    host: PEER_HOST,
    port: PEER_PORT,
    secure: PEER_SECURE
  });

  peer.on("open", (id) => {
    studentPeerId = id;
    safeSetLocal("exam_peer_id", id);
    sendPeerIdToServer(id);
  });

  peer.on("call", (call) => {
    if (localStream) {
      call.answer(localStream);
    } else {
      pendingCall = call;
    }
  });

  function sendPeerIdToServer(peerId) {
    if (!peerId) return;
    fetch(`${backendURL}/store-peer-id`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peerId })
    }).catch(err => console.error("Failed to send peer ID:", err));
  }

  // ------------------ Violation reporting (throttled) ------------------
  function sendTabViolation(reason) {
    if (!reason) return;

    const now = Date.now();
    const last = lastViolationSent.get(reason) || 0;
    if (now - last < VIOLATION_COOLDOWN_MS) {
      // skip repeated identical violation within cooldown
      return;
    }
    lastViolationSent.set(reason, now);

    const peerId = studentPeerId || safeGetLocal("exam_peer_id") || null;
    fetch(`${backendURL}/tab-violation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peerId, reason })
    })
    .then(res => res.json().catch(() => ({})))
    .then(data => {
      console.log("Tab violation logged:", reason, data);
      if (focusWarning) {
        focusWarning.style.display = "block";
        focusWarning.textContent = `⚠️ ${reason} — Violations: ${data.count || "-"}`;
      }
      if (violationDisplay && data.reasons) {
        violationDisplay.innerHTML = (data.reasons || []).join("<br>");
      }
      if (data.action === "stop_exam") {
        endExamDueToViolations();
      }
    })
    .catch(err => console.error("Tab violation send error:", err));
  }

  function endExamDueToViolations() {
    try {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
      if (webcam) webcam.srcObject = null;
    } catch (e) { console.warn(e); }

    safeSetLocal("exam_active", "0");
    alert("Exam terminated due to repeated violations.");
    window.location.href = "/";
  }

  // // ------------------ Fullscreen & Focus enforcement ------------------
  function ensureFullscreen() {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn("Fullscreen request failed:", err);
        });
      }
    } catch (e) {
      console.warn("ensureFullscreen error", e);
    }
  }

  // document.addEventListener("fullscreenchange", () => {
  //   if (!document.fullscreenElement) {
  //     sendTabViolation("Exited fullscreen");
  //     // best-effort to re-request
  //     try { document.documentElement.requestFullscreen().catch(()=>{}); } catch(e){}
  //   }
  // });

  // document.addEventListener("visibilitychange", () => {
  //   if (document.hidden) {
  //     sendTabViolation("Page hidden or switched tab");
  //     try { document.title = "⚠ RETURN TO EXAM"; } catch(e){}
  //   } else {
  //     try { document.title = "Exam Page"; } catch(e){}
  //     ensureFullscreen();
  //     try { window.focus(); } catch(e){}
  //   }
  // });

  // window.addEventListener("blur", () => {
  //   sendTabViolation("Window lost focus (possible alt+tab)");
  // });

  // document.addEventListener("mouseleave", () => {
  //   sendTabViolation("Mouse left window");
  // });

  // // Prevent some shortcuts (best-effort)
  // window.addEventListener("keydown", function (e) {
  //   const blocked =
  //     e.key === "F11" ||
  //     e.key === "F12" ||
  //     (e.ctrlKey && (e.key === "t" || e.key === "w" || e.key === "Tab" || e.key === "r")) ||
  //     (e.metaKey && (e.key === "t" || e.key === "w")) ||
  //     (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i")) ||
  //     (e.ctrlKey && e.shiftKey && e.key === "C");

  //   if (blocked) {
  //     e.preventDefault?.();
  //     e.stopPropagation?.();
  //     sendTabViolation(`Blocked shortcut attempt: ${e.key}`);
  //     // Small UX: only alert for particularly serious combos
  //     if (e.key === "F12" || (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "C"))) {
  //       alert("Shortcut disabled during exam.");
  //     }
  //     return false;
  //   }
  // }, true);

  // Named handler so we can remove it before deliberate navigation
  function beforeUnloadHandler(e) {
    const active = safeGetLocal("exam_active");
    if (active === "1") {
      // required pattern to trigger browser confirmation in many browsers
      e.preventDefault();
      e.returnValue = "";
      return "";
    }
  }

  // Add handler
  window.addEventListener("beforeunload", beforeUnloadHandler);

  // ------------------ Frame capture & upload ------------------
  function startFrameCapture() {
    if (!canvasCtx || !frameCanvas || !webcam) return;

    if (frameIntervalHandle) clearInterval(frameIntervalHandle);

    frameIntervalHandle = setInterval(() => {
      if (!localStream) return;

      // Skip capture when hidden or unfocused to reduce false positives
      if (document.hidden || !document.hasFocus()) return;

      if (webcam.videoWidth && webcam.videoHeight) {
        frameCanvas.width = webcam.videoWidth;
        frameCanvas.height = webcam.videoHeight;
      }

      try {
        canvasCtx.drawImage(webcam, 0, 0, frameCanvas.width, frameCanvas.height);
        const now = Date.now();
        if (now - lastFrameSentAt < FRAME_INTERVAL_MS) return;
        lastFrameSentAt = now;

        const imageData = frameCanvas.toDataURL("image/png");
        const payload = {
          image: imageData,
          peerId: studentPeerId || safeGetLocal("exam_peer_id")
        };

        // Fire-and-forget (but log errors)
        fetch(`${backendURL}/upload-screenshot`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        .then(res => res.json().catch(()=>({})))
        .then(data => {
          if (data.reasons && violationDisplay) {
            violationDisplay.innerHTML = data.reasons.join("<br>");
          }
          if (data.action === "stop_exam") {
            endExamDueToViolations();
          }
        })
        .catch(err => {
          console.error("Frame upload error:", err);
        });
      } catch (e) {
        console.error("Frame capture error:", e);
      }
    }, FRAME_INTERVAL_MS);
  }

  // ------------------ Start exam session ------------------
  async function startExamSession() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      localStream = stream;
      if (webcam) webcam.srcObject = stream;

      if (pendingCall) {
        pendingCall.answer(localStream);
        pendingCall = null;
      }

      startFrameCapture();

      // Mark active in storage so other pages/scripts can detect ongoing exam
      safeSetLocal("exam_active", "1");
      safeSetLocal("exam_peer_id", studentPeerId || "");

      // Force fullscreen if possible
      ensureFullscreen();

      // IMPORTANT: temporarily remove beforeunload handler so the intentional redirect doesn't trigger the confirmation popup.
      try { window.removeEventListener("beforeunload", beforeUnloadHandler); } catch (e) {}

      // After removing the handler, navigate to /quiz.
      // The script expected to be included on /quiz will re-add beforeunload when it runs and sees exam_active === "1".
      window.location.href = "/quiz";
    } catch (err) {
      console.error("Webcam access error:", err);
      alert("Failed to access webcam. Please allow permission and try again.");
    }
  }

  // ------------------ Preview button (if present) ------------------
  if (document.getElementById('previewBtn')) {
    document.getElementById('previewBtn').addEventListener('click', async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (webcam) webcam.srcObject = stream;
      } catch (err) {
        alert('Camera access denied or not available.');
      }
    });
  }

  // ------------------ Cleanup on unload ------------------
  window.addEventListener("unload", () => {
    try {
      const peerIdToDelete = studentPeerId || safeGetLocal("exam_peer_id");
      if (peerIdToDelete) {
        fetch(`${backendURL}/delete-peer-id`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ peerId: peerIdToDelete })
        }).catch(() => {});
      }
      safeSetLocal("exam_peer_id", "");
      safeSetLocal("exam_active", "0");
    } catch (e) { /* ignore */ }
  });

  // ------------------ Proceed button hookup ------------------
  if (proceedBtn) {
    proceedBtn.addEventListener("click", startExamSession);
  } else {
    console.warn("proceedBtn not found in DOM — startExamSession must be wired manually.");
  }

  // ------------------ Init if active (e.g. included on /quiz) ------------------
  (function initIfActive() {
    const active = safeGetLocal("exam_active");
    if (active === "1") {
      // If user returned to page while exam_active, try to obtain focus & fullscreen
      ensureFullscreen();
      try { window.focus(); } catch(e){}
    }
  })();

})();
