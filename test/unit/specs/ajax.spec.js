import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { request } from 'src/lib/streak-api/ajax';

// Captures the XHR calls made by `request()` so we can assert on the URL/body
// it builds, without touching the network.
function stubXhr(sent) {
  class FakeXhr {
    addEventListener(name, fn) { if (name === 'load') this.onLoad = fn; }
    open(method, url) { sent.method = method; sent.url = url; }
    setRequestHeader() {}
    send(body) {
      sent.body = body;
      this.status = 200;
      this.responseText = '{}';
      this.onLoad.call(this);
    }
  }
  return FakeXhr;
}

describe('streak-api ajax', () => {
  let sent;

  beforeEach(() => {
    sent = {};
    vi.stubGlobal('XMLHttpRequest', stubXhr(sent));
    vi.stubGlobal('gapi', {
      auth2: {
        getAuthInstance: () => ({
          currentUser: { get: () => ({ getAuthResponse: () => ({ id_token: 'TOKEN123' }) }) }
        })
      }
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  // Regression: `method` was referenced before its `const` declaration. Babel's
  // `var` hoisting masked it; without Babel it throws a TDZ ReferenceError.
  it('does not throw when injecting the id_token on a POST', async () => {
    await expect(
      request({ method: 'POST', body: { operation: 'update-user-info' } })
    ).resolves.toBeDefined();
  });

  it('puts the id_token in the query string, for POST as well as GET', async () => {
    await request({ method: 'POST', body: { operation: 'update-user-info' } });
    expect(sent.method).toBe('POST');
    expect(sent.url).toContain('id_token=TOKEN123');
    expect(sent.body).not.toContain('id_token');

    await request({ qs: {} });
    expect(sent.method).toBe('GET');
    expect(sent.url).toContain('id_token=TOKEN123');
  });

  it('keeps an explicitly supplied id_token', async () => {
    await request({ qs: { id_token: 'EXPLICIT' } });
    expect(sent.url).toContain('id_token=EXPLICIT');
  });
});
