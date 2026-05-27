"""Post-process the generated Sankey HTML for occupation-page embeds.

Run this after executing Materials/sankey_generate.ipynb. The notebook writes
assets/sankey.html; this script updates that file so it can open directly to a
specific occupation using a URL parameter, for example:

    assets/sankey.html?soc=15-1252

The occupation detail page iframe depends on this behavior.
"""

from __future__ import annotations

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
SANKEY_HTML = REPO_ROOT / "assets" / "sankey.html"

OLD_INITIALIZER = """populateDropdown();
document.getElementById(\"occupationSelect\").value = \"{default_soc}\";
renderFigure();"""

NEW_INITIALIZER = """populateDropdown();

const params = new URLSearchParams(window.location.search);
const requestedSoc = params.get(\"soc\");

const initialSoc =
    requestedSoc && figures[requestedSoc]
        ? requestedSoc
        : \"{default_soc}\";

document.getElementById(\"occupationSelect\").value = initialSoc;
renderFigure();"""


def postprocess_sankey_html(path: Path = SANKEY_HTML) -> None:
    if not path.exists():
        raise FileNotFoundError(
            f"Could not find {path}. Run Materials/sankey_generate.ipynb first."
        )

    html = path.read_text(encoding="utf-8")

    if "const figures =" not in html:
        raise ValueError(
            f"{path} does not look like the generated Sankey HTML. "
            "Expected to find `const figures =`."
        )

    if NEW_INITIALIZER in html:
        print(f"{path} already supports ?soc=... initialization.")
        return

    if OLD_INITIALIZER not in html:
        raise ValueError(
            "Could not find the expected default Sankey initializer. "
            "Update OLD_INITIALIZER in this script if the notebook output changed."
        )

    html = html.replace(OLD_INITIALIZER, NEW_INITIALIZER)
    path.write_text(html, encoding="utf-8")

    print(f"Updated {path} to support ?soc=XX-XXXX occupation-page embeds.")


if __name__ == "__main__":
    postprocess_sankey_html()
