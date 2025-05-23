const remoteVideo = document.getElementById("remoteVideo");
const peer = new Peer();

peer.on('open', () => {
  const studentId = prompt("Enter the Student's Peer ID:");

  const call = peer.call(studentId, null); // Admin is just receiving

  call.on('stream', (stream) => {
    remoteVideo.srcObject = stream;
  });

  call.on('error', (err) => {
    alert("Call failed: " + err.message);
  });
});
