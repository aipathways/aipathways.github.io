Arizona AI Transition Pathways Website Prototype

What is the value of this website?
1. Provide Arizonan's with an understanding of which jobs are exposed to AI in the state2
2. Showcase transition Pathways
3. Provide an exhaustive list of trainings beyond what is available through IPEDS

Files included:
- index.html
- occupation.html
- styles.css
- app.js
- data.js
- assets/sankey.html
- Materials/sankey_generate.ipynb
- Materials/postprocess_sankey_html.py

Current prototype behavior:
- Shows up to 6 occupations at a time in the explorer.
- Adds a "Selected Occupation" header above the right-side panel.
- Shows only the top 2 related lower-exposure occupations in the right-side panel.
- Removes Arizona training opportunities from the right-side panel.
- Adds full occupation pages via occupation.html?id=occupation-id.
- Embeds the shared Sankey diagram on full occupation pages for High and Very High exposure occupations, immediately before the "Related lower-exposure occupations" section.
- The Sankey iframe passes the selected SOC to assets/sankey.html using ?soc=XX-XXXX so the initial chart matches the occupation page.
- The Clear button resets both the search/filter state and the selected occupation panel.

Sankey integration workflow:
1. Run Materials/sankey_generate.ipynb to generate assets/sankey.html.
2. Run python Materials/postprocess_sankey_html.py so assets/sankey.html supports direct links such as assets/sankey.html?soc=15-1252.
3. Commit the regenerated assets/sankey.html file.

Suggested next upgrades:
- Replace seeded data with O*NET + state labor market estimates.
- Add pagination or a "Load more" pattern.
- Add export, comparison, and county filters.
- Link training results to a live CIP-to-SOC crosswalk.

