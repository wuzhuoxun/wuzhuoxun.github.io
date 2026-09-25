# Zhuoxun Wu — Personal Website

Personal academic website for Zhuoxun Wu, a PhD student in Electrical and Computer Engineering at the University of Southern California.

## Experience

- Animated star system with cel-shaded planets and moving orbital ribbons.
- Scroll-driven name reveal, surface approach, and About / Education / Contact chapters.
- Curved surface scenes with three rotating landmarks.
- Keyboard navigation, touch support, direct chapter links, and reduced-motion support.
- Procedural WebGL artwork with a Canvas fallback; no build step required.

## Files

- `index.html`: profile, education, contact links, and navigation.
- `style.css`: desktop and mobile layouts.
- `universe.js`: rendering and interaction.
- `.nojekyll`: static GitHub Pages publishing.

The `main` branch is published through GitHub Pages at https://wuzhuoxun.github.io/.

To preview locally, run `python -m http.server 8765` in this directory.

## Hand-drawn rendering update

The star includes illustrated oceans, coastlines, and mountain ranges. Orbital trails are broken cloud-like ribbons. Rounded cream lettering uses outlined headings and an ember-edge name reveal.

Rendering uses one compact texture atlas instead of four full-resolution GPU readbacks. Slowly rotating surfaces update separately from smooth orbital motion. Stable scenes avoid redundant DOM updates. Reduced-motion preferences disable the ember animation and ambient movement.
