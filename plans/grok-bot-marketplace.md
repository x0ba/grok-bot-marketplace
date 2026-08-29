# Grok bot marketplace plan

This program turns the fresh TanStack Start scaffold into a marketplace for shared Grok bot templates.
A visitor browses a ranked catalog of bots, each parsed from its x.ai share link.
A signed-in user submits links, tags them, describes them, and upvotes.
A Grok bot reads the same catalog over MCP and hands its user an install link.
The PR order is foundation, submit, feed, mcp, polish.

## How to read this

One box is one unit of work. Every box names the evidence that checks it. A nested box is a sub-step of the box above it. Check a box only when its evidence exists, a file, a log line, a screenshot, a test run, or a SHA. The body is a how-to. The appendices explain and record.

The program runs the autopilot-stack playbook, `playbooks/autopilot-stack.md` under the pstack plugin. The root appends each verified PR to one linear Graphite stack. The operator reviews and lands the stack herself. Every PR stops at merge-ready. All five PRs are review-gated.

Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

## Program checklist

### Arm the program

- [ ] State the protocol and this plan to the operator, then stop. Start execution only on her explicit go.
- [ ] On her go, arm a `/goal` with this exact text. "Run plans/grok-bot-marketplace.md. PR order foundation, submit, feed, mcp, polish. Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. The root appends each verified PR to the Graphite stack. The operator reviews and lands the stack. Done when all five PRs sit verified and merge-ready in one linear stack."
- [ ] Create the GitHub repo and add it as `origin`. The workspace has no remote and no commits yet.
- [ ] Commit the scaffold as-is to `main` as the base commit and push. Every PR needs this base to diff against.
- [ ] Confirm `.env.local` carries working Clerk and Convex values, and that a Clerk JWT template named `convex` exists with `CLERK_JWT_ISSUER_DOMAIN` set on the Convex deployment. The foundation owner is blocked without them.
- [ ] Read these in full at program start. Re-read them at every tick. Find the skill files under the pstack plugin cache with Glob.
  - [ ] `git show origin/main:plans/grok-bot-marketplace.md`
  - [ ] `playbooks/autopilot-stack.md`
  - [ ] `skills/swarm/SKILL.md`
  - [ ] `playbooks/opening-a-pr.md`
  - [ ] `playbooks/babysit.md`
- [ ] Arm the 30-minute audit tick as a real terminal `/loop`. Never leave the cadence to memory.
- [ ] Use this tick prompt, verbatim. "Re-read the execution playbook from trunk and the armed /goal. Audit the operation against both and fix drift in this tick. Probe every active lane and judge progress by side effects only. Stand down a stuck lane and dispatch its replacement now. Then send the operator a status message, whether or not anything changed, with the queue table of PR, owner, state, and head SHA, the verdicts since the last tick, what merged, open operator gates, and blockers."
- [ ] On the operator's hold or stand-down, send every owner a zero-writes order at once.

### Spawn owners

- [ ] Spawn one owner per PR with the full lifecycle the autopilot-stack playbook names.
- [ ] Follow this dependency graph. Base each PR on its parent branch, since the stack is linear.
  - [ ] foundation is first. It branches from `main`.
  - [ ] submit after foundation.
  - [ ] feed after submit.
  - [ ] mcp after feed.
  - [ ] polish after mcp.
- [ ] Hold the file boundaries. foundation owns `convex/schema.ts`, `convex/lib/**`, `src/styles.css`, and `src/routes/__root.tsx`. submit owns `convex/bots.ts`, `convex/lib/parseBotPage.ts`, and `src/routes/submit.tsx`. feed owns `convex/votes.ts`, `convex/feed.ts`, `convex/seed.ts`, `src/routes/index.tsx`, and `src/routes/bot.$botId.tsx`. mcp owns `src/routes/mcp.ts` and `src/mcp/**`. polish touches `src/**` only and no `convex/**` schema or mutation files.
- [ ] Hold the review gate. All five PRs change an interaction or the operator-facing catalog API. Each waits for the operator's review in chat with screenshots and a video before it enters the stack.

### PR mechanics, for every PR

- [ ] Open the PR ready, never draft, registered with Graphite `gt` as part of the stack.
- [ ] Run `npm run lint` and `npx tsc --noEmit` once before the PR-facing push. Push with hooks on.
- [ ] The cursor-team-kit plugin is not installed. Run a manual slop pass per the unslop skill before each commit and a comment audit per the no-comments skill before review.
- [ ] Triage every Bugbot and security-reviewer comment per the bugbot-triage reference. Dismiss noise with a concrete reason.
- [ ] Restack onto the current parent before babysit and again before the STACK-READY report.

