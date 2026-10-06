import { initAuthForm } from '/auth-form.js';

// Testing-only: clicking "Log In" with no credentials typed logs in as a fixed
// test account instead of requiring manual entry. Fields left blank fall back
// to this account; anything the user typed is left untouched.
const TEST_ACCOUNT = { email: 'test3@test.com', password: 'Test12345!' };
document.getElementById('login-form').addEventListener('submit', () => {
  const emailEl = document.getElementById('f-email');
  const passEl = document.getElementById('f-password');
  if (!emailEl.value.trim()) emailEl.value = TEST_ACCOUNT.email;
  if (!passEl.value) passEl.value = TEST_ACCOUNT.password;
});

initAuthForm({
  formId:     'login-form',
  endpoint:   '/api/auth/login',
  fields:     ['email', 'password'],
  redirectTo: '/campaign-generator.html',
  errorMap:   { INVALID_CREDENTIALS: 'err_creds' },
  i18n: {
    en: { sub: 'Sign in to your workspace', email: 'Email', password: 'Password', signin: 'Sign in',
          noaccount: 'No account?', register: 'Register', err_creds: 'Invalid email or password.' },
    ru: { sub: 'Вход в рабочее пространство', email: 'Email', password: 'Пароль', signin: 'Войти',
          noaccount: 'Нет аккаунта?', register: 'Регистрация', err_creds: 'Неверный email или пароль.' },
  },
});
