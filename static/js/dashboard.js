// Assumes updated backend: /get-peer-ids returns array of { peerId, name, examStart, violations }

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
let studentMetadata = {}; // Store metadata by peerId

function getDummyStream() {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const dst = oscillator.connect(ctx.createMediaStreamDestination());
  oscillator.start();
  return dst.stream;
}

startMonitoringBtn.addEventListener("click", () => {
  startMonitoringBtn.disabled = true;

  peer = new Peer({ host: "0.peerjs.com", port: 443, secure: true });

  peer.on("open", (adminPeerId) => {
    fetch(`${window.location.origin}/get-peer-ids`)
      .then(res => res.json())
      .then(students => {
        if (!students.length) {
          addAlert("[Alert] No student peers connected yet.");
          return;
        }

        const dummyStream = getDummyStream();

        students.forEach(({ peerId, name, examStart, violations }) => {
          studentMetadata[peerId] = { name, examStart, violations };

          const call = peer.call(peerId, dummyStream);
          if (!call) {
            addAlert(`[Error] Failed to call ${peerId}`);
            return;
          }

          call.on("stream", (stream) => {
            addOrUpdateVideoBox(peerId, stream);
          });

          call.on("close", () => removeVideoBox(peerId));

          call.on("error", (err) => addAlert(`[Error] Call error with ${peerId}: ${err.message}`));
        });
      })
      .catch(err => addAlert("[Error] Failed to fetch student peer IDs from server."));
  });

  peer.on("error", (err) => addAlert(`[Error] PeerJS Error: ${err.type}`));
});

function addOrUpdateVideoBox(peerId, stream) {
  let videoBox = document.querySelector(`.video-box[data-peer-id="${peerId}"]`);
  const meta = studentMetadata[peerId] || {};

  if (!videoBox) {
    videoBox = document.createElement("div");
    videoBox.classList.add("video-box");
    videoBox.dataset.peerId = peerId;

    const title = document.createElement("h3");
    title.textContent = `${meta.name || "Student"} (${peerId.slice(0, 6)}...)`;
    videoBox.appendChild(title);

    const videoElem = document.createElement("video");
    videoElem.autoplay = true;
    videoElem.playsInline = true;
    videoElem.muted = true;
    videoElem.srcObject = stream;
    videoElem.onloadedmetadata = () => videoElem.play().catch(err => console.warn(err));
    videoBox.appendChild(videoElem);

    const metaInfo = document.createElement("div");
    metaInfo.classList.add("student-meta");
    metaInfo.innerHTML = `
      <p><strong>Start:</strong> ${new Date(meta.examStart).toLocaleString()}</p>
      <p><strong>Violations:</strong> ${meta.violations ?? 0}</p>
    `;
    videoBox.appendChild(metaInfo);

    videoBox.addEventListener("click", () => openDetailModal(peerId));
    videoGrid.appendChild(videoBox);
  } else {
    const videoElem = videoBox.querySelector("video");
    if (videoElem.srcObject !== stream) {
      videoElem.srcObject = stream;
      videoElem.onloadedmetadata = () => videoElem.play().catch(err => console.warn(err));
    }
  }
}

function removeVideoBox(peerId) {
  const videoBox = document.querySelector(`.video-box[data-peer-id="${peerId}"]`);
  if (videoBox) videoBox.remove();
}

function openDetailModal(peerId) {
  const meta = studentMetadata[peerId] || {};

  detailStudentName.textContent = meta.name || `Student (${peerId})`;
  detailExamName.textContent = "Exam Name: Unknown";
  detailExamStatus.textContent = `Status: In Progress | Violations: ${meta.violations ?? 0}`;

  const videoBox = document.querySelector(`.video-box[data-peer-id="${peerId}"]`);
  const videoElem = videoBox?.querySelector("video");

  if (videoElem) {
    detailVideo.srcObject = videoElem.srcObject;
    detailVideo.onloadedmetadata = () => detailVideo.play().catch(err => console.warn(err));
  }

  detailModal.classList.remove("hidden");
}

closeModalBtn.addEventListener("click", () => {
  detailModal.classList.add("hidden");
  detailVideo.pause();
  detailVideo.srcObject = null;
});

function addAlert(message) {
  const li = document.createElement("li");
  li.innerHTML = `<i class="fa fa-exclamation-triangle"></i> ${message}`;
  alertsList.prepend(li);
}