### Verdict and merge, for every PR

- [ ] At the STACK-READY head SHA, run the swarm per the swarm skill. One gates lane. The ten live lanes from the PR's **Verify, live** block. The perf lane from its **Verify, perf** block. One audit lane that reads the diff and the receipts and distrusts the PR body.
- [ ] Clean only when every lane is `PASS`. Findings go back to the owner. A new head gets a fresh swarm and a fresh verdict.
- [ ] On a clean verdict the root appends the PR to the Graphite stack with `gt track -p <current-tip>` then `gt submit --no-interactive --stack`. Nothing auto-ships. A restack rewrites SHAs, so compare `git patch-id` at each verdict SHA against the new head and re-verify anything that drifted.

### Boot recipe, for every live lane

Each live lane runs in its own worktree at the PR head. No control-ui skill is installed, so lanes drive the page through the cursor-ide-browser tools.

- [ ] `git fetch origin <head-branch> && git checkout <head SHA>`, then `npm install`.
- [ ] Start the backend with `CONVEX_AGENT_MODE=anonymous npx convex dev` in one terminal. Start the app with `npm run dev` in another. Wait for the Vite ready line on port 3000.
- [ ] Deliver input only through `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_fill`, and `browser_press_key`. Read-only diagnostics through `browser_cdp` with `Runtime.evaluate`.
- [ ] For lanes that need auth, sign in with a Clerk test account. Use an email ending in `+clerk_test@example.com` and the code `424242`.
- [ ] Save every screenshot to `/tmp/swarm-<pr-id>/worker-<n>/<slug>.png` and return the paths with the report.

## Clear the scaffold and lay the foundation (foundation)

**Depends on.** None. Branches from the base commit on `main`.

**Files.**

- [ ] Delete `convex/todos.ts` and `src/mcp-todos.ts`. The todo demo goes before anything is built on top of it.
- [ ] Create `convex/auth.config.ts`, `convex/lib/auth.ts`, `src/components/header.tsx`, and `vitest.config.ts`.
- [ ] Edit `convex/schema.ts`, `src/styles.css`, `src/routes/__root.tsx`, `src/routes/index.tsx`, and `src/routes/mcp.ts`.

**Build.**

- [ ] Replace the demo schema in `convex/schema.ts` with the three real tables. This shape drives every later PR.

```ts
export default defineSchema({
	users: defineTable({
		clerkId: v.string(),
		name: v.string(),
		imageUrl: v.optional(v.string()),
	}).index('by_clerkId', ['clerkId']),

	bots: defineTable({
		botId: v.string(),
		url: v.string(),
		name: v.string(),
		creatorName: v.optional(v.string()),
		ogImageUrl: v.optional(v.string()),
		promptExcerpt: v.optional(v.string()),
		description: v.optional(v.string()),
		tags: v.array(v.string()),
		submitterId: v.id('users'),
		score: v.number(),
	})
		.index('by_botId', ['botId'])
		.index('by_score', ['score'])
		.searchIndex('search_name', { searchField: 'name', filterFields: ['tags'] }),

	votes: defineTable({
		botId: v.id('bots'),
		userId: v.id('users'),
	}).index('by_bot_user', ['botId', 'userId']),
})
```

- [ ] Add `convex/auth.config.ts` with the Clerk provider read from `CLERK_JWT_ISSUER_DOMAIN`.
- [ ] Add `getOrCreateUser(ctx)` in `convex/lib/auth.ts`. It reads `ctx.auth.getUserIdentity()`, upserts into `users` by `clerkId`, and throws when signed out. Every authed mutation calls it.
- [ ] Rewrite the theme tokens in `src/styles.css`. Near-black background, high-contrast off-white foreground, one accent, tight tracking on display text, dark mode as the only mode. Match the look of the x.ai bot page, which styles its title with `font-display`, normal weight, and tight tracking.
- [ ] Add `src/components/header.tsx` with the app name and the existing Clerk `header-user.tsx`. Mount it in `src/routes/__root.tsx` and set the document title.
- [ ] Replace the demo content in `src/routes/index.tsx` with an empty-catalog state that reads "No bots yet".
- [ ] Strip the `addTodo` demo tool from `src/routes/mcp.ts`. Keep the server and the POST handler so the route still answers.
- [ ] Add vitest and `convex-test` as dev dependencies and a `test` script.

