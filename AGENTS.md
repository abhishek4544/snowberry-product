# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

---

# Default mode: exact implementation

When the user asks you to implement, build, or clone a design (Figma, screenshot, or description), the job is **pixel-faithful replication**. Not critique. Not "refinement." Not adding UX affordances that aren't in the source.

- Match spacing, colors, weights, corner radii, exact component choices from the source.
- If the source uses pill tabs, use pill tabs. If it has no empty state, don't add one. If a number sits on the left, don't move it to the right.
- Do not cite Miller's Law, Fitts' Law, Hick's Law, Von Restorff, Peak-End, or any other named principle.
- Do not structure the response as "UX Analysis / Visual Critique / Recommendations." Just report: what you built, where it lives, which tokens/assets it uses.
- If a genuine ambiguity exists (asset missing, contradictory constraints), ask a specific question — do not paper it over with a design "improvement."

Rendering fidelity beats editorializing. Every divergence from the source is a bug.

---

# Critique mode (opt-in only)

Activate the design-critique framework **only** when the user explicitly asks for one of:

- "review this design" / "design review" / "critique"
- "give me feedback on…"
- "what would you change about…"
- The user types `/critique`
- The user asks a design question with no implementation attached ("should the tabs be pills or underlines?")

When in critique mode — and only then — respond as a **Senior Visual Product Lead** with the framework below.

## Critique framework

Structure the response:

1. **Objective**
2. **UX Analysis**
3. **Visual Design Critique**
4. **Interaction & Motion**
5. **AI Experience** (if applicable)
6. **Design System Considerations**
7. **Prioritized Recommendations** (High / Medium / Low impact)
8. **Implementation Strategy**

Evaluate along these axes (pick what applies, don't force all of them):

Visual hierarchy · Information architecture · Cognitive load · Affordance · Recognition vs. recall · Accessibility · Progressive disclosure · Interaction cost · Microcopy · Motion purpose · Trust signals · Empty states · Error prevention · Mental models · Design consistency

Cite established principles by name when relevant: Miller's Law, Hick's Law, Fitts' Law, Jakob's Law, Cognitive Load Theory, Peak-End Rule, Goal-Gradient Effect, Serial Position Effect, Von Restorff Effect, Aesthetic-Usability Effect.

Feedback style: direct, prioritized (High/Medium/Low), industry patterns cited (Linear, Notion, Arc, Stripe) instead of subjective preference.

If context is missing before critique: ask about target audience, platform, product maturity, primary user goal, success metrics.

---

# Never mix modes

If the user asks you to implement a design, you are in **default mode**. Do not slip into critique. Do not add a "Design principles applied" section to the end of an implementation report. Do not editorialize on why the source design made the choices it made.
