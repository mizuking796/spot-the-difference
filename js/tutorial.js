// tutorial.js — チュートリアル制御（index.html / camera.html 共通）

function initTutorial(options) {
  const overlay = document.getElementById('tutorialOverlay');
  const nextBtn = document.getElementById('tutorialNext');
  const helpBtn = document.getElementById('helpBtn');
  const slides = document.querySelectorAll('.tutorial-slide');
  const dots = document.querySelectorAll('.tutorial-dot');
  const agreeCheck = document.getElementById('agreeCheck');
  const onClose = options.onClose || function() {};

  let currentSlide = 0;
  const totalSlides = slides.length;
  const seen = localStorage.getItem('tutorialSeen');

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.remove('active', 'prev');
      if (i === index) slide.classList.add('active');
      else if (i < index) slide.classList.add('prev');
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    if (index === totalSlides - 1) {
      nextBtn.textContent = '同意してはじめる 🎀';
      updateAgreeButton();
    } else {
      nextBtn.textContent = 'つぎへ →';
      nextBtn.classList.remove('disabled');
    }
  }

  function updateAgreeButton() {
    if (currentSlide === totalSlides - 1) {
      nextBtn.classList.toggle('disabled', !agreeCheck.checked);
    }
  }

  function close() {
    overlay.classList.add('hidden');
    localStorage.setItem('tutorialSeen', 'true');
    onClose();
  }

  function open() {
    currentSlide = 0;
    agreeCheck.checked = false;
    showSlide(0);
    overlay.classList.remove('hidden');
  }

  agreeCheck.addEventListener('change', updateAgreeButton);

  nextBtn.addEventListener('click', () => {
    if (currentSlide < totalSlides - 1) {
      currentSlide++;
      showSlide(currentSlide);
    } else if (agreeCheck.checked) {
      close();
    }
  });

  helpBtn.addEventListener('click', open);

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      currentSlide = i;
      showSlide(currentSlide);
    });
  });

  // Swipe support
  let touchStartX = 0;
  overlay.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  });
  overlay.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentSlide < totalSlides - 1) {
        currentSlide++;
        showSlide(currentSlide);
      } else if (diff < 0 && currentSlide > 0) {
        currentSlide--;
        showSlide(currentSlide);
      }
    }
  });

  if (seen) {
    overlay.classList.add('hidden');
  }

  return { open, close, isSeen: !!seen };
}