**You see.**

- [ ] `npm run dev` renders the dark shell with the header, sign-in works, and `npx convex dev` pushes the schema with no demo tables. The Convex dashboard shows `users`, `bots`, and `votes`.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `convex/lib/auth.test.ts` proves `getOrCreateUser` inserts once and returns the same user on the second call with the same identity. Run `npx vitest run`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Load the home page. Save `shell.png`. Pass when the header shows the app name and a sign-in button on the near-black background.
- [ ] Lane 2. Complete the Clerk test sign-in. Save `signed-in.png`. Pass when the header shows the user avatar.
- [ ] Lane 3. Sign out from the avatar menu. Save `signed-out.png`. Pass when the sign-in button replaces the avatar.
- [ ] Lane 4. Reload after signing in. Save `session-persist.png`. Pass when the avatar survives the reload.
- [ ] Lane 5. Read the page console via `browser_cdp`. Save `console.png`. Pass when no errors are logged on load.
- [ ] Lane 6. Set a 390px viewport. Save `mobile.png`. Pass when the header fits with no horizontal scroll.
- [ ] Lane 7. Inspect the computed body background via `Runtime.evaluate`. Save `theme.png`. Pass when it equals the near-black token from `src/styles.css`.
- [ ] Lane 8. Search the rendered home page for todo UI. Save `no-demo.png`. Pass when no todo text or list remains.
- [ ] Lane 9. From the page console, POST an MCP initialize request to `/mcp`. Save `mcp-alive.png`. Pass when the response carries `serverInfo` and no tools.
- [ ] Lane 10. View the empty catalog signed out. Save `empty-state.png`. Pass when the page reads "No bots yet".

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Cold load time of the home page, navigation start to load event, from `Performance.getMetrics`.
- [ ] Probe. Load the page five times at trunk and five at the head, interleaved, and take the median.
- [ ] Baseline. Record the trunk median first.
- [ ] Rule. The head median stays within 500ms of the trunk median. Slower fails.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 1, 2, and 7 screenshots into `plans/media/foundation-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of the shell and the sign-in flow on a lane worktree. Save it as `plans/media/foundation-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Restacked onto the current base after the verdict, patch-id unchanged.
- [ ] The root appends the PR to the Graphite stack. The operator lands it.

## Parse bot links and take submissions (submit)

**Depends on.** foundation.

**Files.**

- [ ] Create `convex/lib/parseBotPage.ts`, `convex/lib/parseBotPage.test.ts`, `convex/lib/__fixtures__/point-peddler.html`, `convex/bots.ts`, and `src/routes/submit.tsx`.
- [ ] Edit `src/components/header.tsx` to add the Submit link.

**Build.**

- [ ] Validate the URL at the boundary. Accept only `https://x.ai/bot/<id>` where the id matches `[A-Za-z0-9_-]+`. Normalize to that exact form and extract `botId`. Everything past this check trusts the parsed value.
- [ ] Write `parseBotPage(html)` as a pure function. It reads `og:title`, `og:image`, and `og:description` from the meta tags, falls back to `<title>`, and splits the title on the last " by " into `name` and `creatorName`. The probe in Appendix A shows both tags present on a real bot page.
- [ ] Add the `fetchBotPreview` action in `convex/bots.ts`. It validates the URL, fetches the page, and returns the parsed fields without writing. Convex actions have `fetch` built in, so no `"use node"` file is needed.
- [ ] Add the `submitBot` action. It requires auth, re-fetches and re-parses server side so client-supplied names are never trusted, normalizes tags to lowercase and trimmed with at most five of 24 chars each, caps the description at 500 chars, and inserts through an internal mutation. A `botId` already in `bots` throws a `ConvexError` naming the existing listing.
- [ ] Build `src/routes/submit.tsx`. Paste a link, see the parsed preview card with name, creator, and image, add optional tags and a description, publish, and land on the home page with a toast. Signed out, the route shows a sign-in prompt instead of the form.
- [ ] Trim the saved fixture to the head section with the meta tags so the test file stays small.

**You see.**

