// =================================================================
// FILE SCRIPT.JS FINAL (VERSI BERSIH & SUDAH DIPERBAIKI)
// =================================================================

// --- BAGIAN 1: SETUP AWAL & AUTENTIKASI ---
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'login.html';
} else {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        document.getElementById('usernameDisplay').textContent = payload.user.username;
        document.getElementById('userInfo').style.display = 'block';
    } catch (e) {
        console.error("Token tidak valid:", e);
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}
document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
});

// --- BAGIAN 2: ELEMEN & VARIABEL GLOBAL ---
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');
const angleInput = document.getElementById('angle');
const velocityInput = document.getElementById('velocity');
const gravityInput = document.getElementById('gravity');
const launchButton = document.getElementById('launchButton');
const maxDistanceSpan = document.getElementById('maxDistance');
const maxHeightSpan = document.getElementById('maxHeight');
const timeOfFlightSpan = document.getElementById('timeOfFlight');
const historyList = document.getElementById('historyList');
const deleteAllButton = document.getElementById('deleteAllButton');
const launchSound = document.getElementById('launchSound');
const impactSound = document.getElementById('impactSound');

const DEFAULT_VIEW_WIDTH_METERS = 100;
let animationFrameId;
let target = { x: 0, y: 0, radius: 5 };

// --- BAGIAN 3: LOGIKA PENGGAMBARAN KANVAS ---
function drawGridAndScale(scale, viewWidth, viewHeight) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const padding = 40;
    
    ctx.strokeStyle = "rgba(77, 118, 253, 0.2)";
    ctx.fillStyle = "rgba(234, 234, 234, 0.7)";
    ctx.font = "10px Poppins";

    const getNiceInterval = (maxVal) => {
        if (maxVal <= 0) return 1;
        const exponent = Math.floor(Math.log10(maxVal));
        const relVal = maxVal / Math.pow(10, exponent);
        if (relVal < 1.5) return 0.1 * Math.pow(10, exponent);
        if (relVal < 3) return 0.2 * Math.pow(10, exponent);
        if (relVal < 7) return 0.5 * Math.pow(10, exponent);
        return 1 * Math.pow(10, exponent);
    };
    
    let lastXPos = -Infinity;
    const xInterval = getNiceInterval(viewWidth);
    for (let x = 0; x <= viewWidth; x += xInterval) {
        const canvasX = padding + x * scale.x;
        if (canvasX - lastXPos > 40) {
            ctx.beginPath();
            ctx.moveTo(canvasX, 0);
            ctx.lineTo(canvasX, canvas.height - padding);
            ctx.stroke();
            ctx.fillText(`${x.toFixed(0)}m`, canvasX - 10, canvas.height - padding + 15);
            lastXPos = canvasX;
        }
    }

    let lastYPos = Infinity;
    const yInterval = getNiceInterval(viewHeight);
    for (let y = 0; y <= viewHeight; y += yInterval) {
        const canvasY = canvas.height - padding - y * scale.y;
        if (lastYPos - canvasY > 20) {
            ctx.beginPath();
            ctx.moveTo(padding, canvasY);
            ctx.lineTo(canvas.width, canvasY);
            ctx.stroke();
            ctx.fillText(`${y.toFixed(0)}m`, 5, canvasY + 3);
            lastYPos = canvasY;
        }
    }
    
    ctx.strokeStyle = "rgba(234, 234, 234, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, 0);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width, canvas.height - padding);
    ctx.stroke();
    ctx.lineWidth = 1;

    // GAMBAR TARGET
    const targetCanvasX = padding + target.x * scale.x;
    const targetCanvasY = canvas.height - padding - target.y * scale.y;
    const targetRadiusCanvas = target.radius * scale.x;
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(targetCanvasX, targetCanvasY, targetRadiusCanvas, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(targetCanvasX, targetCanvasY, targetRadiusCanvas * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(targetCanvasX, targetCanvasY, targetRadiusCanvas * 0.3, 0, Math.PI * 2);
    ctx.fill();
}

function startSimulation() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    const angle = parseFloat(angleInput.value);
    const velocity = parseFloat(velocityInput.value);
    const gravity = parseFloat(gravityInput.value);
    const angleInRadians = angle * Math.PI / 180;

    const vx = velocity * Math.cos(angleInRadians);
    const vy = velocity * Math.sin(angleInRadians);

    const totalTime = (2 * vy) / gravity;
    const maxDistance = vx * totalTime;
    const maxHeight = Math.pow(vy, 2) / (2 * gravity);

    maxDistanceSpan.textContent = maxDistance.toFixed(2);
    maxHeightSpan.textContent = maxHeight.toFixed(2);
    timeOfFlightSpan.textContent = totalTime.toFixed(2);
    saveResult(maxDistance, maxHeight);

    launchSound.play();
    launchSound.pause();
    launchSound.currentTime = 0;
    launchSound.play();

    const padding = 40;
    const viewWidth = Math.max(DEFAULT_VIEW_WIDTH_METERS, maxDistance);
    const viewHeight = Math.max(viewWidth * (canvas.height / canvas.width), maxHeight);

    const scale = {
        x: (canvas.width - padding * 2) / viewWidth,
        y: (canvas.height - padding) / viewHeight
    };

    let startTime;
    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsedTime = (timestamp - startTime) / 1000;

        drawGridAndScale(scale, viewWidth, viewHeight);

        const currentX_meters = vx * elapsedTime;
        const currentY_meters = (vy * elapsedTime) - (0.5 * gravity * elapsedTime * elapsedTime);
        
        const canvasX = padding + currentX_meters * scale.x;
        const canvasY = canvas.height - padding - currentY_meters * scale.y;

        ctx.beginPath();
        ctx.strokeStyle = "cyan";
        ctx.lineWidth = 3;
        ctx.moveTo(padding, canvas.height - padding);
        for (let t = 0; t <= elapsedTime && t <= totalTime; t += 0.01) {
            const pathX = padding + (vx * t) * scale.x;
            const pathY = canvas.height - padding - ((vy * t) - (0.5 * gravity * t * t)) * scale.y;
            ctx.lineTo(pathX, pathY);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#00F5D4";
        ctx.fill();

        if (elapsedTime < totalTime) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            impactSound.play();
            impactSound.pause();
            impactSound.currentTime = 0;
            impactSound.play();
            drawGridAndScale(scale, viewWidth, viewHeight);
            ctx.beginPath();
            ctx.strokeStyle = "cyan";
            ctx.lineWidth = 3;
            ctx.moveTo(padding, canvas.height - padding);
            for (let t = 0; t <= totalTime; t += 0.01) {
                const pathX = padding + (vx * t) * scale.x;
                const pathY = canvas.height - padding - ((vy * t) - (0.5 * gravity * t * t)) * scale.y;
                ctx.lineTo(pathX, pathY);
            }
            ctx.stroke();
            if (Math.abs(maxDistance - target.x) <= target.radius) {
                setTimeout(() => alert("🎯 TEPAT SASARAN!"), 100);
            }
        }
    }
    animationFrameId = requestAnimationFrame(animate);
}


