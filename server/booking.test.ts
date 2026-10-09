import test from "node:test";
import assert from "node:assert/strict";
import { overlaps, withinSchedule, canTransition } from "./booking.js";
test("Deux réservations adjacentes ne se chevauchent pas", () => {
  const at = (h: string) => new Date("2026-10-12T" + h + ":00Z");
  assert.equal(
    overlaps(at("09:00"), at("10:00"), at("10:00"), at("11:00")),
    false,
  );
  assert.equal(
    overlaps(at("09:00"), at("10:00"), at("09:30"), at("10:30")),
    true,
  );
});
test("La prestation doit tenir entièrement dans les horaires", () => {
  const schedule = [{ weekday: 1, startMinute: 540, endMinute: 1080 }];
  assert.equal(
    withinSchedule(
      new Date("2026-10-12T09:00Z"),
      new Date("2026-10-12T10:00Z"),
      schedule,
    ),
    true,
  );
  assert.equal(
    withinSchedule(
      new Date("2026-10-12T17:30Z"),
      new Date("2026-10-12T18:30Z"),
      schedule,
    ),
    false,
  );
  assert.equal(
    withinSchedule(
      new Date("2026-10-11T09:00Z"),
      new Date("2026-10-11T10:00Z"),
      schedule,
    ),
    false,
  );
  assert.equal(
    withinSchedule(
      new Date("2026-10-12T23:00Z"),
      new Date("2026-10-13T00:00Z"),
      [{ weekday: 1, startMinute: 1380, endMinute: 1440 }],
    ),
    true,
  );
});
test("Un rendez-vous terminé ou annulé ne peut pas redevenir confirmé", () => {
  assert.equal(canTransition("PENDING", "CONFIRMED"), true);
  assert.equal(canTransition("CONFIRMED", "IN_PROGRESS"), true);
  assert.equal(canTransition("PENDING", "COMPLETED"), false);
  assert.equal(canTransition("COMPLETED", "CONFIRMED"), false);
  assert.equal(canTransition("CANCELLED", "CONFIRMED"), false);
});
