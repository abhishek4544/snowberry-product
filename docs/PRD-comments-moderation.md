# PRD: Comments moderation queue redesign

**Product**: Snowberry / PRIXA administration panel
**Area**: Comments
**Status**: Draft v1
**Author**: Product (drafted with Claude)
**Date**: 2026-07-15

---

## Problem statement

Moderators must review every reader comment before it appears on the news site, but the current Comments page is a flat DataTables listing that treats moderation like record lookup. The comment body — the decision-critical content — is buried in a narrow column; the destructive DELETE action is the most prominent control on every row; there is no way to act on more than one comment at a time; and pending items are interleaved with approved ones. The result is visible in production data: comments have sat "Awaiting Approval" for 5+ months, including obvious spam floods (3 near-identical comments from one email within minutes). Every unreviewed day is a day legitimate reader engagement stays invisible and the comment section looks dead.

## Goals

1. **Drain the backlog and keep it drained** — median time from comment submission to moderation decision drops from days/months to same-day.
2. **Raise moderation throughput** — a moderator can clear 15+ pending comments in under 2 minutes (vs. ~1 click-cycle per comment today).
3. **Eliminate accidental destructive actions** — zero unintended deletions, achieved through action hierarchy + undo instead of prominence + confirm dialogs.
4. **Make judgment contextual** — every comment is reviewable with its article and (if a reply) its parent comment visible, without leaving the page.
5. **Bring the page into the v11 design system** — visually consistent with the rest of the Snowberry admin (brand blue, pastel status tints, glass sidebar shell).

## Non-goals

- **Comment editing workflows** — the existing EDIT capability is retained as-is (moved into the overflow menu); redesigning the edit form is a separate effort.
- **Reader-facing comment UI changes** — this PRD covers the admin panel only; the website's comment display is untouched.
- **A full ML spam-classification model** — v1 spam detection is heuristic (burst/duplicate detection); model-based scoring via Berry AI is P2, and building it now would delay the structural fixes that deliver most of the value.
- **Commenter account management** (banning, verification, profiles) — surfaced as trust signals only; management tooling is a future initiative.
- **Real-time/live updating queue** — standard refresh-on-action is sufficient at current comment volume.

## User stories

**Moderator (primary persona — clears the queue daily)**
- As a moderator, I want pending comments shown first and separated from approved ones, so that I immediately see what needs my attention.
- As a moderator, I want to read the full comment text prominently, so that I can judge it without squinting at a truncated table cell.
- As a moderator, I want comments grouped under the article they were posted on, so that I judge them in context and can sweep a whole story's comments at once.
- As a moderator, I want to select multiple comments and approve or reject them in one action, so that spam floods and test comments don't cost one click-cycle each.
- As a moderator, I want a reply to show the parent comment it responds to, so that I can judge tone and relevance correctly.
- As a moderator, I want approve to be the primary action and delete to require deliberate intent (overflow menu + undo), so that I never destroy a comment by mis-click.
- As a moderator, I want obvious spam bursts pre-grouped with a one-click "reject all", so that junk doesn't drown the queue.
- As a moderator, I want an "all caught up" state when the queue is empty, so that I know I'm done.

**Editor / admin (secondary persona — checks health, audits history)**
- As an editor, I want to see pending count, oldest-pending age, and weekly volume at a glance, so that I know whether moderation is keeping up.
- As an editor, I want to see which articles attract the most comments (and spam), so that engagement data feeds editorial decisions.
- As an admin, I want a searchable flat table of all comments regardless of status, so that I can audit past decisions and find specific records.

## Requirements

### P0 — must have (v1 cannot ship without)

**R1. Status tabs with counts**
The page defaults to a *Pending* tab; *Approved* and *All comments* tabs are one click away. Tab labels show live counts.
- [ ] Given pending comments exist, when the page loads, then the Pending tab is active and shows only comments awaiting approval, newest first.
- [ ] Given 12 comments are pending, when viewing any tab, then the Pending tab label shows "12".
- [ ] The *All comments* tab renders the existing flat, sortable, searchable table (audit view).

**R2. Comment card layout**
Each pending comment renders as a card: commenter identity block (avatar/initials, name, email, relative time), full comment body as the visually dominant text, and the source article as a secondary context line.
- [ ] Comment body is displayed in full — no truncation on the Pending tab.
- [ ] Nepali (Devanagari) and English content render correctly with appropriate line-height.
- [ ] The article title on the card links to the article.

**R3. Action hierarchy and undo**
Approve is the single primary (filled) button per card. Reject is secondary. Edit and Delete live in an overflow (⋯) menu. All actions are optimistic with a 5-second undo toast; no confirm dialogs.
- [ ] Given a pending comment, when the moderator clicks Approve, then the card animates out, the pending count decrements, and an undo toast appears for 5 seconds.
- [ ] Given an undo toast is visible, when the moderator clicks Undo, then the comment returns to the queue in its prior position and state.
- [ ] Delete is never rendered as a top-level button on a card or table row.

**R4. Bulk selection and actions**
Cards have checkboxes; a bulk-action bar (Approve / Reject) appears when ≥1 is selected, with select-all for the current view.
- [ ] Given 3 comments are selected, when the moderator clicks bulk Approve, then all 3 are approved in one operation with a single undo toast covering the batch.
- [ ] Bulk actions respect the current tab/group scope only.

**R5. Stats band**
Four metric cards above the tabs: Pending count (with oldest-pending age), Approved this week (with week-over-week delta), Spam caught (count + share of new comments), Average time-to-review (against a same-day target).
- [ ] Oldest-pending age renders as a warning chip when > 48 hours.
- [ ] All metrics compute from real data; no metric renders as a raw unexplained number (each has its qualifier line).

