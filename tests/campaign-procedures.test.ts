import test from "node:test";
import assert from "node:assert/strict";
import type { OracleDefinition, OracleRegistry } from "../src/domain/oracle.ts";
import { createCampaign } from "../src/generators/index.ts";
import { createSession } from "../src/domain/chronicleOperations.ts";
import { cloneCampaign } from "../src/domain/operations.ts";
import { validateCampaign, parseImport } from "../src/storage/schema.ts";
import { diceDomain } from "../src/generators/oracleRoller.ts";
import {
  campaignHasEnded,
  knownRouteDice,
  miseryCode,
  recordDawn,
  recordMisery,
  recordTravel,
  setCampaignDay,
  MAX_CAMPAIGN_DAY,
  rollMisery,
  rollRouteDuration,
  rollTravel,
  travelNeedsReplacement,
} from "../src/domain/campaignProcedures.ts";
const table = (id: string, dice: string, pages = 7): OracleDefinition => ({
  id,
  dice,
  sourceBookId: id.startsWith("core.") ? "core" : "feretory",
  title: id,
  sourcePage: pages,
  sourceVerified: true,
  tags: [],
  category: "EVENT",
  entries: diceDomain(dice).map((n) => ({
    id: `${id}:${n}`,
    min: n,
    max: n,
    text: `Fixture ${n}`,
  })),
});
const registry: OracleRegistry = {
  books: [
    { id: "core", title: "Core fixture" },
    { id: "feretory", title: "Feretory fixture" },
  ],
  procedures: [],
  tables: [
    table("core.miseries", "d66", 18),
    table("core.weather", "d12", 4),
    table("feretory.roadType", "d8"),
    table("feretory.roadEvent", "d20"),
    table("feretory.forage", "d6", 8),
    table("feretory.village", "d6", 8),
    table("feretory.campsite", "d12", 9),
    table("feretory.leaveRoad", "d12", 9),
  ],
};
const seq = (...values: number[]) => {
  let n = 0;
  return () => values[Math.min(n++, values.length - 1)];
};
const c = () => createCampaign("Procedure verification");

