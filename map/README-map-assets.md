# Map Asset Prep

`scripts/export-slide-assets.ps1` converts local slide files into web-ready PNGs for the interactive architect map.

`scripts/export-essay1-topics-map.ps1` converts `data/Essay 1 topics+locations.xlsx` into `data/essay1-topics-map.js` for the spreadsheet-backed version of the interactive map.

Outputs:

- `assets/slides/<deck-id>/slide-001.png`
- `data/slide-manifest.json`
- `data/architects-template.csv`
- `data/essay1-topics-map.js`

Usage:

```powershell
.\scripts\export-slide-assets.ps1
.\scripts\export-essay1-topics-map.ps1
```

Optional parameters:

```powershell
.\scripts\export-slide-assets.ps1 -PdfDpi 180 -PptWidth 1920
.\scripts\export-slide-assets.ps1 -SkipPptx
.\scripts\export-slide-assets.ps1 -SkipPdf
```

Notes:

- `PDF` export uses `pdftoppm`.
- `PPTX` export uses Microsoft PowerPoint automation.
- If PowerPoint automation fails inside the sandbox, rerun the script in a normal desktop session.