- [ ] Paste `https://x.ai/bot/PFD95widaEeqjkYLLUZmD`, and the preview reads "point peddler" by "Daniel" with its card image. Publish, and the row appears in the `bots` table.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `parseBotPage.test.ts` covers the fixture, a title with no " by " suffix, and a page with no og tags. URL validation covers non-x.ai hosts, non-bot paths, and bad ids. Tag normalization covers case, whitespace, and the five-tag cap. Run `npx vitest run`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Signed in, paste the point peddler URL on `/submit`. Save `preview.png`. Pass when the preview names "point peddler" and "Daniel".
- [ ] Lane 2. Publish with a description and the tags "Travel" and "points". Save `published.png`. Pass when a success toast shows and the home page lists the bot.
- [ ] Lane 3. Inspect the stored listing. Save `tags.png`. Pass when both tags render lowercase.
- [ ] Lane 4. Submit the same URL again. Save `duplicate.png`. Pass when the form says the bot is already listed and links the existing listing.
- [ ] Lane 5. Paste `https://example.com/bot/x`. Save `invalid-url.png`. Pass when an inline error shows and no fetch fires.
- [ ] Lane 6. Paste `https://x.ai/bot/doesnotexist000` with a made-up id. Save `not-found.png`. Pass when the form reports the bot page could not be read.
- [ ] Lane 7. Add a sixth tag. Save `tag-limit.png`. Pass when the form refuses it at five.
- [ ] Lane 8. Type a 600-char description. Save `desc-limit.png`. Pass when the counter blocks publish past 500.
- [ ] Lane 9. Open `/submit` signed out. Save `gated.png`. Pass when a sign-in prompt shows instead of the form.
- [ ] Lane 10. Check the preview card image. Save `og-image.png`. Pass when the bot's og image renders.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. `fetchBotPreview` round trip, paste to rendered preview.
- [ ] Probe. Time five previews of the point peddler URL at the head. At trunk, time five direct curls of the same x.ai URL, interleaved.
- [ ] Baseline. Record the trunk curl median first.
- [ ] Rule. The preview median stays within 1s of the curl median. The overhead budget covers the action hop and parsing only.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 1, 2, and 4 screenshots into `plans/media/submit-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of paste, preview, tag, and publish on a lane worktree. Save it as `plans/media/submit-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Restacked onto the current parent after the verdict, patch-id unchanged.
- [ ] The root appends the PR to the Graphite stack. The operator lands it.

## Rank the catalog and let users vote (feed)

**Depends on.** submit.

**Files.**

- [ ] Create `convex/feed.ts`, `convex/votes.ts`, `convex/votes.test.ts`, `convex/seed.ts`, `src/routes/bot.$botId.tsx`, `src/components/bot-card.tsx`, and `src/components/vote-button.tsx`.
- [ ] Edit `src/routes/index.tsx`.
- [ ] Add the shadcn components card, badge, tabs, skeleton, avatar, and sonner with `pnpm dlx shadcn@latest add <component>`.

**Build.**

- [ ] Add `listTop` and `listNew` paginated queries in `convex/feed.ts`. Top orders by the `by_score` index descending. New orders by creation time descending. Both take `paginationOpts` and an optional tag that filters the returned page in TypeScript.
- [ ] Add `getByBotId` in `convex/feed.ts` for the detail page, keyed on the x.ai `botId`.
- [ ] Add `toggleUpvote` in `convex/votes.ts`. One mutation looks up `votes` by the `by_bot_user` index, inserts the row and increments `score` when absent, deletes the row and decrements when present. Convex mutations are transactions, so the row and the score never diverge. One vote per user per bot, toggled, no downvotes.
- [ ] Add `myVoteBotIds` in `convex/votes.ts` so the feed can fill the arrow for bots the viewer already upvoted.
- [ ] Add `seedBots` as an internal mutation in `convex/seed.ts` that inserts n fake bots with spread scores. Lanes and the perf probe run it with `npx convex run`.
- [ ] Rewrite `src/routes/index.tsx` as the feed. Top and New tabs, `usePaginatedQuery`, a load-more control, and one `bot-card.tsx` row per bot with the vote button on the left, the name, the creator, the tag badges, and the score.
- [ ] Build `src/routes/bot.$botId.tsx`. Name, creator, full description, prompt excerpt, tags, score, and a prominent "Add to Grok Bot" link to the x.ai URL.
- [ ] A signed-out click on the vote button opens the Clerk sign-in and changes nothing.

**You see.**

