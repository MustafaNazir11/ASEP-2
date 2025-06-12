const peer = new Peer(undefined, {
  host: "0.peerjs.com",
  port: 443,
  secure: true
});

const backendURL = window.location.origin;
const studentGallery = document.getElementById("studentGallery");

peer.on("open", (adminId) => {
  console.log("%c👨‍💼 Admin PeerJS ready:", "color: green;", adminId);
  loadAllStudents();
});

// Fetch all peer IDs from the server
function loadAllStudents() {
  fetch(`${backendURL}/get-peer-ids`)
    .then(res => res.json())
    .then(peerIds => {
      console.log("👥 Active students:", peerIds);
      studentGallery.innerHTML = "";
      peerIds.forEach(peerId => createStudentCard(peerId));
    })
    .catch(err => {
      console.error("❌ Error fetching student list:", err);
    });
}

// Create UI + Call for a student
function createStudentCard(peerId) {
  const card = document.createElement("div");
  card.className = "student-card";

  const video = document.createElement("video");
  video.autoplay = true;
  video.playsInline = true;
  card.appendChild(video);

  const info = document.createElement("div");
  info.className = "info";
  info.innerHTML = `
    <p><strong>Student ID:</strong> ${peerId}</p>
    <p class="violation" id="violations-${peerId}">Violations: ...</p>
  `;
  card.appendChild(info);
  studentGallery.appendChild(card);

  const call = peer.call(peerId, null);
  call.on("stream", (remoteStream) => {
    video.srcObject = remoteStream;
    console.log(`📺 Streaming from ${peerId}`);
  });

  call.on("close", () => {
    console.log(`📴 Stream closed for ${peerId}`);
    card.remove();
  });

  updateViolationCount(peerId);
}

// Poll violation counts every 10 seconds
function updateViolationCount(peerId) {
  const update = () => {
    fetch(`${backendURL}/violation-counts`)
      .then(res => res.json())
      .then(data => {
        const count = data[peerId] || 0;
        const element = document.getElementById(`violations-${peerId}`);
        if (element) element.textContent = `Violations: ${count}`;
      });
  };
  update();
  setInterval(update, 10000); // every 10 sec
}
