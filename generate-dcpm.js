exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  if (!process.env.OPENAI_API_KEY) {
    return json(500, { error: "Missing OPENAI_API_KEY in Netlify environment variables." });
  }

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } 
  catch { return json(400, { error: "Invalid JSON body." }); }

  const { competitor, focalCompany, period, month, year, geography } = body;
  if (!competitor || !focalCompany) return json(400, { error: "Competitor and focal company are required." });

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      executiveSummary: { type: "string" },
      rows: {
        type: "array",
        minItems: 6,
        maxItems: 6,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            pillar: { type: "string" },
            event: { type: "string" },
            materiality: { type: "string", enum: ["High","Moderate","Low"] },
            marketOpportunity: { type: "array", minItems: 2, maxItems: 2, items: { type: "string" } },
            competitiveImpact: { type: "string", enum: ["Direct Competition","Strategy Validation","Competitive Gap","Emerging Opportunity","Ecosystem Shift","Low Strategic Relevance"] },
            firmPositioning: { type: "array", minItems: 2, maxItems: 2, items: { type: "string" } },
            strategicPriority: { type: "string", enum: ["High","Moderate","Low"] },
            confidence: { type: "string", enum: ["High","Medium","Low"] },
            evidenceBasis: { type: "string" }
          },
          required: ["pillar","event","materiality","marketOpportunity","competitiveImpact","firmPositioning","strategicPriority","confidence","evidenceBasis"]
        }
      },
      sources: { type: "array", items: { type: "string" } }
    },
    required: ["executiveSummary","rows","sources"]
  };

  const prompt = `
You are a Senior Competitive Intelligence Consultant at a Tier-1 consulting firm.

Create Deb's Competitive Positioning Matrix (DCPM).

Inputs:
Competitor: ${competitor}
Focal Company: ${focalCompany}
Time Filter: ${period}, ${month}, ${year}
Geography Filter: ${geography}

MANDATORY DCPM pillars, in this exact order:
1. Product Launch & Enhancement
2. Client Wins
3. M&A & Partnerships
4. Expansion & Innovation
5. Corporate Awards
6. Leadership Change

Event selection rules:
- Use only official company releases, investor relations, annual reports, quarterly reports, earnings transcripts, SEC/equivalent filings, Reuters, Bloomberg, credible FMCG/industry publications, or company newsroom announcements.
- Do not fabricate events.
- If there is no material event under a pillar in the selected time/geography, event must be exactly: "No material strategic event identified."
- Prefer material strategic developments only.

Market Opportunity:
- Exactly two concise executive bullets.
- Interpret the pre-existing market opportunity or TAM signal the competitor likely identified.
- Do not say the competitor created or increased the market.

Firm Competitive Positioning:
- Exactly two concise executive bullets.
- Assess what this means for ${focalCompany}'s current competitive position.
- Do not automatically recommend actions.
- Recommend only when a genuine capability gap or emerging opportunity exists.

Classification:
- materiality: High, Moderate, or Low.
- competitiveImpact: Direct Competition, Strategy Validation, Competitive Gap, Emerging Opportunity, Ecosystem Shift, or Low Strategic Relevance.
- strategicPriority: High, Moderate, or Low.
- confidence: High, Medium, or Low.
- evidenceBasis: mention source type and any exact initiative/date/geography known.

Also create a concise executiveSummary.

Return only valid JSON matching the provided schema.
`;

  try {
    const apiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.5",
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "dcpm_pro_output",
            schema,
            strict: true
          }
        }
      })
    });

    const raw = await apiRes.text();
    if (!apiRes.ok) return json(apiRes.status, { error: `OpenAI API error: ${raw}` });

    const parsed = JSON.parse(raw);
    const output = extractOutputText(parsed);
    if (!output) return json(500, { error: "No output text returned from OpenAI." });

    let result;
    try { result = JSON.parse(output); }
    catch { return json(500, { error: "OpenAI returned invalid JSON.", raw: output }); }

    result.rows = normalizeRows(result.rows || []);
    return json(200, result);
  } catch (err) {
    return json(500, { error: err.message || "Server error" });
  }
};

function normalizeRows(rows) {
  const pillars = ["Product Launch & Enhancement","Client Wins","M&A & Partnerships","Expansion & Innovation","Corporate Awards","Leadership Change"];
  return pillars.map(p => rows.find(r => r.pillar === p) || {
    pillar: p,
    event: "No material strategic event identified.",
    materiality: "Low",
    marketOpportunity: [
      "• No confirmed market opportunity signal identified for this pillar in the selected scope.",
      "• Public-source evidence is insufficient to infer a material TAM driver without speculation."
    ],
    competitiveImpact: "Low Strategic Relevance",
    firmPositioning: [
      "• No immediate positioning implication for the focal company can be established from verified public events.",
      "• Continue monitoring only if future source-backed events indicate category, channel, capability, or geographic movement."
    ],
    strategicPriority: "Low",
    confidence: "Medium",
    evidenceBasis: "No material source-backed event identified."
  });
}

function extractOutputText(resp) {
  if (resp.output_text) return resp.output_text;
  if (Array.isArray(resp.output)) {
    for (const item of resp.output) {
      if (Array.isArray(item.content)) {
        for (const c of item.content) {
          if (c.type === "output_text" && c.text) return c.text;
          if (c.text) return c.text;
        }
      }
    }
  }
  return "";
}

function json(statusCode, data) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify(data)
  };
}
