document.addEventListener('DOMContentLoaded', function() {
    const questionBlocks = document.querySelectorAll('.question-block');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const progressBar = document.querySelector('.progress-bar');
    const currentQuestionSpan = document.getElementById('current-question');
    const totalQuestionsSpan = document.getElementById('total-questions');
    
    let current = 0;
    const totalQuestions = questionBlocks.length;
    
    // Set total questions counter
    totalQuestionsSpan.textContent = totalQuestions;
    
    // Initialize the quiz
    function showQuestion(index) {
        // Hide all questions
        questionBlocks.forEach((block, i) => {
            block.classList.remove('active');
            if (i === index) {
                setTimeout(() => {
                    block.classList.add('active');
                }, 10);
            }
        });
        
        // Update navigation buttons
        prevBtn.style.display = index > 0 ? 'flex' : 'none';
        nextBtn.style.display = index < totalQuestions - 1 ? 'flex' : 'none';
        submitBtn.style.display = index === totalQuestions - 1 ? 'flex' : 'none';
        
        // Update progress bar
        const progress = ((index + 1) / totalQuestions) * 100;
        progressBar.style.width = `${progress}%`;
        
        // Update question counter
        currentQuestionSpan.textContent = index + 1;
        
        // Add animation to options
        const options = questionBlocks[index].querySelectorAll('.option');
        options.forEach((option, i) => {
            option.style.animationDelay = `${i * 0.1}s`;
            option.classList.add('animate__animated', 'animate__fadeIn');
        });
    }
    
    // Next button click handler
    nextBtn.addEventListener('click', () => {
        if (current < totalQuestions - 1) {
            current++;
            showQuestion(current);
        }
    });
    
    // Previous button click handler
    prevBtn.addEventListener('click', () => {
        if (current > 0) {
            current--;
            showQuestion(current);
        }
    });
    
    // Option selection handler
    document.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options in this question
            const questionBlock = this.closest('.question-block');
            questionBlock.querySelectorAll('.option').forEach(opt => {
                opt.style.backgroundColor = '';
                opt.style.borderColor = '';
            });
            
            // Add selected style to clicked option
            this.style.backgroundColor = 'rgba(74, 107, 255, 0.1)';
            this.style.borderColor = 'var(--primary-color)';
        });
    });
    
    // Initialize the quiz
    showQuestion(current);
    
    // Form submission handler
    document.getElementById('quiz-form').addEventListener('submit', function(e) {
        // You can add form validation here if needed
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;
    });
});