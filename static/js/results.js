document.addEventListener("DOMContentLoaded", function () {
    const score = parseInt(document.getElementById("score").textContent);
    const total = parseInt(document.getElementById("total").textContent);
    const message = document.querySelector(".message");

    if (score === total) {
        message.textContent = "Perfect Score! 🏆";
    } else if (score >= total * 0.7) {
        message.textContent = "Great Job! 🎯";
    } else if (score >= total * 0.4) {
        message.textContent = "Not bad! Keep practicing 👨‍💻";
    } else {
        message.textContent = "Needs improvement. 📚";
    }
});
