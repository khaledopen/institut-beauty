import test from "node:test";
import assert from "node:assert/strict";
import { canManageServices, tenantWhere } from "./policy.js";
test("Toutes les recherches métier restent liées à l’institut de la session", () => {
  assert.deepEqual(tenantWhere("A", "resource-B"), {
    instituteId: "A",
    id: "resource-B",
  });
});
test("Seuls propriétaire et responsable peuvent gérer le catalogue", () => {
  assert.ok(canManageServices("OWNER"));
  assert.ok(canManageServices("MANAGER"));
  for (const role of ["RECEPTIONIST", "PRACTITIONER", "CASHIER"] as const)
    assert.equal(canManageServices(role), false);
});
