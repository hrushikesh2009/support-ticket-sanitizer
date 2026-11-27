import { useEffect, useRef } from 'react';
import { usePreferences } from '../state/PreferencesContext';

const LINE_COUNT = 24;
const SEGMENTS = 72;

export function ContourBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { motionOff, resolvedTheme } = usePreferences();

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = canvas?.parentElement;
    const context = canvas?.getContext('2d');
    if (!canvas || !hero || !context) return;

    const canAnimate = !motionOff && window.matchMedia('(pointer: fine)').matches;
    const dark = resolvedTheme === 'dark';
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = false;
    let pointerX = 0;
    let pointerY = 0;
    let offsetX = 0;
    let offsetY = 0;
    let light: CanvasGradient;

    function draw(time: number) {
      if (!width || !height || !context) return;
      context.clearRect(0, 0, width, height);
      offsetX += (pointerX - offsetX) * 0.065;
      offsetY += (pointerY - offsetY) * 0.065;

      const compact = width < 600;
      const centerX = compact ? 0.74 : 0.69;
      const heightScale = compact ? 0.65 : 1;
      for (let i = LINE_COUNT - 1; i >= 0; i--) {
        const depth = i / (LINE_COUNT - 1);
        const perspective = 1 / (1 + depth * 0.68);
        const highlight = i % 6 === 2;
        context.beginPath();

        for (let step = 0; step <= SEGMENTS; step++) {
          const u = (step / SEGMENTS - 0.5) * 2.45;
          const crest = Math.exp(-((u - 0.25) ** 2) * 2.6);
          const lift = Math.sin(u * 3.25 + depth * 3 - time) * crest * 0.27;
          const fold = Math.sin(u * 6.5 - time * 0.68 - depth * 4.3) * crest * 0.05;
          const x = width * (centerX + (u + offsetX * 0.1) * perspective + depth * 0.16);
          const y = height * (1.03 - (depth * 0.57 + lift + fold) * heightScale
            + offsetY * perspective * 0.045);
          if (step === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }

        context.globalAlpha = highlight ? 0.92 : 0.46 + (1 - depth) * 0.2;
        context.lineWidth = highlight ? 1.3 : 0.85;
        context.strokeStyle = light;
        context.stroke();
      }
      context.globalAlpha = 1;
    }

    function resize() {
      if (!canvas || !context) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      light = context.createLinearGradient(0, height * 0.75, width, height * 0.35);
      light.addColorStop(0, 'transparent');
      light.addColorStop(0.28, 'transparent');
      light.addColorStop(0.52, dark ? '#53C98C67' : '#458B852C');
      light.addColorStop(0.76, dark ? '#94EDB6C9' : '#28795A8A');
      light.addColorStop(1, dark ? '#61C5F0DA' : '#2C769FC0');
      draw(canAnimate ? performance.now() / 2400 : 0.6);
    }

    function tick(time: number) {
      draw(time / 2400);
      frame = window.requestAnimationFrame(tick);
    }

    function syncAnimation() {
      if (canAnimate && visible && !document.hidden) {
        if (!frame) frame = window.requestAnimationFrame(tick);
      } else {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
    }

    function movePointer(event: PointerEvent) {
      if (!hero || event.pointerType !== 'mouse') return;
      const bounds = hero.getBoundingClientRect();
      pointerX = (event.clientX - bounds.left) / bounds.width * 2 - 1;
      pointerY = (event.clientY - bounds.top) / bounds.height * 2 - 1;
    }

    function resetPointer() {
      pointerX = 0;
      pointerY = 0;
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const viewportObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncAnimation();
    });
    viewportObserver.observe(canvas);

    if (canAnimate) {
      hero.addEventListener('pointermove', movePointer, { passive: true });
      hero.addEventListener('pointerleave', resetPointer);
      document.addEventListener('visibilitychange', syncAnimation);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      viewportObserver.disconnect();
      hero.removeEventListener('pointermove', movePointer);
      hero.removeEventListener('pointerleave', resetPointer);
      document.removeEventListener('visibilitychange', syncAnimation);
    };
  }, [motionOff, resolvedTheme]);

  return <canvas ref={canvasRef} className="hero-contours" aria-hidden="true" />;
}
