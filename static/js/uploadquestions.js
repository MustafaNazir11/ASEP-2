document.addEventListener('DOMContentLoaded', function() {
    // Function to save questions to local storage
    function saveQuestionsToLocalStorage(examData) {
        try {
            const existingExams = JSON.parse(localStorage.getItem('proctorExams')) || [];
            existingExams.push(examData);
            localStorage.setItem('proctorExams', JSON.stringify(existingExams));
            return true;
        } catch (error) {
            console.error('Error saving to local storage:', error);
            return false;
        }
    }

    // Handle form submission
    document.getElementById('uploadExamForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const examData = {
            id: Date.now(),
            title: document.getElementById('examTitle').value,
            questions: [],
            duration: document.getElementById('examDuration').value,
            startTime: document.getElementById('examStartTime').value
        };
        
        // Add each question
        document.querySelectorAll('.question-item').forEach((item, index) => {
            examData.questions.push({
                id: index + 1,
                text: item.querySelector('.question-text').value,
                options: Array.from(item.querySelectorAll('.question-option')).map(opt => opt.value),
                correctAnswer: item.querySelector('.correct-answer').value
            });
        });
        
        if (saveQuestionsToLocalStorage(examData)) {
            alert('Exam saved successfully!');
            // Optionally redirect or clear form
        } else {
            alert('Error saving exam. Please try again.');
        }
    });

    // Add button to add more questions
    document.getElementById('addQuestion')?.addEventListener('click', function() {
        const newQuestion = document.createElement('div');
        newQuestion.className = 'question-item';
        newQuestion.innerHTML = `
            <textarea class="question-text" placeholder="Question text" required></textarea>
            <input type="text" class="question-option" placeholder="Option 1" required>
            <input type="text" class="question-option" placeholder="Option 2" required>
            <input type="text" class="question-option" placeholder="Option 3" required>
            <select class="correct-answer" required>
                <option value="">Select correct answer</option>
                <option value="0">Option 1</option>
                <option value="1">Option 2</option>
                <option value="2">Option 3</option>
            </select>
            <button type="button" class="remove-question">Remove</button>
        `;
        document.getElementById('questionsContainer').appendChild(newQuestion);
    });

    // Delegated event for remove buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-question')) {
            e.target.closest('.question-item').remove();
        }
    });
});