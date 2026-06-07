const CONFIG = {
  title: 'Install Sleep Diary',
  skipButtonText: "Don't install",
  installButtonText: 'Install As an App',
  unavailableText: 'Not available',
  iosTitle: 'Install Sleep Diary',
  iosStep1: 'Click the share icon in the browser address bar',
  iosStep2: "Click 'Add to Home Screen'",
};

function createStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .pwa-modal-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      justify-content: center;
      align-items: center;
      z-index: 99999;
    }
    
    .pwa-modal-overlay.active {
      display: flex;
    }
    
    .pwa-modal-content {
      background: #fff;
      border-radius: 10px;
      padding: 20px;
      min-width: 340px;
      max-width: 340px;
      box-sizing: border-box;
    }
    
    .pwa-modal-content h1 {
      font-size: 18px;
      margin: 0 0 10px 0;
    }
    
    .pwa-modal-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }
    
    .pwa-modal-logo {
      width: 64px;
      height: 64px;
      border-radius: 8px;
    }
    
    .pwa-install-button {
      width: 100%;
      padding: 10px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: 0.3s;
      margin-bottom: 20px;
    }
    
    .pwa-install-button:hover:not(:disabled) {
      background: #0056b3;
    }
    
    .pwa-install-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    .pwa-skip-button {
      background: none;
      border: none;
      color: #a0a0a0;
      font-size: 14px;
      text-decoration: underline;
      cursor: pointer;
      font-family: inherit;
    }
    
    .pwa-ios-steps {
      margin: 10px 0;
      padding-left: 20px;
    }
  `;
  document.head.appendChild(style);
}

function getFavicon() {
  const links = document.querySelectorAll('link[rel="icon"]');
  if (links.length > 0) {
    return links[0].href;
  }
  return '';
}

function createModal(isIOS) {
  const modal = document.createElement('div');
  modal.id = 'pwa-install-modal';
  modal.className = 'pwa-modal-overlay';

  if (isIOS) {
    modal.innerHTML = `
      <div class="pwa-modal-content">
        <div class="pwa-modal-body">
          <h1>${CONFIG.iosTitle}</h1>
          <img class="pwa-modal-logo" alt="app logo" />
          <h2 id="pwa-app-name"></h2>
        </div>
        <ol class="pwa-ios-steps">
          <li>${CONFIG.iosStep1}</li>
          <li>${CONFIG.iosStep2}</li>
        </ol>
        <button class="pwa-skip-button" id="pwa-skip-btn">${CONFIG.skipButtonText}</button>
      </div>
    `;
  } else {
    modal.innerHTML = `
      <div class="pwa-modal-content">
        <div class="pwa-modal-body">
          <h1>${CONFIG.title}</h1>
          <img class="pwa-modal-logo" alt="app logo" />
          <h2 id="pwa-app-name"></h2>
        </div>
        <button class="pwa-install-button" id="pwa-install-btn" disabled>${CONFIG.unavailableText}</button>
        <button class="pwa-skip-button" id="pwa-skip-btn">${CONFIG.skipButtonText}</button>
      </div>
    `;
  }

  document.body.appendChild(modal);
  return modal;
}

function closeModal() {
  const modal = document.getElementById('pwa-install-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function openModal() {
  const modal = document.getElementById('pwa-install-modal');
  if (modal) {
    modal.classList.add('active');
  }
}

function init() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isRunningAsPWA =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  // Don't show if already installed
  if (isRunningAsPWA) {
    return;
  }

  createStyles();
  const modal = createModal(isIOS);

  // Set app info
  const logoImg = modal.querySelector('.pwa-modal-logo');
  const nameEl = modal.querySelector('#pwa-app-name');
  logoImg.src = getFavicon();
  nameEl.textContent = document.title;

  // Set up close button
  const skipBtn = modal.querySelector('#pwa-skip-btn');
  skipBtn.addEventListener('click', closeModal);

  // Prevent modal close when clicking content
  const content = modal.querySelector('.pwa-modal-content');
  content.addEventListener('click', (e) => e.stopPropagation());

  // Close modal on background click
  modal.addEventListener('click', closeModal);

  // Handle install button for non-iOS
  if (!isIOS) {
    const installBtn = modal.querySelector('#pwa-install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      const deferredPrompt = e;

      installBtn.textContent = CONFIG.installButtonText;
      installBtn.disabled = false;

      installBtn.addEventListener('click', async () => {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          closeModal();
        }

        deferredPrompt = null;
      });
    });

    // Timeout for browsers that don't support beforeinstallprompt
    setTimeout(() => {
      if (installBtn.disabled && installBtn.textContent === CONFIG.unavailableText) {
        // Still unavailable after timeout
      }
    }, 1000);
  }

  // Hash-based modal control
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#pwa-install') {
      openModal();
    } else {
      closeModal();
    }
  });

  // Open modal if hash is set on load
  if (window.location.hash === '#pwa-install') {
    openModal();
  }

  console.log('PWA Install Prompt initialized');
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