- [ ] With two listed bots, upvoting the second raises its count and moves it above the first on the Top tab. A second click on the arrow undoes both.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `convex/votes.test.ts` proves toggle on then off restores the score, a double toggle leaves at most one vote row per user per bot, and two users add two points. A pagination case proves `listTop` orders by score across page boundaries. Run `npx vitest run`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Seed 12 bots, open the Top tab. Save `top.png`. Pass when rows descend by score.
- [ ] Lane 2. Open the New tab. Save `new.png`. Pass when the newest listing is first.
- [ ] Lane 3. Signed in, upvote a bot. Save `upvote.png`. Pass when the count increments and the arrow fills.
- [ ] Lane 4. Click the same arrow again. Save `unvote.png`. Pass when the count and the arrow revert.
- [ ] Lane 5. Upvote, then reload. Save `vote-persist.png`. Pass when the arrow stays filled.
- [ ] Lane 6. Vote on the same bot from a second Clerk test account. Save `two-users.png`. Pass when the count shows both votes.
- [ ] Lane 7. Click the arrow signed out. Save `vote-gated.png`. Pass when the sign-in opens and the count does not change.
- [ ] Lane 8. Load more past the first page. Save `pagination.png`. Pass when more rows append in order.
- [ ] Lane 9. Open a bot's detail page. Save `detail.png`. Pass when the name, creator, tags, description, and the "Add to Grok Bot" link to x.ai all render.
- [ ] Lane 10. Show Top in one tab and vote from another tab. Save `live-rank.png`. Pass when the first tab reorders without a reload.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Home page cold load with 200 seeded bots, navigation start to load event.
- [ ] Probe. Seed 200 bots at the head, load five times. Load the trunk home page five times, interleaved. Take medians.
- [ ] Baseline. Record the trunk median first.
- [ ] Rule. The head median stays within 750ms of the trunk median. Slower fails, since the first page is 20 rows regardless of catalog size.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 1, 3, and 9 screenshots into `plans/media/feed-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of browsing, voting, and the live reorder on a lane worktree. Save it as `plans/media/feed-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Restacked onto the current parent after the verdict, patch-id unchanged.
- [ ] The root appends the PR to the Graphite stack. The operator lands it.

## Expose the catalog over MCP (mcp)

**Depends on.** feed.

**Files.**

- [ ] Create `src/mcp/catalog.ts` and `src/mcp/catalog.test.ts`.
- [ ] Edit `src/routes/mcp.ts`.

**Build.**

- [ ] Register three read-only tools on the existing `McpServer` in `src/routes/mcp.ts`. The handlers call Convex through a `ConvexHttpClient` built from `VITE_CONVEX_URL`. No auth, since the catalog is public.
- [ ] `list_bots` takes `sort` of `top` or `new` and a `limit` clamped to 50. It returns name, creator, description, tags, score, and `install_url`.
- [ ] `search_bots` takes a query string and an optional tag. It runs the `search_name` search index with the tag as a filter field and returns the same shape.
- [ ] `get_bot` takes the x.ai bot id. It returns the full record, `install_url` as `https://x.ai/bot/<id>`, and one instruction line telling the agent to open the link so its user can click "Add to Grok Bot". An unknown id returns a clean tool error.
- [ ] Put the record-to-payload shaping in `botToToolPayload` in `src/mcp/catalog.ts` as a pure function the tests hit directly.

**You see.**

- [ ] The MCP inspector connected to `http://localhost:3000/mcp` lists the three tools, and `list_bots` returns the seeded bots with their x.ai links.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `src/mcp/catalog.test.ts` proves `botToToolPayload` builds `install_url` from the bot id, drops Convex-internal fields, and clamps `limit` to 50. Run `npx vitest run`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe. Lanes drive the MCP inspector UI from `npx @modelcontextprotocol/inspector` in the browser.

