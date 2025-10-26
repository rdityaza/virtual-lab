
document.addEventListener('DOMContentLoaded', () => {
    // Cek autentikasi
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

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

    // Load best score dari server
    async function loadBestScore() {
        try {
            const response = await fetch('/api/scores/best', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                return data.bestScore || 0;
            }
        } catch (error) {
            console.error('Error loading best score:', error);
        }
        return 0;
    }

    // Save best score ke server
    async function saveBestScore(score) {
        try {
            const response = await fetch('/api/scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ score })
            });
            if (!response.ok) {
                throw new Error('Failed to save best score');
            }
        } catch (error) {
            console.error('Error saving best score:', error);
        }
    }

    async function calculateScore() {
        let score = 0;
        let correctAnswers = 0;

        for (let i = 1; i <= totalQuestions; i++) {
            const selectedOption = document.querySelector(`input[name="q${i}"]:checked`);
            if (selectedOption && selectedOption.value === 'correct') {
                score += 4;
                correctAnswers++;
            }
        }
        
        const bestScore = await loadBestScore();
        let isNewBest = false;
        
        if (score > bestScore) {
            await saveBestScore(score);
            isNewBest = true;
        }
        
        scoreElement.textContent = score;
        
        let details = `Anda menjawab ${correctAnswers} dari ${totalQuestions} soal dengan benar.`;
        details += `<br><strong>Skor Terbaik Anda: ${Math.max(score, bestScore)}</strong>`;
        
        if (isNewBest && score > 0) {
            details += `<br><span style="color: #00F5D4; font-weight: bold;">🎉 REKOR BARU!</span>`;
        }
        
        scoreDetailsElement.innerHTML = details;
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