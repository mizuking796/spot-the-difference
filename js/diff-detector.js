// diff-detector.js — 差分検出・クラスタリング

function buildDiffMap(data1, data2, width, height, dx, dy, threshold, margin) {
  var diffMap = new Uint8Array(width * height);

  for (var y = margin; y < height - margin; y++) {
    for (var x = margin; x < width - margin; x++) {
      var x2 = x + dx;
      var y2 = y + dy;

      if (x2 < 0 || x2 >= width || y2 < 0 || y2 >= height) continue;

      var i1 = (y * width + x) * 4;
      var i2 = (y2 * width + x2) * 4;

      var r1 = data1.data[i1], g1 = data1.data[i1+1], b1 = data1.data[i1+2];
      var r2 = data2.data[i2], g2 = data2.data[i2+1], b2 = data2.data[i2+2];

      var diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);

      if (diff > threshold) {
        diffMap[y * width + x] = 1;
      }
    }
  }
  return diffMap;
}

function findConnectedComponents(diffMap, width, height, minSize) {
  var labels = new Int32Array(width * height);
  var currentLabel = 0;
  var clusters = [];

  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      var idx = y * width + x;
      if (diffMap[idx] === 1 && labels[idx] === 0) {
        currentLabel++;
        var queue = [[x, y]];
        var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        var size = 0;

        while (queue.length > 0) {
          var point = queue.shift();
          var cx = point[0], cy = point[1];
          var cidx = cy * width + cx;

          if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
          if (diffMap[cidx] !== 1 || labels[cidx] !== 0) continue;

          labels[cidx] = currentLabel;
          size++;
          minX = Math.min(minX, cx);
          minY = Math.min(minY, cy);
          maxX = Math.max(maxX, cx);
          maxY = Math.max(maxY, cy);

          queue.push([cx-1, cy], [cx+1, cy], [cx, cy-1], [cx, cy+1]);
        }

        if (size >= minSize) {
          clusters.push({
            size: size,
            centerX: (minX + maxX) / 2,
            centerY: (minY + maxY) / 2,
            width: maxX - minX,
            height: maxY - minY
          });
        }
      }
    }
  }

  return { clusters: clusters };
}

function mergeClusters(clusters, maxDist) {
  if (clusters.length === 0) return [];

  var merged = [];
  var used = new Set();

  for (var i = 0; i < clusters.length; i++) {
    if (used.has(i)) continue;

    var group = [clusters[i]];
    used.add(i);

    var changed = true;
    while (changed) {
      changed = false;
      for (var j = 0; j < clusters.length; j++) {
        if (used.has(j)) continue;

        for (var k = 0; k < group.length; k++) {
          var g = group[k];
          var ddx = clusters[j].centerX - g.centerX;
          var ddy = clusters[j].centerY - g.centerY;
          var dist = Math.sqrt(ddx * ddx + ddy * ddy);

          if (dist < maxDist) {
            group.push(clusters[j]);
            used.add(j);
            changed = true;
            break;
          }
        }
      }
    }

    var gMinX = Infinity, gMinY = Infinity, gMaxX = -Infinity, gMaxY = -Infinity;
    var totalSize = 0;
    for (var m = 0; m < group.length; m++) {
      var c = group[m];
      gMinX = Math.min(gMinX, c.centerX - c.width / 2);
      gMinY = Math.min(gMinY, c.centerY - c.height / 2);
      gMaxX = Math.max(gMaxX, c.centerX + c.width / 2);
      gMaxY = Math.max(gMaxY, c.centerY + c.height / 2);
      totalSize += c.size;
    }

    merged.push({
      size: totalSize,
      centerX: (gMinX + gMaxX) / 2,
      centerY: (gMinY + gMaxY) / 2,
      width: gMaxX - gMinX,
      height: gMaxY - gMinY
    });
  }

  return merged;
}
