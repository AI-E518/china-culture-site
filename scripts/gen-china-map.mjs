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
// 城市源数据：只填 slug/中文名/英文名/真实经纬度，地图 x/y 由墨卡托投影自动算。
// 后续新增城市：在此数组加一行即可，重跑 `node scripts/gen-china-map.mjs` 自动生成坐标。
const rawCities = [
  { slug: 'beijing', zh: '北京', en: 'Beijing', lon: 116.407, lat: 39.904 },
  { slug: 'shanghai', zh: '上海', en: 'Shanghai', lon: 121.473, lat: 31.23 },
  { slug: 'guangzhou', zh: '广州', en: 'Guangzhou', lon: 113.264, lat: 23.129 },
  { slug: 'shenzhen', zh: '深圳', en: 'Shenzhen', lon: 114.057, lat: 22.543 },
  { slug: 'chongqing', zh: '重庆', en: 'Chongqing', lon: 106.551, lat: 29.563 },
  { slug: 'chengdu', zh: '成都', en: 'Chengdu', lon: 104.066, lat: 30.572 },
  { slug: 'hangzhou', zh: '杭州', en: 'Hangzhou', lon: 120.155, lat: 30.274 },
  { slug: 'xian', zh: '西安', en: "Xi'an", lon: 108.948, lat: 34.263 },
  { slug: 'nanjing', zh: '南京', en: 'Nanjing', lon: 118.797, lat: 32.06 },
  { slug: 'suzhou', zh: '苏州', en: 'Suzhou', lon: 120.619, lat: 31.299 },
  { slug: 'lijiang', zh: '丽江', en: 'Lijiang', lon: 100.233, lat: 26.872 },
  { slug: 'dali', zh: '大理', en: 'Dali', lon: 100.267, lat: 25.606 },
  { slug: 'xiamen', zh: '厦门', en: 'Xiamen', lon: 118.089, lat: 24.479 },
  { slug: 'qingdao', zh: '青岛', en: 'Qingdao', lon: 120.382, lat: 36.067 },
  { slug: 'wuhan', zh: '武汉', en: 'Wuhan', lon: 114.305, lat: 30.593 },
  { slug: 'changsha', zh: '长沙', en: 'Changsha', lon: 112.938, lat: 28.228 },
  { slug: 'tianjin', zh: '天津', en: 'Tianjin', lon: 117.19, lat: 39.125 },
  { slug: 'kunming', zh: '昆明', en: 'Kunming', lon: 102.832, lat: 24.88 },
  { slug: 'guilin', zh: '桂林', en: 'Guilin', lon: 110.299, lat: 25.274 },
  { slug: 'lhasa', zh: '拉萨', en: 'Lhasa', lon: 91.14, lat: 29.645 },
  { slug: 'harbin', zh: '哈尔滨', en: 'Harbin', lon: 126.642, lat: 45.756 },
  { slug: 'sanya', zh: '三亚', en: 'Sanya', lon: 109.511, lat: 18.252 },
  { slug: 'hongkong', zh: '香港', en: 'Hong Kong', lon: 114.173, lat: 22.32 },
  { slug: 'taipei', zh: '台北', en: 'Taipei', lon: 121.565, lat: 25.033 },
  { slug: 'dunhuang', zh: '敦煌', en: 'Dunhuang', lon: 94.662, lat: 40.142 },
  { slug: 'urumqi', zh: '乌鲁木齐', en: 'Urumqi', lon: 87.617, lat: 43.825 },
  { slug: 'shenyang', zh: '沈阳', en: 'Shenyang', lon: 123.431, lat: 41.805 },
  { slug: 'jinan', zh: '济南', en: 'Jinan', lon: 117.0, lat: 36.651 },
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