// --- BAGIAN 4: FUNGSI API ---
async function saveResult(distance, height) {
    try {
        // 1. Ambil token dari browser
        const token = localStorage.getItem('token');
        const resultData = {
            angle: parseFloat(angleInput.value),
            velocity: parseFloat(velocityInput.value),
            distance: distance,
            height: height
        };
        const response = await fetch('/api/simulation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 2. Pastikan token disertakan di sini dengan benar
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(resultData)
        });
        if (!response.ok) throw new Error('Gagal menyimpan data.');
        fetchHistory();
    } catch (error) {
        console.error("Gagal saat mencoba menyimpan hasil:", error);
    }
}

async function fetchHistory() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const response = await fetch('/api/history', {
            headers: {
                // 3. Pastikan token juga disertakan di sini
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Gagal memuat riwayat.');
        const history = await response.json();
        historyList.innerHTML = '';
        if (history.length === 0) {
            historyList.innerHTML = '<li>Belum ada riwayat.</li>';
            return;
        }
        history.forEach(item => {
            const li = document.createElement('li');
            const textSpan = document.createElement('span');
            textSpan.textContent = `Sudut: ${item.angle}°, Kecepatan: ${item.velocity} m/s ➔ Jarak: ${item.distance.toFixed(2)} m`;
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.className = 'delete-item-btn';
            deleteBtn.onclick = () => handleDelete(item._id, li);
            li.appendChild(textSpan);
            li.appendChild(deleteBtn);
            historyList.appendChild(li);
        });
    } catch (error) {
        console.error('Error mengambil riwayat:', error);
        historyList.innerHTML = '<li>Gagal memuat riwayat.</li>';
    }
}

async function handleDelete(id, listItem) {
    if (!confirm("Anda yakin ingin menghapus riwayat ini?")) return;
    try {
        const response = await fetch(`/api/history/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Gagal menghapus riwayat.');
        listItem.remove();
    } catch (error) {
        alert("Gagal menghapus riwayat.");
    }
}

async function handleDeleteAll() {
    if (!confirm("PERINGATAN: Anda akan menghapus SEMUA riwayat. Lanjutkan?")) return;
    try {
        const response = await fetch('/api/history', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Gagal menghapus semua riwayat.');
        historyList.innerHTML = '<li>Belum ada riwayat.</li>';
    } catch (error) {
        alert("Gagal menghapus semua riwayat.");
    }
}

// --- BAGIAN 5: EVENT LISTENERS & PEMICU ---
function generateTarget() {
    target.x = (Math.random() * 0.7 + 0.2) * DEFAULT_VIEW_WIDTH_METERS;
    target.y = 0;
}

launchButton.addEventListener('click', startSimulation);
deleteAllButton.addEventListener('click', handleDeleteAll);

document.addEventListener('DOMContentLoaded', () => {
    if (token) {
        generateTarget();
        fetchHistory();
        const initialScale = {
            x: (canvas.width - 80) / DEFAULT_VIEW_WIDTH_METERS,
            y: (canvas.height - 40) / (DEFAULT_VIEW_WIDTH_METERS * (canvas.height / canvas.width))
        };
        drawGridAndScale(initialScale, DEFAULT_VIEW_WIDTH_METERS, DEFAULT_VIEW_WIDTH_METERS * (canvas.height/canvas.width));
    }
});