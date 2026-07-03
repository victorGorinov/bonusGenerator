import { initAuthForm } from '/auth-form.js';

initAuthForm({
  formId:     'register-form',
  endpoint:   '/api/auth/register',
  fields:     ['name', 'email', 'password'],
  redirectTo: '/retention-calendar.html',
  errorMap:   { EMAIL_TAKEN: 'err_taken' },
  i18n: {
    en: { sub: 'Create your workspace', name: 'Name', email: 'Email', password: 'Password (min 8 characters)',
          register: 'Create account', hasaccount: 'Already have an account?', signin: 'Sign in',
          err_taken: 'This email is already registered.' },
    ru: { sub: 'Создание рабочего пространства', name: 'Имя', email: 'Email', password: 'Пароль (мин. 8 символов)',
          register: 'Создать аккаунт', hasaccount: 'Уже есть аккаунт?', signin: 'Войти',
          err_taken: 'Этот email уже зарегистрирован.' },
  },
});
