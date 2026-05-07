// gallery.js — index.html メインロジック
// 依存: tutorial.js, image-processing.js, diff-detector.js, settings.js

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(function() {});
}

// Tutorial
var tutorial = initTutorial({ onClose: function() {} });

// Settings
var blinkInterval = null;
var isOverlayMode = false;

var settings = initSettings(function onBlinkSpeedChange() {
  if (blinkInterval && !isOverlayMode) {
    startBlinking();
  }
});

// View switching
var selectionScreen = document.getElementById('selectionScreen');
var uploadView = document.getElementById('uploadView');

document.getElementById('showGalleryBtn').addEventListener('click', function() {
  selectionScreen.classList.add('hidden');
  uploadView.classList.add('visible');
});

document.getElementById('backToSelectionBtn').addEventListener('click', function() {
  selectionScreen.classList.remove('hidden');
  uploadView.classList.remove('visible');
});

// File upload
var fileInput = document.getElementById('fileInput');
var preview = document.getElementById('preview');
var placeholder = document.getElementById('placeholder');
var uploadBox = document.getElementById('uploadBox');
var findBtn = document.getElementById('findBtn');
var resultCanvas = document.getElementById('resultCanvas');
var ctx = resultCanvas.getContext('2d');
var status = document.getElementById('status');

var sourceImg = null;
var halfWidth, halfHeight, splitDirection;
var displayWidth, displayHeight;

var alignMethod = document.getElementById('alignMethod');
var manualControls = document.getElementById('manualControls');
var manualDx = document.getElementById('manualDx');
var manualDy = document.getElementById('manualDy');
var manualDxValue = document.getElementById('manualDxValue');
var manualDyValue = document.getElementById('manualDyValue');
var toggleOverlayBtn = document.getElementById('toggleOverlayBtn');

var currentAutoOffset = { dx: 0, dy: 0 };
var canvas1Ref = null, canvas2Ref = null;

// Upload handlers
uploadBox.addEventListener('click', function() { fileInput.click(); });

uploadBox.addEventListener('dragover', function(e) {
  e.preventDefault();
  uploadBox.style.borderColor = '#ff69b4';
});

uploadBox.addEventListener('dragleave', function() {
  uploadBox.style.borderColor = '#ffb6c1';
});

uploadBox.addEventListener('drop', function(e) {
  e.preventDefault();
  uploadBox.style.borderColor = '#ffb6c1';
  var file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    loadImage(file);
  }
});

fileInput.addEventListener('change', function(e) {
  if (e.target.files[0]) {
    loadImage(e.target.files[0]);
  }
});

