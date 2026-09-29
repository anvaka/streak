import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import uploadJsonFile from 'src/lib/gapi/uploadJsonFile';
import getErrorMessage from 'src/lib/gapi/getErrorMessage';
import saveSettings from 'src/lib/store/saveSettings';
import setColumnCombine from 'src/lib/store/setColumnCombine';
import NumberCard from 'src/components/insights/NumberCard.vue';

vi.mock('src/lib/gapi/renewAuth.js', () => ({ default: () => Promise.resolve() }));
vi.mock('src/lib/store/cachingDocs.js', () => ({
  resetProjectFileCache() {}, resetSettings() {}, resetSheetDataCache() {},
}));

afterEach(() => {
  delete globalThis.gapi;
});

// gapi.client.request answering with `responses` in turn: an object with
// `status` rejects, anything else resolves.
function fakeGapi(responses) {
  const request = vi.fn(() => {
    const response = responses.shift();
    return response && response.status ? Promise.reject(response) : Promise.resolve(response);
  });
  globalThis.gapi = { client: { request } };
  return request;
}
const EXPIRED = { status: 401, result: { error: { status: 'UNAUTHENTICATED', message: 'Invalid Credentials' } } };

describe('uploading the settings file', () => {
  it('retries the same update after sign-in is renewed, and finishes', async () => {
    const request = fakeGapi([EXPIRED, { result: { id: 'f1' } }]);
    const response = await uploadJsonFile({ name: 'streak-settings.json' }, '{}', 'f1');
    expect(response).toEqual({ result: { id: 'f1' } });
    expect(request.mock.calls.map(([options]) => [options.method, options.path])).toEqual([
      ['PATCH', '/upload/drive/v3/files/f1'],
      ['PATCH', '/upload/drive/v3/files/f1'],
    ]);
    expect(request.mock.calls[1][0].body).toContain('"name":"streak-settings.json"');
  });

  it('remembers a settings file it created, so the next change updates it', async () => {
    const request = fakeGapi([{ result: { id: 'new-file' } }, { result: { id: 'new-file' } }]);
    const project = {
      id: 'p1', headers: [{ title: 'Date', valueType: 'date' }, { title: 'Minutes', valueType: 'number' }],
      settings: null, settingsFileId: null, projectHistory: { numberColumns: [{ columnIndex: 1, combine: 'average' }] },
    };
    project.saveSettings = change => saveSettings(project, change);

    await setColumnCombine(project, 1, 'sum');
    expect(project.settingsFileId).toBe('new-file');
    expect(project.headers[1].combine).toBe('sum');
    expect(project.projectHistory.numberColumns[0].combine).toBe('sum');

    await setColumnCombine(project, 1, undefined);
    expect(request.mock.calls.map(([options]) => options.method)).toEqual(['POST', 'PATCH']);
    expect(request.mock.calls[1][0].body).not.toContain('"combine"');
  });
});

describe('saving whether a column adds up', () => {
  function project() {
    const p = {
      id: 'p1', spreadsheetId: 's1',
      headers: [{ title: 'Date', valueType: 'date' }, { title: 'Weight', valueType: 'number' },
        { title: '', valueType: 'text' }, { title: 'Minutes', valueType: 'number' }],
      settings: null, settingsFileId: null,
      projectHistory: { numberColumns: [{ columnIndex: 1, combine: 'average' }, { columnIndex: 3, combine: 'average' }] },
    };
    p.saveSettings = change => saveSettings(p, change);
    return p;
  }

  it('changes only the settings file, never the sheet or the other columns', async () => {
    const request = fakeGapi([{ result: { id: 'f1' } }]);
    const p = project();
    await setColumnCombine(p, 3, 'sum');
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0].path).toBe('/upload/drive/v3/files');
    expect(p.settings).toEqual({ fields: [{ title: 'Minutes', combine: 'sum' }] });
  });

  it('keeps both of two changes made at once, in one file', async () => {
    let answer;
    const request = vi.fn(() => new Promise(resolve => { answer = resolve; }));
    globalThis.gapi = { client: { request } };
    const p = project();
    const first = setColumnCombine(p, 1, 'sum');
    const second = setColumnCombine(p, 3, 'sum');
    await new Promise(r => setTimeout(r));
    expect(request).toHaveBeenCalledTimes(1); // the second waits for the first
    answer({ result: { id: 'f1' } });
    await new Promise(r => setTimeout(r));
    answer({ result: { id: 'f1' } });
    await Promise.all([first, second]);
    expect(request.mock.calls.map(([options]) => options.method)).toEqual(['POST', 'PATCH']);
    expect(JSON.parse(request.mock.calls[1][0].body.split('\r\n\r\n')[2].split('\r\n--')[0]))
      .toEqual({ fields: [{ title: 'Weight', combine: 'sum' }, { title: 'Minutes', combine: 'sum' }] });
    expect(p.projectHistory.numberColumns.map(c => c.combine)).toEqual(['sum', 'sum']);
  });

  it('leaves the loaded settings alone when saving fails, and later saves still go', async () => {
    fakeGapi([{ status: 500, statusText: 'Server Error' }, { result: { id: 'f1' } }]);
    const p = project();
    await expect(setColumnCombine(p, 1, 'sum')).rejects.toBeTruthy();
    expect(p.settings).toBe(null);
    expect(p.projectHistory.numberColumns[0].combine).toBe('average');
    await setColumnCombine(p, 3, 'sum');
    expect(p.settings).toEqual({ fields: [{ title: 'Minutes', combine: 'sum' }] });
  });
});

describe('a failed call', () => {
  it('is described by what Google said, not "[object Object]"', () => {
    expect(getErrorMessage({ status: 403, result: { error: { message: 'Rate limit exceeded' } } }))
      .toBe('Rate limit exceeded');
    expect(getErrorMessage(new Error('Network down'))).toBe('Network down');
    expect(getErrorMessage({ status: 500, statusText: 'Server Error' })).toBe('Request failed (500 Server Error)');
  });
});

describe('switching a number card between entries and totals', () => {
  function mountCard(save) {
    const project = {
      canEdit: true,
      headers: [{ title: 'Date', valueType: 'date' }, { title: 'Minutes', valueType: 'number' }],
      projectHistory: { numberColumns: [] },
      saveSettings: save,
    };
    const today = new Date();
    const contributions = {
      x: { date: today, rows: [{ cells: [{ value: today }, { value: 30 }] }] },
    };
    return mount(NumberCard, {
      props: { project, column: { columnIndex: 1, title: 'Minutes', combine: 'average' }, contributions, note: '' },
      global: { mocks: { $route: { query: {} } } },
    });
  }
  const pick = (w, label) => w.findAll('.nc-combine button').find(b => b.text() === label).trigger('click');

  it('shows the choice at once, without reloading, while it saves', async () => {
    let finish;
    const w = mountCard(() => new Promise(resolve => { finish = resolve; }));
    await pick(w, 'totals');
    expect(w.find('.insight-number').text()).toBe('30 total');
    expect(w.text()).toContain('Saving...');
    finish();
    await new Promise(r => setTimeout(r));
    expect(w.text()).not.toContain('Saving...');
    expect(w.find('.insight-number').text()).toBe('30 total');
  });

  it('goes back, and says why, when saving fails', async () => {
    const w = mountCard(() => Promise.reject({ status: 403, result: { error: { message: 'Insufficient permissions' } } }));
    await pick(w, 'totals');
    await new Promise(r => setTimeout(r));
    expect(w.find('.insight-number').text()).toBe('30 trend');
    expect(w.text()).toContain('Could not save: Insufficient permissions');
  });
});
