// @ts-check
const RECIPIENT = 'sanmensoworks@gmail.com';
const emailPattern = /^[^\s<>@\r\n]+@[^\s<>@\r\n]+\.[^\s<>@\r\n]+$/;
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

function configured(env) {
  return Boolean(
    env.RESEND_API_KEY &&
    emailPattern.test(env.CONTACT_FROM || '') &&
    env.TURNSTILE_SITE_KEY &&
    env.TURNSTILE_SECRET_KEY,
  );
}

export function validateContact(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new Error('入力内容を確認してください。');
  /** @type {Record<string, string>} */
  const result = {};
  /** @type {Array<[string, string, number, boolean]>} */
  const fields = [
    ['name', '名前', 120, true],
    ['email', 'メールアドレス', 254, true],
    ['role', '求めている役割', 160, true],
    ['deadline', '納期', 100, false],
    ['budget', '予算', 100, false],
    ['message', 'メッセージ', 5000, true],
  ];
  for (const [key, label, maximum, required] of fields) {
    if (data[key] !== undefined && typeof data[key] !== 'string')
      throw new Error(`${label}を確認してください。`);
    const value = (data[key] || '').trim();
    if (
      (required && !value) ||
      value.length > maximum ||
      (key !== 'message' && [...value].some((character) => character.charCodeAt(0) < 32))
    ) {
      throw new Error(`${label}を確認してください。`);
    }
    result[key] = value;
  }
  if (!emailPattern.test(result.email)) throw new Error('メールアドレスを確認してください。');
  if (!/^[a-f0-9-]{36}$/i.test(data.submissionId || ''))
    throw new Error('ページを再読込して再度お試しください。');
  return result;
}

async function boundedJson(request) {
  if (Number(request.headers.get('content-length')) > 24000)
    throw new Error('入力内容が長すぎます。');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('入力内容がありません。');
  let size = 0;
  const chunks = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 24000) throw new Error('入力内容が長すぎます。');
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

/** No user content or provider responses are logged. The destination is server-owned. */
export async function handleContact(request, env, send = fetch) {
  if (request.method === 'GET')
    return json({
      available: configured(env),
      siteKey: configured(env) ? env.TURNSTILE_SITE_KEY : '',
    });
  if (request.method !== 'POST') return json({ error: 'この操作は利用できません。' }, 405);
  const origin = new URL(request.url).origin;
  if (request.headers.get('origin') !== origin)
    return json({ error: '送信元を確認できません。ページを再読込してください。' }, 403);
  if (!configured(env))
    return json(
      { error: '現在フォームからの送信を準備中です。メールまたはDiscordからご連絡ください。' },
      503,
    );
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json')
    return json({ error: '入力形式が不正です。' }, 415);
  let data, fields;
  try {
    data = await boundedJson(request);
    fields = validateContact(data);
    if (data.website) return json({ error: '送信できませんでした。' }, 400);
    if (typeof data.token !== 'string' || !data.token || data.token.length > 2048)
      return json({ error: '送信前の確認を完了してください。' }, 400);
  } catch (error) {
    return json(
      { error: error instanceof SyntaxError ? '入力形式が不正です。' : error.message },
      400,
    );
  }

  try {
    const verificationResponse = await send(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: data.token }),
        signal: AbortSignal.timeout(10000),
      },
    );
    const verification = verificationResponse.ok ? await verificationResponse.json() : {};
    if (
      !verification.success ||
      verification.hostname !== new URL(request.url).hostname ||
      verification.action !== 'portfolio-contact'
    ) {
      return json({ error: '送信前の確認に失敗しました。もう一度お試しください。' }, 400);
    }
    const response = await send('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Idempotency-Key': `portfolio-contact/${data.submissionId}`,
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM,
        to: [RECIPIENT],
        reply_to: fields.email,
        subject: `[制作のご相談] ${fields.role} — ${fields.name}`,
        text: `名前: ${fields.name}\nメールアドレス: ${fields.email}\n求めている役割: ${fields.role}\n納期: ${fields.deadline || '未定・相談'}\n予算: ${fields.budget || '未定・相談'}\n\n${fields.message}`,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const result = response.ok ? await response.json() : {};
    if (!response.ok || typeof result.id !== 'string' || !result.id)
      throw new Error('Provider rejected message');
    return json({ ok: true });
  } catch {
    return json(
      {
        error:
          '送信を確認できませんでした。入力内容は残っています。再試行するか、メール・Discordからご連絡ください。',
      },
      502,
    );
  }
}
