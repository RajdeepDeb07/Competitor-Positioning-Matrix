DCPM Pro - Netlify + OpenAI

WHAT IS INCLUDED
- Professional executive dashboard UI
- OpenAI-powered DCPM generation
- KPI cards:
  - Material Events
  - Direct Competition
  - Competitive Gaps
  - Emerging Opportunities
  - High Priority
  - Average Confidence
- DCPM table with:
  - DCPM Pillar
  - Specific Competitor Event
  - Event Materiality
  - Market Opportunity
  - Competitive Impact
  - Firm Competitive Positioning
  - Strategic Priority
  - Confidence
  - Evidence Basis
- CSV export
- JSON export
- Copy table
- Print / PDF
- Save/load project in browser local storage
- Source log and executive summary

DEPLOYMENT
1. Unzip this package.
2. Upload the full project to a GitHub repository.
3. In Netlify, choose: Add new site > Import from Git.
4. Select the repository.
5. In Netlify, add Environment Variable:
   OPENAI_API_KEY = your OpenAI API key
6. Optional:
   OPENAI_MODEL = gpt-5.5
7. Deploy.

IMPORTANT
Do not place your OpenAI API key inside index.html.
The API key is used only in netlify/functions/generate-dcpm.js.
