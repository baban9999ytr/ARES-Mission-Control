#!/usr/bin/env python3
"""Validate a raster audit manifest and the Jezero science-point database.

No external packages required. This checks structure and geometry, not source truth.
"""
import argparse
import json
import math
from pathlib import Path
from urllib.parse import urlsplit


def science_points(path):
    issues = []
    try:
        data = json.loads(path.read_text(encoding='utf-8'))
    except (OSError, ValueError) as exc:
        return {'file': str(path), 'error': str(exc), 'issues': ['invalid or unreadable JSON']}
    points = data.get('points')
    if not isinstance(points, list):
        return {'file': str(path), 'issues': ['points must be an array']}
    seen = set()
    counts = {'total': len(points), 'with_coordinates': 0, 'null_coordinates': 0,
              'rover_or_sample': 0, 'feature': 0, 'unclear_type': 0}
    for index, point in enumerate(points):
        prefix = f'points[{index}]'
        if not isinstance(point, dict):
            issues.append(f'{prefix}: expected object')
            continue
        ident = point.get('id')
        if not isinstance(ident, str) or not ident.strip():
            issues.append(f'{prefix}: missing ID')
        elif ident in seen:
            issues.append(f'{prefix}: duplicate ID {ident}')
        seen.add(ident)
        for field in ('name', 'scientific_description'):
            value = point.get(field)
            if not isinstance(value, dict) or not all(isinstance(value.get(lang), str) and value[lang].strip() for lang in ('en', 'tr')):
                issues.append(f'{prefix}: {field} needs nonempty en and tr')
        for field in ('scientific_target', 'geological_category', 'jury_description_en'):
            if not isinstance(point.get(field), str) or not point[field].strip():
                issues.append(f'{prefix}: missing {field}')
        image = point.get('image') or {}
        for field, value in [('nasa_source_url', point.get('nasa_source_url')),
                             ('image.url', image.get('url') if isinstance(image, dict) else None)]:
            parsed = urlsplit(value) if isinstance(value, str) else None
            if not parsed or parsed.scheme != 'https' or not parsed.netloc:
                issues.append(f'{prefix}: {field} must be an HTTPS URL')
        if not isinstance(image, dict) or not isinstance(image.get('credit'), str) or not image['credit'].strip():
            issues.append(f'{prefix}: missing image credit')
        coordinates = point.get('coordinates')
        if not isinstance(coordinates, dict):
            issues.append(f'{prefix}: missing coordinates object')
            continue
        lat, lon = coordinates.get('latitude'), coordinates.get('longitude_east')
        if lat is None and lon is None:
            counts['null_coordinates'] += 1
        elif lat is None or lon is None:
            issues.append(f'{prefix}: incomplete coordinate pair')
        elif not all(isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x) for x in (lat, lon)):
            issues.append(f'{prefix}: nonfinite or nonnumeric coordinate')
        else:
            counts['with_coordinates'] += 1
            if not (17.5 <= lat <= 19.5 and 76.5 <= lon <= 78.5):
                issues.append(f'{prefix}: coordinate outside broad Jezero vicinity')
        represents = coordinates.get('represents')
        if not isinstance(represents, str) or not represents.strip():
            issues.append(f'{prefix}: missing coordinate meaning')
            counts['unclear_type'] += 1
        else:
            lower = represents.lower()
            if any(term in lower for term in ('rover', 'sample', 'locality', 'drill')):
                counts['rover_or_sample'] += 1
            elif any(term in lower for term in ('feature', 'formation', 'delta', 'outcrop', 'unit', 'crater', 'region', 'rim')):
                counts['feature'] += 1
            else:
                counts['unclear_type'] += 1
        if not isinstance(coordinates.get('status'), str) or not coordinates['status'].strip():
            issues.append(f'{prefix}: missing coordinate status')
    return {'file': str(path), 'counts': counts, 'issues': issues,
            'caution': 'URL format, coordinate plausibility and descriptions do not establish scientific source verification.'}


def pair(a, b):
    if not a or not b:
        return {'status': 'missing', 'reason': 'DEM or DRG unavailable'}
    if a.get('error') or b.get('error'):
        return {'status': 'invalid', 'reason': 'one or both rasters could not be opened'}
    if not a.get('crs') or not b.get('crs'):
        return {'status': 'invalid', 'reason': 'missing CRS'}
    same_crs = a['crs'] == b['crs']
    x1, y1, x2, y2 = a['bounds']
    u1, v1, u2, v2 = b['bounds']
    width = max(0, min(x2, u2) - max(x1, u1))
    height = max(0, min(y2, v2) - max(y1, v1))
    overlap = width * height
    coverage = overlap / ((x2-x1) * (y2-y1)) if (x2-x1)*(y2-y1) else 0
    return {'status': 'geometry-compatible' if same_crs and overlap else 'incompatible',
            'same_crs': same_crs, 'overlap_square_meters': round(overlap, 2),
            'dem_bbox_coverage_fraction': round(coverage, 6),
            'pixel_resolution_meters': {'dem': a['resolution'], 'drg': b['resolution']},
            'caution': 'BBox and CRS checks do not prove pixel-level registration or vertical accuracy.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=Path, default=Path('data/manifests/raster-audit.json'))
    parser.add_argument('--science', type=Path, default=Path('jezero-science-points.json'))
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    manifest = json.loads(args.manifest.read_text())
    records = manifest['rasters']
    def get(name):
        return next((r for r in records if r['filename'] == name and not r.get('error')), None)
    def get_any(*names):
        return next((found for name in names if (found := get(name))), None)
    result = {'science': science_points(args.science),
              'pairs': {
                  'central_jezero': pair(get_any('cenjez_DEM_1m.tif', 'cenjez_DEM_1m(1).tif'),
                                         get_any('cenjez_DRG_0_3m.tif', 'cenjez_DRG_0_3m(1).tif')),
                  'southwest_jezero': pair(get('swjez-DEM_1m.tif'), get('swjez-DRG_0_3m.tif')),
                  'northern_fan': pair(get('nf_DEM_1m.tif'), get('nf_DRG_0_3m.tif')),
                  'ctx_context': pair(get('JEZ_ctx_B_soc_008_DTM_MOLAtopography_DeltaGeoid_20m_Eqc_latTs0_lon0.tiff'),
                                      get('JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0.tiff'))}}
    serialized = json.dumps(result, indent=2, ensure_ascii=False) + '\n'
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(serialized)
    else:
        print(serialized)
    if result['science'].get('issues'):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
