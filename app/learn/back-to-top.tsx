import { useEffect, useState, type CSSProperties } from 'react';
import { ArrowUp } from 'lucide-react';
import { backToLearnTop, LEARN_BACK_TO_TOP_EVENT } from './scroll-navigation';

export function LearnBackToTop() {
  const [reading, setReading] = useState({ visible: false, progress: 0 });
  const [flight, setFlight] = useState({ running: false, duration: 900 });
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>('.learn-shell');
    if (!shell) return;
    let frame = 0;
    let scrollFrame = 0, landing: ReturnType<typeof setTimeout> | undefined;
    let traveling = false;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stop = () => {
      cancelAnimationFrame(scrollFrame);
      clearTimeout(landing);
      traveling = false;
      setFlight(previous => previous.running ? { ...previous, running: false } : previous);
    };
    const returnToTop = (event: Event) => {
      event.preventDefault();
      if (traveling) return;
      shell.querySelector<HTMLElement>('#learn-content')?.focus({ preventScroll: true });
      const start = shell.scrollTop;
      if (media.matches || start < 1) {
        shell.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }
      traveling = true;
      const duration = Math.min(1200, Math.max(720, 500 + Math.sqrt(start) * 8));
      setFlight({ running: true, duration });
      const began = performance.now();
      const glide = (now: number) => {
        const t = Math.min(1, Math.max(0, (now - began) / duration));
        const eased = t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
        shell.scrollTo({ top: start * (1 - eased), behavior: 'instant' });
        if (t < 1) scrollFrame = requestAnimationFrame(glide);
        else landing = setTimeout(stop, 160);
      };
      scrollFrame = requestAnimationFrame(glide);
    };
    const interrupt = (event: Event) => {
      if (event.type === 'keydown' && !['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Escape'].includes((event as KeyboardEvent).key)) return;
      if (event.target instanceof Element && event.target.closest('.learn-back-to-top')) return;
      if (traveling) stop();
    };
    const reduceMotion = () => { if (traveling && media.matches) { stop(); shell.scrollTo({ top: 0, behavior: 'instant' }); } };
    const update = () => {
      frame = 0;
      const distance = shell.scrollHeight - shell.clientHeight;
      const visible = shell.scrollTop > Math.min(400, shell.clientHeight * .6);
      const progress = distance > 0 ? Math.min(1, Math.max(0, Math.round(shell.scrollTop / distance * 100) / 100)) : 0;
      setReading(previous => previous.visible === visible && previous.progress === progress ? previous : { visible, progress });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    shell.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener(LEARN_BACK_TO_TOP_EVENT, returnToTop);
    shell.addEventListener('wheel', interrupt, { passive: true });
    shell.addEventListener('touchstart', interrupt, { passive: true });
    shell.addEventListener('pointerdown', interrupt, { passive: true });
    document.addEventListener('keydown', interrupt);
    media.addEventListener('change', reduceMotion);
    window.addEventListener('resize', schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(shell);
    const content = shell.querySelector('main');
    if (content) observer.observe(content);
    update();
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(scrollFrame);
      clearTimeout(landing);
      observer.disconnect();
      shell.removeEventListener('scroll', schedule);
      window.removeEventListener(LEARN_BACK_TO_TOP_EVENT, returnToTop);
      shell.removeEventListener('wheel', interrupt);
      shell.removeEventListener('touchstart', interrupt);
      shell.removeEventListener('pointerdown', interrupt);
      document.removeEventListener('keydown', interrupt);
      media.removeEventListener('change', reduceMotion);
      window.removeEventListener('resize', schedule);
    };
  }, []);
  return reading.visible || flight.running ? <button type="button" className="learn-back-to-top" data-traveling={flight.running || undefined} style={{ '--learn-top-duration': `${flight.duration}ms` } as CSSProperties} aria-label="Back to top" title="Back to top" onClick={backToLearnTop}>
    <svg className="learn-back-to-top-ring" viewBox="0 0 48 48" aria-hidden="true"><circle className="learn-back-to-top-track" cx="24" cy="24" r="21"/><circle className="learn-back-to-top-progress" cx="24" cy="24" r="21" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - reading.progress * 100}/></svg>
    <span className="learn-back-to-top-arrow" aria-hidden="true"><ArrowUp size={19} strokeWidth={1.8}/></span>
  </button> : null;
}
