# Altitude System Visual Libraries Research

**Purpose**: Create an immersive background transition from ground to orbit as users improve their codebase score.

---

## Recommended Stack

### Primary: Framer Motion + CSS Gradients
Already in our `package.json`. Best for smooth, performant transitions.

```tsx
import { motion } from 'framer-motion'

// Animate background based on altitude progress (0-100)
<motion.div
  animate={{ 
    background: getAltitudeGradient(altitudeProgress),
    transition: { duration: 2 }
  }}
>
```

### Stars Layer: CSS + Framer Motion
Fade in stars as altitude increases.

```tsx
<motion.div 
  className="stars-layer"
  animate={{ opacity: getStarsVisibility(altitudeProgress) }}
/>
```

---

## Libraries Evaluated

### 1. Framer Motion (using)
- **pros**: already installed, simple API, great performance
- **cons**: none for our use case
- **verdict**: primary choice for all animations

### 2. React Spring
- **pros**: physics-based, very smooth
- **cons**: heavier, more complex API
- **verdict**: alternative if we need spring physics for rocket

### 3. React Three Fiber (@react-three/fiber)
- **pros**: full 3D earth, atmosphere, realistic space
- **cons**: heavy bundle, complex, overkill for background
- **verdict**: future enhancement for 3D rocket visualization

### 4. Lottie (lottie-react)
- **pros**: pre-made rocket animations, small files
- **cons**: need to find/buy animations
- **verdict**: good for rocket icon, not background

### 5. Rive (rive-react)
- **pros**: interactive animations, state machines
- **cons**: need to create in Rive editor
- **verdict**: future enhancement for interactive rocket

### 6. shadcn/ui Backgrounds
- **pros**: pre-built aurora, particles effects
- **cons**: not altitude-specific
- **verdict**: could layer with our gradient

### 7. GSAP + ScrollTrigger
- **pros**: powerful timeline control
- **cons**: overkill, different paradigm
- **verdict**: skip

### 8. Pure CSS Animated Gradients (Animista)
- **pros**: zero JS, very performant
- **cons**: less control
- **verdict**: could use for subtle background movement

---

## Visual Design Concept

### Layer Stack (bottom to top)
1. **Base Gradient** - Ground to space color transition
2. **Atmosphere Glow** - Subtle blue glow that fades with altitude
3. **Clouds Layer** - White wisps at low altitude (0-30%)
4. **Stars Layer** - Appear at 50%+, density increases
5. **Rocket/Progress** - The actual indicator

### Color Palette by Altitude Zone

| Zone | Progress | Colors | Elements |
|------|----------|--------|----------|
| Runway | 0-10% | Gray, brown | Concrete texture |
| Troposphere | 10-25% | Green → light blue | Clouds, birds |
| Stratosphere | 25-40% | Light blue → steel blue | Thin clouds |
| Mesosphere | 40-55% | Steel blue → midnight | Stars begin |
| Thermosphere | 55-70% | Midnight → dark purple | Auroras visible |
| Exosphere | 70-85% | Dark purple → near black | Dense stars |
| Orbit+ | 85-100% | Black with subtle nebula | Earth visible below |

---

## Implementation Plan

### Phase 1: CSS Gradient Background
Simple but effective - animate between color stops.

```css
.altitude-bg {
  background: linear-gradient(
    to top,
    var(--ground-color) 0%,
    var(--sky-color) var(--altitude-progress),
    var(--space-color) 100%
  );
  transition: background 1.5s ease-out;
}
```

### Phase 2: Add Stars Layer
CSS-only star field that fades in.

```css
.stars {
  background-image: 
    radial-gradient(2px 2px at 20% 30%, white, transparent),
    radial-gradient(2px 2px at 40% 70%, white, transparent),
    radial-gradient(1px 1px at 50% 50%, white, transparent),
    /* ... more stars */;
  opacity: calc(var(--altitude-progress) - 0.5) * 2;
}
```

### Phase 3: Rocket Progress Indicator
Framer Motion animated rocket that rises with progress.

```tsx
<motion.div 
  className="rocket"
  animate={{ 
    y: `${100 - altitudeProgress}%`,
    rotate: altitudeProgress > 50 ? 0 : -5 + Math.random() * 10 // wobble at low altitude
  }}
>
  🚀
</motion.div>
```

### Phase 4: Particle Effects (Future)
Add floating particles - dust at low altitude, cosmic dust at high.

---

## Performance Considerations

1. **Use CSS transforms** - GPU accelerated, no layout thrashing
2. **Reduce stars at low altitudes** - Don't render what's invisible
3. **Debounce altitude updates** - Don't animate every 1% change
4. **prefers-reduced-motion** - Respect accessibility settings

```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

if (prefersReducedMotion) {
  // Skip animations, instant state changes
}
```

---

## Files to Create

1. `components/AltitudeBackground.tsx` - The gradient + stars background
2. `components/AltitudeRocket.tsx` - The progress indicator rocket
3. `components/AltitudeDisplay.tsx` - Combined display with user count
4. `styles/altitude.css` - All altitude-related CSS

---

## Resources

- **Lottie Rocket Animations**: https://lottiefiles.com/search?q=rocket
- **CSS Star Generator**: https://wweb.dev/resources/css-stars-background-generator
- **Framer Motion Docs**: https://www.framer.com/motion/
- **Animista Backgrounds**: https://animista.net/play/background

