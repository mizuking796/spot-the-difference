// image-processing.js — 画像処理アルゴリズム（共通）

function toGrayscaleUint8(imageData) {
  var gray = new Uint8Array(imageData.width * imageData.height);
  for (var i = 0; i < gray.length; i++) {
    var j = i * 4;
    gray[i] = Math.round(0.299 * imageData.data[j] + 0.587 * imageData.data[j+1] + 0.114 * imageData.data[j+2]);
  }
  return gray;
}

function toGrayscaleFloat(imageData) {
  var gray = new Float32Array(imageData.width * imageData.height);
  for (var i = 0; i < gray.length; i++) {
    var j = i * 4;
    gray[i] = 0.299 * imageData.data[j] + 0.587 * imageData.data[j+1] + 0.114 * imageData.data[j+2];
  }
  return gray;
}

function downsample(gray, width, height, scale) {
  var sw = Math.floor(width / scale);
  var sh = Math.floor(height / scale);
  var result = new Float32Array(sw * sh);

  for (var y = 0; y < sh; y++) {
    for (var x = 0; x < sw; x++) {
      var sum = 0;
      for (var dy = 0; dy < scale; dy++) {
        for (var dx = 0; dx < scale; dx++) {
          sum += gray[(y * scale + dy) * width + (x * scale + dx)];
        }
      }
      result[y * sw + x] = sum / (scale * scale);
    }
  }
  return result;
}

function detectEdges(gray, width, height) {
  var edges = new Uint8Array(width * height);

  for (var y = 1; y < height - 1; y++) {
    for (var x = 1; x < width - 1; x++) {
      var idx = y * width + x;

      // Sobel operator
      var gx =
        -gray[(y-1)*width + (x-1)] + gray[(y-1)*width + (x+1)] +
        -2*gray[y*width + (x-1)] + 2*gray[y*width + (x+1)] +
        -gray[(y+1)*width + (x-1)] + gray[(y+1)*width + (x+1)];

      var gy =
        -gray[(y-1)*width + (x-1)] - 2*gray[(y-1)*width + x] - gray[(y-1)*width + (x+1)] +
        gray[(y+1)*width + (x-1)] + 2*gray[(y+1)*width + x] + gray[(y+1)*width + (x+1)];

      var magnitude = Math.sqrt(gx * gx + gy * gy);
      edges[idx] = magnitude > 50 ? 255 : 0;
    }
  }
  return edges;
}

// NCC: Normalized Cross-Correlation
function findOffsetNCC(img1, img2, width, height, maxShift) {
  var bestOffset = { dx: 0, dy: 0, score: -Infinity };
  var margin = maxShift;

  for (var dy = -maxShift; dy <= maxShift; dy++) {
    for (var dx = -maxShift; dx <= maxShift; dx++) {
      var sum1 = 0, sum2 = 0, sum12 = 0, sum11 = 0, sum22 = 0;
      var count = 0;

      for (var y = margin; y < height - margin; y++) {
        for (var x = margin; x < width - margin; x++) {
          var x2 = x + dx;
          var y2 = y + dy;
          if (x2 < 0 || x2 >= width || y2 < 0 || y2 >= height) continue;

          var v1 = img1[y * width + x];
          var v2 = img2[y2 * width + x2];

          sum1 += v1; sum2 += v2;
          sum12 += v1 * v2;
          sum11 += v1 * v1; sum22 += v2 * v2;
          count++;
        }
      }

      if (count === 0) continue;
      var mean1 = sum1 / count, mean2 = sum2 / count;
      var var1 = sum11 / count - mean1 * mean1;
      var var2 = sum22 / count - mean2 * mean2;
      var cov = sum12 / count - mean1 * mean2;
      var score = cov / (Math.sqrt(var1 * var2) + 0.0001);

      if (score > bestOffset.score) bestOffset = { dx: dx, dy: dy, score: score };
    }
  }
  return bestOffset;
}

