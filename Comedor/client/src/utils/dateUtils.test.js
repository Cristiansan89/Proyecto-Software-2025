import { describe, expect, it } from "vitest";
import { formatCicloLectivo } from "./dateUtils.js";

describe("formatCicloLectivo", () => {
  it("debe devolver el año correcto para fechas de ciclo lectivo", () => {
    expect(formatCicloLectivo("2026-01-01")).toBe(2026);
    expect(formatCicloLectivo("2026-01-01T00:00:00.000Z")).toBe(2026);
    expect(formatCicloLectivo(new Date("2026-01-01T00:00:00.000Z"))).toBe(2026);
    expect(formatCicloLectivo(2026)).toBe(2026);
    expect(formatCicloLectivo("2026")).toBe("2026");
  });
});
