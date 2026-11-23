(() => {
  const PASSWORD = 'optimiza2cr';
  const SESSION_KEY = 'optimiza2_authenticated';

  const loginScreen = document.getElementById('loginScreen');
  const appShell = document.getElementById('appShell');
  const loginForm = document.getElementById('loginForm');
  const passwordInput = document.getElementById('loginPassword');
  const errorMessage = document.getElementById('loginError');
  const togglePassword = document.getElementById('togglePassword');
  const logoutButton = document.getElementById('logoutButton');

  function showApp() {
    loginScreen.hidden = true;
    appShell.hidden = false;
  }

  function showLogin() {
    sessionStorage.removeItem(SESSION_KEY);
    appShell.hidden = true;
    loginScreen.hidden = false;
    passwordInput.value = '';
    errorMessage.textContent = '';
    passwordInput.focus();
  }

  if (sessionStorage.getItem(SESSION_KEY) === 'true') {
    showApp();
  } else {
    appShell.hidden = true;
    loginScreen.hidden = false;
    passwordInput.focus();
  }

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (passwordInput.value === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      errorMessage.textContent = '';
      showApp();
    } else {
      errorMessage.textContent = 'La contraseña es incorrecta. Inténtalo de nuevo.';
      passwordInput.select();
    }
  });

  togglePassword.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    togglePassword.textContent = isHidden ? 'Ocultar' : 'Mostrar';
    togglePassword.setAttribute('aria-label', isHidden ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });

  logoutButton.addEventListener('click', showLogin);
})();
