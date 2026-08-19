/* Interactive canvas starfield for the Branding hero. */

(() => {
  const canvas = document.querySelector('[data-branding-starfield]');
  const region = document.querySelector('[data-branding-starfield-region]');

  if (!canvas || !region) return;

  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = { x: -1000, y: -1000, active: false };
  const interactionRadius = 90;
  const dynamicFrameInterval = 1000 / 30;
  // Only the star nearest the cursor lights up. The brightness still has to
  // settle fast enough that no trail forms, while the cross-shaped flare grows
  // and retracts on its own slower, delayed curve so nothing snaps into place.
  const glowAttack = 170;
  const glowRelease = 420;
  const flareEnterDelay = 130;
  const flareLeaveDelay = 90;
  const flareAttack = 320;
  const flareRelease = 380;
  let stars = [];
  let activeStar = null;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let frameId = 0;
  let lastPaintTime = 0;
  let lastDrawTime = 0;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  // Real starfields skew toward many small, dim points with only a few large,
  // bright ones. A uniform random radius made most stars land near the same
  // size, which read as a field of same-sized dots instead.
  const starRadius = (roll, cursorAccent) => (cursorAccent
    ? .18 + (roll ** 2.2) * .9
    : .28 + (roll ** 2.6) * 2);

  // Same skew as starRadius, applied to brightness: a lower floor and a
  // higher ceiling than the old flat .17–.51 range, so most stars stay quiet
  // and a few read as distinctly brighter. That spread is what makes the
  // field feel more contrasty, not just brighter across the board.
  const starAlpha = (roll) => .1 + (roll ** 2.2) * .65;

  const createRandom = (seed) => () => {
    seed |= 0;
    seed = seed + 0x6d2b79f5 | 0;
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };

  const relocationRandom = createRandom(319874021);

  const buildStars = () => {
    const random = createRandom(8512450978);
    const targetCellSize = width < 768 ? 58 : 70;
    const columns = Math.max(5, Math.ceil(width / targetCellSize));
    const rows = Math.max(7, Math.ceil(height / targetCellSize));
    const cellWidth = width / columns;
    const cellHeight = height / rows;

    stars = [];
    // The previous highlight target no longer exists after a rebuild.
    activeStar = null;

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const createStar = (cursorAccent = false) => {
          // Shorter and more frequent than the original slow 12–24s drift, so
          // the ambient twinkle reads as active rather than barely-there.
          const cycleDuration = 4000 + random() * 5000;

          return {
            x: (column + .14 + random() * .72) * cellWidth,
            y: (row + .14 + random() * .72) * cellHeight,
            cellX: column * cellWidth,
            cellY: row * cellHeight,
            cellWidth,
            cellHeight,
            radius: starRadius(random(), cursorAccent),
            alpha: cursorAccent ? .025 + random() * .035 : starAlpha(random()),
            glow: 0,
            flare: 0,
            activeSince: -1,
            inactiveSince: -1,
            cursorAccent,
            glint: !cursorAccent && random() > .9,
            blue: random() > .52,
            // More of the field blinks now (up from ~55%), which reads as a
            // livelier sky rather than a handful of scattered stars fading.
            dynamic: random() > .22,
            cycleDuration,
            cycleOffset: random() * cycleDuration,
            relocatedCycle: -1,
          };
        };

        // One primary star per cell prevents accidental empty patches.
        stars.push(createStar());

        // Extra low-opacity stars add density and become clearer near the pointer.
        if (random() > .22) stars.push(createStar(true));
      }
    }
  };

  const smoothstep = (value) => {
    const progress = clamp(value, 0, 1);
    return progress * progress * (3 - 2 * progress);
  };

  const getLifeAlpha = (star, time) => {
    if (!star.dynamic || reduceMotion.matches) return 1;

    const elapsed = time + star.cycleOffset;
    const cycle = Math.floor(elapsed / star.cycleDuration);
    const phase = elapsed / star.cycleDuration - cycle;

    // Snappier fade in/out than before (was 14%/16% of the cycle) so each
    // blink reads as a distinct flicker instead of a slow dimming.
    if (phase < .7) return 1;
    if (phase < .78) return 1 - smoothstep((phase - .7) / .08);

    if (star.relocatedCycle !== cycle) {
      // Jumping several cells away, not just resettling in the same spot,
      // is what makes this read as one star vanishing and a different one
      // appearing elsewhere rather than the same star quietly drifting.
      const jumpX = (relocationRandom() * 2 - 1) * star.cellWidth * 3;
      const jumpY = (relocationRandom() * 2 - 1) * star.cellHeight * 3;
      star.x = clamp(star.cellX + (.14 + relocationRandom() * .72) * star.cellWidth + jumpX, 0, width);
      star.y = clamp(star.cellY + (.14 + relocationRandom() * .72) * star.cellHeight + jumpY, 0, height);
      star.relocatedCycle = cycle;

      // Re-rolling size, brightness, and color sells the same illusion: the
      // star that fades back in should look like a new one, not a clone.
      star.radius = starRadius(relocationRandom(), star.cursorAccent);
      if (star.cursorAccent) {
        star.alpha = .025 + relocationRandom() * .035;
      } else {
        star.alpha = starAlpha(relocationRandom());
        star.glint = relocationRandom() > .9;
      }
      star.blue = relocationRandom() > .52;
    }

    if (phase < .86) return 0;
    return smoothstep((phase - .86) / .14);
  };

  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(bounds.width));
    const nextHeight = Math.max(1, Math.round(bounds.height));
    const nextPixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    if (nextWidth === width && nextHeight === height && nextPixelRatio === pixelRatio) return;

    width = nextWidth;
    height = nextHeight;
    pixelRatio = nextPixelRatio;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    buildStars();
    draw();
  };

  const draw = (time = performance.now()) => {
    context.clearRect(0, 0, width, height);
    const delta = clamp(time - lastDrawTime, 0, 120) || 16;
    lastDrawTime = time;
    let isSettling = false;

    stars.forEach((star) => {
      const lifeAlpha = getLifeAlpha(star, time);
      const isActive = star === activeStar;
      const target = isActive ? 1 : 0;

      if (isActive) {
        if (star.activeSince < 0) star.activeSince = time;
        star.inactiveSince = -1;
      } else if (star.activeSince >= 0) {
        star.inactiveSince = time;
        star.activeSince = -1;
      }

      if (Math.abs(target - star.glow) > .004) {
        const timeConstant = target > star.glow ? glowAttack : glowRelease;
        star.glow += (target - star.glow) * (1 - Math.exp(-delta / timeConstant));
        isSettling = true;
      } else {
        star.glow = target;
      }

      // The flare waits before it starts growing, and waits again before it
      // retracts, so the cross eases in and out instead of snapping.
      const flareDelayed = isActive
        ? time - star.activeSince < flareEnterDelay
        : star.inactiveSince >= 0 && time - star.inactiveSince < flareLeaveDelay;
      const flareTarget = isActive && !flareDelayed ? 1 : (flareDelayed ? star.flare : 0);

      if (flareDelayed) {
        isSettling = true;
      } else if (Math.abs(flareTarget - star.flare) > .004) {
        const flareConstant = flareTarget > star.flare ? flareAttack : flareRelease;
        star.flare += (flareTarget - star.flare) * (1 - Math.exp(-delta / flareConstant));
        isSettling = true;
      } else {
        star.flare = flareTarget;
        if (!isActive) star.inactiveSince = -1;
      }

      const proximity = star.glow;
      const flare = smoothstep(star.flare);
      const cursorBoost = star.cursorAccent ? proximity : proximity * .82;
      const alpha = clamp((star.alpha + cursorBoost) * lifeAlpha, 0, 1);
      const x = star.x;
      const y = star.y;
      const color = star.blue ? `151, 185, 255, ${alpha}` : `231, 237, 255, ${alpha}`;

      if (proximity > .05 && lifeAlpha > .01) {
        const glowRadius = 2 + proximity * 6;
        const glowColor = star.blue ? '151, 185, 255' : '231, 237, 255';
        const glow = context.createRadialGradient(x, y, 0, x, y, glowRadius);
        glow.addColorStop(0, `rgba(${glowColor}, ${proximity * lifeAlpha * .38})`);
        glow.addColorStop(1, `rgba(${glowColor}, 0)`);
        context.beginPath();
        context.fillStyle = glow;
        context.arc(x, y, glowRadius, 0, Math.PI * 2);
        context.fill();
      }

      const bodyRadius = star.radius + proximity * .7;

      // A soft bloom under the solid core is what reads as a point of light;
      // the core alone is a flat, printed-looking dot.
      const bloomRadius = bodyRadius * 2.4;

      if (bloomRadius > 1 && alpha > .03) {
        const bloomColor = star.blue ? '151, 185, 255' : '231, 237, 255';
        const bloom = context.createRadialGradient(x, y, 0, x, y, bloomRadius);
        bloom.addColorStop(0, `rgba(${bloomColor}, ${alpha * .5})`);
        bloom.addColorStop(1, `rgba(${bloomColor}, 0)`);
        context.beginPath();
        context.fillStyle = bloom;
        context.arc(x, y, bloomRadius, 0, Math.PI * 2);
        context.fill();
      }

      context.beginPath();
      context.fillStyle = `rgba(${color})`;
      context.arc(x, y, bodyRadius, 0, Math.PI * 2);
      context.fill();

      // Decorative stars keep their static cross; the highlighted one grows its
      // own out of the dot and pulls it back in.
      const staticRay = star.glint ? 1 : 0;
      const rayStrength = Math.max(staticRay, flare);

      if (rayStrength > .01 && alpha > .18) {
        const ray = (2.2 + proximity * 3.6) * rayStrength;
        const rayAlpha = clamp(alpha * rayStrength, 0, 1);
        const rayColor = star.blue ? `151, 185, 255, ${rayAlpha}` : `231, 237, 255, ${rayAlpha}`;
        context.beginPath();
        context.strokeStyle = `rgba(${rayColor})`;
        context.lineWidth = (.55 + proximity * .25) * Math.max(.6, rayStrength);
        context.moveTo(x - ray, y);
        context.lineTo(x + ray, y);
        context.moveTo(x, y - ray);
        context.lineTo(x, y + ray);
        context.stroke();
      }
    });

    return isSettling;
  };

  // Exactly one star is lit at any moment: the one closest to the cursor.
  const updateActiveStar = () => {
    if (!pointer.active) {
      activeStar = null;
      return;
    }

    let nearest = null;
    // Squared distances avoid a square root per star on every pointer move.
    let nearestDistance = interactionRadius * interactionRadius;

    stars.forEach((star) => {
      const dx = star.x - pointer.x;
      const dy = star.y - pointer.y;
      const distance = dx * dx + dy * dy;

      if (distance < nearestDistance) {
        nearest = star;
        nearestDistance = distance;
      }
    });

    activeStar = nearest;
  };

  const scheduleDraw = () => {
    if (frameId || document.hidden) return;

    const renderFrame = (time) => {
      frameId = 0;
      const dynamicBackground = !reduceMotion.matches;

      if (!dynamicBackground || time - lastPaintTime >= dynamicFrameInterval) {
        lastPaintTime = time;
        const isSettling = draw(performance.now());
        if (dynamicBackground || isSettling) frameId = requestAnimationFrame(renderFrame);
        return;
      }

      frameId = requestAnimationFrame(renderFrame);
    };

    frameId = requestAnimationFrame(renderFrame);
  };

  const updatePointer = (event) => {
    if (!finePointer.matches) return;
    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    pointer.active = x >= 0 && x <= bounds.width && y >= 0 && y <= bounds.height;
    pointer.x = x;
    pointer.y = y;
    updateActiveStar();
    scheduleDraw();
  };

  const clearPointer = () => {
    pointer.active = false;
    activeStar = null;
    scheduleDraw();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  window.addEventListener('mousemove', updatePointer, { passive: true });
  region.addEventListener('mouseleave', clearPointer, { passive: true });
  window.addEventListener('blur', clearPointer);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
      return;
    }

    scheduleDraw();
  });
  reduceMotion.addEventListener('change', scheduleDraw);

  resize();
  scheduleDraw();
})();

