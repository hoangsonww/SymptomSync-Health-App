import type { NextApiRequest, NextApiResponse } from "next";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MedResponse = { data: any[] };
type ErrorResponse = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MedResponse | ErrorResponse>,
) {
  const { ndc } = req.query;
  if (!ndc || typeof ndc !== "string") {
    return res.status(400).json({ error: "Missing ndc query parameter" });
  }

  try {
    const upcRes = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(ndc)}`,
    );
    if (upcRes.ok) {
      const upcJson = await upcRes.json();
      if (
        upcJson.code === "OK" &&
        upcJson.total > 0 &&
        Array.isArray(upcJson.items) &&
        upcJson.items.length > 0
      ) {
        const item = upcJson.items[0];
        const data = [
          {
            title: item.title,
            published_date: "",
            images: Array.isArray(item.images) ? item.images : [],
          },
        ];
        return res.status(200).json({ data });
      }
    }
  } catch (err) {
    console.error("UPCItemDB lookup error:", err);
  }

  try {
    const v1Url = `https://dailymed.nlm.nih.gov/dailymed/services/v1/ndc/${encodeURIComponent(
      ndc,
    )}/spls.json`;
    const dm1Res = await fetch(v1Url);
    if (dm1Res.ok) {
      const dm1Json = await dm1Res.json();
      if (Array.isArray(dm1Json.COLUMNS) && Array.isArray(dm1Json.DATA)) {
        const cols: string[] = dm1Json.COLUMNS;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = dm1Json.DATA.map((row: any[]) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const obj: Record<string, any> = {};
          cols.forEach((col, idx) => {
            obj[col.toLowerCase()] = row[idx];
          });
          return obj;
        });
        return res.status(200).json({ data });
      }
    }
    if (dm1Res.status !== 404) {
      console.error(`DailyMed v1 error: ${dm1Res.status}`);
    }
  } catch (err) {
    console.error("DailyMed v1 lookup error:", err);
  }

  try {
    const fbUrl =
      "https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?package_ndc=577687522250";
    const fbRes = await fetch(fbUrl);
    if (fbRes.ok) {
      const fbJson = await fbRes.json();
      if (Array.isArray(fbJson.data)) {
        return res.status(200).json({ data: fbJson.data });
      }
    }
  } catch (err) {
    console.error("DailyMed v2 fallback error:", err);
  }

  return res.status(404).json({ error: `No data found for NDC ${ndc}` });
}