test("Misery d66 code formatter preserves psalm and verse, including terminal", () => {
  assert.equal(miseryCode(16), "1:6");
  assert.equal(miseryCode(77), "7:7");
  assert.equal(miseryCode(null), "MANUAL");
});
test("Misery first six choose only unique d66 results, including constant RNG", () => {
  const campaign = c();
  for (let i = 0; i < 6; i++)
    recordMisery(
      campaign,
      rollMisery(campaign, registry, () => 0),
    );
  assert.deepEqual(
    campaign.miseries.map((m) => m.roll),
    [11, 12, 13, 14, 15, 16],
  );
  assert.equal(campaign.timeline.length, 6);
});
test("Seventh Misery is always 7:7 and no eighth can alter the archive", () => {
  const campaign = c();
  for (let i = 0; i < 7; i++)
    recordMisery(
      campaign,
      rollMisery(campaign, registry, () => 0.99),
    );
  assert.equal(campaign.miseries[6].roll, 77);
  assert.equal(campaign.miseries[6].terminal, true);
  assert.equal(campaignHasEnded(campaign), true);
  const before = JSON.stringify(campaign);
  assert.throws(() => recordMisery(campaign, { roll: 11, result: "Eighth" }));
  assert.throws(() => recordDawn(campaign, registry));
  assert.equal(JSON.stringify(campaign), before);
});
test("No natural d66 outcome incorrectly ends the campaign", () => {
  const campaign = c();
  recordMisery(campaign, { roll: 66, result: "Fixture" });
  assert.equal(campaignHasEnded(campaign), false);
});
test("Duplicate and invalid Misery codes reject without timeline mutation", () => {
  const campaign = c();
  recordMisery(campaign, { roll: 11, result: "Fixture" });
  const before = JSON.stringify(campaign);
  for (const roll of [11, 17, 70, 77, 100])
    assert.throws(() => recordMisery(campaign, { roll, result: "Bad" }));
  assert.equal(JSON.stringify(campaign), before);
});
test("Manual unspecified Miseries still count toward the seventh, preserving notes", () => {
  const campaign = c();
  for (let i = 0; i < 7; i++)
    recordMisery(campaign, { roll: null, result: `Manual ${i}`, notes: "GM annotation" });
  assert.equal(campaign.miseries[6].roll, 77);
  assert.equal(campaign.miseries[0].notes, "GM annotation");
});
test("Dawn requires a chosen die and records no-Misery roll with new day", () => {
  const campaign = c();
  assert.throws(() => recordDawn(campaign, registry));
  campaign.apocalypseDie = 20;
  const result = recordDawn(campaign, registry, () => 0.5);
  assert.equal(result.roll, 11);
  assert.equal(result.misery, null);
  assert.equal(campaign.campaignDay, 2);
  assert.equal(campaign.timeline[0].sourceRefs[0].roll, 11);
});
test("Dawn result1 records both the date transition and a Misery", () => {
  const campaign = c();
  campaign.apocalypseDie = 2;
  const result = recordDawn(campaign, registry, () => 0);
  assert.equal(result.misery?.roll, 11);
  assert.equal(campaign.timeline.length, 2);
  assert.equal(campaign.miseries[0].inWorldDate, "Day 2");
});
test("Missing Misery data fails before advancing time; seventh needs no random table", () => {
  const empty = { ...registry, tables: [] };
  const campaign = c();
  campaign.apocalypseDie = 2;
  const before = JSON.stringify(campaign);
  assert.throws(() => recordDawn(campaign, empty, () => 0));
  assert.equal(JSON.stringify(campaign), before);
  for (let i = 0; i < 6; i++) recordMisery(campaign, { roll: null, result: "Manual" });
  assert.equal(recordDawn(campaign, empty, () => 0).misery?.roll, 77);
});
test("Only exact map endpoints have route dice, symmetric with original bounds", () => {
  assert.deepEqual(knownRouteDice("galgenbeck", "graven-tosk"), { sides: 6, modifier: 6 });
  assert.equal(rollRouteDuration("graven-tosk", "galgenbeck", () => 0).days, 7);
  assert.equal(rollRouteDuration("galgenbeck", "valley-undead", () => 0.999).days, 11);
  assert.equal(knownRouteDice("sarkash", "graven-tosk"), null);
  assert.throws(() => rollRouteDuration("kergus", "grift"));
});
test("Road7–8 rerolls persist the original roll chain; weather5–6 rerolls weather", () => {
  const reading = rollTravel("road", registry, seq(0, 0, 0.31, 0.21, 0.5));
  assert.deepEqual(
    reading.rolls.map((r) => r.roll),
    [1, 1, 7, 5, 7],
  );
  assert.equal(reading.rolls[4].oracleId, "core.weather");
});
test("Road reroll loop is bounded without inventing a replacement result", () => {
  assert.throws(() => rollTravel("road", registry, () => 0.31), /반복/);
});
test("Foraging5–6 rolls village; camp and off-road use their exact dice", () => {
  assert.deepEqual(
    rollTravel("forage", registry, () => 0.99).rolls.map((r) => r.oracleId),
    ["feretory.forage", "feretory.village"],
  );
  assert.equal(rollTravel("camp", registry, () => 0).rolls[0].dice, "d12");
  assert.equal(rollTravel("off-road", registry, () => 0).rolls[0].oracleId, "feretory.leaveRoad");
});
test("Travel records history without applying passage of time or HP/resource consequences", () => {
  const campaign = c();
  const reading = rollTravel("road", registry, () => 0);
  recordTravel(
    campaign,
    { from: "Sarkash", to: "Graven-Tosk", days: 4, action: "road", reading, notes: "Observed" },
    registry,
  );
  assert.equal(campaign.campaignDay, 1);
  assert.equal(campaign.timeline[0].type, "travel");
  assert.deepEqual(campaign.timeline[0].oracle?.rolls, reading.rolls);
  assert.match(campaign.timeline[0].description, /4일/);
});
test("Used italicized road events require a manual replacement before a second recording", () => {
  const campaign = c();
  const reading = rollTravel("road", registry, seq(0, 0, 0.46));
  const input = { from: "A", to: "B", action: "road" as const, reading };
  assert.equal(travelNeedsReplacement(campaign, reading), false);
  recordTravel(campaign, input, registry);
  assert.equal(travelNeedsReplacement(campaign, reading), true);
  assert.throws(() => recordTravel(campaign, input, registry));
  recordTravel(campaign, { ...input, notes: "A different event chosen by the GM" }, registry);
  assert.equal(campaign.timeline.length, 2);
});
test("Misery, time and travel exact values survive validation and JSON import", () => {
  const campaign = c();
  campaign.apocalypseDie = 6;
  recordDawn(campaign, registry, () => 0);
  recordTravel(
    campaign,
    { from: "A", to: "B", action: "camp", reading: rollTravel("camp", registry, () => 0) },
    registry,
  );
  const validated = validateCampaign(campaign);
  assert.deepEqual(validated.miseries, campaign.miseries);
  assert.equal(validated.campaignDay, 2);
  const imported = parseImport(JSON.stringify({ schemaVersion: 6, campaign }))[0];
  assert.deepEqual(imported.timeline, JSON.parse(JSON.stringify(campaign.timeline)));
});
test("Campaign duplication remaps procedure records and embedded Oracle IDs, retaining results", () => {
  const campaign = c();
  recordMisery(
    campaign,
    rollMisery(campaign, registry, () => 0),
  );
  recordTravel(
    campaign,
    { from: "A", to: "B", action: "camp", reading: rollTravel("camp", registry, () => 0) },
    registry,
  );
  const copy = cloneCampaign(campaign);
  assert.notEqual(copy.miseries[0].id, campaign.miseries[0].id);
  assert.equal(copy.miseries[0].result, campaign.miseries[0].result);
  assert.notEqual(copy.timeline[1].oracle?.id, campaign.timeline[1].oracle?.id);
  assert.equal(copy.timeline[1].oracle?.rolls[0].text, campaign.timeline[1].oracle?.rolls[0].text);
  validateCampaign(copy);
});