**R6. v11 visual language**
The page is rebuilt inside the v11 shell: glass sidebar, brand blue primary, pastel status tints (amber = pending, green = approved, red = spam/rejected), replacing the AdminLTE/DataTables chrome.
- [ ] No DataTables default controls ("Show N entries", unlabeled search) remain on the Pending/Approved tabs.

### P1 — should have (fast follow)

**R7. Group-by-article view**
A view toggle on the Pending tab: *By article* / *Newest first*. In article view, comments cluster under a collapsible article header (thumbnail, title, section, publish date, total comments, pending badge) with group-level Approve all / Reject all actions.
- [ ] Given an article has 2 pending comments, when in article view, then both render under one article header showing "2 pending".
- [ ] Group actions produce one undo toast for the group.

**R8. Threaded reply context**
Replies render indented with a quoted excerpt of the parent comment ("Replying to X — '…'").
- [ ] Given a pending reply, when its parent was deleted, then the quote line reads "Replying to a removed comment" (no crash, no blank).
- *Dependency: requires parent-comment reference in the comments API (see open questions).*

**R9. Heuristic spam-flood detection**
Near-identical comments from the same email within a short window are auto-grouped, labeled ("Likely spam · N similar"), collapsed by default, and given a one-click "Reject all N".
- [ ] Detection rule v1: same email + Levenshtein-similar body + submitted within 10 minutes.
- [ ] Collapsed groups can be expanded and reviewed individually; nothing is auto-rejected without moderator action.

**R10. Commenter trust signal**
Cards show a "N prior approved" chip for returning commenters with approved history.

**R11. Keyboard shortcuts**
J/K to move between cards, A to approve, X to reject, with a visible focus state and a shortcut legend (?).

**R12. Empty state**
When the pending queue reaches zero: "You're all caught up" with count of comments processed this session.

**R13. Stats detail row (collapsible)**
Below the metric cards, collapsed by default: comments-per-week stacked bar chart (legitimate vs. spam, 8 weeks), status breakdown bar, most-commented articles list.

### P2 — future considerations (design for, don't build)

- **Berry AI spam scoring** — model-based toxicity/spam confidence per comment, queue pre-sorted safest-first. Design the card to accommodate an AI label slot now.
- **Trusted-commenter auto-approval** — policy-driven auto-approve with "auto-approved by Berry" audit labeling.
- **AI summary line for bilingual content** — one-line English gloss of Nepali comments for moderators who don't read both.
- **Commenter management** — click-through from the identity block to a commenter history/ban surface.

## Success metrics

**Leading (evaluate 2 weeks post-launch)**
- Median time-to-review for new comments: **< 24 hours** (stretch: < 4 business hours). Measured from `created_at` to status-change timestamp.
- Pending backlog: **0 comments older than 7 days** within 2 weeks of launch (currently: items at 5+ months).
- Bulk-action adoption: **≥ 30%** of moderation decisions made via bulk or group actions.
- Accidental-action rate: undo invoked on **< 5%** of actions, and **zero** support reports of unintended deletion.

**Lagging (evaluate 1 quarter post-launch)**
- Published-comment volume on the site increases (legitimate comments no longer dying in the queue) — baseline to be captured pre-launch.
- Moderator-reported satisfaction with the workflow (lightweight internal survey) improves vs. pre-launch baseline.

## Open questions

**Blocking**
1. **API capabilities** *(engineering)* — Does the comments API support (a) bulk status updates, (b) a parent-comment/thread reference, (c) per-article aggregation? R4 depends on (a); R8 on (b); R7 on (c). If absent, scope API work into phase 1/2.
2. **Roles and permissions** *(engineering + admin stakeholder)* — Is Delete restricted to certain roles today? The overflow-menu demotion assumes any moderator may delete; confirm.

**Non-blocking**
3. **Undo semantics** *(engineering)* — Is undo a client-side delay before commit, or a server-side status reversal? Affects R3 implementation, not behavior.
4. **Spam heuristic thresholds** *(data/engineering)* — Tune similarity threshold and time window (proposed: 10 min) against historical comment data before enabling R9 by default.
5. **Time-to-review target** *(editorial stakeholder)* — Is same-day the right SLA, or should sports/breaking-news articles have a tighter one?
6. **Backlog cold-start** *(editorial stakeholder)* — The existing 5-month-old pending items: bulk-triage them at launch, or expire comments older than N months automatically?

## Timeline and phasing

No hard external deadline; phased to deliver the core fix fast.

**Phase 1 — structure (v1 launch): R1–R6.**
Tabs, cards, action hierarchy + undo, bulk actions, stats band, v11 visuals. This alone resolves the backlog-invisibility and mis-click problems.
*Dependency: open question 1(a) — bulk API.*

**Phase 2 — throughput (fast follow): R7–R13.**
Article grouping, reply threading, heuristic spam grouping, trust chips, keyboard shortcuts, empty state, stats detail.
*Dependencies: open questions 1(b), 1(c), 4.*

**Phase 3 — intelligence (next quarter): P2 items.**
Berry AI scoring, auto-approval policy, bilingual summaries. Requires phase 2 telemetry (moderator decisions become training/eval signal).

## Design reference

Interaction mockups (queue card layout, stats band, article-grouped view) were produced in the design exploration session of 2026-07-15 and reflect the v11 dashboard direction (brand blue + pastel palette, glass sidebar). Industry reference patterns: Discourse review queue (keyboard-driven triage), Gmail (bulk select + undo), YouTube Studio comments (article/video grouping), Linear (optimistic actions with undo toasts).
