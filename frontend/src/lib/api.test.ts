// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { api, ApiError } from "./api";

function reply(status: number, body: unknown) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })));
  return vi.spyOn(window.location, "assign").mockImplementation(() => {});
}

describe("api", () => {
  it("goes to sign in when the session has ended", async () => {
    const assign = reply(401, { detail: "Please sign in." });
    await expect(api("/api/documents")).rejects.toBeInstanceOf(ApiError);
    expect(assign).toHaveBeenCalledWith("/");
  });

  it("leaves a failed sign in to the form", async () => {
    const assign = reply(401, { detail: "Wrong email or password." });
    await expect(api("/api/auth/signin", {})).rejects.toThrow("Wrong email or password.");
    expect(assign).not.toHaveBeenCalled();
  });
});
