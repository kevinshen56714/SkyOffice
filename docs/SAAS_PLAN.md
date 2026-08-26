# Turning MIH Office into a SaaS

A build plan for taking this repository — a hardened SkyOffice fork that one
person deploys as a Portainer stack — and running it as a multi-tenant product
in the shape of [Katmai](https://katmaitech.com/): companies sign up, get a
persistent branded office at their own address, and pay per seat.

**Decisions this plan is written against**

| Decision | Choice |
| --- | --- |
| Visual fidelity | Stay 2D. Polish the pixel art, add maps, make them per-tenant. No 3D track. |
| Control plane | Self-hosted Supabase (Postgres + Auth + Storage) on your own infrastructure. |
| Payments | PayPal first. PayMongo (cards + GCash + Maya) second, for local PHP billing. |

---

## 1. Where the code actually is today

Worth being precise, because the gap between "works for one deployment" and
"works as a product" is where the schedule goes.

**What is already good.** The security work is done and it is not shallow:
matchmaking origins are enforced ahead of Colyseus's own listener
(`server/index.ts`), movement is validated against a distance budget so a client
cannot teleport (`server/rooms/SkyOffice.ts`), chat and password attempts are
rate limited, the monitor refuses to mount without credentials, containers run
unprivileged with health checks, and `yarn audit:check` fails CI on new
advisories. Offices already outlive their rooms — `OfficeStore` keeps the
*definition* so a share link survives the room being disposed, and a stored
record beats whatever the reopening client claims, which is what stops someone
recreating a private office without its password. That is a real foundation.

**What does not exist yet.**

| # | Gap | Where |
| --- | --- | --- |
| 1 | Identity is client-asserted — a person types a name and gets an avatar. Nothing verifies who they are. | `client/src/components/LoginDialog.tsx:141` |
| 2 | Room access control is a bcrypt room password, not a user session. | `server/rooms/SkyOffice.ts:389` (`onAuth`) |
| 3 | No tenancy. The lobby lists every listed custom room to every client, across all would-be customers. | `server/index.ts` (`enableRealtimeListing()`) |
| 4 | Workspace records are a JSON file on one Docker volume. Single node, and losing the file closes every office. | `server/rooms/OfficeStore.ts` |
| 5 | Media is a full P2P mesh with no TURN. Uplink cost grows per proximate peer; it fails outright behind symmetric NAT and most corporate firewalls. | `client/src/web/WebRTC.ts` |
| 6 | One Colyseus process. No Redis presence or driver, and `officeStore` is a per-process singleton, so you cannot add a second node. | `server/index.ts` |
| 7 | Client config is baked per *deployment* at container start, not per *tenant* at page load. | `client/config.js.template`, `client/src/runtimeConfig.ts` |
| 8 | Proximity is a binary gate — video is on or off. There is no distance falloff, so there is no spatial audio in the sense Katmai means it. | `client/src/web/WebRTC.ts` (`allowPeer`) |

Gaps 1–4 and 7 are ordinary product work. **Gap 5 is the one that decides
whether this is a real product**, and it is the largest single item in this plan.

---

## 2. Target architecture

Five planes. The point of the split is that the game server stops owning
tenancy and stops carrying media.

```
                     app.mihoffice.com          acme.mihoffice.com
                            |                          |
                    +-------+--------+         +-------+--------+
   CONTROL PLANE    |  Marketing +   |         |  Game client   |   EDGE
                    |  Dashboard     |         |  (Phaser/React)|
                    |  (Next.js)     |         +-------+--------+
                    +-------+--------+                 |
                            |                          | workspace JWT
                    +-------+--------------------------+--------+
   API              |  Platform API — orgs, seats, invites,      |
                    |  entitlements, workspace tokens, webhooks  |
                    +-------+---------------------------+--------+
                            |                           |
              +-------------+----------+    +-----------+-----------+
   REALTIME   |  Colyseus game servers |    |  LiveKit SFU          |  MEDIA
              |  (position, chat,      |    |  (audio, video,       |
              |   items, presence)     |    |   screen share)       |
              +-------------+----------+    +-----------+-----------+
                            |                           |
              +-------------+---------------------------+---------+
   DATA       |  Postgres (Supabase)   Redis (presence, limits)    |
              |  Object storage (maps, logos, recordings)          |
              +---------------------------------------------------+
```

**Why LiveKit rather than keeping PeerJS.** In a mesh, every client uploads its
camera once per proximate peer. Six people standing together is five uplinks
each — roughly 3–5 Mbps up on a connection that usually has 10. Katmai's whole
premise is a company standing around in one space, so the mesh is not an
optimisation problem, it is a ceiling. An SFU makes it one uplink and N
downlinks, and it is also where per-track volume lives, which is how you get
continuous distance falloff instead of the current on/off gate. LiveKit
self-hosts, speaks a sane token model, and ships client SDKs; mediasoup is the
alternative if you want lower-level control and more work.

**Why the game server keeps Colyseus.** Nothing about positions, chairs,
whiteboards or chat bubbles is a media problem, and the existing state schema,
commands and movement validation are good. Colyseus stays; it just starts
verifying a real token and stops being the source of truth for what a workspace
*is*.

---

## 3. Data model

The minimum that makes seats, invites and entitlements enforceable. Postgres,
with row-level security on every table.

```sql
organizations   (id, slug, name, plan, seats_purchased, status,
                 branding jsonb, created_at, deleted_at)
memberships     (org_id, user_id, role, status, invited_by, joined_at)
                 -- role: owner | admin | member | guest
workspaces      (id, org_id, slug, name, description, map_id,
                 unlisted, is_default, created_at, archived_at)
invitations     (id, org_id, email, role, token_hash, expires_at, accepted_at)
subscriptions   (org_id, provider, provider_ref, plan, seats,
                 status, current_period_end)
usage_daily     (org_id, day, peak_concurrent, participant_minutes,
                 egress_bytes)
audit_log       (id, org_id, actor_id, action, target, meta jsonb, at)
```

`workspaces` is the table that replaces `OfficeStore`'s JSON file. Keep the
existing `get` / `put` / `prune` interface and swap the implementation — the
class already has a clean seam, so this is a substitution rather than a rewrite,
and `server/test/integration.ts` keeps covering it.

Note what leaves: the room password. Once membership decides access, a shared
password is a downgrade. Keep it only for the guest/visitor path.

---

## 4. Phases

Sized for two or three developers. Each phase ends with something you could
demo.

### Phase 0 — Foundations · ~2 weeks

Stand up self-hosted Supabase alongside the existing stack. Add Postgres and
Redis to the compose file. Create a staging environment that mirrors production,
move secrets out of the stack environment into a secret store, and set up
backups with a restore you have actually performed. Register the domain and
wildcard TLS for `*.mihoffice.com`.

**Done when** staging runs the current app end to end against the new
infrastructure, and you have restored a database from backup once.

### Phase 1 — Identity and tenancy · ~4 weeks

The core change. Supabase Auth for sign-up, sign-in, email verification and
password reset. Organizations, memberships and invitations. Then rewrite room
access:

- The client gets a short-lived **workspace token** from the Platform API,
  scoped to one workspace, carrying `user_id`, `org_id`, `role` and a display
  name the server trusts.
- `SkyOffice.onAuth` verifies that token instead of comparing a bcrypt hash, and
  `onJoin` takes name and avatar **from the token**, not from the client. Delete
  the client's ability to set its own name.
- Scope the lobby listing by org, so a customer can only ever see their own
  workspaces.
- Migrate `OfficeStore` to Postgres.

**Done when** two accounts in different organizations cannot see or reach each
other's workspaces, and a name in the room is a name someone actually proved.

### Phase 2 — Persistent workspaces and the dashboard · ~4 weeks

The product surface. A Next.js dashboard at `app.mihoffice.com`: create and
manage workspaces, invite and remove members, assign roles, set branding.
Per-tenant subdomain routing, with the client resolving its configuration at
page load from `/api/tenant?host=` rather than from a container-baked
`config.js`. Per-tenant branding — logo, workspace names, choice of map. A
default workspace created on sign-up so a new org lands *inside* an office
rather than on an empty list.

**Done when** a stranger can sign up, invite a colleague, and both walk around
a branded office at their own address without you touching anything.

### Phase 3 — Media that scales · ~6 weeks

The largest phase. Deploy LiveKit and issue LiveKit tokens from the Platform
API. Replace `WebRTC.ts` with a LiveKit room: publish once, subscribe to nearby
peers. Then make it feel like a room rather than a call:

- **Distance falloff.** Set per-track gain from the same distance the game
  already computes, so voices fade rather than snap.
- **Stereo panning.** Pan by relative bearing through a Web Audio panner. This
  is the single cheapest thing that makes a 2D map feel spatial.
- Screen share through the SFU, so more than one person can watch.
- Device selection, mute state, a working "who can hear me" indicator.
- Coturn for TURN, which is what makes it work on corporate networks at all.

**Done when** twenty people are in one workspace, audio fades naturally as they
walk apart, and it works from a network that blocks UDP.

### Phase 4 — Billing · ~3 weeks

**PayPal first.** PayPal Subscriptions for recurring per-seat billing, with the
Orders API for one-off purchases. Webhooks (`BILLING.SUBSCRIPTION.*`,
`PAYMENT.SALE.*`) drive the `subscriptions` table; verify every webhook
signature and make handlers idempotent, because PayPal will redeliver. PayPal
gets you paid globally on day one without a merchant entity negotiation, and PH
customers can pay with a card through it.

**PayMongo second**, once local demand is real — cards, GCash and Maya in PHP,
which is what an SME or school here will actually reach for. Put both behind one
`PaymentProvider` interface from the start: `createSubscription`,
`changeSeats`, `cancel`, `handleWebhook`. The provider becomes a column on
`subscriptions`, not a fork in the codebase.

Then enforce it: seat counts checked at invite time and at join time, a grace
period and dunning emails on failed payment, plan limits (seats, workspaces,
concurrent participants) read from one entitlements module rather than scattered
`if` statements.

**Done when** an organization can buy seats, add a member beyond its seat count
and be told why not, and lose access cleanly when payment fails.

### Phase 5 — Operations and trust · ~4 weeks

What makes it something a company will put its staff on. Redis presence and
driver for Colyseus so you can run more than one game node, with sticky routing
by workspace. Structured logging, metrics and alerting — concurrent
participants, room count, SFU egress, error rate. An admin console for you that
is scoped and audited, replacing the all-or-nothing `/colyseus` monitor. Audit
log surfaced to org owners. Backups with a documented RPO/RTO. A status page.
And the paperwork: terms of service, privacy policy, a DPA, a data export and a
real delete path.

**Done when** you can lose a game server node without losing the product, and
answer a customer's security questionnaire from documents that already exist.

### Phase 6 — Pilot and launch · ongoing

Three to five design partners from the MIH network — a co-working floor, a
school, a BPO team — on free or discounted seats in exchange for weekly
feedback. Onboarding that gets a new org to "we are standing in a room together"
in under five minutes. Then open sign-up.

---

## 5. Pricing and unit economics

The variable cost of this product is SFU egress, and it is the only number that
can quietly kill you. An SFU forwards one uplink to N subscribers, so cost
scales with *participant-minutes × streams subscribed*, not with users signed
up. Audio-only is roughly 40 kbps per subscribed track; video at 360p is roughly
500 kbps. A workspace of ten people all on camera and all in earshot is on the
order of 45 Mbps of egress, sustained.

Three consequences, all worth building in from Phase 3 rather than discovering
later:

- **Subscribe by proximity, not by room.** The game already knows who is nearby;
  use it to decide which tracks a client subscribes to. This is the single
  largest cost lever you have.
- **Audio-first.** Default cameras off; make video an explicit act. It is also
  what people actually want in an all-day office.
- **No unmetered free tier.** A free tier priced per seat with unlimited hours
  is a bandwidth bill with a sign-up form attached. Cap free plans by
  participant-minutes or concurrent users.

A workable shape for a PH market, per member per month: a free tier capped at
around five concurrent people and a few hundred participant-minutes; a team
plan in the ₱250–400 range; a business plan around ₱600–900 adding SSO, custom
maps and longer retention; annual at roughly ten months' price. Anchor against
what Gather and Kumospace charge in USD, then price under it in PHP — that
locality is a real advantage against Katmai, which is priced for the US market.

---

## 6. Risks

| Risk | Why it matters | What to do |
| --- | --- | --- |
| **Asset licensing** | The tilesets and sprites are LimeZu packs under a CC-BY-style licence: commercial use is fine *with credit*, redistribution and resale are not. A web app ships the tileset PNGs to every browser, which is at minimum worth a written check. | Get LimeZu's position in writing before launch, keep visible in-product credit, and price a commissioned or licensed tileset as the fallback. Do this in Phase 0 — cheap now, expensive after you have customers. |
| **WBO whiteboard is AGPL** | Currently an iframe embed, which is fine. Self-hosting a modified WBO to make it multi-tenant triggers AGPL source obligations. | Either keep it an unmodified embed, publish your changes, or replace it with tldraw or Excalidraw. |
| **Bandwidth economics** | See above. The failure mode is a growing product with negative gross margin. | Proximity-based subscription, audio-first defaults, metered free tier, per-org egress in `usage_daily` from day one. |
| **Colyseus 0.14** | Several majors behind. Upgrading during Phase 5 while carrying tenancy changes is unpleasant. | Do the upgrade at the end of Phase 1, while the surface area is still small. |
| **PH Data Privacy Act** | Selling to PH organizations means processing personal data as a controller/processor, with NPC obligations and breach-notification duties. | Fold into Phase 5's paperwork; get a Philippine lawyer to review the DPA rather than adapting a US template. |
| **Scope drift toward 3D** | Katmai's demo is seductive and a customer will ask. | The answer is that you compete on price, persistence and spatial audio, not fidelity. Revisit only after revenue. |

---

## 7. What to cut if the schedule slips

In order, cut: per-tenant custom maps (ship one good map), the audit log UI
(keep the table, skip the screen), SSO, recording, and mobile. Do not cut TURN,
proximity-based subscription, or seat enforcement — the first two are the
difference between "works on my laptop" and "works", and the third is the
difference between a product and a gift.

---

## 8. First week

1. Write to LimeZu about the asset licence. It gates everything and has the
   longest latency.
2. Stand up self-hosted Supabase in staging next to the existing stack.
3. Spike LiveKit with two browsers and per-track gain driven by fake
   coordinates — one day, and it de-risks the largest phase.
4. Sketch the `organizations` / `memberships` / `workspaces` schema and the
   workspace-token claims, since every later phase depends on their shape.
