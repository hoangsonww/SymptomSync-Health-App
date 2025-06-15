import handler from "@/pages/api/med";
import { createMocks } from "node-mocks-http";

async function callRoute({ query }) {
  const { req, res } = createMocks({ method: "GET", query });
  await handler(req, res);
  return res._getJSONData();
}

const buildOk = (json) =>
  Promise.resolve({ ok: true, status: 200, json: async () => json });

const build404 = () =>
  Promise.resolve({ ok: false, status: 404, json: async () => ({}) });

afterEach(() => {
  jest.restoreAllMocks();
});

test("returns 400 if `ndc` query param missing", async () => {
  const res = await callRoute({ query: {} });
  expect(res).toEqual({ error: "Missing ndc query parameter" });
});

test("returns UPCItemDB data when UPC lookup succeeds", async () => {
  jest.spyOn(global, "fetch").mockImplementation((url) =>
    url.startsWith("https://api.upcitemdb.com")
      ? buildOk({
          code: "OK",
          total: 1,
          items: [
            {
              title: "Tylenol Extra Strength",
              images: ["https://example.com/t.png"],
            },
          ],
        })
      : build404(),
  );

  const res = await callRoute({ query: { ndc: "300450449092" } });

  expect(res).toEqual({
    data: [
      {
        title: "Tylenol Extra Strength",
        published_date: "",
        images: ["https://example.com/t.png"],
      },
    ],
  });
});

test("falls back to DailyMed v1 if UPC gives no results", async () => {
  const dm1Json = {
    COLUMNS: ["SETID", "SPL_VERSION", "TITLE", "PUBLISHED_DATE"],
    DATA: [["uuid-1", 1, "AMOXICILLIN CAPSULE", "March 01, 2025"]],
  };

  jest.spyOn(global, "fetch").mockImplementation((url) => {
    if (url.startsWith("https://api.upcitemdb.com"))
      return buildOk({ code: "OK", total: 0, items: [] });
    if (url.startsWith("https://dailymed.nlm.nih.gov/dailymed/services/v1"))
      return buildOk(dm1Json);
    return build404();
  });

  const res = await callRoute({ query: { ndc: "0409-3613-01" } });

  expect(res).toEqual({
    data: [
      {
        setid: "uuid-1",
        spl_version: 1,
        title: "AMOXICILLIN CAPSULE",
        published_date: "March 01, 2025",
      },
    ],
  });
});

test("uses DailyMed v2 hard-coded fallback when everything else 404s", async () => {
  const dm2Payload = {
    data: [{ title: "GAS-X", published_date: "Jun 13, 2025", spl_version: 1 }],
  };

  jest.spyOn(global, "fetch").mockImplementation((url) => {
    if (url.startsWith("https://api.upcitemdb.com")) return build404();
    if (url.startsWith("https://dailymed.nlm.nih.gov/dailymed/services/v1"))
      return build404();
    if (url.includes("services/v2/spls")) return buildOk(dm2Payload);
    return build404();
  });

  const res = await callRoute({ query: { ndc: "xyz" } });

  expect(res).toEqual(dm2Payload);
});

test("returns 404 + error when all lookups fail", async () => {
  jest.spyOn(global, "fetch").mockImplementation(() => build404());

  const ndc = "does-not-exist";
  const { req, res } = createMocks({ method: "GET", query: { ndc } });
  await handler(req, res);

  expect(res._getStatusCode()).toBe(404);
  expect(res._getJSONData()).toEqual({
    error: `No data found for NDC ${ndc}`,
  });
});
