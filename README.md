Life
====

A bit of fun with JavaScript... because life is random.

A bioluminescent life model rendered with three.js. A single spore drifts in the
dark; it grows, blooms, breeds, and fades, and its descendants spread through a
slow, chaotic ocean current until the colony fills the deep or dies out.

## The life cycle

Every generation, each organism advances one stage or dies:

| Glyph | Stage | Dies | Offspring on leaving the stage |
| :---: | ----- | ---: | ------------------------------ |
| `.` | Spore | 5% | |
| `o` | Larva | 5% | one spore, half the time |
| `O` | Adult | 5% | one to three spores |
| `@` | Bloom | 10% | one spore, sometimes |
| `0` | Elder | always | |
| `-` | Husk | | sinks and dissolves |

On top of that:

- **Genomes.** Each organism carries a lineage hue and a life strategy (hardy vs.
  prolific). Both mutate in offspring. Hue drift shows up as color; strategy is
  under selection, because crowding punishes fragile breeders.
- **Carrying capacity.** Births thin out as the population nears capacity, both
  globally and in crowded neighborhoods.
- **Tides.** Capacity swells and ebbs over a long cycle, driving boom and bust.
- **Blights.** Now and then a blight sweeps through part of the colony.
- **Epochs.** If everything dies, the deep goes dark for a moment and a new
  founding spore drifts in.

## Controls

| Input | Action |
| ----- | ------ |
| Click empty space | Seed a new founder spore (new lineage) |
| Drag / scroll | Orbit / zoom |
| Hover | Inspect an organism |
| `Space` | Pause / resume |
| `S` | Step one generation |
| `R` | Reset |
| `L` | Toggle lineage threads |
| `O` | Toggle auto-orbit |
| `H` | Hide / show the interface |

Speed, capacity, and mutation rate are adjustable from the dock.

## Development

Requires Node 24+ and pnpm.

```sh
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # simulation tests (vitest)
pnpm build      # typecheck + production build to dist/
```

`dist/` is a fully static site with relative asset paths, so it can be served
from any subpath. Pushes to `master` build and deploy it to GitHub Pages via
`.github/workflows/deploy.yml` (set the repo's Pages source to "GitHub Actions").

The simulation (`src/sim`) is plain TypeScript with no rendering dependencies.
Rendering (`src/render`) is three.js with custom point-sprite shaders, bloom, and
a finishing pass; the interface lives in `src/ui`.
