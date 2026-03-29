// Service Worker Registration and Install Prompt Handler
let deferredPrompt;
const installBanner = document.getElementById('installBanner');
const installAccept = document.getElementById('installAccept');
const installDismiss = document.getElementById('installDismiss');

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, prompt user to refresh
              console.log('New content available; please refresh.');
            }
          });
        });
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// Handle beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Don't show install banner if user previously dismissed it (check within last 7 days)
  const dismissedTime = localStorage.getItem('installBannerDismissed');
  if (dismissedTime) {
    const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
    if (daysSinceDismissed < 7) {
      return;
    }
  }
  
  // Show install banner after 3 seconds
  setTimeout(() => {
    if (installBanner) {
      installBanner.classList.add('show');
    }
  }, 3000);
});

// Handle install button click
if (installAccept) {
  installAccept.addEventListener('click', async () => {
    if (!deferredPrompt) {
      return;
    }
    
    // Hide the install banner
    installBanner.classList.remove('show');
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // Clear the deferredPrompt
    deferredPrompt = null;
  });
}

// Handle dismiss button click
if (installDismiss) {
  installDismiss.addEventListener('click', () => {
    // Hide the install banner
    installBanner.classList.remove('show');
    
    // Save dismissal timestamp
    localStorage.setItem('installBannerDismissed', Date.now().toString());
  });
}

// Handle appinstalled event
window.addEventListener('appinstalled', (event) => {
  console.log('Tangle-me PWA was installed successfully!');
  
  // Hide the install banner if it's still showing
  if (installBanner) {
    installBanner.classList.remove('show');
  }
  
  // Clear the deferredPrompt
  deferredPrompt = null;
  
  // Optional: Track install event with analytics
  // gtag('event', 'install', { 'app_name': 'Tangle-me' });
});

// Detect if app is running in standalone mode
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
  console.log('Tangle-me is running in standalone mode (installed)');
  // You can add special behavior for installed app here
}
