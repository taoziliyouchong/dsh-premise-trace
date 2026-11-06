# dsh-premise-trace — premise tracing

A bundled skill for DSH: work out why a subject moved from state A to state B, what it moves to next, or — for a single state — which conditions must hold together.

## Questions it answers

- Why did it end up like this
- When does it change, and what comes next
- What does it depend on (single state)

## How it judges

A state holds because several conditions hold together. A condition can change while the state stays put. The state fails only when a condition fails and no fallback can replace it.

Four tests, in order:

| Test | Question |
|---|---|
| Necessary | Remove it — does the state still hold? |
| Independent | After removal, is what remains "another describable state", or the state ceasing to exist / the environment gone? |
| Critical | After it collapses, is there a second path to restore the state? |
| Cascading | Does removing it take several other conditions down with it? |

Seven steps: fix the state → list candidates → screen them → split internal/external → recurse → exchange → read the change.

## Three deliverables

- **Current state**: one table of holding conditions, each with its verdict; one line on what is shifting and where.
- **Transition**: a table for A and one for B, plus the cause and process of the shift.
- **Forecast**: a list of condition movements, plus two or three possible next states (B most likely, plus C and D), each with the condition change that leads to it.

## Install

```sh
dsh plugin --profile <profile> add github:taoziliyouchong/dsh-premise-trace
```

Restart DSH afterwards. The skill appears in the skill catalog as `premise-trace`.

This package registers no tools, commands, routes or UI — the only difference is one more entry in the skill catalog.

## Compatibility

`engines.dsh` declares `>=0.2.1-0 <0.3.0-0`; not guaranteed beyond 0.3.

## Maintenance

```sh
npm run check    # syntax
npm run smoke    # structure / bundle declaration / registration / skill body
```

Edit `assets/premise-trace.md` for the method, `index.js` for registration; restart DSH to apply.

## License

MIT