test("Current Session receives dawn, Misery and travel references that survive cloning", () => {
  const campaign = c();
  const session = createSession(campaign, { title: "Session 07", status: "active" });
  campaign.apocalypseDie = 6;
  recordDawn(campaign, registry, () => 0);
  recordTravel(
    campaign,
    { from: "A", to: "B", action: "camp", reading: rollTravel("camp", registry, () => 0) },
    registry,
  );
  assert.equal(campaign.miseries[0].sessionId, session.id);
  assert.ok(campaign.timeline.every((e) => e.sessionId === session.id));
  const copy = cloneCampaign(campaign);
  validateCampaign(copy);
  assert.equal(copy.miseries[0].sessionId, copy.sessions[0].id);
  assert.ok(copy.timeline.every((e) => e.sessionId === copy.sessions[0].id));
});
test("Unknown Session on manual Misery is rejected before recording any history", () => {
  const campaign = c();
  const before = JSON.stringify(campaign);
  assert.throws(() =>
    recordMisery(campaign, { roll: 11, result: "Fixture", sessionId: "missing" }),
  );
  assert.equal(JSON.stringify(campaign), before);
});


test("Dawn and its Misery use the advanced clock even when Session date is older", () => {
  const campaign = c();
  const session = createSession(campaign, { status: "active", inWorldDate: "Day 3" });
  campaign.campaignDay = 17;
  campaign.apocalypseDie = 6;
  const first = recordDawn(campaign, registry, () => 0.5);
  assert.equal(first.event.inWorldDate, "Day 18");
  const second = recordDawn(campaign, registry, () => 0);
  assert.equal(second.event.inWorldDate, "Day 19");
  assert.equal(second.misery?.inWorldDate, "Day 19");
  assert.equal(campaign.timeline.at(-1)?.inWorldDate, "Day 19");
  assert.equal(session.inWorldDate, "Day 3");
  assert.equal(first.event.sessionId, session.id);
  validateCampaign(campaign);
});
test("Manual campaign-day correction preserves past history and resumes from the chosen date", () => {
  const campaign = c();
  const session = createSession(campaign, { status: "active", inWorldDate: "The third winter" });
  recordMisery(campaign, { roll: 11, result: "Earlier Misery" });
  const history = JSON.parse(JSON.stringify(campaign.timeline));
  const miseries = JSON.parse(JSON.stringify(campaign.miseries));
  setCampaignDay(campaign, 42);
  assert.equal(campaign.campaignDay, 42);
  assert.equal(campaign.timeline.at(-1)?.inWorldDate, "Day 42");
  assert.deepEqual(JSON.parse(JSON.stringify(campaign.timeline.slice(0, history.length))), history);
  assert.deepEqual(JSON.parse(JSON.stringify(campaign.miseries)), miseries);
  assert.equal(session.inWorldDate, "The third winter");
  const count = campaign.timeline.length;
  setCampaignDay(campaign, 42);
  assert.equal(campaign.timeline.length, count);
  campaign.apocalypseDie = 6;
  assert.equal(recordDawn(campaign, registry, () => 0.5).event.inWorldDate, "Day 43");
  const imported = parseImport(JSON.stringify({ schemaVersion: 6, campaign }))[0];
  assert.equal(imported.campaignDay, 43);
});
test("Manual day rejects fractions, non-finite and out-of-range values before mutation", () => {
  const campaign = c();
  const before = JSON.stringify(campaign);
  for (const day of [0, -1, 1.5, NaN, Infinity, MAX_CAMPAIGN_DAY + 1])
    assert.throws(() => setCampaignDay(campaign, day));
  assert.equal(JSON.stringify(campaign), before);
  setCampaignDay(campaign, MAX_CAMPAIGN_DAY);
  campaign.apocalypseDie = 6;
  const last = JSON.stringify(campaign);
  assert.throws(() => recordDawn(campaign, registry, () => 0.5));
  assert.equal(JSON.stringify(campaign), last);
});

test("Daily travel follows the campaign clock while the Session keeps its narrative date", () => {
  const campaign = c();
  const session = createSession(campaign, { status: "active", inWorldDate: "Feast of Ashes" });
  campaign.campaignDay = 17;
  campaign.apocalypseDie = 6;
  recordDawn(campaign, registry, () => 0.5);
  const travel = recordTravel(campaign, {
    from: "Sarkash", to: "Graven-Tosk", action: "road", reading: rollTravel("road", registry, () => 0),
  }, registry);
  assert.equal(travel.inWorldDate, "Day 18");
  assert.equal(travel.sessionId, session.id);
  assert.equal(session.inWorldDate, "Feast of Ashes");
  assert.equal(campaign.campaignDay, 18);
  const imported = parseImport(JSON.stringify({ schemaVersion: 6, campaign }))[0];
  assert.equal(imported.timeline.at(-1)?.inWorldDate, "Day 18");
});
