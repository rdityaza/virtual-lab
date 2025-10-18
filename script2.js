
document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;
    const totalPages = 6; 
    const totalQuestions = 25;

    const navigation = document.querySelector('.navigation');
    const pages = document.querySelectorAll('.page');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    const scoreElement = document.getElementById('score');
    const scoreDetailsElement = document.getElementById('score-details');
    const retryBtn = document.getElementById('retryBtn');

    function calculateScore() {
        let score = 0;
        let correctAnswers = 0;

        for (let i = 1; i <= totalQuestions; i++) {
            const selectedOption = document.querySelector(`input[name="q${i}"]:checked`);
            if (selectedOption && selectedOption.value === 'correct') {
                score += 4;
                correctAnswers++;
            }
        }
        
        scoreElement.textContent = score;
        scoreDetailsElement.textContent = `Anda menjawab ${correctAnswers} dari ${totalQuestions} soal dengan benar.`;
    }

    function updatePage() {
        pages.forEach(page => page.classList.remove('active'));

        document.getElementById(`page${currentPage}`).classList.add('active');

        if (currentPage === totalPages) {
            calculateScore();
            navigation.style.display = 'none'; 
        } else {
            navigation.style.display = 'flex'; 
            pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages - 1}`;
        }
        
        prevBtn.disabled = currentPage === 1;

        if (currentPage === totalPages - 1) {
            nextBtn.textContent = 'Selesai';
        } else {
            nextBtn.textContent = 'Berikutnya';
        }
    }

    function resetQuiz() {
        const allRadios = document.querySelectorAll('input[type="radio"]');
        allRadios.forEach(radio => radio.checked = false);

        currentPage = 1;
        updatePage();
    }

    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            updatePage();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updatePage();
        }
    });

    retryBtn.addEventListener('click', resetQuiz);

    updatePage();
});