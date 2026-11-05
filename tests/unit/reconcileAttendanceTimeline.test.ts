import { test } from "node:test";
import assert from "node:assert/strict";
import { getAttendanceTimelineKey, reconcileAttendanceTimeline, type LocalTimelineSlot } from "../../src/utils/reconcileAttendanceTimeline";

const entry = (key: string, createdAt = "2026-11-05T20:05:00.000Z") => ({ key, createdAt });
const keys = (items: ReturnType<typeof entry>[]) => items.map((item) => item.key);
const slots = () => new Map<string, LocalTimelineSlot>([
  ["local:pdf", { afterKey: "history", createdAt: entry("").createdAt }],
  ["local:text1", { afterKey: "local:pdf", createdAt: entry("").createdAt }],
  ["local:text2", { afterKey: "local:text1", createdAt: entry("").createdAt }],
]);

test("a failed PDF keeps its slot when subsequent texts are persisted", () => {
  const result = reconcileAttendanceTimeline(
    [entry("history"), entry("local:text1"), entry("local:text2")],
    [entry("local:pdf")], slots(),
  );
  assert.deepEqual(keys(result), ["history", "local:pdf", "local:text1", "local:text2"]);
});

test("realtime replaces the optimistic entry before HTTP returns without a duplicate", () => {
  const local = { ...entry("local:pdf"), source: "optimistic" };
  const key = getAttendanceTimelineKey({ kind: "message", id: "server-pdf", clientMessageId: "pdf" }, slots());
  const server = { ...entry(key, "2026-11-05T20:07:00.000Z"), source: "server" };
  const result = reconcileAttendanceTimeline([server], [local], slots());
  assert.equal(result.length, 1);
  assert.equal(result[0].source, "server");
});

test("HTTP confirmation also keeps the local key when the API omits the client ID", () => {
  const positions = slots();
  positions.get("local:pdf")!.serverMessageId = "server-pdf";
  assert.equal(getAttendanceTimelineKey({ kind: "message", id: "server-pdf" }, positions), "local:pdf");
  assert.equal(getAttendanceTimelineKey({ kind: "message", id: "unrelated" }, positions), "message:unrelated");
});

test("the slot stays stable across each persistence step despite server timestamp differences", () => {
  const expected = ["history", "local:pdf", "local:text1", "local:text2"];
  const local = expected.slice(1).map((key) => entry(key));
  for (let persisted = 0; persisted <= local.length; persisted++) {
    const server = [entry("history"), ...local.slice(0, persisted).map((item) =>
      entry(item.key, "2026-11-05T21:00:00.000Z"))];
    assert.deepEqual(keys(reconcileAttendanceTimeline(server, local.slice(persisted), slots())), expected);
  }
});

test("same timestamps and repeated text submissions keep distinct slots in submission order", () => {
  const local = [entry("local:text2"), entry("local:pdf"), entry("local:text1")];
  assert.deepEqual(keys(reconcileAttendanceTimeline([entry("history")], local, slots())),
    ["history", "local:pdf", "local:text1", "local:text2"]);
});

test("an incoming message stays between local submissions anchored on either side of it", () => {
  const positions = slots();
  positions.get("local:text1")!.afterKey = "incoming";
  assert.deepEqual(keys(reconcileAttendanceTimeline(
    [entry("history"), entry("incoming")],
    [entry("local:pdf"), entry("local:text1"), entry("local:text2")], positions,
  )), ["history", "local:pdf", "incoming", "local:text1", "local:text2"]);
});