- [ ] Lane 1. Connect the inspector to `http://localhost:3000/mcp`. Save `connect.png`. Pass when the server reports connected.
- [ ] Lane 2. List tools. Save `tools.png`. Pass when exactly `list_bots`, `search_bots`, and `get_bot` appear.
- [ ] Lane 3. Call `list_bots` with sort top. Save `list-top.png`. Pass when results descend by score and every result carries `install_url`.
- [ ] Lane 4. Call `list_bots` with sort new. Save `list-new.png`. Pass when the newest listing is first.
- [ ] Lane 5. Call `search_bots` with the query "peddler". Save `search-name.png`. Pass when point peddler returns.
- [ ] Lane 6. Call `search_bots` with a tag filter. Save `search-tag.png`. Pass when only bots carrying the tag return.
- [ ] Lane 7. Call `get_bot` with a real id. Save `get-bot.png`. Pass when the record and `https://x.ai/bot/<id>` return with the install instruction.
- [ ] Lane 8. Call `get_bot` with a fake id. Save `get-missing.png`. Pass when a clean not-found error returns with no stack trace.
- [ ] Lane 9. Call `list_bots` with limit 500. Save `limit-cap.png`. Pass when at most 50 return.
- [ ] Lane 10. Check the tool list for the scaffold demo. Save `no-demo-tool.png`. Pass when no `addTodo` tool exists.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. `list_bots` round trip over JSON-RPC with 200 seeded bots.
- [ ] Probe. A script POSTs initialize plus `list_bots` ten times at the head. At trunk, the same script POSTs initialize ten times, interleaved. Take medians.
- [ ] Baseline. Record the trunk initialize median first.
- [ ] Rule. The `list_bots` median stays within 300ms of the initialize median. The budget covers one Convex query only.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 3, 5, and 7 screenshots into `plans/media/mcp-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of the inspector calling all three tools on a lane worktree. Save it as `plans/media/mcp-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Restacked onto the current parent after the verdict, patch-id unchanged.
- [ ] The root appends the PR to the Graphite stack. The operator lands it.

## Polish the browsing experience (polish)

**Depends on.** mcp.

**Files.**

- [ ] Create `src/components/tag-filter.tsx`.
- [ ] Edit `src/routes/index.tsx`, `src/routes/bot.$botId.tsx`, `src/routes/submit.tsx`, and `src/routes/__root.tsx`.

**Build.**

- [ ] Add the tag filter to the feed. Clicking a tag badge narrows the feed to that tag through the existing query arg, and a clear control restores the full feed. The active tag lives in the route's search params so the URL is shareable.
- [ ] Add skeleton rows while feed pages load and while the submit preview fetches.
- [ ] Add a styled 404 state to the detail route for unknown bot ids.
- [ ] Set per-route document titles and og meta through the route `head` option. The detail page title is the bot name.
- [ ] Add visible focus rings and keyboard operability to the vote button and the tag badges.
- [ ] Surface submit failures as an error toast with the server's message.

**You see.**

- [ ] Clicking a "travel" badge shows only travel bots with the tag in the URL, and the tab title on a detail page reads the bot's name.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] A `convex/feed.test.ts` case proves the tag arg filters `listTop` results to bots carrying the tag. Run `npx vitest run`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Click a tag badge on the feed. Save `tag-filter.png`. Pass when only bots with that tag remain and the tag shows in the URL.
- [ ] Lane 2. Clear the filter. Save `tag-clear.png`. Pass when the full feed returns.
- [ ] Lane 3. Throttle the network via CDP and reload the feed. Save `skeleton.png`. Pass when skeleton rows show before content.
- [ ] Lane 4. Filter to a tag no bot carries. Save `empty.png`. Pass when a styled empty state shows instead of a blank page.
- [ ] Lane 5. Open `/bot/doesnotexist000`. Save `not-found.png`. Pass when the styled 404 state renders.
- [ ] Lane 6. Open a bot detail page and read the tab title. Save `titles.png`. Pass when the title is the bot's name.
- [ ] Lane 7. Set a 390px viewport on the feed and a detail page. Save `mobile.png`. Pass when both fit with no horizontal scroll.
- [ ] Lane 8. Tab to a vote button and press enter. Save `keyboard.png`. Pass when the vote registers and a focus ring is visible.
- [ ] Lane 9. Stop the Convex dev process and publish a submission. Save `error-toast.png`. Pass when an error toast shows instead of a silent failure.
- [ ] Lane 10. Snapshot og meta on a detail page via `Runtime.evaluate`. Save `og-meta.png`. Pass when og title and description are set.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Home page cold load with 200 seeded bots, navigation start to load event.
- [ ] Probe. Load five times at the head and five at the feed PR's head, interleaved. Take medians.
- [ ] Baseline. Record the feed PR median first. It is this PR's trunk.
- [ ] Rule. The head median stays within 250ms of the baseline. Polish must not slow the page.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 1, 5, and 6 screenshots into `plans/media/polish-review-<slug>.png`.
- [ ] Record a 30 to 60 second video walking filter, empty state, 404, and keyboard voting on a lane worktree. Save it as `plans/media/polish-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Restacked onto the current parent after the verdict, patch-id unchanged.
- [ ] The root appends the PR to the Graphite stack. The operator lands it.

## Close the program

- [ ] Every box above is checked with its evidence.
- [ ] Reply to the operator with links to the stack root and tip, a one-line verdict summary per link, and anything parked or excluded with the reason.

## Appendix A. Prototype evidence

The open question was whether the x.ai bot page can be parsed server side. Answered yes on 2026-08-28 by fetching `https://x.ai/bot/PFD95widaEeqjkYLLUZmD` twice, once through a page-reader fetch and once with curl. No branch or SHA exists because the probe wrote no code.

