// camera.js — camera.html メインロジック
// 依存: tutorial.js, image-processing.js

var video = document.getElementById('cameraVideo');
var canvas = document.getElementById('resultCanvas');
var ctx = canvas.getContext('2d');
var captureBtn = document.getElementById('captureBtn');
var status = document.getElementById('status');
var speedControl = document.getElementById('speedControl');
var speedSlider = document.getElementById('speed');
var guideV = document.getElementById('guideV');
var guideH = document.getElementById('guideH');
var controlsDiv = document.querySelector('.controls');
var loadingScreen = document.getElementById('loadingScreen');

var stream = null;
var isShowingResult = false;
var blinkInterval = null;
var canvas1 = null, canvas2 = null;
var splitDirection = 'horizontal';

// Tutorial
var tutorial = initTutorial({
  onClose: function() {
    status.innerHTML = '🎀 線を真ん中にしてね<br>📐 画面いっぱいに写そう';
  }
});

// Split direction toggle
document.querySelectorAll('.split-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.split-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    splitDirection = btn.dataset.dir;

    if (splitDirection === 'horizontal') {
      guideV.classList.remove('hidden');
      guideH.classList.add('hidden');
    } else {
      guideV.classList.add('hidden');
      guideH.classList.remove('hidden');
    }
  });
});

// Start camera
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    });
    video.srcObject = stream;

    video.onloadedmetadata = function() {
      loadingScreen.classList.add('hidden');
      if (tutorial.isSeen || document.getElementById('tutorialOverlay').classList.contains('hidden')) {
        status.innerHTML = '🎀 線を真ん中にしてね<br>📐 画面いっぱいに写そう';
      }
    };
  } catch (err) {
    document.getElementById('tutorialOverlay').classList.add('hidden');
    loadingScreen.querySelector('.loading-title').textContent = '😢 カメラエラー';
    loadingScreen.querySelector('.loading-hearts').innerHTML = '<span style="font-size:3rem;">📵</span>';
    loadingScreen.querySelector('.loading-bar-container').style.display = 'none';
    loadingScreen.querySelector('.loading-text').textContent = 'カメラへのアクセスを許可してね';
  }
}

// Reset to camera mode
function resetToCamera() {
  stopBlinking();
  video.style.display = 'block';
  canvas.style.display = 'none';
  guideV.classList.remove('hidden');
  if (splitDirection === 'vertical') {
    guideV.classList.add('hidden');
    guideH.classList.remove('hidden');
  }
  captureBtn.textContent = '📸';
  captureBtn.classList.remove('processing', 'small');
  controlsDiv.classList.remove('corner');
  speedControl.classList.remove('visible');
  document.getElementById('splitToggle').style.display = 'flex';
  isShowingResult = false;
}

// Capture and process
captureBtn.addEventListener('click', async function() {
  if (isShowingResult) {
    resetToCamera();
    status.innerHTML = '🎀 線を真ん中にしてね<br>📐 画面いっぱいに写そう';
    return;
  }

  status.textContent = '✨ 処理中...';
  captureBtn.textContent = '⏳';

  var w = video.videoWidth;
  var h = video.videoHeight;

  var captureCanvas = document.createElement('canvas');
  captureCanvas.width = w;
  captureCanvas.height = h;
  var captureCtx = captureCanvas.getContext('2d');
  captureCtx.drawImage(video, 0, 0);

  var isHorizontal = splitDirection === 'horizontal';
  var halfW = isHorizontal ? Math.floor(w / 2) : w;
  var halfH = isHorizontal ? h : Math.floor(h / 2);

  canvas1 = document.createElement('canvas');
  canvas2 = document.createElement('canvas');
  canvas1.width = canvas2.width = halfW;
  canvas1.height = canvas2.height = halfH;

  var ctx1 = canvas1.getContext('2d');
  var ctx2 = canvas2.getContext('2d');

  if (isHorizontal) {
    ctx1.drawImage(captureCanvas, 0, 0, halfW, halfH, 0, 0, halfW, halfH);
    ctx2.drawImage(captureCanvas, halfW, 0, halfW, halfH, 0, 0, halfW, halfH);
  } else {
    ctx1.drawImage(captureCanvas, 0, 0, halfW, halfH, 0, 0, halfW, halfH);
    ctx2.drawImage(captureCanvas, 0, halfH, halfW, halfH, 0, 0, halfW, halfH);
  }

  var gray1 = toGrayscaleFloat(ctx1.getImageData(0, 0, halfW, halfH));
  var gray2 = toGrayscaleFloat(ctx2.getImageData(0, 0, halfW, halfH));

  var scale = 4;
  var sw = Math.floor(halfW / scale);
  var sh = Math.floor(halfH / scale);
  var small1 = downsample(gray1, halfW, halfH, scale);
  var small2 = downsample(gray2, halfW, halfH, scale);

  var offset = findOffsetNCC(small1, small2, sw, sh, 25);
  var dx = -offset.dx * scale;
  var dy = -offset.dy * scale;

  canvas.width = halfW;
  canvas.height = halfH;

  guideV.classList.add('hidden');
  guideH.classList.add('hidden');
  video.style.display = 'none';
  canvas.style.display = 'block';
  captureBtn.textContent = '🔄';
  captureBtn.classList.add('processing', 'small');
  controlsDiv.classList.add('corner');
  speedControl.classList.add('visible');
  document.getElementById('splitToggle').style.display = 'none';
  isShowingResult = true;
  status.textContent = '🔍 さがしてみてね';

  startBlinking(dx, dy);
});

speedSlider.addEventListener('input', function() {
  if (isShowingResult && canvas1 && canvas2) {
    stopBlinking();
    startBlinking(parseInt(canvas.dataset.dx), parseInt(canvas.dataset.dy));
  }
});

function startBlinking(dx, dy) {
  canvas.dataset.dx = dx;
  canvas.dataset.dy = dy;

  var showFirst = true;
  var speed = 900 - parseInt(speedSlider.value);

  function render() {
    if (showFirst) {
      ctx.drawImage(canvas1, 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(canvas2, dx, dy);
    }
    showFirst = !showFirst;
  }

  render();
  blinkInterval = setInterval(render, speed);
}

function stopBlinking() {
  if (blinkInterval) {
    clearInterval(blinkInterval);
    blinkInterval = null;
  }
}

// Handle orientation change
var lastOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';

function handleOrientationChange() {
  var currentOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  if (currentOrientation === lastOrientation) return;
  lastOrientation = currentOrientation;

  if (isShowingResult) {
    resetToCamera();
    status.textContent = '🔄 向き変わったよ！撮り直してね';
    canvas1 = null;
    canvas2 = null;
  }
}

window.addEventListener('orientationchange', handleOrientationChange);
if (screen.orientation) screen.orientation.addEventListener('change', handleOrientationChange);
window.addEventListener('resize', function() {
  clearTimeout(window.resizeTimeout);
  window.resizeTimeout = setTimeout(handleOrientationChange, 100);
});

// Initialize
startCamera();
