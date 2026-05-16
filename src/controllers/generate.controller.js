import * as bonusService from '../services/bonus.service.js';

export function generate(req, res) {
  try {
    const cfg = bonusService.generate(req.body || {});
    res.json({ cfg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not generate configuration' });
  }
}

export function recalc(req, res) {
  try {
    const { cfg, overrides } = req.body || {};
    res.json(bonusService.recalc(cfg, overrides));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Recalc failed' });
  }
}
