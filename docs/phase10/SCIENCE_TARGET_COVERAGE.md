# Science target coverage

`src/data/science-catalog.js` validates catalog shape and projects longitude/latitude only for the supported Mars equirectangular CRS. `scienceCoverage` also requires a valid DEM cell and explicit source verification. The existing tests show every submitted Jezero catalog point fails current crop eligibility. `jezero-008` is cross-checked as a rover position, not an outcrop centroid. The catalog UI correctly says no ARES route is generated.

No target was snapped into the CTX crop or relabeled as a verified destination. A source-confirmed point in a measured routeable region, verified coordinate meaning, CRS check, and successful route are prerequisites for a future “Plan Route to This Target” action. Additional imagery and DEM acquisition would require a separate source and coordinate audit.
