let currentQuestionIndex = 0;

function addQuestionBlock() {
    const container = document.getElementById("questions-container");
    const index = document.getElementsByClassName("question-block").length + 1;

    const block = document.createElement("div");
    block.className = "question-block";
    block.style.display = "none";  // Hide by default

    block.innerHTML = `
        <fieldset>
            <legend>Question ${index}</legend>
            <label>Question:</label><br>
            <input type="text" name="question" required><br>

            <label>Option A:</label><br>
            <input type="text" name="option_a" required><br>

            <label>Option B:</label><br>
            <input type="text" name="option_b" required><br>

            <label>Option C:</label><br>
            <input type="text" name="option_c" required><br>

            <label>Option D:</label><br>
            <input type="text" name="option_d" required><br>

            <label>Correct Option (a/b/c/d):</label><br>
            <input type="text" name="correct_option" pattern="[abcd]" required><br>

            <button type="button" class="delete-button">🗑️ Delete</button>
        </fieldset>
        <hr>
    `;

    // Delete logic
    block.querySelector(".delete-button").addEventListener("click", () => {
        const blocks = document.getElementsByClassName("question-block");
        const idx = Array.from(blocks).indexOf(block);

        block.remove();

        if (idx === currentQuestionIndex && blocks.length > 0) {
            currentQuestionIndex = Math.max(0, idx - 1);
            showQuestion(currentQuestionIndex);
        } else if (blocks.length === 0) {
            currentQuestionIndex = 0;
        }
    });

    container.appendChild(block);

    // Show newly added block
    currentQuestionIndex = document.getElementsByClassName("question-block").length - 1;
    showQuestion(currentQuestionIndex);
}

function showQuestion(index) {
    const blocks = document.getElementsByClassName("question-block");

    for (let i = 0; i < blocks.length; i++) {
        blocks[i].style.display = "none";
    }

    if (blocks[index]) {
        blocks[index].style.display = "block";
    }

    // Update button state
    document.getElementById("prev-btn").disabled = index <= 0;
    document.getElementById("next-btn").disabled = index >= blocks.length - 1;
}

function showNext() {
    const blocks = document.getElementsByClassName("question-block");
    if (currentQuestionIndex < blocks.length - 1) {
        currentQuestionIndex++;
        showQuestion(currentQuestionIndex);
    }
}

function showPrevious() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion(currentQuestionIndex);
    }
}

window.onload = function () {
    addQuestionBlock(); // Start with one question
};