// SAD: Sum of Absolute Differences
function findOffsetSAD(img1, img2, width, height, maxShift) {
  var bestOffset = { dx: 0, dy: 0, score: -Infinity };
  var margin = maxShift;

  for (var dy = -maxShift; dy <= maxShift; dy++) {
    for (var dx = -maxShift; dx <= maxShift; dx++) {
      var sad = 0, count = 0;

      for (var y = margin; y < height - margin; y++) {
        for (var x = margin; x < width - margin; x++) {
          var x2 = x + dx;
          var y2 = y + dy;
          if (x2 < 0 || x2 >= width || y2 < 0 || y2 >= height) continue;

          sad += Math.abs(img1[y * width + x] - img2[y2 * width + x2]);
          count++;
        }
      }

      var score = -sad / count;
      if (score > bestOffset.score) bestOffset = { dx: dx, dy: dy, score: score };
    }
  }
  return bestOffset;
}

// Center-region NCC: Only use central 50%
function findOffsetCenterNCC(img1, img2, width, height, maxShift) {
  var bestOffset = { dx: 0, dy: 0, score: -Infinity };
  var marginX = Math.floor(width * 0.25);
  var marginY = Math.floor(height * 0.25);

  for (var dy = -maxShift; dy <= maxShift; dy++) {
    for (var dx = -maxShift; dx <= maxShift; dx++) {
      var sum1 = 0, sum2 = 0, sum12 = 0, sum11 = 0, sum22 = 0;
      var count = 0;

      for (var y = marginY; y < height - marginY; y++) {
        for (var x = marginX; x < width - marginX; x++) {
          var x2 = x + dx;
          var y2 = y + dy;
          if (x2 < 0 || x2 >= width || y2 < 0 || y2 >= height) continue;

          var v1 = img1[y * width + x];
          var v2 = img2[y2 * width + x2];

          sum1 += v1; sum2 += v2;
          sum12 += v1 * v2;
          sum11 += v1 * v1; sum22 += v2 * v2;
          count++;
        }
      }

      if (count === 0) continue;
      var mean1 = sum1 / count, mean2 = sum2 / count;
      var var1 = sum11 / count - mean1 * mean1;
      var var2 = sum22 / count - mean2 * mean2;
      var cov = sum12 / count - mean1 * mean2;
      var score = cov / (Math.sqrt(var1 * var2) + 0.0001);

      if (score > bestOffset.score) bestOffset = { dx: dx, dy: dy, score: score };
    }
  }
  return bestOffset;
}

function findDividerLine(imageData, width, height, direction, searchRange) {
  var data = imageData.data;

  if (direction === 'vertical') {
    var centerX = Math.floor(width / 2);
    var darkestX = centerX;
    var darkestSum = Infinity;

    for (var x = centerX - searchRange; x <= centerX + searchRange; x++) {
      if (x < 0 || x >= width) continue;

      var sum = 0;
      for (var y = 0; y < height; y += 5) {
        var i = (y * width + x) * 4;
        var brightness = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
        sum += brightness;
      }

      if (sum < darkestSum) {
        darkestSum = sum;
        darkestX = x;
      }
    }
    return darkestX;
  } else {
    var centerY = Math.floor(height / 2);
    var darkestY = centerY;
    var darkestSumH = Infinity;

    for (var yy = centerY - searchRange; yy <= centerY + searchRange; yy++) {
      if (yy < 0 || yy >= height) continue;

      var sumH = 0;
      for (var xx = 0; xx < width; xx += 5) {
        var ii = (yy * width + xx) * 4;
        var br = data[ii] * 0.299 + data[ii+1] * 0.587 + data[ii+2] * 0.114;
        sumH += br;
      }

      if (sumH < darkestSumH) {
        darkestSumH = sumH;
        darkestY = yy;
      }
    }
    return darkestY;
  }
}
