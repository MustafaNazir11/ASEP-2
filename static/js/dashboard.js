const videoGrid = document.querySelector(".video-grid");
const alertsList = document.getElementById("alertsList");
const detailModal = document.getElementById("detailModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const detailVideo = document.getElementById("detailVideo");
const detailStudentName = document.getElementById("detailStudentName");
const detailExamName = document.getElementById("detailExamName");
const detailExamStatus = document.getElementById("detailExamStatus");

const peer = new Peer({
  host: "0.peerjs.com",
  port: 443,
  secure: true,
});

const studentStreams = new Map();
const studentInfoMap = new Map();

peer.on("open", (adminPeerId) => {
  console.log("Admin Peer ID:", adminPeerId);

  fetch("http://127.0.0.1:5000/get-peer-ids")
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      return res.json();
    })
    .then(peerIds => {
      console.log("Fetched peer IDs:", peerIds);

      peerIds.forEach((peerId, index) => {
        console.log("Calling peer:", peerId);
        const call = peer.call(peerId);

        if (!call) {
          console.warn(`Failed to call peer ${peerId}`);
          addAlert(`Failed to call peer ${peerId}`);
          return;
        }

        const student = {
          id: peerId,
          name: `Student ${index + 1}`,
          exam: "Unknown",
          status: "In Progress"
        };
        studentInfoMap.set(peerId, student);

        call.on("stream", (stream) => {
          studentStreams.set(peerId, stream);
          addOrUpdateVideoBox(student, stream);
        });

        call.on("error", (err) => {
          addAlert(`Error with ${student.name}: ${err.message}`);
        });
      });
    })
    .catch(err => {
      console.error("Error fetching peer IDs from server:", err);
      addAlert("Error fetching peer IDs from server");
    });
});

function addOrUpdateVideoBox(student, stream) {
  let videoBox = document.querySelector(`.video-box[data-peer-id="${student.id}"]`);

  if (!videoBox) {
    videoBox = document.createElement("div");
    videoBox.classList.add("video-box");
    videoBox.dataset.peerId = student.id;

    const title = document.createElement("h3");
    title.textContent = student.name;
    videoBox.appendChild(title);

    const videoElem = document.createElement("video");
    videoElem.autoplay = true;
    videoElem.playsInline = true;
    videoElem.muted = true;
    videoBox.appendChild(videoElem);

    videoGrid.appendChild(videoBox);

    videoBox.addEventListener("click", () => openDetailModal(student.id));
  }

  const videoElem = videoBox.querySelector("video");
  if (videoElem.srcObject !== stream) {
    videoElem.srcObject = stream;
  }
}

function openDetailModal(peerId) {
  const student = studentInfoMap.get(peerId);
  if (!student) return;

  detailStudentName.textContent = student.name;
  detailExamName.textContent = student.exam;
  detailExamStatus.textContent = student.status;

  const stream = studentStreams.get(peerId);
  if (stream) {
    detailVideo.srcObject = stream;
  }

  detailModal.classList.remove("hidden");
}

closeModalBtn.addEventListener("click", () => {
  detailModal.classList.add("hidden");
  detailVideo.srcObject = null;
});

function addAlert(message) {
  const li = document.createElement("li");
  li.innerHTML = `<i class="fa fa-exclamation-triangle"></i> ${message}`;
  alertsList.prepend(li);
}
