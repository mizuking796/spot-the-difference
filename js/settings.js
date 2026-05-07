// settings.js — 設定モーダル・スライダー管理

var DEFAULT_SETTINGS = {
  blinkSpeed: 400,
  threshold: 45,
  downsampleScale: 4,
  maxShift: 25,
  dividerSearchRange: 50,
  detectionMargin: 15,
  minClusterSize: 30,
  clusterMergeDistance: 40,
  maxRegions: 10
};

function initSettings(onBlinkSpeedChange) {
  var modal = document.getElementById('settingsModal');
  var openBtn = document.getElementById('openSettingsBtn');
  var closeBtn = document.getElementById('closeSettingsBtn');
  var resetBtn = document.getElementById('resetSettingsBtn');

  var sliders = {
    blinkSpeed: document.getElementById('blinkSpeedSlider'),
    threshold: document.getElementById('thresholdSlider'),
    downsampleScale: document.getElementById('downsampleScale'),
    maxShift: document.getElementById('maxShift'),
    dividerSearchRange: document.getElementById('dividerSearchRange'),
    detectionMargin: document.getElementById('detectionMargin'),
    minClusterSize: document.getElementById('minClusterSize'),
    clusterMergeDistance: document.getElementById('clusterMergeDistance'),
    maxRegions: document.getElementById('maxRegions')
  };

  function updateDisplays() {
    document.getElementById('blinkSpeedValue').textContent = sliders.blinkSpeed.value + 'ms';
    document.getElementById('thresholdValue').textContent = sliders.threshold.value;
    document.getElementById('downsampleScaleValue').textContent = sliders.downsampleScale.value + 'x';
    document.getElementById('maxShiftValue').textContent = '±' + (sliders.maxShift.value * sliders.downsampleScale.value) + 'px';
    document.getElementById('dividerSearchRangeValue').textContent = '±' + sliders.dividerSearchRange.value + 'px';
    document.getElementById('detectionMarginValue').textContent = sliders.detectionMargin.value + 'px';
    document.getElementById('minClusterSizeValue').textContent = sliders.minClusterSize.value + 'px²';
    document.getElementById('clusterMergeDistanceValue').textContent = sliders.clusterMergeDistance.value + 'px';
    document.getElementById('maxRegionsValue').textContent = sliders.maxRegions.value;
  }

  // Modal open/close
  openBtn.addEventListener('click', function() { modal.classList.add('visible'); });
  closeBtn.addEventListener('click', function() { modal.classList.remove('visible'); });
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.classList.remove('visible');
  });

  // Reset
  resetBtn.addEventListener('click', function() {
    sliders.blinkSpeed.value = DEFAULT_SETTINGS.blinkSpeed;
    sliders.threshold.value = DEFAULT_SETTINGS.threshold;
    sliders.downsampleScale.value = DEFAULT_SETTINGS.downsampleScale;
    sliders.maxShift.value = DEFAULT_SETTINGS.maxShift;
    sliders.dividerSearchRange.value = DEFAULT_SETTINGS.dividerSearchRange;
    sliders.detectionMargin.value = DEFAULT_SETTINGS.detectionMargin;
    sliders.minClusterSize.value = DEFAULT_SETTINGS.minClusterSize;
    sliders.clusterMergeDistance.value = DEFAULT_SETTINGS.clusterMergeDistance;
    sliders.maxRegions.value = DEFAULT_SETTINGS.maxRegions;
    updateDisplays();
  });

  // Individual slider listeners
  sliders.blinkSpeed.addEventListener('input', function() {
    document.getElementById('blinkSpeedValue').textContent = sliders.blinkSpeed.value + 'ms';
    if (onBlinkSpeedChange) onBlinkSpeedChange();
  });

  sliders.threshold.addEventListener('input', function() {
    document.getElementById('thresholdValue').textContent = sliders.threshold.value;
  });

  sliders.downsampleScale.addEventListener('input', function() {
    document.getElementById('downsampleScaleValue').textContent = sliders.downsampleScale.value + 'x';
    document.getElementById('maxShiftValue').textContent = '±' + (sliders.maxShift.value * sliders.downsampleScale.value) + 'px';
  });

  sliders.maxShift.addEventListener('input', function() {
    document.getElementById('maxShiftValue').textContent = '±' + (sliders.maxShift.value * sliders.downsampleScale.value) + 'px';
  });

  sliders.dividerSearchRange.addEventListener('input', function() {
    document.getElementById('dividerSearchRangeValue').textContent = '±' + sliders.dividerSearchRange.value + 'px';
  });

  sliders.detectionMargin.addEventListener('input', function() {
    document.getElementById('detectionMarginValue').textContent = sliders.detectionMargin.value + 'px';
  });

  sliders.minClusterSize.addEventListener('input', function() {
    document.getElementById('minClusterSizeValue').textContent = sliders.minClusterSize.value + 'px²';
  });

  sliders.clusterMergeDistance.addEventListener('input', function() {
    document.getElementById('clusterMergeDistanceValue').textContent = sliders.clusterMergeDistance.value + 'px';
  });

  sliders.maxRegions.addEventListener('input', function() {
    document.getElementById('maxRegionsValue').textContent = sliders.maxRegions.value;
  });

  return {
    getValues: function() {
      return {
        blinkSpeed: parseInt(sliders.blinkSpeed.value),
        threshold: parseInt(sliders.threshold.value),
        downsampleScale: parseInt(sliders.downsampleScale.value),
        maxShift: parseInt(sliders.maxShift.value),
        dividerSearchRange: parseInt(sliders.dividerSearchRange.value),
        detectionMargin: parseInt(sliders.detectionMargin.value),
        minClusterSize: parseInt(sliders.minClusterSize.value),
        clusterMergeDistance: parseInt(sliders.clusterMergeDistance.value),
        maxRegions: parseInt(sliders.maxRegions.value)
      };
    }
  };
}
