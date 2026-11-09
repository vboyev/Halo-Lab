// Rotating shot wheel in the final CTA: idle spin, pointer drag, and momentum.
(() => {
    const cta = document.querySelector('.final-cta');
    const orbit = document.querySelector('.final-cta__orbit');
    const wheel = document.querySelector('.final-cta__wheel');
    const shots = [...document.querySelectorAll('.final-cta__shot')];
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const idleVelocity = reducedMotion.matches ? 0 : 360 / 200;

    const total = shots.length;

    if (!total) return;

    const angleStep = 360 / total;
    const angleOffset = 90;

    shots.forEach((shot, index) => {
      const angle = angleStep * index + angleOffset;

      shot.style.transform = `
          translate(-50%, -50%)
          rotate(${angle}deg)
          translateY(calc(var(--y) * -1))
        `;
    });

    let rotation = 0;
    let velocity = idleVelocity;
    let paused = false;
    let dragging = false;
    let wasPausedAtDragStart = false;
    let activePointer = null;
    let lastAngle = 0;
    let lastMoveTime = 0;
    let dragDistance = 0;
    let lastFrameTime = performance.now();
    let gifUntil = 0;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const normalizeDelta = (value) => ((value + 540) % 360) - 180;

    const pointerAngle = (event) => {
      const bounds = orbit.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      return (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) / Math.PI;
    };

    const stopWheel = () => {
      paused = true;
      velocity = 0;
      gifUntil = 0;
      cta.classList.remove('is-boosted');
      wheel.classList.remove('is-moving');
    };

    const resumeIdleWheel = () => {
      paused = false;
      velocity = idleVelocity;
      gifUntil = 0;
      cta.classList.remove('is-boosted');
    };

    const startDrag = (event) => {
      wasPausedAtDragStart = paused;
      paused = false;
      dragging = true;
      activePointer = event.pointerId;
      lastAngle = pointerAngle(event);
      lastMoveTime = performance.now();
      dragDistance = 0;
      velocity = 0;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      cta.classList.add('is-dragging');
      wheel.classList.add('is-moving');
    };

    const moveDrag = (event) => {
      if (!dragging || event.pointerId !== activePointer) return;
      const now = performance.now();
      const angle = pointerAngle(event);
      const delta = normalizeDelta(angle - lastAngle);
      const elapsed = Math.max(8, now - lastMoveTime);
      rotation += delta;
      dragDistance += Math.abs(delta);
      velocity = clamp(velocity * 0.45 + (delta / elapsed) * 1000 * 0.55, -900, 900);
      if (Math.abs(velocity) > 240) gifUntil = now + 2200;
      lastAngle = angle;
      lastMoveTime = now;
      wheel.style.transform = `rotate(${rotation}deg)`;
    };

    const endDrag = (event) => {
      if (!dragging || event.pointerId !== activePointer) return;
      dragging = false;
      activePointer = null;
      cta.classList.remove('is-dragging');
      if (dragDistance < 4) {
        if (wasPausedAtDragStart) {
          stopWheel();
        } else {
          resumeIdleWheel();
        }
      } else if (dragDistance < 12 || Math.abs(velocity) < 140) {
        if (wasPausedAtDragStart) {
          stopWheel();
        } else {
          resumeIdleWheel();
        }
      }
    };

    shots.forEach((shot) => {
      shot.addEventListener('pointermove', moveDrag);
      shot.addEventListener('pointerdown', startDrag);
      shot.addEventListener('pointerup', endDrag);
      shot.addEventListener('pointercancel', endDrag);
      shot.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          stopWheel();
        }
      });
    });

    addEventListener('pointerup', endDrag);
    addEventListener('pointercancel', endDrag);

    const animate = (now) => {
      const delta = Math.min(34, now - lastFrameTime) / 1000;
      lastFrameTime = now;

      if (!dragging && !paused) {
        rotation += velocity * delta;
        const easing = 1 - Math.exp(-0.75 * delta);
        velocity += (idleVelocity - velocity) * easing;
        if (Math.abs(velocity - idleVelocity) < 0.01) velocity = idleVelocity;
        wheel.style.transform = `rotate(${rotation}deg)`;
      }

      if (Math.abs(velocity) > 240) gifUntil = Math.max(gifUntil, now + 180);
      cta.classList.toggle('is-boosted', now < gifUntil);
      wheel.classList.toggle('is-moving', dragging || (!paused && Math.abs(velocity - idleVelocity) > 8));
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  })();
