import { initAuthForm } from '/auth-form.js';

initAuthForm({
  formId:     'login-form',
  endpoint:   '/api/auth/login',
  fields:     ['email', 'password'],
  redirectTo: '/retention-calendar.html',
  errorMap:   { INVALID_CREDENTIALS: 'err_creds' },
  i18n: {
    en: { sub: 'Sign in to your workspace', email: 'Email', password: 'Password', signin: 'Sign in',
          noaccount: 'No account?', register: 'Register', err_creds: 'Invalid email or password.' },
    ru: { sub: 'Вход в рабочее пространство', email: 'Email', password: 'Пароль', signin: 'Войти',
          noaccount: 'Нет аккаунта?', register: 'Регистрация', err_creds: 'Неверный email или пароль.' },
  },
});
