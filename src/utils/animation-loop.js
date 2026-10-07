/** A bounded loop that suspends outside the visible page and resumes without a time jump. */
export function createAnimationLoop(draw, { element, active = () => true, fps = () => 60 } = {}) {
  let frame = null;
  let previous = null;
  let inView = true;
  let disposed = false;
  const visible = () => !document.hidden && inView && !disposed;
  const stop = () => {
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    previous = null;
  };
  const schedule = () => {
    if (visible() && active() && frame === null) frame = window.requestAnimationFrame(tick);
  };
  const tick = (now) => {
    frame = null;
    if (!visible() || !active()) { previous = null; return; }
    const interval = 1000 / Math.max(1, fps());
    const elapsed = previous === null ? interval : now - previous;
    if (elapsed >= interval - 0.5) {
      previous = now;
      draw(Math.min(elapsed, 100), now);
    }
    schedule();
  };
  const invalidate = () => {
    stop();
    if (visible()) draw(0, performance.now());
    schedule();
  };
  const onVisibility = () => { if (visible()) invalidate(); else stop(); };
  document.addEventListener('visibilitychange', onVisibility);
  const observer = element && typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        onVisibility();
      }) : null;
  observer?.observe(element);
  invalidate();
  return { invalidate, stop, dispose() {
    disposed = true;
    stop();
    observer?.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
  } };
}
