// 把 DataV 合规中国 GeoJSON 渲染为静态 SVG 路径，并计算城市热点坐标。
// 合规：底图含台湾省、港澳、南海九段线（100000_JD），不手绘边界。
import fs from 'node:fs';

const geo = JSON.parse(fs.readFileSync('data/china_full.json', 'utf8'));

// Web Mercator 投影（x 用经度弧度，y 用墨卡托纬度，单位一致可比较）
const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2));
const proj = ([lon, lat]) => [lon * Math.PI / 180, mercY(lat)];

// 第一遍：收集所有点算边界
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
const allRings = []; // 每个元素是一组 ring（ring = [[lon,lat],...]）

function pushRings(coords, type) {
  if (type === 'Polygon') {
    allRings.push(coords);
  } else if (type === 'MultiPolygon') {
    coords.forEach((p) => allRings.push(p));
  } else if (type === 'LineString') {
    allRings.push([coords]);
  } else if (type === 'MultiLineString') {
    coords.forEach((l) => allRings.push([l]));
  }
}

for (const f of geo.features) {
  const g = f.geometry;
  if (!g) continue;
  if (g.type === 'GeometryCollection') {
    g.geometries.forEach((sg) => pushRings(sg.coordinates, sg.type));
  } else {
    pushRings(g.coordinates, g.type);
  }
}

for (const rings of allRings) {
  for (const ring of rings) {
    for (const pt of ring) {
      const [x, y] = proj(pt);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

// 第二遍：缩放到 viewBox（宽 1000，等比，留白 12）
const VB_W = 1000;
const PAD = 12;
const scale = (VB_W - PAD * 2) / (maxX - minX);
const vbH = Math.ceil((maxY - minY) * scale + PAD * 2);
const sx = (x) => (x - minX) * scale + PAD;
const sy = (y) => (maxY - y) * scale + PAD; // 翻转 y，北朝上

function ringToPath(ring) {
  return ring
    .map((pt, i) => {
      const [x, y] = proj(pt);
      return `${i === 0 ? 'M' : 'L'}${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`;
    })
    .join(' ');
}

// 每个 feature 合成一条 path（外环 + 孔洞，fill-rule:evenodd 挖洞）
const provincePaths = [];
for (const f of geo.features) {
  const g = f.geometry;
  const segs = [];
  const add = (coords, type) => {
    if (type === 'Polygon') coords.forEach((ring) => segs.push(ringToPath(ring) + ' Z'));
    else if (type === 'MultiPolygon') coords.forEach((p) => p.forEach((ring) => segs.push(ringToPath(ring) + ' Z')));
    else if (type === 'LineString') segs.push(ringToPath(coords) + ' Z');
    else if (type === 'MultiLineString') coords.forEach((l) => segs.push(ringToPath(l) + ' Z'));
  };
  if (!g) continue;
  if (g.type === 'GeometryCollection') g.geometries.forEach((sg) => add(sg.coordinates, sg.type));
  else add(g.coordinates, g.type);
  provincePaths.push(segs.join(' '));
}

// 目标城市热点（真实经纬度，投影后与底图同一坐标系）
const rawCities = [
  { slug: 'beijing', zh: '北京', en: 'Beijing', lon: 116.407, lat: 39.904 },
  { slug: 'shanghai', zh: '上海', en: 'Shanghai', lon: 121.473, lat: 31.23 },
  { slug: 'guangzhou', zh: '广州', en: 'Guangzhou', lon: 113.264, lat: 23.129 },
  { slug: 'shenzhen', zh: '深圳', en: 'Shenzhen', lon: 114.057, lat: 22.543 },
  { slug: 'chongqing', zh: '重庆', en: 'Chongqing', lon: 106.551, lat: 29.563 },
];
const cities = rawCities.map((c) => {
  const [x, y] = proj([c.lon, c.lat]);
  return { ...c, x: +sx(x).toFixed(1), y: +sy(y).toFixed(1) };
});

const out = `// 由 scripts/gen-china-map.mjs 自动生成，请勿手改。
// 底图：阿里 DataV 合规中国 GeoJSON（含台湾省、港澳、南海九段线）。
export const mapViewBox = { w: ${VB_W}, h: ${vbH} };
export const provincePaths: string[] = ${JSON.stringify(provincePaths)};
export const cities = ${JSON.stringify(cities)} as const;
`;
fs.writeFileSync('src/data/china.ts', out, 'utf8');
console.log(`OK: viewBox ${VB_W}x${vbH}, 省路径 ${provincePaths.length} 条, 城市 ${cities.length} 个`);
console.log('城市坐标:', cities.map((c) => `${c.zh}(${c.x},${c.y})`).join('  '));
