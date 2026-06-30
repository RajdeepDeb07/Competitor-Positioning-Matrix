exports.handler = async function(event) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rows: [
        {
          pillar: "Product Launch & Enhancement",
          event: "Test function is working.",
          materiality: "Low",
          marketOpportunity: [
            "• Test market opportunity bullet one.",
            "• Test market opportunity bullet two."
          ],
          competitiveImpact: "Low Strategic Relevance",
          firmPositioning: [
            "• Test positioning bullet one.",
            "• Test positioning bullet two."
          ],
          strategicPriority: "Low",
          confidence: "Medium",
          evidenceBasis: "Function test response."
        }
      ],
      executiveSummary: "Function is working.",
      sources: ["Netlify function test"]
    })
  };
};
