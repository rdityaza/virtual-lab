// File: auth.js

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

// Jika form registrasi ada di halaman ini, tambahkan event listener
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Mencegah form reload halaman

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Gagal mendaftar.');
            }

            alert('Registrasi berhasil! Silakan login.');
            window.location.href = 'login.html'; // Pindah ke halaman login

        } catch (error) {
            alert(error.message);
        }
    });
}

// Jika form login ada di halaman ini, tambahkan event listener
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Gagal login.');
            }

            // SIMPAN TOKEN KE BROWSER! Ini adalah langkah kuncinya.
            localStorage.setItem('token', data.token);

            alert('Login berhasil!');
            window.location.href = 'index.html'; // Pindah ke halaman simulasi utama

        } catch (error) {
            alert(error.message);
        }
    });
}