#!/usr/bin/env python
"""
graph3d-generator.py — Lee graph.json + .graphify_labels.json y genera
graphify-out/graph3d.html con una visualizacion 3D interactiva donde
cada comunidad del grafo ocupa un piso (plano Z) distinto.

Output: graphify-out/graph3d.html (autocontenido, abrible en Chrome).
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
GRAPH = REPO / "graphify-out" / "graph.json"
LABELS = REPO / "graphify-out" / ".graphify_labels.json"
OUT = REPO / "graphify-out" / "graph3d.html"

Z_SPACING = 80  # audit 2026-07-07: was 300, with 197 layers the camera ended
# up ~106k units away from origin and nodes were 1-2px tall (black canvas
# in browser). 80 + sqrt-scaled camera keeps everything visible.
NUM_COLORS = 20


def vibrant_palette(n: int) -> list[str]:
    """Paleta de N colores vibrantes, espaciados en HSL."""
    import colorsys
    return [
        "#%02x%02x%02x" % tuple(int(c * 255) for c in colorsys.hls_to_rgb(i / n, 0.55, 0.85))
        for i in range(n)
    ]


def main() -> int:
    if not GRAPH.exists():
        print(f"ERROR: no existe {GRAPH}")
        return 1
    if not LABELS.exists():
        print(f"ERROR: no existe {LABELS}")
        return 1

    graph = json.loads(GRAPH.read_text(encoding="utf-8"))
    labels = json.loads(LABELS.read_text(encoding="utf-8"))

    nodes_raw = graph.get("nodes", [])
    edges_raw = graph.get("edges", [])
    if not edges_raw:
        edges_raw = graph.get("links", [])

    # Set de comunidades presentes (para asignar color deterministico)
    communities = sorted({int(n.get("community", 0)) for n in nodes_raw})
    palette = vibrant_palette(NUM_COLORS)
    comm_to_color = {c: palette[i % NUM_COLORS] for i, c in enumerate(communities)}

    # Transformar nodos — asignar layer/fz/vz para 3d-force-graph
    nodes_out = []
    for n in nodes_raw:
        comm = int(n.get("community", 0))
        is_god = bool(n.get("is_god") or n.get("god") or n.get("isGod"))
        # Confidence: edges tienen confidence, nodos no. Para nodos, usar
        # heuristica basada en file_type: 'document' = INFERRED, 'code' = EXTRACTED.
        conf = n.get("confidence")
        if not conf:
            conf = "EXTRACTED" if n.get("file_type") == "code" else "INFERRED"
        nodes_out.append({
            "id": n["id"],
            "name": n.get("label") or n["id"],
            "type": n.get("file_type") or n.get("type") or "unknown",
            "community": comm,
            "layer": comm,                # alias
            "is_god": is_god,
            "source_location": n.get("source_location") or "",
            "source_file": n.get("source_file") or "",
            "confidence": conf,
            "color": comm_to_color.get(comm, "#888"),
            # audit 2026-07-07: was 24/6, but at the old camera distance nodes
            # were 1-2px. Increased so they stay visible after the camera tweak.
            "nodeVal": 50 if is_god else 14,
            "resolution": 16 if is_god else 8,
            # fz/vz se fijan en el JS al construir la layer
        })

    # Transformar aristas — separar intra-community de cross-community
    id_to_comm = {n["id"]: n["community"] for n in nodes_out}
    edges_out = []
    cross_count = 0
    intra_count = 0
    for e in edges_raw:
        src = e.get("source")
        tgt = e.get("target")
        if not src or not tgt:
            continue
        if src not in id_to_comm or tgt not in id_to_comm:
            continue
        s_comm = id_to_comm[src]
        t_comm = id_to_comm[tgt]
        cross = s_comm != t_comm
        edges_out.append({
            "source": src,
            "target": tgt,
            "label": e.get("relation", ""),
            "confidence": e.get("confidence", "EXTRACTED"),
            "cross_layer": cross,
            "color": comm_to_color.get(s_comm, "#888") if not cross else "rgba(255,255,255,0.18)",
            # audit 2026-07-07: cross-layer edges were 0.55 opacity which
            # dominated the view with white spaghetti. Drop to 0.18 so
            # intra-community structure stays readable.
            "opacity": 0.6 if not cross else 0.18,
            "width": 0.8 if not cross else 0.6,
        })
        if cross:
            cross_count += 1
        else:
            intra_count += 1

    num_layers = len(communities)
    num_nodes = len(nodes_out)
    num_edges = len(edges_out)

    # Embed data como JS
    graph_data_js = json.dumps({"nodes": nodes_out, "links": edges_out}, ensure_ascii=False)
    labels_js = json.dumps(labels, ensure_ascii=False)
    palette_js = json.dumps(palette, ensure_ascii=False)
    comm_color_js = json.dumps({str(k): v for k, v in comm_to_color.items()}, ensure_ascii=False)

    # Generar HTML. Usamos el campo layer (community) como Z fijo. Los nodos
    # dentro de la misma comunidad comparten un plano Z y flotan en XY.
    html = HTML_TEMPLATE.replace("__GRAPH_DATA__", graph_data_js)
    html = html.replace("__LABELS__", labels_js)
    html = html.replace("__PALETTE__", palette_js)
    html = html.replace("__COMM_COLOR__", comm_color_js)
    html = html.replace("__NUM_LAYERS__", str(num_layers))
    html = html.replace("__NUM_NODES__", str(num_nodes))
    html = html.replace("__NUM_EDGES__", str(num_edges))
    html = html.replace("__INTRA__", str(intra_count))
    html = html.replace("__CROSS__", str(cross_count))

    OUT.write_text(html, encoding="utf-8")

    print(f"3D graph: {num_nodes} nodos en {num_layers} capas \u2192 {OUT.relative_to(REPO)}")
    print(f"   edges: {num_edges} (intra-community: {intra_count}, cross-layer: {cross_count})")
    print(f"   god nodes: {sum(1 for n in nodes_out if n['is_god'])}")
    return 0


HTML_TEMPLATE = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Graphify 3D Layers — MedSysVE</title>
<style>
  html, body { margin:0; padding:0; height:100%; background:#0d0d14; color:#eee;
    font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; overflow:hidden; }
  #graph { width:100vw; height:100vh; }

  /* Panel de control — glassmorphism esquina superior izquierda */
  #panel {
    position: fixed; top: 16px; left: 16px; width: 320px; max-height: calc(100vh - 32px);
    overflow-y: auto;
    background: rgba(20, 20, 30, 0.65);
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px; padding: 14px 16px; z-index: 10;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }
  #panel h2 { margin: 0 0 12px 0; font-size: 15px; font-weight: 700; letter-spacing: 0.02em; }
  #panel h2 .glyph { color:#FFD100; }
  #panel .search { width: 100%; box-sizing: border-box; padding: 7px 10px;
    background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 7px; color: #eee; font-size: 12.5px; outline: none; }
  #panel .search:focus { border-color: #FFD100; }
  #panel .legend-stats { display:flex; gap:10px; margin-top: 10px; font-size: 11px;
    color: rgba(255,255,255,0.55); }
  #panel ul { list-style:none; padding:0; margin: 12px 0 0 0; }
  #panel li {
    display:flex; align-items:center; gap:8px; padding:5px 6px; cursor:pointer;
    border-radius: 6px; font-size: 12px; line-height: 1.35;
    transition: background 0.15s;
  }
  #panel li:hover { background: rgba(255,255,255,0.05); }
  #panel li.off { opacity: 0.35; }
  #panel li .dot {
    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
    box-shadow: 0 0 6px currentColor;
  }
  #panel li .name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  #panel li .count { color: rgba(255,255,255,0.45); font-variant-numeric: tabular-nums; }

  /* Tooltip — esquina inferior izquierda */
  #tooltip {
    position: fixed; bottom: 16px; left: 16px; max-width: 460px; min-width: 280px;
    background: rgba(20, 20, 30, 0.85);
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px; padding: 12px 14px; z-index: 11;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    font-size: 12.5px; display: none; cursor: default;
  }
  #tooltip .name { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 6px;
    word-break: break-all; }
  #tooltip .row { display:flex; gap:6px; margin-top: 3px; line-height: 1.4; }
  #tooltip .label { color: rgba(255,255,255,0.45); min-width: 92px; flex-shrink: 0; }
  #tooltip .value { color: #ddd; word-break: break-all; }
  #tooltip .confidence { padding: 1px 6px; border-radius: 3px; font-size: 10.5px;
    font-weight: 600; letter-spacing: 0.02em; }
  #tooltip .confidence.EXTRACTED { background: rgba(74, 222, 128, 0.18); color: #4ade80; }
  #tooltip .confidence.INFERRED { background: rgba(250, 204, 21, 0.18); color: #facc15; }
  #tooltip .confidence.AMBIGUOUS { background: rgba(248, 113, 113, 0.18); color: #f87171; }
  #tooltip .close { position: absolute; top: 8px; right: 10px; cursor: pointer;
    color: rgba(255,255,255,0.5); font-size: 16px; line-height: 1; }
  #tooltip .close:hover { color: #fff; }

  /* Leyenda camara — esquina superior derecha */
  #legend {
    position: fixed; top: 16px; right: 16px;
    background: rgba(20, 20, 30, 0.65);
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px; padding: 10px 12px; z-index: 10;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    font-size: 11.5px; color: rgba(255,255,255,0.75);
    display: flex; flex-direction: column; gap: 6px;
  }
  #legend kbd {
    background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px;
    font-family: ui-monospace, monospace; font-size: 10.5px;
    border: 1px solid rgba(255,255,255,0.12); color: #FFD100;
  }
  #legend .row { display:flex; gap: 6px; align-items: center; }

  /* Stats esquina inferior derecha */
  #stats {
    position: fixed; bottom: 16px; right: 16px; font-size: 11px;
    color: rgba(255,255,255,0.4); z-index: 10;
    background: rgba(20,20,30,0.55); padding: 8px 12px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.06);
  }

  canvas { display:block; }
</style>
</head>
<body>
<div id="graph"></div>

<div id="panel">
  <h2><span class="glyph">◧</span> Graphify 3D Layers</h2>
  <input id="search" class="search" type="text" placeholder="Search nodes by name…" autocomplete="off">
  <div class="legend-stats">
    <span id="stat-nodes">— nodes</span>
    <span id="stat-edges">— edges</span>
    <span id="stat-layers">— layers</span>
  </div>
  <ul id="layers"></ul>
</div>

<div id="tooltip" role="dialog" aria-live="polite">
  <span class="close" id="tooltip-close" aria-label="Close">×</span>
  <div class="name" id="tt-name"></div>
  <div class="row"><div class="label">Type</div><div class="value" id="tt-type"></div></div>
  <div class="row"><div class="label">Layer</div><div class="value" id="tt-layer"></div></div>
  <div class="row"><div class="label">Source</div><div class="value" id="tt-source"></div></div>
  <div class="row"><div class="label">Confidence</div><div class="value"><span class="confidence" id="tt-confidence"></span></div></div>
</div>

<div id="legend">
  <div class="row"><kbd>Left drag</kbd> rotate</div>
  <div class="row"><kbd>Scroll</kbd> zoom</div>
  <div class="row"><kbd>Right drag</kbd> pan</div>
</div>

<div id="stats">
  <div>Intra: <span id="stat-intra">—</span></div>
  <div>Cross: <span id="stat-cross">—</span></div>
</div>

<script src="https://unpkg.com/3d-force-graph@1/dist/3d-force-graph.min.js"></script>
<script>
(function() {
  'use strict';

  const GRAPH_DATA = __GRAPH_DATA__;
  const LABELS = __LABELS__;
  const PALETTE = __PALETTE__;
  const COMM_COLOR = __COMM_COLOR__;
  const Z_SPACING = 300;
  const NUM_LAYERS = __NUM_LAYERS__;
  const NUM_NODES = __NUM_NODES__;
  const NUM_EDGES = __NUM_EDGES__;
  const INTRA = __INTRA__;
  const CROSS = __CROSS__;

  document.getElementById('stat-nodes').textContent = NUM_NODES.toLocaleString() + ' nodes';
  document.getElementById('stat-edges').textContent = NUM_EDGES.toLocaleString() + ' edges';
  document.getElementById('stat-layers').textContent = NUM_LAYERS.toLocaleString() + ' layers';
  document.getElementById('stat-intra').textContent = INTRA.toLocaleString();
  document.getElementById('stat-cross').textContent = CROSS.toLocaleString();

  // Preparar datos — copiar para no mutar el original
  const nodes = GRAPH_DATA.nodes.map(n => Object.assign({}, n, {
    fx: null, fy: null, fz: (n.layer || n.community || 0) * Z_SPACING,
    vz: 0,
    visible: true,
  }));
  const nodeById = new Map(nodes.map(n => [n.id, n]));
  const links = GRAPH_DATA.links.map(l => Object.assign({}, l));

  // Capas (comunidades) ordenadas
  const layerMap = new Map(); // community -> { count, on, color, name }
  for (const n of nodes) {
    const c = n.community;
    if (!layerMap.has(c)) {
      const name = LABELS[String(c)] || ('Community ' + c);
      layerMap.set(c, { community: c, name, count: 0, on: true, color: COMM_COLOR[String(c)] || '#888' });
    }
    layerMap.get(c).count++;
  }
  const layers = Array.from(layerMap.values()).sort((a, b) => a.community - b.community);

  // Render panel de capas
  const layersUl = document.getElementById('layers');
  for (const lyr of layers) {
    const li = document.createElement('li');
    li.dataset.community = lyr.community;
    li.innerHTML = '<span class="dot" style="background:' + lyr.color + ';color:' + lyr.color + '"></span>' +
      '<span class="name" title="' + escapeHtml(lyr.name) + '">' + escapeHtml(lyr.name) + '</span>' +
      '<span class="count">' + lyr.count + '</span>';
    li.addEventListener('click', () => toggleLayer(lyr.community));
    layersUl.appendChild(li);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  function toggleLayer(c) {
    const lyr = layerMap.get(c);
    lyr.on = !lyr.on;
    const li = layersUl.querySelector('li[data-community="' + c + '"]');
    if (li) li.classList.toggle('off', !lyr.on);

    // Aplicar visibilidad a nodos de esa layer
    for (const n of nodes) {
      if (n.community === c) {
        n.visible = lyr.on;
      }
    }
    applyFilters();
  }

  // Busqueda
  const searchInput = document.getElementById('search');
  let searchTerm = '';
  searchInput.addEventListener('input', () => {
    searchTerm = searchInput.value.trim().toLowerCase();
    applyFilters();
  });

  function applyFilters() {
    const filtered = new Set();
    for (const n of nodes) {
      let show = n.visible;
      if (show && searchTerm) {
        const name = (n.name || n.id || '').toLowerCase();
        const src = (n.source_file || '').toLowerCase();
        show = name.includes(searchTerm) || src.includes(searchTerm) || n.id.toLowerCase().includes(searchTerm);
      }
      n.__show = show;
      if (show) filtered.add(n.id);
    }
    // Actualizar el grafo.
    // audit 2026-07-07: 3d-force-graph v1+ uses `g.graphData({nodes, links})`,
    // NOT `g.nodes(...)` and `g.links(...)` separately (those throw
    // "g.nodes is not a function" on v1.x — found when debugging the
    // black-canvas issue). Use the documented single-call API.
    g.graphData({
      nodes: nodes.filter(n => n.__show),
      links: links.filter(l => filtered.has(l.source.id || l.source) && filtered.has(l.target.id || l.target)),
    });
  }

  // Crear el grafo 3D
  const Graph = window.ForceGraph3D ? window.ForceGraph3D : window['3d-force-graph'];
  const elem = document.getElementById('graph');
  const g = Graph()(elem)
    .backgroundColor('#0d0d14')
    .nodeColor(n => n.color)
    .nodeVal(n => n.nodeVal || 6)
    .nodeResolution(n => n.resolution || 8)
    .nodeOpacity(1.0)
    .nodeLabel(n => '') // tooltip via DOM
    .linkColor(l => l.color)
    .linkOpacity(l => l.opacity)
    .linkWidth(l => l.width)
    .linkDirectionalParticles(0)
    .enableNodeDrag(true)
    .showNavInfo(false);

  // audit 2026-07-07: 3d-force-graph v1+ uses `g.graphData({nodes, links})`.
  g.graphData({ nodes, links });

  // audit 2026-07-07: with 197 layers and 886 cross-layer edges spanning up to
  // 60k+ Z units, d3-force 3D's default forces collapse the cloud into a
  // cone around the centroid. We disable EVERY force (we already pinned
  // fx/fy/fz on every node) so positions stay where we put them. This
  // trades organic layout for predictable per-layer rings — acceptable
  // since per-layer is the whole point of this view.
  try {
    g.d3Force('charge').strength(0);
    g.d3Force('link').strength(0);
    g.d3Force('center', null);
    g.d3Force('x', null);
    g.d3Force('y', null);
  } catch {}
  setTimeout(() => {
    try { g.d3ReheatSimulation && g.d3ReheatSimulation(); } catch {}
  }, 100);

  // Camara inicial — vista elevada, ligeramente elevada
  //
  // audit 2026-07-07: the previous formula (NUM_LAYERS * Z_SPACING * 1.8)
  // put the camera ~106k units away from origin when NUM_LAYERS=197, so
  // nodes were 1-2px tall and the canvas looked completely black. We now
  // use sqrt-scaled distance (so 197 layers is ~28x further than 1, not
  // 197x) and aim the camera at the Z mid-point of the layers.
  const camDist = 800 + Math.sqrt(NUM_LAYERS) * 320;
  const camTargetZ = (NUM_LAYERS - 1) * Z_SPACING * 0.5;
  g.cameraPosition({ x: 0, y: -300, z: camTargetZ + camDist });

  // audit 2026-07-07: After graphData + initial tick, RE-PIN all positions
  // to fx/fy/fz. 3d-force-graph's engine runs for several seconds by
  // default; if a node's fixed position is dropped (e.g. because the
  // user clicked it), the engine could drag it back to (0,0,0). We
  // re-pin every tick until the engine cools down. This is belt-and-
  // suspenders on top of the d3Force nulling above.
  let engineTicks = 0;
  g.onEngineTick(() => {
    if (engineTicks++ > 60) return; // engine cools after ~60 ticks (~2s)
    for (const n of nodes) {
      if (n.fx == null) n.fx = n.x;
      if (n.fy == null) n.fy = n.y;
      if (n.fz == null) n.fz = n.z;
    }
  });

  // audit 2026-07-07: seed initial XY positions on a per-layer ring so the
  // 3d-force-graph engine starts with a spread-out cloud instead of every
  // node at (0,0,0). Without this, d3-force collapses everything to a
  // single point before our onEngineTick hook can pin Z.
  //
  // We ALSO fix the positions (n.fx/n.fy/n.fz) so the engine doesn't pull
  // them back toward the centroid. With 197 layers, cross-layer edges
  // (which can span 60k+ units in Z) collapse everything unless positions
  // are pinned.
  const nodesByLayer = new Map();
  for (const n of nodes) {
    const layer = n.layer || n.community || 0;
    if (!nodesByLayer.has(layer)) nodesByLayer.set(layer, []);
    nodesByLayer.get(layer).push(n);
  }
  for (const [layer, layerNodes] of nodesByLayer) {
    const count = layerNodes.length;
    // Ring per layer: each node on a circle around the layer's center.
    // Radius scales with sqrt(count) so big layers don't pile up.
    const radius = 80 + Math.sqrt(count) * 22;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const n = layerNodes[i];
      n.x = Math.cos(angle) * radius;
      n.y = Math.sin(angle) * radius;
      n.z = layer * Z_SPACING;
      n.fx = n.x;
      n.fy = n.y;
      n.fz = n.z;
    }
  }

  // Debug stats — open DevTools console to see why the canvas is/isn't
  // showing anything.
  console.log('[graph3d] nodes=' + nodes.length + ' layers=' + NUM_LAYERS
    + ' zRange=[0,' + ((NUM_LAYERS-1)*Z_SPACING) + ']'
    + ' camDist=' + camDist + ' camPosZ=' + (camTargetZ + camDist));

  // Tooltip
  const tooltip = document.getElementById('tooltip');
  const ttName = document.getElementById('tt-name');
  const ttType = document.getElementById('tt-type');
  const ttLayer = document.getElementById('tt-layer');
  const ttSource = document.getElementById('tt-source');
  const ttConfidence = document.getElementById('tt-confidence');
  const ttClose = document.getElementById('tooltip-close');

  function hideTooltip() {
    tooltip.style.display = 'none';
  }
  function showTooltip(n) {
    ttName.textContent = n.name || n.id;
    ttType.textContent = n.type || 'unknown';
    const layerName = LABELS[String(n.community)] || ('Community ' + n.community);
    ttLayer.textContent = '#' + n.community + ' — ' + layerName;
    ttSource.textContent = n.source_file + (n.source_location ? ':' + n.source_location : '');
    ttConfidence.textContent = n.confidence || 'EXTRACTED';
    ttConfidence.className = 'confidence ' + (n.confidence || 'EXTRACTED');
    tooltip.style.display = 'block';
  }

  g.onNodeClick(n => {
    if (!n) { hideTooltip(); return; }
    showTooltip(n);
    // Centrar camara cerca del nodo (sin zoom agresivo)
    const dist = 250;
    const angle = Math.PI / 4;
    g.cameraPosition({
      x: n.x + dist * Math.cos(angle),
      y: n.y - dist * Math.sin(angle),
      z: n.z + 120,
    }, n, 800);
  });

  ttClose.addEventListener('click', hideTooltip);
  // Click en el fondo cierra tooltip
  elem.addEventListener('click', e => {
    // Solo si el click no fue en un nodo (3d-force-graph ya maneja node click)
    if (e.target === elem) hideTooltip();
  });

  // Resize handler
  window.addEventListener('resize', () => {
    g.width(window.innerWidth);
    g.height(window.innerHeight);
  });
})();
</script>
</body>
</html>
"""


if __name__ == "__main__":
    sys.exit(main())