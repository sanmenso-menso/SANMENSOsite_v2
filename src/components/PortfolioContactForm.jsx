import React, { useEffect, useRef, useState } from 'react';

function Turnstile({ siteKey, onToken, onReset, widgetRef }) {
  const target = useRef(null);
  useEffect(() => {
    let active = true;
    const render = () => {
      if (!active || !window.turnstile) return;
      widgetRef.current = window.turnstile.render(target.current, {
        sitekey: siteKey,
        action: 'portfolio-contact',
        callback: onToken,
        'expired-callback': onReset,
        'error-callback': onReset,
        size: 'flexible',
        theme: 'light',
      });
    };
    let script = document.querySelector('script[data-portfolio-turnstile]');
    if (window.turnstile) render();
    else {
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.dataset.portfolioTurnstile = 'true';
        document.head.appendChild(script);
      }
      script.addEventListener('load', render);
      script.addEventListener('error', onReset);
    }
    return () => {
      active = false;
      script?.removeEventListener('load', render);
      script?.removeEventListener('error', onReset);
      if (widgetRef.current !== null && window.turnstile)
        window.turnstile.remove(widgetRef.current);
      widgetRef.current = null;
    };
  }, [siteKey, onToken, onReset, widgetRef]);
  return <div className="portfolio-turnstile" ref={target} />;
}

export default function PortfolioContactForm() {
  const [connection, setConnection] = useState({ status: 'loading', siteKey: '' });
  const [status, setStatus] = useState('idle');
  const [notice, setNotice] = useState('');
  const [token, setToken] = useState('');
  const widget = useRef(null);
  const submission = useRef(null);
  const sending = useRef(false);
  const controller = useRef(null);
  const onReset = React.useCallback(() => setToken(''), []);

  useEffect(() => {
    const abort = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => abort.abort(), 10000);
    fetch('/api/contact', { signal: abort.signal, cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        if (active && !abort.signal.aborted)
          setConnection({
            status: data.available && data.siteKey ? 'ready' : 'unavailable',
            siteKey: data.siteKey || '',
          });
      })
      .catch(() => {
        if (active) setConnection({ status: 'unavailable', siteKey: '' });
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      active = false;
      abort.abort();
      window.clearTimeout(timeout);
      controller.current?.abort();
    };
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (sending.current || connection.status !== 'ready' || !token) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    if (!submission.current) submission.current = crypto.randomUUID();
    sending.current = true;
    setStatus('sending');
    setNotice('');
    controller.current = new AbortController();
    const timeout = window.setTimeout(() => controller.current?.abort(), 30000);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, token, submissionId: submission.current }),
        signal: controller.current.signal,
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true)
        throw new Error(
          result.error ||
            '送信を確認できませんでした。再試行するか、メール・Discordからご連絡ください。',
        );
      setStatus('sent');
      setNotice('送信しました。ご連絡ありがとうございます。');
      form.reset();
      submission.current = null;
    } catch (error) {
      setStatus('error');
      setNotice(
        error.name === 'AbortError'
          ? '送信を確認できませんでした。入力内容は残っています。再試行するか、メール・Discordからご連絡ください。'
          : error.message,
      );
    } finally {
      window.clearTimeout(timeout);
      sending.current = false;
      setToken('');
      if (window.turnstile && widget.current !== null) window.turnstile.reset(widget.current);
    }
  }

  return (
    <form
      className="portfolio-contact-form"
      onSubmit={submit}
      onChange={() => {
        if (!sending.current) {
          submission.current = null;
          setStatus('idle');
          setNotice('');
        }
      }}
    >
      <fieldset disabled={status === 'sending'}>
        <legend>フォームから相談する</legend>
        <div className="portfolio-form-grid">
          <label>
            名前 <span>必須</span>
            <input name="name" autoComplete="name" maxLength={120} required />
          </label>
          <label>
            メールアドレス <span>必須</span>
            <input name="email" type="email" autoComplete="email" maxLength={254} required />
          </label>
          <label className="portfolio-form-wide">
            求めている役割（ロール） <span>必須</span>
            <input
              name="role"
              list="portfolio-contact-roles"
              placeholder="作曲、編曲、映像、DJなど。複数でも構いません。"
              maxLength={160}
              required
            />
            <datalist id="portfolio-contact-roles">
              <option value="作曲・編曲" />
              <option value="映像制作・編集" />
              <option value="リミックス" />
              <option value="DJ・ライブ出演" />
              <option value="デザイン" />
              <option value="SE制作・音響" />
            </datalist>
          </label>
          <label>
            納期 <span>任意</span>
            <input name="deadline" maxLength={100} />
          </label>
          <label>
            予算 <span>任意</span>
            <input name="budget" maxLength={100} />
          </label>
          <label className="portfolio-form-wide">
            メッセージ（本文） <span>必須</span>
            <textarea
              name="message"
              rows={7}
              placeholder="ご相談内容、参考作品や資料のリンクなどをお書きください。"
              maxLength={5000}
              required
            />
          </label>
        </div>
        <div className="portfolio-honeypot" aria-hidden="true">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <p className="portfolio-form-note">入力内容はお問い合わせへの対応のために使用します。</p>
        {connection.status === 'ready' && (
          <Turnstile
            siteKey={connection.siteKey}
            onToken={setToken}
            onReset={onReset}
            widgetRef={widget}
          />
        )}
        {connection.status !== 'ready' && (
          <p className="portfolio-form-notice" role="status">
            {connection.status === 'loading'
              ? '送信の準備を確認しています…'
              : 'フォームからの送信は準備中です。メールまたはDiscordからご連絡ください。'}
          </p>
        )}
        <button
          className="portfolio-submit"
          type="submit"
          disabled={connection.status !== 'ready' || !token || status === 'sending'}
        >
          {status === 'sending' ? '送信しています…' : '送信する'}
        </button>
        {connection.status === 'ready' && !token && status !== 'sending' && (
          <p className="portfolio-form-note">送信前の確認が完了すると送信できます。</p>
        )}
      </fieldset>
      {notice && (
        <p className="portfolio-form-notice" role={status === 'error' ? 'alert' : 'status'}>
          {notice}
        </p>
      )}
    </form>
  );
}
