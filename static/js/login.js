document.getElementById('login-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const role = document.getElementById('role').value;

  const adminCreds = { username: 'admin', password: 'admin123' };
  const studentCreds = { username: 'student', password: 'student123' };

  if (role === 'admin' && username === adminCreds.username && password === adminCreds.password) {
    window.location.href = '/admin';
  } else if (role === 'student' && username === studentCreds.username && password === studentCreds.password) {
    window.location.href = '/exam';
  } else {
    document.getElementById('login-error').innerText = 'Invalid credentials or role selected.';
  }
});
