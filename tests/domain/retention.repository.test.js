import { describe, it, expect, beforeEach } from 'vitest';

// ── Mock localStorage ─────────────────────────────────────────────────────────
const store = {};
global.localStorage = {
  getItem:    (k)    => store[k] ?? null,
  setItem:    (k, v) => { store[k] = v; },
  removeItem: (k)    => { delete store[k]; },
};
// crypto.randomUUID is already available in Node 24

// Import after mocks are set up
const { repo } = await import('../../public/retention-calendar/repository.js');

beforeEach(() => { Object.keys(store).forEach(k => delete store[k]); });

const DATA = { title: 'Test', type: 'reload', segment: 'all', geo: 'de', startDate: '2025-06-01', endDate: '2025-06-07', status: 'draft', brands: ['default'] };

describe('repository — campaigns', () => {
  it('listCampaigns returns empty array initially', async () => {
    expect(await repo.listCampaigns()).toEqual([]);
  });

  it('saveCampaign creates new campaign with id and timestamps', async () => {
    const saved = await repo.saveCampaign(DATA);
    expect(saved.id).toBeTruthy();
    expect(saved.createdAt).toBeTruthy();
    expect(saved.updatedAt).toBeTruthy();
    expect(saved.title).toBe('Test');
  });

  it('listCampaigns returns saved campaign', async () => {
    await repo.saveCampaign(DATA);
    const list = await repo.listCampaigns();
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe('Test');
  });

  it('getCampaign retrieves by id', async () => {
    const saved = await repo.saveCampaign(DATA);
    const found = await repo.getCampaign(saved.id);
    expect(found?.id).toBe(saved.id);
  });

  it('saveCampaign with existing id updates record', async () => {
    const created = await repo.saveCampaign(DATA);
    await repo.saveCampaign({ ...created, title: 'Updated' });
    const list = await repo.listCampaigns();
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe('Updated');
  });

  it('deleteCampaign removes by id', async () => {
    const saved = await repo.saveCampaign(DATA);
    await repo.deleteCampaign(saved.id);
    expect(await repo.listCampaigns()).toHaveLength(0);
  });

  it('getCampaign returns undefined for unknown id', async () => {
    expect(await repo.getCampaign('nope')).toBeUndefined();
  });
});

describe('repository — templates', () => {
  it('listTemplates returns empty array initially', async () => {
    expect(await repo.listTemplates()).toEqual([]);
  });

  it('saveTemplate creates template with id', async () => {
    const tmpl = await repo.saveTemplate({ name: 'My Template', type: 'reload', segment: 'all', geo: 'de' });
    expect(tmpl.id).toBeTruthy();
    expect(tmpl.name).toBe('My Template');
  });

  it('deleteTemplate removes template', async () => {
    const tmpl = await repo.saveTemplate({ name: 'T1', type: 'reload', segment: 'all', geo: 'de' });
    await repo.deleteTemplate(tmpl.id);
    expect(await repo.listTemplates()).toHaveLength(0);
  });
});