/* Match the homepage showreel's responsive scroll reveal, and give the
   starfield a matching sense of depth: as the showreel grows toward the
   viewer, the stars recede and fade over the exact same scroll span, so the
   two read as one push forward rather than two unrelated animations. */
(() => {
  const reveal = document.querySelector('[data-branding-showreel-reveal]');
  const starfield = document.querySelector('[data-branding-starfield]');

  if (!reveal || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  const media = gsap.matchMedia();

  media.add(
    {
      isDesktop: '(min-width: 992px)',
      isTablet: '(min-width: 768px) and (max-width: 991px)',
      isMobile: '(max-width: 767px)',
      reduceMotion: '(prefers-reduced-motion: reduce)',
    },
    (context) => {
      const { isDesktop, isTablet, isMobile, reduceMotion } = context.conditions;

      if (isMobile || reduceMotion) return;

      // Each tween gets its own ScrollTrigger config object — sharing one
      // instance across tweens isn't a documented pattern, and a matching
      // trigger/start/end pair scrubs them in perfect sync regardless.
      const animations = [
        gsap.fromTo(
          reveal,
          {
            width: '50%',
            height: isDesktop ? '20rem' : '8rem',
          },
          {
            width: '100%',
            height: isDesktop ? '42rem' : '25rem',
            ease: 'none',
            scrollTrigger: {
              trigger: reveal,
              start: 'top 80%',
              end: 'top 10%',
              scrub: true,
            },
          },
        ),
      ];

      if (starfield) {
        animations.push(
          gsap.fromTo(
            starfield,
            {
              scale: 1,
              opacity: 1,
            },
            {
              scale: .8,
              opacity: 0,
              ease: 'none',
              scrollTrigger: {
                trigger: reveal,
                start: 'top 80%',
                end: 'top 10%',
                scrub: true,
              },
            },
          ),
        );
      }

      return () => {
        animations.forEach((animation) => {
          animation.scrollTrigger?.kill();
          animation.kill();
        });
      };
    },
  );
})();
