### Installation

```bash
npm run install
```


### Run

```bash
npm run start
```


### Architecture Thoughts

A `Terminal` has an array of `Invocation`s.
Each `Invocation` has an `Input` and an `Output`.
Those are based on a `Buffer`, can have a `Cursor`. Have a view, and emit an event on change.
