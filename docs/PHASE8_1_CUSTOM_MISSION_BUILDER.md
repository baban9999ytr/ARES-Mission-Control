# Phase 8.1 — Interactive Custom Mission Builder

ARES supports user-authored fixed-order multi-stop research exercises on the **measured Jezero CTX** study crop. This is an editor for reproducible model exercises, not operational EVA navigation.

## Workflow

1. Open **Mission Library → New mission** to start with two valid measured grid locations. Alternatively select any of the 30 existing missions and choose **Duplicate selected** to edit an independent copy (the original library never changes).
2. Give the mission a name (up to 80 characters). Select **Drag stops** to drag an existing numbered marker on the map onto another valid CTX cell. Empty background dragging still pans.
3. Select **+ Add stop on map** and click a measured CTX grid cell to append a stop (2–8 ordered stops). Choose **Pan map** to prevent marker edits. The map uses 40 m grid snapping, not sub-cell positions.
4. Reorder stops by dragging the grip (⠿) in the left-panel list to a new row, or use accessible **↑/↓** buttons. **×** removes a stop when at least two stops remain.
5. **Undo/Redo** restores up to 30 edit states within the open custom mission.
6. **Save mission JSON** downloads a versioned, editable mission blueprint. **Load JSON** imports that specific ARES custom-mission format (100 KB max, no untrusted external URLs). Both measured pack compatibility and route feasibility are checked before accepting an import.
7. The original **Export mission JSON** button still produces a calculated research report, including the independent shortest / terrain-preferred legs, metrics and dataset limitations. Unlike the blueprint JSON, the calculated report is not directly imported by Load JSON.
8. Selecting a library mission or manual point exits the custom edit mode. A newly started mission keeps the original 30 catalog entries intact.

## Design details and safety

- The editor has three explicit map modes (pan, drag stops, add stop) to avoid a conflict with map panning. Stops move only on pointer release; routes are recomputed after each valid edit rather than on every pointer-move event.
- Pointer-based dragging works on mouse and touch; grips use `touch-action: none`. Keyboard up/down reorder buttons provide an accessible alternative.
- Invalid/out-of-crop/no-data cells, identical consecutive stops, and zero-length or unrouteable legs are rejected without overwriting the prior mission.
- A mission can return to its starting cell at the final stop. Every pair of consecutive stops is an **independent** A* leg. The app **does not optimize** stop order or treat route distances and sampled slopes as EVA-safe guidance.
- Custom missions are deliberately limited to the current 80 × 60, 40 m measured CTX raster pack. Synthetic mode and named Jezero research points never silently become mission coordinates.
- State is held in the browser during an editing session; **save an editable JSON blueprint to preserve the work**. It is not automatically synchronized to a server or account.

## Verification

```bash
npm run check
node tools/generate_mission_results.mjs --check
npx wrangler deploy --dry-run
```

Then test on `https://spcapps.openstacktool.com/` against the correct deployed commit:
- New → Add stop → Move via map drag → reorder via grip → Undo → Redo.
- Move start and destination, and move one stop onto a blocked cell (reject).
- Duplicate CM-04, move a middle stop and compare independent leg distance totals; return to default and verify original CM-04 is unchanged.
- Save/load custom JSON, reject malformed and incompatible files.
- Test pointer pan, zoom, mobile/touch, nested navigation, keyboard reorder and JSON report export.
- Check browser console and accessibility semantics for every map mode.

**GO requires both CI and interactive live tests.** A successful GitHub merge or Wrangler dry-run alone does not establish production readiness.
