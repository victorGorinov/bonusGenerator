import { Resend }   from 'resend';
import { RESEND_API_KEY, NOTIFY_EMAIL } from '../config/index.js';
import { AppError } from '../errors/AppError.js';

const ESC = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

export async function signup(req, res, next) {
  const { name, email, role } = req.body;   // validated by SignupSchema
  const resend = new Resend(RESEND_API_KEY);
  try {
    await resend.emails.send({
      from:    'BonusEngine <onboarding@resend.dev>',
      to:      NOTIFY_EMAIL,
      subject: `New signup: ${ESC(name || 'Anonymous')} — BonusEngine`,
      html: `
        <h2>New Early Access Request</h2>
        <table cellpadding="6" style="border-collapse:collapse">
          <tr><td><b>Name</b></td><td>${ESC(name  || '—')}</td></tr>
          <tr><td><b>Email</b></td><td>${ESC(email)}</td></tr>
          <tr><td><b>Role</b></td><td>${ESC(role  || '—')}</td></tr>
        </table>
      `,
    });
    res.json({ ok: true });
  } catch (err) {
    next(new AppError('Failed to send email', 500, 'EMAIL_ERROR'));
  }
}
