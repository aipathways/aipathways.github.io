import pandas as pd
import json
import re

# Load CSV
df = pd.read_csv("data.csv")

# Helper to create ID
def make_id(title):
    return re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')

# Group by occupation
grouped = df.groupby(["title", "soc", "exposure", "summary",
                      "medianWage", "annualOpenings",
                      "employment", "projectedGrowth",
                      "typicalEducation"])

output = []

for keys, group in grouped:
    (
        title, soc, exposure, summary,
        medianWage, annualOpenings,
        employment, projectedGrowth,
        typicalEducation
    ) = keys

    # Build training array
    training = []
    for _, row in group.iterrows():
        if pd.notna(row.get("provider")):
            training.append({
                "provider": row.get("provider"),
                "program": row.get("program"),
                "cip": row.get("cip"),
                "award": row.get("award"),
                "location": row.get("location")
            })

    obj = {
        "id": make_id(title),
        "title": title,
        "soc": soc,
        "exposure": exposure,
        "summary": summary,
        "laborMarket": {
            "medianWage": str(medianWage),
            "annualOpenings": str(annualOpenings),
            "employment": str(employment),
            "projectedGrowth": str(projectedGrowth),
            "typicalEducation": typicalEducation
        },
        "relatedOccupationIds": [],
        "training": training
    }

    output.append(obj)

# Write to JS file
with open("data.js", "w") as f:
    f.write("const data = ")
    json.dump(output, f, indent=2)
    f.write(";")