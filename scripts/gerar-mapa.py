"""Gera src/mapaBrasil.js (contornos dos estados em SVG) a partir da malha de UFs do IBGE (qualidade mínima).
Uso: python3 scripts/gerar-mapa.py caminho/uf.geojson
Fonte: https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?intrarregiao=UF&formato=application/vnd.geo+json&qualidade=minima"""
import json, math, sys
COD = {'11':'RO','12':'AC','13':'AM','14':'RR','15':'PA','16':'AP','17':'TO','21':'MA','22':'PI','23':'CE','24':'RN','25':'PB','26':'PE','27':'AL','28':'SE','29':'BA','31':'MG','32':'ES','33':'RJ','35':'SP','41':'PR','42':'SC','43':'RS','50':'MS','51':'MT','52':'GO','53':'DF'}
g = json.load(open(sys.argv[1]))
K = 11  # pixels por grau
cosl = math.cos(math.radians(14))
proj = lambda lon, lat: ((lon + 74.0) * cosl * K, (5.4 - lat) * K)
def aneis(geom):
    polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
    for p in polys:
        yield p
out, minx, miny, maxx, maxy = {}, 1e9, 1e9, -1e9, -1e9
for f in g['features']:
    uf = COD[f['properties']['codarea']]
    d, areas, mx = '', [], -1e9
    for poly in aneis(f['geometry']):
        for i, ring in enumerate(poly):
            pts, ult = [], None
            for lon, lat in ring:
                x, y = proj(lon, lat)
                if ult is None or abs(x - ult[0]) + abs(y - ult[1]) >= 0.5: pts.append((x, y)); ult = (x, y)
            if len(pts) < 3: continue
            d += 'M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in pts) + 'Z'
            if i == 0:  # área e centroide do anel externo (o maior polígono do estado vira o ponto do rótulo)
                a = cx = cy = 0
                for (x0, y0), (x1, y1) in zip(pts, pts[1:] + pts[:1]):
                    c = x0 * y1 - x1 * y0; a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c
                a /= 2
                if a: areas.append((abs(a), cx / (6 * a), cy / (6 * a)))
            for x, y in pts: minx, miny, maxx, maxy = min(minx, x), min(miny, y), max(maxx, x), max(maxy, y); mx = max(mx, x)
    _, cx, cy = max(areas)
    out[uf] = {'d': d, 'cx': round(cx, 1), 'cy': round(cy, 1), 'mx': round(mx, 1)}
box = [round(minx) - 2, round(miny) - 2, round(maxx - minx) + 4, round(maxy - miny) + 4]
open('src/mapaBrasil.js', 'w').write('// Gerado por scripts/gerar-mapa.py a partir da malha de UFs do IBGE. Não edite à mão.\nexport const VIEWBOX = ' + json.dumps(box) + ';\nexport const ESTADOS = ' + json.dumps(out, separators=(',', ':')) + ';\n')
print('ok', box, sum(len(v['d']) for v in out.values()), 'bytes de caminhos')
