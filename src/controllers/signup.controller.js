import { Resend } from 'resend';
import { RESEND_API_KEY, NOTIFY_EMAIL } from '../config/index.js';

const ESC      = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function signup(req, res) {
  const { name, email, role } = req.body || {};

  if (!email || !EMAIL_RE.test(String(email))) return res.status(400).json({ error: 'valid email required' });
  if (name && String(name).length > 200) return res.status(400).json({ error: 'name too long' });
  if (role && String(role).length > 100) return res.status(400).json({ error: 'role too long' });

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
    console.error('Resend error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
}
