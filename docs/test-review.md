# Test Review

## Purpose

Reviews the **quality and simplicity of the existing test suite** — whether tests are readable,
practical, and focused on behavior rather than implementation details. Flags overengineering,
unnecessary abstraction, and tests that are too complex for their value.

**Does not:** check for coverage gaps in newly written code (that is `docs/code-review.md`).
Does not run tests or generate new tests.

---

## Preparation

Read `AGENTS.md` to load the project's testing rules before beginning.

## Scope

- Review tests that already exist in the codebase
- Include all test types: Vitest unit, Vitest integration, React Testing Library, and Cypress E2E
- Keep simplicity as the primary priority

The ideal suite is lean, readable, and grounded. Tests should cover important behavior, feel
basic and believable, and avoid looking overbuilt or overly abstracted.

---

## Review criteria

### 1. Simplicity

- Are tests easy to read and follow?
- Is setup straightforward?
- Are abstractions justified by the project's actual needs?

### 2. Realism

- Do tests read like something a developer would realistically write?
- Is naming natural and direct?
- Does the suite avoid sounding robotic, overly formal, or mechanically uniform?

### 3. Scope and restraint

- Do tests focus on important behavior?
- Are there too many tests covering low-value implementation details?
- Could repetitive tests be combined or removed?
- Does the suite stay lean instead of chasing coverage for its own sake?

### 4. Test style and structure

- Are setup and assertions straightforward?
- Do assertions focus on what matters?
- Do tests verify outcomes and user-visible behavior rather than internal implementation details?
- Are mocks, fixtures, wrappers, or helpers used more than necessary?
- Is setup more complicated than the feature under test?

### 5. Integration test correctness

Specific to this codebase's Route Handler integration tests:

- Are integration tests calling the real route handler export (`GET`/`POST`), not a mock wrapper?
- Are they using a real test database, not an in-memory mock?
- Does each test assert a meaningful response shape or status code, not just that the function
  was called?

### 6. E2E test scope

- Do Cypress tests focus on the most important real user flows (login, upload, edit, export)?
- Do they avoid trying to cover every variation and edge case?
- Do they interact with real DOM elements, not implementation internals?
- Is setup minimal — no excessive custom utilities or orchestration?

---

## Findings to flag

- Tests too complex for their value
- Overly abstracted tests — excessive helper layers that obscure intent
- Tests that assert implementation details instead of behavior
- Repetitive tests that should be simplified, combined, or removed
- Heavy mocking or setup where simpler approaches would work
- Integration tests that mock the database (violates `AGENTS.md` testing rules)
- Cypress tests that do not visit real pages or interact with real elements
- Tests that look machine-generated: too uniform, too exhaustive, or unnaturally polished

---

## Output

### High-level assessment

State clearly:

- Whether the suite complies with the simplicity requirement
- Whether it feels like practical work or feels overbuilt

### Breakdown by test type

Organize into sections for each test category that exists:

- Vitest unit tests (`__tests__/`)
- Vitest integration tests (`__tests__/`)
- React Testing Library tests (`__tests__/`)
- Cypress E2E tests (`cypress/`)

### File-by-file review

For each test file or logical group:

- What is working well
- What is too complex or unnecessary
- What should be simplified, combined, or removed
- Whether it follows the testing rules in `AGENTS.md`

### Recommendations

- Prefer simplification over expansion
- Prefer removing or combining tests over adding more
- Do not recommend advanced patterns unless absolutely necessary
- If the suite is already acceptable, say so plainly

---

## Constraints

- Do not judge the suite based on coverage percentages alone
- Do not reward complexity because it is thorough
- Err on the side of fewer, simpler, more basic tests
- The target is not perfection
