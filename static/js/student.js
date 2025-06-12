document.addEventListener('DOMContentLoaded', function () {
    // ===================== QUIZ NAVIGATION LOGIC =====================
    const questionBlocks = document.querySelectorAll('.question-block');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const progressBar = document.querySelector('.progress-bar');
    const currentQuestionSpan = document.getElementById('current-question');
    const totalQuestionsSpan = document.getElementById('total-questions');

    let current = 0;
    const totalQuestions = questionBlocks.length;

    totalQuestionsSpan.textContent = totalQuestions;

    function showQuestion(index) {
        questionBlocks.forEach((block, i) => {
            block.classList.remove('active');
            if (i === index) {
                setTimeout(() => {
                    block.classList.add('active');
                }, 10);
            }
        });

        prevBtn.style.display = index > 0 ? 'flex' : 'none';
        nextBtn.style.display = index < totalQuestions - 1 ? 'flex' : 'none';
        submitBtn.style.display = index === totalQuestions - 1 ? 'flex' : 'none';

        const progress = ((index + 1) / totalQuestions) * 100;
        progressBar.style.width = `${progress}%`;
        currentQuestionSpan.textContent = index + 1;

        const options = questionBlocks[index].querySelectorAll('.option');
        options.forEach((option, i) => {
            option.style.animationDelay = `${i * 0.1}s`;
            option.classList.add('animate__animated', 'animate__fadeIn');
        });
    }

    nextBtn.addEventListener('click', () => {
        if (current < totalQuestions - 1) {
            current++;
            showQuestion(current);
        }
    });

    prevBtn.addEventListener('click', () => {
        if (current > 0) {
            current--;
            showQuestion(current);
        }
    });

    document.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', function () {
            const questionBlock = this.closest('.question-block');
            questionBlock.querySelectorAll('.option').forEach(opt => {
                opt.style.backgroundColor = '';
                opt.style.borderColor = '';
            });
            this.style.backgroundColor = 'rgba(74, 107, 255, 0.1)';
            this.style.borderColor = 'var(--primary-color)';
        });
    });

    document.getElementById('quiz-form').addEventListener('submit', function (e) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;
    });

    showQuestion(current);

    // ===================== BACKGROUND PROCTORING LOGIC =====================
    const video = document.getElementById("webcam");
    const violationDisplay = document.getElementById("violationDisplay");
    const examEnded = document.getElementById("examEnded");
    let violationCount = 0;
    let peerId = null;

    // 🎥 Access camera silently
    navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
            video.srcObject = stream;
        })
        .catch(() => {
            alert("Camera permission denied. You cannot proceed with the exam.");
        });

    // 🔗 Connect PeerJS
    const peer = new Peer();
    peer.on("open", (id) => {
        peerId = id;
        fetch("/store-peer-id", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ peerId: id }),
        });
    });

    // 🖼️ Send screenshots every 10 seconds
    setInterval(() => {
        if (!peerId || !video.videoWidth) return;

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const base64Image = canvas.toDataURL("image/png");

        fetch("/upload-screenshot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64Image, peerId }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.message?.includes("Suspicious")) {
                    violationCount++;
                    violationDisplay.style.display = "block";
                    violationDisplay.innerText = "⚠️ " + data.reasons.join(", ");

                    if (data.action === "stop_exam") {
                        document.querySelector(".quiz-container").style.display = "none";
                        examEnded.style.display = "block";
                    }
                }
            })
            .catch(err => console.error("Screenshot upload failed:", err));
    }, 10000);
});