Findings, from the saved response at `/tmp/xai-bot.html` (121,541 bytes):

- The page is public. No auth wall and no JavaScript rendering needed. The full HTML comes back on a plain GET.
- `<title>` and `og:title` both read "point peddler by Daniel". Splitting on the last " by " yields the name and the creator.
- `og:description` carries the opening of the bot's prompt. `og:image` carries a 1200x630 card image.
- An `<h1 title="point peddler">` also carries the name, styled with `font-display`, normal weight, and tight tracking. That styling anchors the theme work in foundation.
- The page footer includes the "Add to Grok Bot" call to action, which confirms the share URL is itself the install link.

Unproven, carried as risks in Appendix C. Whether x.ai rate-limits or blocks datacenter IPs, whether the "name by creator" title format holds across all bots, and what a private or deleted bot returns.

## Appendix B. Alternatives rejected

- Downvotes. Reddit has them, but a small template catalog needs signal, not negativity, and upvote-only keeps the vote model to one row per user per bot with no value column. Revisit if ranking quality suffers at scale.
- Headless browser scraping. The og tags arrive in plain HTML, so a regex over meta tags beats a browser dependency.
- Storing the full prompt text. The og description excerpt is enough for browsing, and republishing a creator's full prompt without consent is a bad default.
- A separate tags table with an index. Convex cannot index array membership, but at launch scale a TypeScript filter over a 20-row page costs nothing. The search index covers tag filtering for MCP search.
- A TanStack server function for page parsing. A Convex action keeps all backend logic in one runtime and lets the insert share the transaction boundary with validation.
- Trusting client-parsed fields on publish. The submit action re-fetches, which costs one extra request and removes the spoofing hole.

## Appendix C. Risks

- x.ai changes the page markup. Lands on submit. The fixture test breaks loudly, and `parseBotPage` falls back from `og:title` to `<title>`. The owner watches the fixture test.
- x.ai rate-limits or blocks the production host's IP. Lands on submit. Low volume at launch, one fetch per preview and one per publish. If it appears, add a per-user submit cooldown before reaching for proxies.
- Private or deleted bots. Lands on submit. Lane 6 proves the unknown-id path shows a clean error. The parser treats any page missing og tags and title as unreadable.
- No cursor-team-kit control skills installed. Lands on every PR. Lanes drive through the cursor-ide-browser tools instead of control-ui, and the slop pass is manual per the unslop skill instead of `/deslop`.
- Auth lanes need Clerk test-mode accounts. Lands on foundation, submit, feed, and polish. The boot recipe uses `+clerk_test@example.com` addresses with the fixed code, which requires the Clerk instance to be in development mode.
- Score drift between `votes` and `bots.score`. Lands on feed. One transactional mutation writes both, and the unit tests pin the invariant.
- The MCP route takes unauthenticated POSTs. Lands on mcp. All three tools are read-only queries over public data, so exposure is limited to catalog reads. Never register a write tool without auth.

## Appendix D. Links and reading list

- [Convex pagination](https://docs.convex.dev/database/pagination) before feed.
- [Convex full text search](https://docs.convex.dev/search/text-search) before mcp.
- [Convex and Clerk](https://docs.convex.dev/auth/clerk) before foundation.
- [TanStack Start server routes](https://tanstack.com/start/latest/docs/framework/react/server-routes) before mcp, since `/mcp` is a server route.
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) before mcp.
- [shadcn/ui theming](https://ui.shadcn.com/docs/theming) before foundation.

No PR here is contested enough for the interrogate skill. If the feed ranking design grows a decay term or downvotes later, run the how skill first. Each owner keeps a `decisions.tsv` trail per the show-me-your-work skill, local, never committed, returned with its report.
