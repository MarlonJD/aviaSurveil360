# AviaSurveil360 ExecPlan Contract

Use an ExecPlan for migrations, cross-cutting implementation, risky work,
readiness work, or anything that must survive context loss.

## Canonical Lifecycle

- [Plan index](exec-plans/index.md) — status and one next concrete todo.
- [`active/`](exec-plans/active/) — living plans.
- [`completed/`](exec-plans/completed/) — verified completed or explicitly
  superseded plans.
- [Completed index](exec-plans/completed/index.md) — completion evidence.
- [Technical-debt tracker](exec-plans/tech-debt-tracker.md) — durable blockers,
  accepted risks, missing evidence, and owner handoffs.

The current repository uses its established plan schema. It has not opted into
the harness skill's stricter `harness-plan:v1` schema.

Historical plan narratives may describe retired `.turkce.md` companion
deliverables. Those references are historical evidence only; the current
English-only policy in `AGENTS.md` applies to all future execution.

## Required Plan Content

Every new plan must be self-contained and include:

- objective and user-visible outcome;
- scope and explicit exclusions;
- assumptions and ownership boundaries;
- repository orientation and affected interfaces;
- ordered phases or tasks;
- concrete commands and expected observations;
- verification and acceptance criteria;
- risks, dependencies, idempotence, and recovery;
- current progress, decisions, discoveries, and outcome notes; and
- an `Execution Prompt` that can resume the plan without chat history.

Use English lowercase kebab-case filenames:
`YYYY-MM-DD-<short-topic>-plan.md`.

## Lifecycle Rules

1. Create or update the plan in `exec-plans/active/` and add exactly one index
   row.
2. Keep progress, discoveries, decisions, commands, and observed evidence
   current at each material transition.
3. Keep only the next concrete todo in the index; detailed checklists belong in
   the plan.
4. Use `active`, `paused`, `blocked`, `ready-for-verification`, `completed`,
   `archived`, or `superseded` literally.
5. Do not infer completion from dates, code presence, or historical claims.
6. Move a plan to `completed/` only after its objective and required
   verification are inspected. Record remaining gaps in the tracker.
7. Preserve the filename when moving a plan and update the active/completed
   indexes atomically.
8. Commits and pushes require current user authorization; a plan never grants
   source-control authority by itself.

## Evidence Rules

- Record fresh command results, not remembered results.
- Distinguish `verified locally`, `not run`, `blocked`, `candidate-only`,
  `release pending`, and production evidence.
- Visual deviations may be documented without repeated pixel-only loops, but a
  failed comparison must never be called passing.
- Plan, index, tracker, and evidence documents must agree before handoff.

The [agent harness output contract](agent-harness/output-contract.md) controls
final evidence wording, and the
[verification matrix](agent-harness/verification-matrix.md) selects the
required gates.
