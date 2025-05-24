const videoGrid = document.querySelector(".video-grid");
const alertsList = document.getElementById("alertsList");
const startMonitoringBtn = document.getElementById("startMonitoringBtn");

const detailModal = document.getElementById("detailModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const detailVideo = document.getElementById("detailVideo");
const detailStudentName = document.getElementById("detailStudentName");
const detailExamName = document.getElementById("detailExamName");
const detailExamStatus = document.getElementById("detailExamStatus");

let peer;
let currentCall = null;

function getDummyStream() {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const dst = oscillator.connect(ctx.createMediaStreamDestination());
  oscillator.start();
  console.log("[DummyStream] Created silent audio stream for call initiation");
  return dst.stream;
}

startMonitoringBtn.addEventListener("click", () => {
  startMonitoringBtn.disabled = true;
  console.log("[Monitoring] Start Monitoring button clicked, initializing PeerJS admin peer...");

  peer = new Peer({
    host: "0.peerjs.com",
    port: 443,
    secure: true,
  });

  peer.on("open", (adminPeerId) => {
    console.log(`[PeerJS] Admin Peer connected with ID: ${adminPeerId}`);

    fetch(`${window.location.origin}/get-peer-ids`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then(peerIds => {
        console.log(`[Fetch] Retrieved student peer IDs:`, peerIds);

        if (peerIds.length === 0) {
          addAlert("[Alert] No student peers connected yet.");
          console.warn("[Warning] No student peers found to call.");
          return;
        }

        const dummyStream = getDummyStream();

        peerIds.forEach((studentPeerId) => {
          console.log(`[Call] Initiating call to student peer: ${studentPeerId}`);
          const call = peer.call(studentPeerId, dummyStream);

          if (!call) {
            console.error(`[Call] Failed to initiate call with student: ${studentPeerId}`);
            addAlert(`[Error] Failed to call student peer ${studentPeerId}`);
            return;
          }

          call.on("stream", (stream) => {
            console.log(`[Stream] Received remote stream from student ${studentPeerId} with ${stream.getTracks().length} track(s)`);
            addOrUpdateVideoBox(studentPeerId, stream);
          });

          call.on("close", () => {
            console.log(`[Call] Call closed by student: ${studentPeerId}`);
            removeVideoBox(studentPeerId);
          });

          call.on("error", (err) => {
            console.error(`[Call] Error during call with student ${studentPeerId}:`, err);
            addAlert(`[Error] Call error with ${studentPeerId}: ${err.message}`);
          });
        });
      })
      .catch(err => {
        console.error("[Fetch] Error fetching peer IDs from backend:", err);
        addAlert("[Error] Failed to fetch student peer IDs from server.");
      });
  });

  peer.on("error", (err) => {
    console.error("[PeerJS] PeerJS error:", err);
    addAlert(`[Error] PeerJS Error: ${err.type}`);
  });
});

function addOrUpdateVideoBox(peerId, stream) {
  let videoBox = document.querySelector(`.video-box[data-peer-id="${peerId}"]`);

  if (!videoBox) {
    videoBox = document.createElement("div");
    videoBox.classList.add("video-box");
    videoBox.dataset.peerId = peerId;

    const title = document.createElement("h3");
    title.textContent = `Student (${peerId.slice(0, 6)}...)`;
    videoBox.appendChild(title);

    const videoElem = document.createElement("video");
    videoElem.autoplay = true;
    videoElem.playsInline = true;
    videoElem.muted = true;
    videoElem.srcObject = stream;

    videoElem.onloadedmetadata = () => {
      console.log(`[Video] Metadata loaded for student ${peerId}, playing video...`);
      videoElem.play().then(() => {
        console.log(`[Video] Playing video stream for student ${peerId}`);
      }).catch(err => {
        console.warn(`[Video] Could not autoplay video for student ${peerId}:`, err);
      });
    };

    videoBox.appendChild(videoElem);
    videoBox.addEventListener("click", () => openDetailModal(peerId));
    videoGrid.appendChild(videoBox);

    console.log(`[UI] Added video box for student peer: ${peerId}`);
  } else {
    const videoElem = videoBox.querySelector("video");
    if (videoElem.srcObject !== stream) {
      videoElem.srcObject = stream;
      videoElem.onloadedmetadata = () => {
        console.log(`[Video] Metadata loaded (update) for student ${peerId}, playing video...`);
        videoElem.play().catch(err => {
          console.warn(`[Video] Could not autoplay updated video for student ${peerId}:`, err);
        });
      };
    }
  }
}

function removeVideoBox(peerId) {
  const videoBox = document.querySelector(`.video-box[data-peer-id="${peerId}"]`);
  if (videoBox) {
    videoBox.remove();
    console.log(`[UI] Removed video box for student peer: ${peerId}`);
  }
}

function openDetailModal(peerId) {
  console.log(`[Modal] Opening detail modal for student peer: ${peerId}`);
  detailStudentName.textContent = `Student (${peerId})`;
  detailExamName.textContent = "Unknown";
  detailExamStatus.textContent = "In Progress";

  const videoBox = document.querySelector(`.video-box[data-peer-id="${peerId}"]`);
  if (videoBox) {
    const videoElem = videoBox.querySelector("video");
    if (videoElem) {
      detailVideo.srcObject = videoElem.srcObject;
      detailVideo.onloadedmetadata = () => {
        console.log(`[Modal Video] Metadata loaded for student ${peerId}, playing detail video...`);
        detailVideo.play().then(() => {
          console.log(`[Modal Video] Playing detail video for student ${peerId}`);
        }).catch(err => {
          console.warn(`[Modal Video] Could not autoplay detail video for student ${peerId}:`, err);
        });
      };
    }
  }

  detailModal.classList.remove("hidden");
}

closeModalBtn.addEventListener("click", () => {
  console.log("[Modal] Closing detail modal");
  detailModal.classList.add("hidden");
  detailVideo.pause();
  detailVideo.srcObject = null;
});

function addAlert(message) {
  console.log(`[Alert] ${message}`);
  const li = document.createElement("li");
  li.innerHTML = `<i class="fa fa-exclamation-triangle"></i> ${message}`;
  alertsList.prepend(li);
}