function loadImage(file) {
  var reader = new FileReader();
  reader.onload = function(event) {
    preview.src = event.target.result;
    preview.style.display = 'block';
    placeholder.style.display = 'none';

    var img = new Image();
    img.onload = function() {
      sourceImg = img;
      findBtn.disabled = false;
      status.textContent = '';

      if (img.width > img.height) {
        document.querySelector('input[name="splitDir"][value="horizontal"]').checked = true;
      } else {
        document.querySelector('input[name="splitDir"][value="vertical"]').checked = true;
      }
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

// Align method switching
alignMethod.addEventListener('change', function() {
  var isManual = alignMethod.value === 'manual';

  if (isManual && canvas1Ref && canvas2Ref) {
    manualDx.value = currentAutoOffset.dx;
    manualDy.value = currentAutoOffset.dy;
    manualDxValue.textContent = currentAutoOffset.dx;
    manualDyValue.textContent = currentAutoOffset.dy;
    isOverlayMode = true;
    toggleOverlayBtn.textContent = '🔄 点滅';
    manualControls.classList.add('visible');
    stopBlinking();
    renderOverlay();
  } else {
    manualControls.classList.remove('visible');
  }
});

toggleOverlayBtn.addEventListener('click', function() {
  if (!canvas1Ref || !canvas2Ref) return;

  if (isOverlayMode) {
    isOverlayMode = false;
    manualControls.classList.remove('visible');
    startBlinking();
  } else {
    isOverlayMode = true;
    stopBlinking();
    toggleOverlayBtn.textContent = '🔄 点滅';
    manualControls.classList.add('visible');
    renderOverlay();
  }
});

manualDx.addEventListener('input', function() {
  manualDxValue.textContent = manualDx.value;
  currentAutoOffset.dx = parseInt(manualDx.value);
  if (alignMethod.value === 'manual' && isOverlayMode) renderOverlay();
});

manualDy.addEventListener('input', function() {
  manualDyValue.textContent = manualDy.value;
  currentAutoOffset.dy = parseInt(manualDy.value);
  if (alignMethod.value === 'manual' && isOverlayMode) renderOverlay();
});

resultCanvas.addEventListener('click', function() {
  if (alignMethod.value === 'manual' && !isOverlayMode && canvas1Ref && canvas2Ref) {
    isOverlayMode = true;
    stopBlinking();
    toggleOverlayBtn.textContent = '🔄 点滅';
    manualControls.classList.add('visible');
    renderOverlay();
  }
});

function renderOverlay() {
  if (!canvas1Ref || !canvas2Ref) return;
  ctx.clearRect(0, 0, displayWidth, displayHeight);
  ctx.globalAlpha = 1;
  ctx.drawImage(canvas1Ref, 0, 0);
  ctx.globalAlpha = 0.5;
  ctx.drawImage(canvas2Ref, currentAutoOffset.dx, currentAutoOffset.dy);
  ctx.globalAlpha = 1;
}

// Main processing
findBtn.addEventListener('click', findDifferences);

function findDifferences() {
  if (!sourceImg) return;

  status.textContent = '';
  var s = settings.getValues();

  var splitDir = document.querySelector('input[name="splitDir"]:checked').value;
  var width, height;

  if (splitDir === 'horizontal') {
    splitDirection = 'horizontal';
    halfWidth = Math.floor(sourceImg.width / 2);
    halfHeight = sourceImg.height;
  } else {
    splitDirection = 'vertical';
    halfWidth = sourceImg.width;
    halfHeight = Math.floor(sourceImg.height / 2);
  }
  width = halfWidth;
  height = halfHeight;

  resultCanvas.width = width;
  resultCanvas.height = height;
  displayWidth = width;
  displayHeight = height;

  var canvas1 = document.createElement('canvas');
  var canvas2 = document.createElement('canvas');
  canvas1.width = canvas2.width = width;
  canvas1.height = canvas2.height = height;

  var ctx1 = canvas1.getContext('2d');
  var ctx2 = canvas2.getContext('2d');

  // Find the center divider line
  var tempCanvas = document.createElement('canvas');
  tempCanvas.width = sourceImg.width;
  tempCanvas.height = sourceImg.height;
  var tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(sourceImg, 0, 0);
  var fullData = tempCtx.getImageData(0, 0, sourceImg.width, sourceImg.height);

  if (splitDirection === 'horizontal') {
    var dividerX = findDividerLine(fullData, sourceImg.width, sourceImg.height, 'vertical', s.dividerSearchRange);
    var leftWidth = dividerX;
    var rightWidth = sourceImg.width - dividerX;
    var useWidth = Math.min(leftWidth, rightWidth);

    ctx1.drawImage(sourceImg, dividerX - useWidth, 0, useWidth, sourceImg.height, 0, 0, width, height);
    ctx2.drawImage(sourceImg, dividerX, 0, useWidth, sourceImg.height, 0, 0, width, height);
  } else {
    var dividerY = findDividerLine(fullData, sourceImg.width, sourceImg.height, 'horizontal', s.dividerSearchRange);
    var topHeight = dividerY;
    var bottomHeight = sourceImg.height - dividerY;
    var useHeight = Math.min(topHeight, bottomHeight);

    ctx1.drawImage(sourceImg, 0, dividerY - useHeight, sourceImg.width, useHeight, 0, 0, width, height);
    ctx2.drawImage(sourceImg, 0, dividerY, sourceImg.width, useHeight, 0, 0, width, height);
  }

  var data1 = ctx1.getImageData(0, 0, width, height);
  var data2 = ctx2.getImageData(0, 0, width, height);

  var gray1 = toGrayscaleUint8(data1);
  var gray2 = toGrayscaleUint8(data2);
  var edges1 = detectEdges(gray1, width, height);
  var edges2 = detectEdges(gray2, width, height);

  canvas1Ref = canvas1;
  canvas2Ref = canvas2;

  var method = alignMethod.value;
  var methodName = document.getElementById('methodName');

  setTimeout(function() {
    var dx, dy;

    if (method === 'manual') {
      methodName.textContent = '方式: 手動調整';
      dx = parseInt(manualDx.value);
      dy = parseInt(manualDy.value);
    } else {
      var sw = Math.floor(width / s.downsampleScale);
      var sh = Math.floor(height / s.downsampleScale);

      var small1 = downsample(gray1, width, height, s.downsampleScale);
      var small2 = downsample(gray2, width, height, s.downsampleScale);
      var smallEdge1 = downsample(edges1, width, height, s.downsampleScale);
      var smallEdge2 = downsample(edges2, width, height, s.downsampleScale);

      var offset;
      switch (method) {
        case 'ncc':
          methodName.textContent = '方式: NCC (正規化相互相関)';
          offset = findOffsetNCC(small1, small2, sw, sh, s.maxShift);
          break;
        case 'ncc_edge':
          methodName.textContent = '方式: NCC + エッジ画像';
          offset = findOffsetNCC(smallEdge1, smallEdge2, sw, sh, s.maxShift);
          break;
        case 'sad':
          methodName.textContent = '方式: SAD (絶対差の和)';
          offset = findOffsetSAD(small1, small2, sw, sh, s.maxShift);
          break;
        case 'sad_edge':
          methodName.textContent = '方式: SAD + エッジ画像';
          offset = findOffsetSAD(smallEdge1, smallEdge2, sw, sh, s.maxShift);
          break;
        case 'center':
          methodName.textContent = '方式: 中央領域NCC';
          offset = findOffsetCenterNCC(small1, small2, sw, sh, s.maxShift);
          break;
        default:
          offset = { dx: 0, dy: 0, score: 0 };
      }

      dx = -offset.dx * s.downsampleScale;
      dy = -offset.dy * s.downsampleScale;
    }

    currentAutoOffset = { dx: dx, dy: dy };

    // Detect differences
    var diffMap = buildDiffMap(data1, data2, width, height, dx, dy, s.threshold, s.detectionMargin);
    var result = findConnectedComponents(diffMap, width, height, s.minClusterSize);
    var merged = mergeClusters(result.clusters, s.clusterMergeDistance);

    merged.sort(function(a, b) { return b.size - a.size; });
    var maxArea = width * height * 0.05;
    merged = merged.filter(function(c) { return c.size < maxArea && c.size > 30; });
    merged = merged.slice(0, s.maxRegions);

    status.textContent = '';

    if (method === 'manual') {
      isOverlayMode = true;
      toggleOverlayBtn.textContent = '🔄 点滅';
      manualControls.classList.add('visible');
      renderOverlay();
    } else {
      isOverlayMode = false;
      manualControls.classList.remove('visible');
      startBlinking();
    }
  }, 50);
}

// Blinking
function stopBlinking() {
  if (blinkInterval) {
    clearInterval(blinkInterval);
    blinkInterval = null;
  }
}

function startBlinking() {
  stopBlinking();

  var showFirst = true;
  var speed = settings.getValues().blinkSpeed;

  function render() {
    var dx = currentAutoOffset.dx;
    var dy = currentAutoOffset.dy;

    if (showFirst) {
      ctx.drawImage(canvas1Ref, 0, 0);
    } else {
      ctx.clearRect(0, 0, displayWidth, displayHeight);
      ctx.drawImage(canvas2Ref, dx, dy);
    }
    showFirst = !showFirst;
  }

  render();
  blinkInterval = setInterval(render, speed);
}
