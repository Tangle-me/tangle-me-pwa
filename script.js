function updateCharCounter(e, t, n) {
    const o = document.getElementById(e),
        s = document.getElementById(t);
    if (o && s) {
        const e = o.value.length;
        s.textContent = `${e}/${n}`
    }
}

function formatCoordinates(e, t) {
    return `${e.toFixed(4)}°, ${t.toFixed(4)}°`
}

function getFriendlyLocationName(e) {
    if (!e || !e.address) return null;
    const t = e.address,
        n = [],
        o = t.suburb || t.village || t.town || t.city || t.municipality || t.county || t.district || t.neighbourhood || t.hamlet,
        s = t.state || t.province || t.region || t.state_district,
        a = t.country;
    return "ocean" === e.type || "sea" === e.type || e.display_name && e.display_name.toLowerCase().includes("ocean") ? `Somewhere in the ${e.display_name||"Ocean"}` : (o && n.push(o), s && s !== o && n.push(s), a && n.push(a), n.length > 0 ? `Near ${n.join(", ")}` : null)
}
async function reverseGeocode(e, t) {
    try {
        const n = `/api/geocode.php?lat=${e}&lng=${t}`,
            o = await fetch(n);
        if (!o.ok) throw new Error(`HTTP error! status: ${o.status}`);
        const s = await o.json();
        if (s.error) throw new Error(s.error);
        return s.friendly_name || (s.friendly_name = getFriendlyLocationName(s)), s
    } catch (n) {
        return console.error("Reverse geocoding error:", n), {
            display_name: `${e.toFixed(6)}, ${t.toFixed(6)}`,
            lat: e,
            lon: t,
            friendly_name: `Location at ${formatCoordinates(e,t)}`
        }
    }
}

function copyCoordinates(e, t) {
    const n = `${e}, ${t}`;
    navigator.clipboard.writeText(n).then(() => {
        showSuccess("Coordinates copied! Paste in Google Maps, Here Maps, etc.")
    }).catch(e => {
        const t = document.createElement("textarea");
        t.value = n, document.body.appendChild(t), t.select(), document.execCommand("copy"), document.body.removeChild(t), showSuccess("Coordinates copied!")
    })
}
let deferredPrompt;
console.log("✅ STRICT SEARCH ACTIVE - v2.0"), console.log("=== TANGLE-ME v4.3.7 HEADER + BUILD 011 ==="), console.log("Leaflet loaded:", "undefined" != typeof L), "serviceWorker" in navigator ? window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").then(e => {
        console.log("✅ Service Worker registered:", e.scope), window.swRegistration = e, e.addEventListener("updatefound", () => {
            const t = e.installing;
            console.log("🔄 New service worker found"), t.addEventListener("statechange", () => {
                "installed" === t.state && navigator.serviceWorker.controller && console.log("🆕 New content available, please refresh")
            })
        }), currentUser && currentUser.id && subscribeToPush(e)
    }).catch(e => {
        console.log("❌ Service Worker registration failed:", e)
    }), navigator.serviceWorker.addEventListener("message", e => {
        e.data && "OPEN_MESSAGES" === e.data.type && openMessages()
    })
}) : console.log("⚠️ Service Worker not supported in this browser"), window.addEventListener("load", () => {
    "open_messages" === new URLSearchParams(window.location.search).get("action") && (window.history.replaceState({}, "", "/"), setTimeout(() => {
        currentUser && openMessages()
    }, 1500))
});
const PWA_INSTALL_DISMISSED_KEY = "tangleme_pwa_install_dismissed",
    PWA_INSTALL_DISMISSED_TIME_KEY = "tangleme_pwa_install_dismissed_time",
    PWA_INSTALLED_KEY = "tangleme_pwa_installed",
    PWA_REMINDER_DAYS = 7;

function getDeviceInfo() {
    const e = navigator.userAgent,
        t = /iPad|iPhone|iPod/.test(e) && !window.MSStream,
        n = /Android/.test(e),
        o = t || n || /webOS|BlackBerry|IEMobile|Opera Mini/i.test(e) || window.innerWidth <= 768,
        s = !o,
        a = /Chrome/.test(e) && /Google Inc/.test(navigator.vendor),
        r = /Safari/.test(e) && /Apple Computer/.test(navigator.vendor),
        i = /Firefox/.test(e),
        l = /Edg/.test(e);
    return {
        isMobile: o,
        isDesktop: s,
        isIOS: t,
        isAndroid: n,
        isChrome: a,
        isSafari: r,
        isFirefox: i,
        isEdge: l,
        supportsInstallPrompt: a || l || n && !r
    }
}

function isPWAInstalled() {
    return window.matchMedia("(display-mode: standalone)").matches ? (console.log("📱 PWA detected: Running in standalone mode"), !0) : !0 === window.navigator.standalone ? (console.log("📱 PWA detected: iOS standalone mode"), !0) : "true" === localStorage.getItem(PWA_INSTALLED_KEY) ? (console.log("📱 PWA detected: Marked as installed in localStorage"), !0) : window.matchMedia("(display-mode: fullscreen)").matches ? (console.log("📱 PWA detected: Running in fullscreen mode"), !0) : !!window.matchMedia("(display-mode: minimal-ui)").matches && (console.log("📱 PWA detected: Running in minimal-ui mode"), !0)
}

function shouldShowInstallReminder() {
    const e = localStorage.getItem(PWA_INSTALL_DISMISSED_TIME_KEY);
    return !e || (Date.now() - parseInt(e)) / 864e5 >= 7
}
window.addEventListener("beforeinstallprompt", e => {
    console.log("📱 PWA Install prompt available"), e.preventDefault(), deferredPrompt = e, isPWAInstalled() ? console.log("📱 PWA already installed - not showing prompt") : shouldShowInstallReminder() && setTimeout(() => {
        showInstallBanner()
    }, 3e3)
}), window.addEventListener("appinstalled", () => {
    console.log("✅ PWA was installed"), localStorage.setItem(PWA_INSTALLED_KEY, "true"), hideInstallBanner()
});
let installBannerTimer = null;

function showInstallBanner() {
    if (isPWAInstalled()) return void console.log("📱 Already installed - not showing banner");
    const e = getDeviceInfo(),
        t = document.getElementById("pwaInstallBanner");
    if (!t) return;
    const n = t.querySelector(".pwa-install-title"),
        o = t.querySelector(".pwa-install-subtitle"),
        s = t.querySelector(".pwa-install-btn");
    e.isIOS ? (n && (n.textContent = "Install Tangle-me"), o && (o.textContent = "Tap Share → Add to Home Screen"), s && (s.textContent = "Show Me How"), console.log("📱 Showing iOS-specific install prompt")) : e.isMobile && !e.supportsInstallPrompt ? (n && (n.textContent = "Install Tangle-me"), o && (o.textContent = "Add to Home Screen for better experience"), s && (s.textContent = "Show Me How"), console.log("📱 Showing mobile-specific install prompt")) : e.isDesktop ? (n && (n.textContent = "Install Tangle-me"), o && (o.textContent = "Install as desktop app for faster access"), s && (s.textContent = "Install Now"), console.log("💻 Showing desktop-specific install prompt")) : (n && (n.textContent = "Install Tangle-me"), o && (o.textContent = "Add to your home screen for quick access"), s && (s.textContent = "Install"), console.log("📱 Showing standard install prompt")), t.style.display = "block", document.body.style.paddingBottom = "90px", clearTimeout(installBannerTimer), installBannerTimer = setTimeout(() => {
        hideInstallBanner(), console.log("⏱️ Install banner auto-dismissed")
    }, 15e3)
}

function hideInstallBanner() {
    const e = document.getElementById("pwaInstallBanner");
    e && (e.style.display = "none", document.body.style.paddingBottom = "0"), clearTimeout(installBannerTimer)
}
async function handleInstallClick() {
    const e = getDeviceInfo();
    if (e.isIOS) {
        hideInstallBanner();
        const e = document.createElement("div");
        return e.className = "modal show", e.id = "iosInstallModal", e.innerHTML = '\n                    <div class="modal-content" style="max-width: 400px;">\n                        <button class="modal-close" onclick="this.closest(\'.modal\').remove()">×</button>\n                        <h2 style="text-align: center; margin-bottom: 1rem;">📱 Install on iOS</h2>\n                        \n                        <div style="text-align: left; line-height: 1.8; color: #4a5568;">\n                            <p style="margin-bottom: 1rem;">To install Tangle-me on your iPhone/iPad:</p>\n                            \n                            <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem;">\n                                <strong>1.</strong> Tap the <span style="background: #667eea; color: white; padding: 0.2rem 0.5rem; border-radius: 4px;">Share</span> button below ↓\n                            </div>\n                            \n                            <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem;">\n                                <strong>2.</strong> Scroll down and tap <strong>"Add to Home Screen"</strong>\n                            </div>\n                            \n                            <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">\n                                <strong>3.</strong> Tap <strong>"Add"</strong> to confirm\n                            </div>\n                            \n                            <p style="font-size: 0.85rem; color: #718096; text-align: center;">\n                                ✨ The app icon will appear on your home screen\n                            </p>\n                        </div>\n                        \n                        <button class="btn-primary" style="width: 100%; margin-top: 1rem;" onclick="this.closest(\'.modal\').remove(); dismissInstallBanner();">\n                            Got It\n                        </button>\n                    </div>\n                ', void document.body.appendChild(e)
    }
    if (!deferredPrompt) {
        console.log("❌ Install prompt not available"), hideInstallBanner();
        const t = document.createElement("div");
        t.className = "modal show", t.id = "installInstructionsModal";
        let n = "";
        return n = e.isDesktop && e.isChrome ? '\n                        <p style="margin-bottom: 1rem;">To install Tangle-me on Chrome:</p>\n                        <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem;">\n                            <strong>1.</strong> Click the <strong>⋮</strong> menu (top right)\n                        </div>\n                        <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem;">\n                            <strong>2.</strong> Click <strong>"Install Tangle-me"</strong>\n                        </div>\n                        <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">\n                            <strong>3.</strong> Click <strong>"Install"</strong> to confirm\n                        </div>\n                    ' : e.isDesktop && e.isEdge ? '\n                        <p style="margin-bottom: 1rem;">To install Tangle-me on Edge:</p>\n                        <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem;">\n                            <strong>1.</strong> Click the <strong>⋯</strong> menu (top right)\n                        </div>\n                        <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem;">\n                            <strong>2.</strong> Hover over <strong>"Apps"</strong>\n                        </div>\n                        <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">\n                            <strong>3.</strong> Click <strong>"Install Tangle-me"</strong>\n                        </div>\n                    ' : e.isAndroid ? '\n                        <p style="margin-bottom: 1rem;">To install Tangle-me on Android:</p>\n                        <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem;">\n                            <strong>1.</strong> Tap the <strong>⋮</strong> menu\n                        </div>\n                        <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem;">\n                            <strong>2.</strong> Tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>\n                        </div>\n                        <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">\n                            <strong>3.</strong> Tap <strong>"Install"</strong>\n                        </div>\n                    ' : '\n                        <p style="margin-bottom: 1rem;">To install Tangle-me:</p>\n                        <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem;">\n                            <strong>1.</strong> Open your browser menu (⋮ or ⋯)\n                        </div>\n                        <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem;">\n                            <strong>2.</strong> Look for <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>\n                        </div>\n                        <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">\n                            <strong>3.</strong> Follow the prompts\n                        </div>\n                    ', t.innerHTML = `\n                    <div class="modal-content" style="max-width: 400px;">\n                        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>\n                        <h2 style="text-align: center; margin-bottom: 1rem;">💻 Install Tangle-me</h2>\n                        <div style="text-align: left; line-height: 1.8; color: #4a5568;">\n                            ${n}\n                            <p style="font-size: 0.85rem; color: #718096; text-align: center;">\n                                ✨ Access Tangle-me faster without opening your browser\n                            </p>\n                        </div>\n                        <button class="btn-primary" style="width: 100%; margin-top: 1rem;" onclick="this.closest('.modal').remove(); dismissInstallBanner();">\n                            Got It\n                        </button>\n                    </div>\n                `, document.body.appendChild(t), void dismissInstallBanner()
    }
    hideInstallBanner(), deferredPrompt.prompt();
    const {
        outcome: t
    } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${t}`), "accepted" === t && (console.log("✅ User accepted the install prompt"), localStorage.setItem(PWA_INSTALLED_KEY, "true")), localStorage.setItem(PWA_INSTALL_DISMISSED_TIME_KEY, Date.now().toString()), deferredPrompt = null
}

function dismissInstallBanner() {
    hideInstallBanner(), localStorage.setItem(PWA_INSTALL_DISMISSED_TIME_KEY, Date.now().toString()), console.log("❌ User dismissed install banner - will remind in 7 days")
}
window.addEventListener("load", () => {
    const e = getDeviceInfo(),
        t = isPWAInstalled();
    console.log("📱 PWA Install Check:", {
        installed: t,
        device: e.isMobile ? "Mobile" : "Desktop",
        platform: e.isIOS ? "iOS" : e.isAndroid ? "Android" : "Other",
        browser: e.isChrome ? "Chrome" : e.isSafari ? "Safari" : e.isEdge ? "Edge" : e.isFirefox ? "Firefox" : "Other",
        supportsInstallPrompt: e.supportsInstallPrompt,
        shouldRemind: shouldShowInstallReminder()
    }), t ? console.log("📱 PWA already installed - not showing banner") : shouldShowInstallReminder() && setTimeout(() => {
        isPWAInstalled() || (console.log("📱 Showing install banner (delayed)"), showInstallBanner())
    }, 5e3)
});
let userLocationData = {
        country: "",
        countryCode: "",
        flag: ""
    },
    itemLocationData = {
        address: "",
        latitude: null,
        longitude: null
    },
    map = null,
    marker = null,
    currentSessionId = "",
    mapSearch = null,
    markerSearch = null,
    searchLocation = {
        address: "",
        latitude: null,
        longitude: null
    },
    selectedRadius = null,
    isSearchActive = !1,
    isMobileDevice = !1,
    currentUser = null,
    savedTangles = [],
    currentMessageTab = "inbox",
    messageEditMode = !1,
    lastKnownUnreadCount = -1,
    toastDismissTimer = null;
const VAPID_PUBLIC_KEY = "BDydEFL0fVwcPLsLUQM8tQKN07yFb324E1w8_RqJxUBLHWseBzmKwAJWjZvuFhSHSOXAABSEMA-HWF2ykEczILw";
let pushSubscription = null,
    currentEditAdId = null,
    currentEditNoteUserId = null,
    currentSendMessageAdId = null,
    currentSendMessageKeywords = null,
    currentSendMessageReceiverId = null,
    detectedCountry = null,
    generatedUsername = "",
    customValidationTimeout = null,
    userSubscription = {
        tier: "free",
        price: 0,
        photos_used: 0,
        photos_limit: 0,
        status: "active",
        started_at: null,
        expires_at: null,
        auto_renew: !0,
        payment_confirmed: !1
    },
    selectedPlan = "pro",
    uploadedPhotos = [],
    userPhotoCount = 0,
    userPhotoLimit = 0;

// ========== UPLOAD PROGRESS TRACKER (Build 024) ==========
let photosUploading = 0, photosUploadTotal = 0;

function updateUploadProgress() {
    let overlay = document.getElementById("uploadProgressOverlay");
    const submitBtn = document.getElementById("submitBtn");

    if (photosUploading > 0) {
        // Disable Post button
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Uploading photos..."; }

        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "uploadProgressOverlay";
            overlay.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.55);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;";
            overlay.innerHTML = `
                <div style="background:white;border-radius:16px;padding:2rem 2.5rem;text-align:center;max-width:320px;width:85%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                    <div id="uploadSpinner" style="width:56px;height:56px;border:5px solid #e2e8f0;border-top:5px solid #3b82f6;border-radius:50%;margin:0 auto 1rem;animation:uploadSpin 0.8s linear infinite;"></div>
                    <div id="uploadProgressText" style="font-size:1.1rem;font-weight:700;color:#2d3748;margin-bottom:0.5rem;">Uploading photos...</div>
                    <div id="uploadProgressCount" style="font-size:0.9rem;color:#718096;margin-bottom:1rem;">0 / 0</div>
                    <div style="width:100%;height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden;">
                        <div id="uploadProgressBar" style="height:100%;background:linear-gradient(90deg,#3b82f6,#8b5cf6);border-radius:4px;transition:width 0.3s ease;width:0%;"></div>
                    </div>
                </div>
            `;
            // Add spinner animation if not already present
            if (!document.getElementById("uploadSpinStyle")) {
                const style = document.createElement("style");
                style.id = "uploadSpinStyle";
                style.textContent = "@keyframes uploadSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}";
                document.head.appendChild(style);
            }
            document.body.appendChild(overlay);
        }

        const done = photosUploadTotal - photosUploading;
        const pct = photosUploadTotal > 0 ? Math.round((done / photosUploadTotal) * 100) : 0;
        const countEl = document.getElementById("uploadProgressCount");
        const barEl = document.getElementById("uploadProgressBar");
        const textEl = document.getElementById("uploadProgressText");
        if (countEl) countEl.textContent = `${done} / ${photosUploadTotal} photos`;
        if (barEl) barEl.style.width = pct + "%";
        if (textEl) textEl.textContent = done < photosUploadTotal ? "Uploading photos..." : "Almost done...";
    } else {
        // Re-enable Post button
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Post Ad"; }
        if (overlay) { overlay.remove(); }
        photosUploadTotal = 0;
    }
}

// Client-side image compression — shrinks before upload (much faster!)
async function compressImageFile(file, maxDim, quality) {
    maxDim = maxDim || 1920;
    quality = quality || 0.82;
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            let w = img.width, h = img.height;
            if (w <= maxDim && h <= maxDim && file.size < 1048576) {
                // Already small enough, skip compression
                URL.revokeObjectURL(img.src);
                return resolve(file);
            }
            if (w > maxDim || h > maxDim) {
                if (w >= h) { h = Math.round(h * (maxDim / w)); w = maxDim; }
                else { w = Math.round(w * (maxDim / h)); h = maxDim; }
            }
            const canvas = document.createElement("canvas");
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, w, h);
            URL.revokeObjectURL(img.src);
            canvas.toBlob(function(blob) {
                if (!blob) return resolve(file);
                const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
                console.log(`📸 Compressed ${file.name}: ${(file.size/1024).toFixed(0)}KB → ${(compressed.size/1024).toFixed(0)}KB`);
                resolve(compressed);
            }, "image/jpeg", quality);
        };
        img.onerror = () => resolve(file); // fallback to original on error
        img.src = URL.createObjectURL(file);
    });
}
async function handleUrlParameters() {
    const e = new URLSearchParams(window.location.search),
        t = e.get("contact"),
        n = e.get("save"),
        action = e.get("action");
    // Handle PWA shortcut actions
    if (action) {
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(function() {
            if (action === 'post') openPostModal();
            else if (action === 'search') window.location.href = '/find.html';
            else if (action === 'myads') openMyAdsModal();
        }, 800);
        return;
    }
    // Handle upgrade redirect from post.html
    const upgradePlan = e.get("openUpgrade");
    if (upgradePlan) {
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(function() {
            if (typeof openUpgradeModal === 'function') openUpgradeModal(upgradePlan);
        }, 1000);
        return;
    }
    // Handle Smart Upload redirect from post.html
    const smartUpload = e.get("openSmartUpload");
    if (smartUpload) {
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(function() {
            if (typeof openBulkUploadModal === 'function') openBulkUploadModal();
        }, 1000);
        return;
    }
    (t || n) && window.history.replaceState({}, document.title, window.location.pathname), t && (console.log("🔔 Contact request for ad:", t), setTimeout(() => {
        handleContactFromShare(parseInt(t))
    }, 500)), n && (console.log("⭐ Save request for ad:", n), setTimeout(() => {
        handleSaveFromShare(parseInt(n))
    }, 500))
}
async function handleContactFromShare(e) {
    if (!currentUser) return alert("Please log in to contact the advertiser"), openLoginModal(), void localStorage.setItem("tangleme_pending_contact", e);
    try {
        const t = await fetch(`/api/get-ad.php?id=${e}`, {
                credentials: "include"
            }),
            n = await t.json();
        if (n.success && n.data) {
            const t = n.data;
            if (String(t.user_id) === String(currentUser.id)) return void showSuccess("This is your own ad! 📝");
            showAdWithMessageOption(t, e)
        } else alert("Ad not found or no longer available")
    } catch (e) {
        console.error("Error fetching ad for contact:", e), alert("Could not load ad details. Please try again.")
    }
}

function showAdWithMessageOption(e, t) {
    let n = [];
    if (e.photos) try {
        n = "string" == typeof e.photos ? JSON.parse(e.photos) : e.photos, n = n.filter(e => e && (e.full || e.url || e.thumb || e.thumbnail))
    } catch (e) {
        console.error("Error parsing photos:", e)
    }
    let o = "";
    n.length > 0 && (o = `\n                    <div style="width: 100%; height: 200px; border-radius: 12px; overflow: hidden; margin-bottom: 1rem;">\n                        <img src="${n[0].full||n[0].url||n[0].thumb||n[0].thumbnail||"/api/placeholder-image.php"}" alt="Ad photo" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/api/placeholder-image.php'">\n                    </div>\n                `, n.length > 1 && (o += `<div style="font-size: 0.85rem; color: #718096; margin-bottom: 1rem; text-align: center;">+${n.length-1} more photo${n.length>2?"s":""}</div>`));
    const s = document.createElement("div");
    s.className = "modal show", s.id = "sharedAdModal", s.innerHTML = `\n                <div class="modal-content" style="max-width: 500px; max-height: 85vh; overflow-y: auto;">\n                    <button class="modal-close" onclick="document.getElementById('sharedAdModal').remove()">×</button>\n                    \n                    <h2 style="text-align: center; margin-bottom: 0.5rem; font-size: 1.1rem;">📋 Ad Details</h2>\n                    <p style="text-align: center; color: #718096; font-size: 0.85rem; margin-bottom: 1rem;">Ad #${t}</p>\n                    \n                    ${o}\n                    \n                    <div style="background: #f7fafc; padding: 1rem; border-radius: 10px; margin-bottom: 1rem;">\n                        <div style="font-weight: 700; color: #2d3748; font-size: 1rem; margin-bottom: 0.5rem;">\n                            ${escapeHtml(e.keywords||"No title")}\n                        </div>\n                        ${e.description?`<div style="color: #4a5568; font-size: 0.9rem; line-height: 1.5; margin-bottom: 0.75rem;">${escapeHtml(e.description)}</div>`:""}\n                        ${e.location_address?`<div style="color: #718096; font-size: 0.85rem;">📍 ${escapeHtml(e.location_address)}</div>`:""}\n                    </div>\n                    \n                    <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%); border-radius: 10px; margin-bottom: 1rem;">\n                        <span class="fi fi-${(e.country_code||"za").toLowerCase()}" style="font-size: 1.5rem;"></span>\n                        <div>\n                            <div style="font-weight: 600; color: #2d3748;">${escapeHtml(e.username||"Anonymous")}</div>\n                            <div style="font-size: 0.8rem; color: #718096;">Advertiser</div>\n                        </div>\n                    </div>\n                    \n                    <button class="btn-primary" style="width: 100%; padding: 1rem; font-size: 1rem;" onclick="document.getElementById('sharedAdModal').remove(); sendMessageToAd(${t}, '${escapeJsString(e.username||"Advertiser")}', '${escapeJsString(e.keywords||"Ad")}', ${e.user_id})">\n                        💬 Send Message to Advertiser\n                    </button>\n                    \n                    <button class="btn-secondary" style="width: 100%; margin-top: 0.5rem;" onclick="document.getElementById('sharedAdModal').remove()">\n                        Close\n                    </button>\n                </div>\n            `, document.body.appendChild(s)
}
async function handleSaveFromShare(e) {
    if (!currentUser) return alert("Please log in to save ads"), openLoginModal(), void localStorage.setItem("tangleme_pending_save", e);
    try {
        const t = await fetch(`/api/get-ad.php?id=${e}`, {
                credentials: "include"
            }),
            n = await t.json();
        if (n.success && n.data) {
            const t = n.data;
            if (savedTangles.some(e => String(e.saved_user_id) === String(t.user_id))) return showSuccess("Already in My Tangles! ⭐"), void openMyTangles();
            const o = await fetch("/api/save-tangle.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        saved_user_id: t.user_id,
                        ad_id: e,
                        notes: ""
                    })
                }),
                s = await o.json();
            s.success ? (await loadSavedTangles(), showSuccess("Saved to My Tangles! ⭐"), openMyTangles()) : alert("Error: " + (s.error || "Failed to save"))
        } else alert("Ad not found or no longer available")
    } catch (e) {
        console.error("Error saving ad:", e), alert("Could not save ad. Please try again.")
    }
}
async function handlePendingActions() {
    const e = localStorage.getItem("tangleme_pending_contact"),
        t = localStorage.getItem("tangleme_pending_save");
    e && (localStorage.removeItem("tangleme_pending_contact"), setTimeout(() => {
        handleContactFromShare(parseInt(e))
    }, 500)), t && (localStorage.removeItem("tangleme_pending_save"), setTimeout(() => {
        handleSaveFromShare(parseInt(t))
    }, 500))
}

// ─── FIND.HTML SEARCH HANDLER (reads sessionStorage set by find.html) ───
function handleFindSearchParams() {
    var raw = sessionStorage.getItem('tangleme_find_search');
    if (!raw) return;
    
    // Remove immediately so it doesn't re-trigger on refresh
    sessionStorage.removeItem('tangleme_find_search');
    
    var search;
    try { search = JSON.parse(raw); } catch(e) { return; }
    
    var keyword = search.keyword || '';
    var lat = parseFloat(search.lat) || 0;
    var lng = parseFloat(search.lng) || 0;
    var radius = parseInt(search.radius);
    var address = search.address || 'Selected location';
    
    if (isNaN(radius)) radius = 0;
    
    // Set the globals that showFindResultsModal reads
    findSearchKeyword = keyword;
    findSearchLocation = { latitude: lat, longitude: lng, address: address };
    selectedFindRadius = radius;
    
    // Block empty keyword + Global (too broad, shows everything)
    if (!keyword && radius === 0) {
        alert('Please enter a search term for global search.');
        window.location.href = '/find.html';
        return;
    }
    
    console.log('🔍 Find search from find.html:', search);
    window._radiusFallbackUsed = 0;
    
    // Wait for page to finish loading
    setTimeout(async function() {
        showSearchLoadingModal();
        
        try {
            var allAds = [];
            
            // ALWAYS fetch global — filter client-side
            try {
                var resp = await fetch('/api/search-ad.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ latitude: lat, longitude: lng, radius_km: 99999, keyword: keyword })
                });
                var data = await resp.json();
                if (resp.ok && data.success) {
                    allAds = data.ads || [];
                }
            } catch(err) {
                console.error('search-ad.php failed:', err);
            }
            
            // Fallback to get-ads.php if search-ad.php failed
            if (allAds.length === 0) {
                try {
                    var resp2 = await fetch('/api/get-ads.php');
                    var data2 = await resp2.json();
                    allAds = data2.ads || data2.data || [];
                } catch(err2) {
                    console.error('Fallback failed:', err2);
                }
            }
            
            // Keyword filter
            if (keyword && allAds.length > 0) {
                allAds = smartFilterAds(allAds, keyword);
            }
            
            // Calculate distance for every ad from search point
            if (lat && lng) {
                allAds.forEach(function(ad) {
                    var aLat = parseFloat(ad.location_lat || ad.latitude || 0);
                    var aLng = parseFloat(ad.location_lng || ad.location_lon || ad.longitude || 0);
                    if (aLat && aLng) {
                        ad.distance_km = Math.round(calculateDistance(lat, lng, aLat, aLng) * 10) / 10;
                    } else {
                        ad.distance_km = 99999;
                    }
                });
                // Sort by distance (closest first)
                allAds.sort(function(a, b) { return (a.distance_km || 99999) - (b.distance_km || 99999); });
            }
            
            // Client-side radius filter
            var results = allAds;
            
            // Diagnostic: log GPS stats
            var withGPS = allAds.filter(function(ad) { return ad.distance_km < 99999; }).length;
            var noGPS = allAds.length - withGPS;
            console.log('📊 RADIUS DEBUG:', { total: allAds.length, withGPS: withGPS, noGPS: noGPS, radius: radius });
            if (allAds.length > 0 && allAds[0].distance_km !== undefined) {
                console.log('📊 First 3 ads distances:', allAds.slice(0, 3).map(function(a) { return { id: a.id, lat: a.location_lat, lon: a.location_lon, dist: a.distance_km }; }));
            }
                    
            if (radius > 0 && lat && lng) {
                var withinRadius = allAds.filter(function(ad) {
                    return ad.distance_km < 99999 && ad.distance_km <= radius;
                });
                if (withinRadius.length > 0) {
                    results = withinRadius;
                } else if (allAds.length > 0) {
                    // Build 028: Fallback — show nearest results with warning banner
                    results = allAds;
                    window._radiusFallbackUsed = radius;
                    console.log('📊 No ads within ' + radius + 'km. Showing nearest. First:', allAds[0].distance_km + 'km');
                }
            }
            
            // Build 029: Multi-factor ranking + cap at 20
            results = rankSearchResults(results, keyword, radius);
            
            showFindResultsModal(results);
        } catch(err) {
            console.error('Find search error:', err);
            closeSearchResultsModal();
        }
        
        selectedFindRadius = null;
    }, 1500);
}

function detectDevice() {
    isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768, console.log("Device type:", isMobileDevice ? "Mobile" : "Desktop")
}
window.addEventListener("DOMContentLoaded", function() {
    console.log("=== TANGLE-ME ==="), detectDevice(), initializeSession(), initializeLanguage(), checkSession(), loadSubscription(), loadSavedTangles(), detectUserCountry(), handlePaymentRedirect(), handleUrlParameters(), handleFindSearchParams();
    checkGeolocationOnLoad();
});
let userCountry = {
    code: "",
    name: "",
    flag: ""
};
async function detectUserCountry() {
    if (!navigator.geolocation) {
        console.log("⚠️ Geolocation not supported, using language fallback");
        if (!userCountry.code) {
            const t = navigator.language || navigator.userLanguage,
                n = t.split("-")[1]?.toLowerCase() || "za";
            userCountry = {
                code: n,
                name: n.toUpperCase(),
                flag: n
            };
            updateUserCountryDisplay();
        }
        return;
    }
    navigator.geolocation.getCurrentPosition(async function(pos) {
            try {
                const lat = pos.coords.latitude,
                    lng = pos.coords.longitude;
                const geo = await reverseGeocode(lat, lng);
                if (geo && geo.address) {
                    const cc = (geo.address.country_code || "").toLowerCase();
                    const cn = geo.address.country || "";
                    if (cc && cc.length === 2) {
                        const nc = {
                            code: cc,
                            name: cn || cc.toUpperCase(),
                            flag: cc
                        };
                        if (nc.code !== userCountry.code) {
                            console.log("🌍 Country from GPS:", nc.name, "(" + lat.toFixed(2) + "," + lng.toFixed(2) + ")");
                            userCountry = nc;
                            updateUserCountryDisplay();
                        }
                    }
                }
            } catch (e) {
                console.error("Country detection error:", e);
            }
        },
        function(err) {
            console.log("📍 GPS unavailable for country, code:", err.code);
            if (!userCountry.code) {
                const t = navigator.language || navigator.userLanguage,
                    n = t.split("-")[1]?.toLowerCase() || "za";
                userCountry = {
                    code: n,
                    name: n.toUpperCase(),
                    flag: n
                };
                updateUserCountryDisplay();
            }
        }, {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000
        });
}

function updateUserCountryDisplay() {
    const e = document.getElementById("hamburgerUserFlag"),
        t = document.getElementById("hamburgerUserCountry"),
        n = document.getElementById("hamburgerUserId"),
        o = document.getElementById("hamburgerUserSection"),
        hf = document.getElementById("headerUserFlag");
    e && userCountry.code && (e.innerHTML = `<span class="fi fi-${userCountry.code}"></span>`);
    hf && userCountry.code && (hf.innerHTML = `<span class="fi fi-${userCountry.code}"></span>`);
    t && userCountry.name && (t.textContent = userCountry.name);
    o && currentUser && (o.style.display = "block", n && (n.textContent = currentUser.username || currentUser.email || ""))
}

function updateHeaderMessageBadge() {
    const e = document.getElementById("headerMessageCount");
    if (!e) return;
    const t = JSON.parse(localStorage.getItem("tangleme_messages") || "[]").filter(e => !e.read && e.to_username === (currentUser?.username || "")).length;
    t > 0 ? (e.textContent = t > 9 ? "9+" : t, e.style.display = "inline") : e.style.display = "none"
}

function initializeSession() {
    currentSessionId = "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9), console.log("Session initialized:", currentSessionId)
}

function updateHeaderTierBadge() {
    const e = void 0 !== currentUser && currentUser && (currentUser.tier || currentUser.subscription_tier) || userSubscription.tier || "free",
        t = document.getElementById("headerTierBadge"),
        n = document.getElementById("headerRow2");
    if (!currentUser) return n && (n.style.display = "none"), void(t && (t.style.display = "none"));
    const o = {
            free: {
                bg: "#6b7280",
                color: "#ffffff",
                ticks: "✔︎",
                label: "FREE"
            },
            basic: {
                bg: "#16a34a",
                color: "#ffffff",
                ticks: "✔︎✔︎",
                label: "BASIC"
            },
            pro: {
                bg: "#2563eb",
                color: "#ffffff",
                ticks: "✔︎✔︎✔︎",
                label: "PRO"
            }
        },
        s = o[e] || o.free;
    t && (t.textContent = "Plan: " + s.ticks + " " + s.label, t.title = "Current plan: " + s.label, t.style.background = s.bg, t.style.color = s.color, t.style.setProperty("background", s.bg, "important"), t.style.setProperty("color", s.color, "important"), t.style.display = "", t.onclick = function() {
        "free" === e ? openUpgradeModal() : openMyAdsModal()
    }), n && (n.style.display = "flex")
}

function loadSubscription() {
    try {
        const e = localStorage.getItem("tangleme_subscription");
        e ? (userSubscription = JSON.parse(e), void 0 === userSubscription.payment_confirmed && (userSubscription.payment_confirmed = !1), console.log("✅ Subscription loaded:", userSubscription.tier, "| Payment confirmed:", userSubscription.payment_confirmed)) : (userSubscription = {
            tier: "free",
            price: 0,
            photos_used: 0,
            photos_limit: 0,
            status: "active",
            started_at: null,
            expires_at: null,
            auto_renew: !0,
            payment_confirmed: !1
        }, saveSubscription())
    } catch (e) {
        console.error("Error loading subscription:", e)
    }
}

function saveSubscription() {
    localStorage.setItem("tangleme_subscription", JSON.stringify(userSubscription))
}

function updatePremiumUI() {
    const e = document.getElementById("freeUserView"),
        t = document.getElementById("basicUserView"),
        n = document.getElementById("proUserView");
    if (e && (e.style.display = "none"), t && (t.style.display = "none"), n && (n.style.display = "none"), "free" === userSubscription.tier) e && (e.style.display = "block");
    else if ("basic" === userSubscription.tier) {
        if (t) {
            t.style.display = "block";
            const e = document.getElementById("photosUsedCount"),
                n = document.getElementById("remainingPhotos");
            e && (e.textContent = userSubscription.photos_used), n && (n.textContent = 20 - userSubscription.photos_used)
        }
    } else "pro" === userSubscription.tier && n && (n.style.display = "block");
    console.log("Premium UI updated for tier:", userSubscription.tier)
}

function openUpgradeModal(e = "pro") {
    const t = void 0 !== currentUser && currentUser && (currentUser.tier || currentUser.subscription_tier) || userSubscription.tier || "free";
    if ("pro" === t) return void openMyAdsModal();
    const n = document.getElementById("basicPlanCard");
    "basic" === t ? (e = "pro", n && (n.style.display = "none")) : n && (n.style.display = ""), selectedPlan = e, document.getElementById("upgradeModal").classList.add("show"), document.getElementById("basicPlanRadio").checked = "basic" === e, document.getElementById("proPlanRadio").checked = "pro" === e, updateUpgradeButtonText(), updatePlanCardHighlight();
    const o = document.getElementById("termsCheckbox"),
        s = document.getElementById("completeUpgradeBtn");
    o && (o.checked = !1, o.onchange = function() {
        s && (s.style.opacity = this.checked ? "1" : "0.5", s.style.cursor = this.checked ? "pointer" : "not-allowed")
    }, s && (s.style.opacity = "0.5", s.style.cursor = "not-allowed"))
}

function closeUpgradeModal() {
    document.getElementById("upgradeModal").classList.remove("show")
}

function selectPlan(e) {
    selectedPlan = e, document.getElementById("basicPlanRadio").checked = "basic" === e, document.getElementById("proPlanRadio").checked = "pro" === e, updateUpgradeButtonText(), updatePlanCardHighlight()
}

function updateUpgradeButtonText() {
    const e = document.getElementById("upgradeButtonText");
    e && (e.textContent = "basic" === selectedPlan ? "🚀 Complete Purchase - €2.99/month" : "🚀 Complete Purchase - €9.99/month")
}

function updatePlanCardHighlight() {
    const e = document.getElementById("basicPlanCard"),
        t = document.getElementById("proPlanCard");
    e && t && (e.classList.remove("upgrade-plan-card-featured"), t.classList.remove("upgrade-plan-card-featured"), "basic" === selectedPlan ? e.classList.add("upgrade-plan-card-featured") : t.classList.add("upgrade-plan-card-featured"))
}
async function completeUpgrade() {
    if (!document.getElementById("termsCheckbox").checked) return void alert("Please agree to the terms and conditions");
    if (!currentUser || !currentUser.id) return void alert("Please login first");
    const e = document.getElementById("completeUpgradeBtn");
    e.disabled = !0, document.getElementById("upgradeButtonText").textContent = "Redirecting to payment...";
    try {
        const e = await fetch("/api/stripe/create-checkout.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    plan: selectedPlan,
                    user_id: currentUser.id
                })
            }),
            t = await e.json();
        if (!t.success || !t.checkout_url) throw new Error(t.error || "Failed to create checkout session");
        window.location.href = t.checkout_url
    } catch (t) {
        console.error("Stripe checkout error:", t), alert("Payment failed: " + t.message + "\n\nPlease try again."), e.disabled = !1, document.getElementById("upgradeButtonText").textContent = "basic" === selectedPlan ? "Complete Purchase - €2.99/month" : "Complete Purchase - €9.99/month"
    }
}
async function syncSubscriptionStatus() {
    if (currentUser && currentUser.id) try {
        const e = `/api/stripe/check-subscription.php?user_id=${currentUser.id}`;
        console.log("🔄 Syncing subscription from:", e);
        const t = await fetch(e, {
                cache: "no-store"
            }),
            n = await t.text();
        let o;
        console.log("📡 check-subscription raw response:", n);
        try {
            o = JSON.parse(n)
        } catch (e) {
            return void console.error("❌ check-subscription returned non-JSON:", n)
        }
        o.success && o.subscription && (userSubscription = {
            tier: o.subscription.tier,
            status: o.subscription.status,
            photos_used: o.subscription.photos_used,
            photos_limit: "unlimited" === o.subscription.photos_limit ? 1 / 0 : o.subscription.photos_limit,
            expires_at: o.subscription.expires_at,
            payment_confirmed: "free" !== o.subscription.tier && !o.subscription.is_expired
        }, void 0 !== currentUser && currentUser && (currentUser.tier = o.subscription.tier, localStorage.setItem("tangleme_current_user", JSON.stringify(currentUser))), saveSubscription(), updatePremiumUI(), updateHeaderTierBadge(), console.log("✅ Subscription synced from backend:", userSubscription))
    } catch (e) {
        console.error("Failed to sync subscription:", e)
    } else console.log("No user logged in, skipping subscription sync")
}

function handlePaymentRedirect() {
    const e = new URLSearchParams(window.location.search),
        t = e.get("payment");
    "success" === t ? (showSuccess("🎉 Payment successful! Your subscription is now active."), setTimeout(() => syncSubscriptionStatus(), 1e3), window.history.replaceState({}, document.title, window.location.pathname)) : "cancelled" === t && (alert("Payment cancelled. You can try again anytime."), window.history.replaceState({}, document.title, window.location.pathname)), "return" === e.get("portal") && (syncSubscriptionStatus(), window.history.replaceState({}, document.title, window.location.pathname))
}
async function openCustomerPortal() {
    if (currentUser && currentUser.id) try {
        const e = await fetch("/api/stripe/customer-portal.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: currentUser.id
                })
            }),
            t = await e.json();
        if (!t.success || !t.portal_url) throw new Error(t.error || "Failed to open subscription portal");
        window.location.href = t.portal_url
    } catch (e) {
        console.error("Customer portal error:", e), alert("Could not open subscription management: " + e.message)
    } else alert("Please login first")
}

function cancelSubscription() {
    confirm("This will open Stripe to manage your subscription.\n\nYou can cancel there and your access will continue until the end of your billing period.\n\nContinue?") && openCustomerPortal()
}
async function deletePhotoFromServer(e) {
    if (!currentUser || !currentUser.id) throw new Error("Please login first");
    const t = await fetch("/api/delete-photo.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                filename: e
            })
        }),
        n = await t.json();
    if (!t.ok) throw new Error(n.error || "Delete failed");
    return void 0 !== n.photos_used && (userSubscription.photos_used = n.photos_used, saveSubscription()), n
}
async function handlePhotoUpload(e) {
    const t = e.target.files;
    if (!t || 0 === t.length) return;
    const tier = void 0 !== currentUser && currentUser && (currentUser.tier || currentUser.subscription_tier) || userSubscription.tier || "free",
        o = userSubscription.payment_confirmed;
    if ("free" === tier || !o) return alert("📸 Photo uploads require a subscription!\n\nUpgrade to BASIC (€2.99/mo) for 20 photos or PRO (€9.99/mo) for unlimited ads and photos (20 per ad)."), openUpgradeModal("basic"), void(e.target.value = "");
    if ("basic" === tier) {
        const n = userSubscription.photos_used || 0,
            remaining = 20 - n;
        if (t.length > remaining && (alert(`⚠️ Photo limit: You can only upload ${remaining} more photo(s).\n\nYou've used ${n}/20 photos.\n\nUpgrade to PRO for unlimited ads and photos (20 per ad)!`), 0 === remaining)) return openUpgradeModal("pro"), void(e.target.value = "")
    }
    const filesToUpload = Array.from(t).filter(f => {
        if (!f.type.startsWith("image/")) { alert(`${f.name} is not an image`); return false; }
        if (f.size > 10485760) { alert(`${f.name} is too large (max 10MB)`); return false; }
        return true;
    });

    // Enforce per-ad limit (MAX_PHOTOS_PER_AD) and account limit for basic tier
    const perAdRemaining = (typeof MAX_PHOTOS_PER_AD !== "undefined" ? MAX_PHOTOS_PER_AD : 20) - uploadedPhotos.length;
    let maxAllowed = perAdRemaining;
    if ("basic" === tier) {
        maxAllowed = Math.min(perAdRemaining, 20 - (userSubscription.photos_used || 0));
    }
    let trimmedFiles = filesToUpload;
    if (filesToUpload.length > maxAllowed) {
        const dropped = filesToUpload.length - maxAllowed;
        trimmedFiles = filesToUpload.slice(0, Math.max(0, maxAllowed));
        if (typeof showSuccess === "function") {
            showSuccess(`⚠️ You selected ${filesToUpload.length} photos — max ${typeof MAX_PHOTOS_PER_AD !== "undefined" ? MAX_PHOTOS_PER_AD : 20} per ad. Only the first ${trimmedFiles.length} will be uploaded. Remove unwanted photos to choose which ones to keep.`);
        } else {
            alert(`⚠️ You selected ${filesToUpload.length} photos but only ${trimmedFiles.length} can be uploaded (max ${typeof MAX_PHOTOS_PER_AD !== "undefined" ? MAX_PHOTOS_PER_AD : 20} per ad). Remove unwanted photos to choose which ones to keep.`);
        }
    }
    const finalFiles = trimmedFiles;

    if (finalFiles.length === 0) { e.target.value = ""; return; }

    // Build 024: Create temp entries with blob previews FIRST
    const tempEntries = finalFiles.map((file, idx) => {
        const tempId = "temp_" + Date.now() + "_" + idx;
        const preview = URL.createObjectURL(file);
        const entry = {
            id: tempId,
            file: file,
            preview: preview,
            thumb: "",
            full: "",
            uploading: true,
            uploaded: false
        };
        uploadedPhotos.push(entry);
        return { tempId, file };
    });
    displayPhotoPreview();

    // Show progress overlay
    photosUploading = tempEntries.length;
    photosUploadTotal = tempEntries.length;
    updateUploadProgress();

    // Upload 2 at a time in parallel with client-side compression
    const batchSize = 2;
    for (let i = 0; i < tempEntries.length; i += batchSize) {
        const batch = tempEntries.slice(i, i + batchSize);
        const promises = batch.map(async ({ tempId, file }) => {
            try {
                const compressed = await compressImageFile(file, 1920, 0.82);
                await uploadPhotoToServer(tempId, compressed);
            } catch (err) {
                console.error("Photo upload error:", err);
                if ("UPGRADE_REQUIRED" === err.message) {
                    alert("📸 Subscription required for photo uploads");
                    openUpgradeModal("basic");
                } else if (err.message && err.message.startsWith("LIMIT_REACHED")) {
                    alert("⚠️ Photo limit reached! Upgrade to PRO for unlimited ads and photos (20 per ad).");
                    openUpgradeModal("pro");
                } else {
                    // Remove failed entry
                    const failIdx = uploadedPhotos.findIndex(p => p.id === tempId);
                    if (failIdx !== -1) uploadedPhotos.splice(failIdx, 1);
                    displayPhotoPreview();
                }
            }
            photosUploading--;
            updateUploadProgress();
        });
        await Promise.all(promises);
    }

    // Final cleanup
    photosUploading = 0;
    updateUploadProgress();
    displayPhotoPreview();
    initPhotoUploadUI();
    e.target.value = "";
}

function initPhotoUploadUI() {
    const tier = void 0 !== currentUser && currentUser && (currentUser.tier || currentUser.subscription_tier) || userSubscription.tier || "free",
        container = document.getElementById("photoTierContent"),
        noteEl = document.getElementById("photoPreviewNote");
    if (!container) return;
    if ("free" === tier) {
        container.innerHTML = '<div style="display:flex;flex-direction:column;gap:14px;"><div onclick="openUpgradeModal(\'basic\')" style="position:relative;cursor:pointer;width:100%;padding:14px;background:#3b82f6;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;filter:blur(2px);opacity:0.55;user-select:none;">\ud83d\udcf7 Add Photos</div><div style="text-align:center;margin-top:-4px;margin-bottom:6px;font-size:12px;color:#3b82f6;cursor:pointer;" onclick="openUpgradeModal(\'basic\')">\ud83d\udd12 Subscribe to Basic (\u20ac2.99/mo) \u2014 up to 20 photos per ad</div><div onclick="showBulkUpgradeModal()" style="position:relative;cursor:pointer;width:100%;padding:14px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;filter:blur(2px);opacity:0.55;user-select:none;">\ud83d\udcc1 Smart Upload</div><div style="text-align:center;margin-top:-4px;font-size:12px;color:#f97316;cursor:pointer;" onclick="showBulkUpgradeModal()">\ud83d\udd12 Pro (\u20ac9.99/mo) \u2014 Upload files, AI creates your ads</div></div>'
    } else if ("basic" === tier) {
        const accountRemaining = Math.max(0, 20 - userPhotoCount - uploadedPhotos.length);
        const perAdRemaining = Math.max(0, MAX_PHOTOS_PER_AD - uploadedPhotos.length);
        const remaining = Math.min(accountRemaining, perAdRemaining);
        container.innerHTML = '<div style="display:flex;flex-direction:column;gap:14px;"><div><button onclick="document.getElementById(\'photoInputBasic\').click()"' + (remaining <= 0 ? ' disabled' : '') + ' style="width:100%;padding:14px;background:' + (remaining > 0 ? '#3b82f6' : '#a0aec0') + ';color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">\ud83d\udcf7 Add Photos</button></div><div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#f8fafc;border-radius:8px;"><span style="font-size:13px;color:#555;">' + (remaining > 0 ? 'This ad' : 'Limit reached') + '</span><span style="font-size:13px;color:#3b82f6;font-weight:600;">' + uploadedPhotos.length + '/' + MAX_PHOTOS_PER_AD + '</span></div><div onclick="showBulkUpgradeModal()" style="position:relative;cursor:pointer;width:100%;padding:14px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;filter:blur(2px);opacity:0.55;user-select:none;">\ud83d\udcc1 Smart Upload</div><div style="text-align:center;margin-top:-4px;font-size:12px;color:#f97316;cursor:pointer;" onclick="showBulkUpgradeModal()">\ud83d\udd12 Pro (\u20ac9.99/mo) \u2014 Upload files, AI creates your ads</div></div>'
    } else if ("pro" === tier) {
        const perAdRemaining = Math.max(0, MAX_PHOTOS_PER_AD - uploadedPhotos.length);
        container.innerHTML = '<div style="display:flex;flex-direction:column;gap:14px;"><div><button onclick="document.getElementById(\'photoInputPro\').click()"' + (perAdRemaining <= 0 ? ' disabled' : '') + ' style="width:100%;padding:14px;background:linear-gradient(135deg,' + (perAdRemaining > 0 ? '#667eea,#764ba2' : '#a0aec0,#718096') + ');color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">\ud83d\udcf7 Add Photos</button></div><div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#f8fafc;border-radius:8px;"><span style="font-size:13px;color:#555;">' + (perAdRemaining > 0 ? 'This ad' : 'Limit reached \u2014 post this ad, then start another') + '</span><span style="font-size:13px;color:#764ba2;font-weight:600;">' + uploadedPhotos.length + '/' + MAX_PHOTOS_PER_AD + '</span></div><div><button onclick="openBulkUploadModal()" style="width:100%;padding:14px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">\ud83d\udcc1 Smart Upload</button></div><div style="font-size:13px;color:#888;padding:4px 12px;">Upload files with text & photos \u2014 AI creates ads (20 photos per ad)</div></div>'
    }
    noteEl && (noteEl.style.display = uploadedPhotos.length > 0 ? "block" : "none");
    console.log("Photo UI initialized for " + tier + " tier")
}

function handleTierUploadClick(e, t) {
    const n = void 0 !== currentUser && currentUser && (currentUser.tier || currentUser.subscription_tier) || userSubscription.tier || "free";
    if ("free" === n) return openUpgradeModal(e);
    if (!t && uploadedPhotos.length >= MAX_PHOTOS_PER_AD) {
        return void alert(`Maximum ${MAX_PHOTOS_PER_AD} photos per ad reached. Remove some photos to add new ones.`);
    }
    if ("pro" !== e || "basic" !== n)
        if (t) document.getElementById("bulkFileInput").click();
        else if ("pro" === e) document.getElementById("photoInputPro").click();
    else {
        if (Math.max(0, 20 - userPhotoCount - uploadedPhotos.length) <= 0) return void alert("You've reached your 20-photo account limit. Delete a photo to free up a slot.");
        document.getElementById("photoInputBasic").click()
    }
    if ("pro" === e && "basic" === n) openUpgradeModal("pro");
}

function updateMyAdsSubscriptionBanner() {
    const e = document.getElementById("myAdsSubBadge"),
        t = document.getElementById("myAdsUpgradeBtn"),
        n = document.querySelector(".my-ads-actions"),
        o = void 0 !== currentUser && currentUser && (currentUser.tier || currentUser.subscription_tier) || userSubscription.tier || "free";
    e && (e.textContent = o.toUpperCase(), e.className = "subscription-badge " + o);
    t && (t.style.display = "none");
    n && (n.style.display = "none");
}
setInterval(function() {
    detectUserCountry()
}, 12e4);
let bulkAdsData = [],
    bulkUploadInProgress = !1;

function openBulkUploadModal() {
    const m = document.getElementById('bulkUploadModal');
    if (m) {
        m.style.display = 'flex';
        resetAiBulkModal();
        const dz = document.getElementById('aiBulkDropZone');
        if (dz && !dz._eventsWired) {
            dz.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.stopPropagation();
                dz.style.borderColor = '#667eea';
                dz.style.background = '#f0f4ff';
            });
            dz.addEventListener('dragleave', function(e) {
                e.preventDefault();
                e.stopPropagation();
                dz.style.borderColor = '#ddd';
                dz.style.background = '#fafafa';
            });
            dz.addEventListener('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
                dz.style.borderColor = '#ddd';
                dz.style.background = '#fafafa';
                const files = e.dataTransfer.files;
                if (files && files.length > 0) {
                    processAiBulkFiles(files);
                }
            });
            const browseLink = dz.querySelector('a,span[onclick],.browse-link');
            if (browseLink) {
                browseLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    const fi = document.getElementById('aiBulkFileInput');
                    if (fi) fi.click();
                });
            }
            dz._eventsWired = true;
        }
    }
}

function closeBulkUploadModal() {
    const m = document.getElementById('bulkUploadModal');
    if (m) m.style.display = 'none';
}

function openBulkUploadInfo() {
    openBulkUploadModal();
}
let aiBulkTempToken = null;
let aiBulkAds = [];

function resetAiBulkModal() {
    aiBulkTempToken = null;
    aiBulkAds = [];
    const s = document.getElementById('aiBulkStatus');
    const r = document.getElementById('aiBulkResults');
    const e = document.getElementById('aiBulkError');
    const f = document.getElementById('aiBulkFooter');
    const fi = document.getElementById('aiBulkFileInput');
    if (s) s.style.display = 'none';
    if (r) r.style.display = 'none';
    if (e) {
        e.style.display = 'none';
        e.textContent = '';
    }
    if (f) {
        f.style.display = 'none';
    }
    if (fi) fi.value = '';
    const pb = document.getElementById('aiBulkProgressBar');
    if (pb) pb.style.width = '0%';
}

function handleAiBulkDrop(e) {
    e.preventDefault();
    const dz = document.getElementById('aiBulkDropZone');
    if (dz) {
        dz.style.borderColor = '#ddd';
        dz.style.background = '#fafafa';
    }
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
        processAiBulkFiles(files);
    }
}

function handleAiBulkSelect(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
        processAiBulkFiles(files);
    }
}
async function processAiBulkFiles(files) {
    if (!files || !files.length) return;
    const fileArray = Array.from(files);
    resetAiBulkModal();
    if (!currentUser || !currentUser.id) {
        const _authErr = document.getElementById('aiBulkError');
        if (_authErr) {
            _authErr.style.display = 'block';
            _authErr.textContent = '⚠️ Please log in first to use bulk upload.';
        }
        return;
    }
    const statusEl = document.getElementById('aiBulkStatus');
    const statusText = document.getElementById('aiBulkStatusText');
    const progressBar = document.getElementById('aiBulkProgressBar');
    const errorEl = document.getElementById('aiBulkError');
    if (statusEl) statusEl.style.display = 'block';
    if (statusText) statusText.textContent = 'Uploading your files…';
    if (progressBar) progressBar.style.width = '20%';
    try {
        const fd = new FormData();
        fd.append('action', 'preview');
        fd.append('user_id', currentUser && currentUser.id ? String(currentUser.id) : '');
        for (const f of fileArray) {
            fd.append('bulk_file', f);
        }
        if (progressBar) progressBar.style.width = '40%';
        if (statusText) statusText.textContent = 'Claude AI is reading your files…';
        const resp = await fetch('/tangle-bulk/bulk_upload.php', {
            method: 'POST',
            body: fd,
            credentials: 'include'
        });
        if (progressBar) progressBar.style.width = '75%';
        const data = await resp.json();
        if (!resp.ok || data.error) {
            throw new Error(data.error || ('Server error ' + resp.status));
        }
        if (!data.preview_rows || data.preview_rows.length === 0) {
            throw new Error('No ads found in your file. Please check the file has ad content.');
        }
        aiBulkTempToken = data.temp_token;
        aiBulkAds = data.preview_rows;
        if (progressBar) progressBar.style.width = '100%';
        if (statusText) statusText.textContent = '✓ Ready to post ' + data.preview_rows.length + ' ad' + (data.preview_rows.length !== 1 ? 's' : '');
        setTimeout(() => {
            if (statusEl) statusEl.style.display = 'none';
            renderAiBulkResults(aiBulkAds);
        }, 600);
    } catch (err) {
        if (statusEl) statusEl.style.display = 'none';
        if (errorEl) {
            errorEl.style.display = 'block';
            errorEl.textContent = '⚠️ ' + err.message;
        }
    }
}

function renderAiBulkResults(ads) {
    const resultsEl = document.getElementById('aiBulkResults');
    const countEl = document.getElementById('aiBulkAdCount');
    const listEl = document.getElementById('aiBulkAdList');
    const footerEl = document.getElementById('aiBulkFooter');
    if (countEl) countEl.textContent = ads.length + ' ad' + (ads.length !== 1 ? 's' : '');
    if (listEl) {
        listEl.innerHTML = ads.map((ad, i) => {
            const title = ad.keywords || ad.title || ('Ad ' + (i + 1));
            const desc = (ad.description || '').substring(0, 80) + (ad.description && ad.description.length > 80 ? '…' : '');
            const photoCount = ad.photos ? ad.photos.length : 0;
            const photoStr = photoCount > 0 ? (' • ' + photoCount + ' photo' + (photoCount !== 1 ? 's' : '')) : '';
            return '<div style="background:#f8f9ff;border:1px solid #e8eaff;border-radius:8px;padding:10px 12px;"><div style="font-weight:600;font-size:13px;color:#333;margin-bottom:2px;">' + (i + 1) + '. ' + escapeHtml(title) + '</div><div style="font-size:12px;color:#777;">' + escapeHtml(desc) + '<span style="color:#667eea;">' + photoStr + '</span></div></div>';
        }).join('');
    }
    if (resultsEl) resultsEl.style.display = 'block';
    if (footerEl) {
        footerEl.style.cssText = 'display:flex;padding:0 24px 24px;flex-direction:column;gap:10px;';
        footerEl.innerHTML = '<button id="aiBulkConfirmBtn" onclick="confirmAiBulkUpload()" style="width:100%;padding:1rem;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border:none;border-radius:12px;font-size:1rem;font-weight:700;cursor:pointer;">✅ Post All Ads Now</button><button onclick="closeBulkUploadModal()" style="width:100%;padding:0.75rem;background:#f1f5f9;color:#64748b;border:none;border-radius:10px;font-size:0.9rem;cursor:pointer;">Cancel</button>';
    }
}
async function confirmAiBulkUpload() {
    if (!aiBulkTempToken || aiBulkAds.length === 0) {
        return;
    }
    const btn = document.getElementById('aiBulkConfirmBtn');
    const errorEl = document.getElementById('aiBulkError');
    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Posting ads…';
    }
    try {
        const fd = new FormData();
        fd.append('action', 'confirm');
        fd.append('temp_token', aiBulkTempToken);
        fd.append('user_id', currentUser && currentUser.id ? String(currentUser.id) : '');
        if (itemLocationData && itemLocationData.latitude) {
            fd.append('location_lat', itemLocationData.latitude);
            fd.append('location_lng', itemLocationData.longitude);
            fd.append('location_address', itemLocationData.address || '');
        }
        if (currentUser) {
            fd.append('username', currentUser.username || '');
            fd.append('country_code', currentUser.country_code || '');
            fd.append('country_name', currentUser.country_name || '');
            fd.append('country_flag', currentUser.country_flag || '');
        }
        const resp = await fetch('/tangle-bulk/bulk_upload.php', {
            method: 'POST',
            body: fd,
            credentials: 'include'
        });
        const data = await resp.json();
        if (!resp.ok || data.error) {
            throw new Error(data.error || 'Failed to post ads');
        }
        closeBulkUploadModal();
        closePostModal();
        console.log('\ud83d\udce6 Bulk upload response:', JSON.stringify(data));
        if (data.created > 0) {
            showBulkSuccessToast(data.created);
        } else {
            var errMsg = 'No ads were created.';
            if (data.errors && data.errors.length > 0) {
                errMsg += '\n\nErrors:\n' + data.errors.join('\n');
            }
            if (data.ads_skipped > 0) {
                errMsg += '\n\nSkipped: ' + data.ads_skipped + ' rows';
            }
            alert(errMsg);
        }
        loadPostedAds(true);
        setTimeout(function() {
            if (typeof loadMyAds === 'function') loadMyAds();
        }, 1000);
    } catch (err) {
        console.error('\ud83d\udea8 Bulk confirm error:', err.message);
        if (errorEl) {
            errorEl.style.display = 'block';
            errorEl.textContent = '\u26a0\ufe0f ' + err.message;
        } else {
            alert('Bulk upload error: ' + err.message);
        }
        if (btn) {
            btn.disabled = false;
            btn.textContent = '\u2705 Post All Ads Now';
        }
    }
}

function showBulkSuccessToast(count) {
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#22c55e;color:#fff;padding:16px 24px;border-radius:16px;font-weight:700;font-size:14px;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.15);display:flex;flex-direction:column;align-items:center;gap:10px;min-width:260px;';
    t.innerHTML = '<div>✅ ' + count + ' ad' + (count !== 1 ? 's' : '') + ' posted successfully!</div><button onclick="this.parentElement.remove();openMyAdsModal();" style="background:#fff;color:#22c55e;border:none;padding:8px 20px;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;">View My Ads →</button>';
    document.body.appendChild(t);
    setTimeout(() => {
        if (t.parentElement) t.remove();
    }, 8000);
}
async function fetchPhotoCount() {
    if (currentUser) try {
        const e = await fetch(`/api/get-photo-count.php?user_id=${currentUser.id}&tier=${userSubscription.tier}`),
            t = await e.json();
        t.success && (userPhotoCount = t.photo_count || 0, userPhotoLimit = "unlimited" === t.limit ? 1 / 0 : t.limit || 0, console.log(`📷 Photo count: ${userPhotoCount}, Limit: ${userPhotoLimit}`))
    } catch (e) {
        console.error("Error fetching photo count:", e)
    }
}

function setupPhotoDropzones() {
    [{
        el: document.getElementById("photoDropzoneBasic"),
        tier: "basic",
        inputId: "photoInputBasic"
    }, {
        el: document.getElementById("photoDropzonePro"),
        tier: "pro",
        inputId: "photoInputPro"
    }].forEach(({
        el: e,
        tier: t,
        inputId: n
    }) => {
        e && (e.addEventListener("dragover", function(e) {
            e.preventDefault(), e.stopPropagation(), this.classList.add("dragover")
        }), e.addEventListener("dragleave", function(e) {
            e.preventDefault(), e.stopPropagation(), this.classList.remove("dragover")
        }), e.addEventListener("drop", function(e) {
            e.preventDefault(), e.stopPropagation(), this.classList.remove("dragover");
            const o = userSubscription.tier || "free";
            if ("free" === o) return void openUpgradeModal(t);
            if ("pro" === t && "basic" === o) return void openUpgradeModal("pro");
            if ("basic" === t && "basic" === o && 20 - userPhotoCount - uploadedPhotos.length <= 0) return void alert("You've reached your 20-photo limit. Delete a photo to free up a slot.");
            const s = e.dataTransfer.files;
            if (s && s.length > 0) {
                const e = document.getElementById(n);
                e && (e.files = s, e.dispatchEvent(new Event("change")))
            }
        }))
    }), console.log("📷 Dropzone drag & drop initialized")
}
const MAX_PHOTOS_PER_AD = 20;

async function handlePhotoSelect(e) {
    const t = e.target.files;
    if (!t || 0 === t.length) return;
    const tier = void 0 !== currentUser && currentUser && (currentUser.tier || currentUser.subscription_tier) || userSubscription.tier || "free";
    if ("free" === tier) return alert("Please upgrade to BASIC or PRO to upload photos."), void(e.target.value = "");

    const perAdRemaining = MAX_PHOTOS_PER_AD - uploadedPhotos.length;
    if (perAdRemaining <= 0) {
        alert(`Maximum ${MAX_PHOTOS_PER_AD} photos per ad reached. Remove some photos to add new ones.`);
        e.target.value = "";
        return;
    }

    let maxAllowed = perAdRemaining;
    if ("basic" === tier) {
        const accountRemaining = 20 - userPhotoCount - uploadedPhotos.length;
        if (accountRemaining <= 0) {
            alert("You've reached your 20-photo account limit. Delete some existing photos or upgrade to PRO for unlimited ads and photos (20 per ad).");
            e.target.value = "";
            return;
        }
        maxAllowed = Math.min(perAdRemaining, accountRemaining);
    }

    const validFiles = [];
    for (let i = 0; i < t.length; i++) {
        const f = t[i];
        if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(f.type)) {
            alert(`Invalid file type: ${f.name}. Use JPG, PNG, GIF, or WebP.`);
            continue;
        }
        if (f.size > 10485760) {
            alert(`File too large: ${f.name}. Maximum 10MB per photo.`);
            continue;
        }
        validFiles.push({ file: f, idx: i });
    }
    if (validFiles.length === 0) { e.target.value = ""; return; }

    // Trim to allowed limit and warn user if some were dropped
    let filesToUpload = validFiles;
    if (validFiles.length > maxAllowed) {
        const dropped = validFiles.length - maxAllowed;
        filesToUpload = validFiles.slice(0, maxAllowed);
        showSuccess(`⚠️ You selected ${validFiles.length} photos — max ${MAX_PHOTOS_PER_AD} per ad. Only the first ${maxAllowed} will be uploaded. Remove unwanted photos to choose which ones to keep.`);
    }

    photosUploading = filesToUpload.length;
    photosUploadTotal = filesToUpload.length;
    updateUploadProgress();

    const batchSize = 2;
    for (let i = 0; i < filesToUpload.length; i += batchSize) {
        const batch = filesToUpload.slice(i, i + batchSize);
        const promises = batch.map(async ({ file, idx }) => {
            const tempId = "temp_" + Date.now() + "_" + idx;
            const preview = URL.createObjectURL(file);
            uploadedPhotos.push({ id: tempId, file: file, preview: preview, uploading: true, uploaded: false });
            displayPhotoPreview();
            try {
                const compressed = await compressImageFile(file, 1920, 0.82);
                await uploadPhotoToServer(tempId, compressed);
            } catch (err) { console.error("Photo upload error:", err); }
            photosUploading--;
            updateUploadProgress();
        });
        await Promise.all(promises);
    }

    photosUploading = 0;
    updateUploadProgress();
    initPhotoUploadUI();
    e.target.value = "";
}
async function handleBulkFileSelect(e) {
    const t = e.target.files;
    if (!t || 0 === t.length) return;
    const imageFiles = [],
        otherFiles = [];
    for (let i = 0; i < t.length; i++) t[i].type.startsWith("image/") ? imageFiles.push(t[i]) : otherFiles.push(t[i]);
    if (otherFiles.length > 0) {
        e.target.value = "";
        openBulkUploadModal();
        setTimeout(() => {
            processAiBulkFiles(t);
        }, 300);
        return;
    }
    const perAdRemaining = MAX_PHOTOS_PER_AD - uploadedPhotos.length;
    if (perAdRemaining <= 0) {
        alert(`Maximum ${MAX_PHOTOS_PER_AD} photos per ad reached. Remove some photos to add new ones.`);
        e.target.value = "";
        return;
    }
    let validImages = imageFiles.filter(f => {
        if (f.size > 10485760) { alert("File too large: " + f.name + ". Maximum 10MB per photo."); return false; }
        return true;
    });
    if (validImages.length === 0) { e.target.value = ""; return; }
    if (validImages.length > perAdRemaining) {
        alert(`Only adding ${perAdRemaining} of ${validImages.length} photos (max ${MAX_PHOTOS_PER_AD} per ad).`);
        validImages = validImages.slice(0, perAdRemaining);
    }

    // Build 024: Show progress overlay
    photosUploading = validImages.length;
    photosUploadTotal = validImages.length;
    updateUploadProgress();

    const batchSize = 2;
    for (let i = 0; i < validImages.length; i += batchSize) {
        const batch = validImages.slice(i, i + batchSize);
        const promises = batch.map(async (f, bIdx) => {
            const id = "temp_" + Date.now() + "_" + (i + bIdx),
                preview = URL.createObjectURL(f);
            uploadedPhotos.push({ id, file: f, preview, uploading: true, uploaded: false });
            displayPhotoPreview();
            try {
                const compressed = await compressImageFile(f, 1920, 0.82);
                await uploadPhotoToServer(id, compressed);
            } catch (err) { console.error("Bulk photo upload error:", err); }
            photosUploading--;
            updateUploadProgress();
        });
        await Promise.all(promises);
    }

    validImages.length > 0 && console.log("📤 Bulk uploaded " + validImages.length + " photo(s)");
    photosUploading = 0;
    updateUploadProgress();
    e.target.value = "";
}
async function uploadPhotoToServer(e, t) {
    if (!currentUser || !currentUser.id) throw new Error("Please login first");
    let n, o;
    void 0 === t ? (n = e, o = null) : (o = e, n = t);
    const s = new FormData;
    s.append("photo", n), s.append("user_id", currentUser.id), s.append("tier", userSubscription.tier);
    try {
        const e = await fetch("/api/upload-photo.php", {
                method: "POST",
                body: s
            }),
            t = await e.json(),
            n = uploadedPhotos.findIndex(e => e.id === o);
        if (console.log(`📷 Upload response for tempId ${o}:`, t), console.log(`📷 Found at photoIndex: ${n}`), t.success) return -1 !== n ? (uploadedPhotos[n] = {
            ...uploadedPhotos[n],
            id: t.photo.id,
            thumb: t.photo.thumb,
            full: t.photo.full,
            filename: t.photo.filename,
            uploading: !1,
            uploaded: !0
        }, console.log(`📷 Updated uploadedPhotos[${n}]:`, uploadedPhotos[n])) : (console.log("⚠️ Photo not found by tempId, adding as new entry"), uploadedPhotos.push({
            id: t.photo.id,
            thumb: t.photo.thumb,
            full: t.photo.full,
            filename: t.photo.filename,
            preview: "/" + t.photo.thumb,
            uploading: !1,
            uploaded: !0
        })), "basic" === userSubscription.tier && (userPhotoCount++, initPhotoUploadUI()), console.log("📷 Photo uploaded:", t.photo.filename), displayPhotoPreview(), {
            url: t.photo.full || t.photo.url,
            thumb_url: t.photo.thumb || t.photo.thumb_url,
            filename: t.photo.filename
        };
        throw -1 !== n && uploadedPhotos.splice(n, 1), displayPhotoPreview(), new Error(t.error || "Upload failed")
    } catch (e) {
        console.error("Photo upload error:", e);
        const t = uploadedPhotos.findIndex(e => e.id === o);
        throw -1 !== t && uploadedPhotos.splice(t, 1), displayPhotoPreview(), e
    }
}

function displayPhotoPreview() {
    const e = document.getElementById("photoPreviewGrid");
    if (!e) return void console.log("⚠️ photoPreviewGrid element not found!");
    e.innerHTML = "";
    const t = uploadedPhotos.filter((e, t) => {
        const n = e.preview || e.thumb || e.full;
        return n || console.log(`⚠️ Removing invalid photo entry at index ${t}`), n
    });
    t.length !== uploadedPhotos.length && (uploadedPhotos.length = 0, uploadedPhotos.push(...t)), uploadedPhotos.forEach((t, n) => {
        const o = document.createElement("div");
        o.className = "photo-preview-item";
        let s = "";
        t.preview && t.preview.startsWith("blob:") ? s = t.preview : t.thumb ? s = t.thumb.startsWith("/") ? t.thumb : "/" + t.thumb : t.full && (s = t.full.startsWith("/") ? t.full : "/" + t.full), console.log(`📸 Preview ${n}: src=${s}, uploading=${t.uploading}, uploaded=${t.uploaded}`), o.innerHTML = `\n                    <img src="${s}" alt="Preview ${n+1}" onerror="this.style.display='none'; console.log('❌ Image failed: ${s}')">\n                    ${t.uploading?'<div class="photo-preview-uploading">Uploading...</div>':""}\n                    ${t.uploading?"":`<button type="button" class="photo-preview-remove" onclick="removeUploadedPhoto(${n})">×</button>`}\n                `, e.appendChild(o)
    }), console.log(`📸 ${uploadedPhotos.length} photos in preview grid`);
    const n = document.getElementById("photoPreviewNote");
    n && (n.style.display = uploadedPhotos.length > 0 ? "block" : "none")
}
async function removeUploadedPhoto(e) {
    const t = uploadedPhotos[e];
    if (t) {
        if (t.uploaded && t.thumb) try {
            const e = await fetch("/api/delete-photo.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: currentUser.id,
                    tier: userSubscription.tier,
                    photo_path: t.thumb
                })
            });
            (await e.json()).success && (console.log("📷 Photo deleted from server"), "basic" === userSubscription.tier && (userPhotoCount = Math.max(0, userPhotoCount - 1)), initPhotoUploadUI())
        } catch (e) {
            console.error("Error deleting photo:", e)
        }
        t.preview && t.preview.startsWith("blob:") && URL.revokeObjectURL(t.preview), uploadedPhotos.splice(e, 1), displayPhotoPreview()
    }
}

function removePhoto(e) {
    removeUploadedPhoto(e)
}

function openSubscriptionModal() {
    const e = document.getElementById("subscriptionModal"),
        t = document.getElementById("subscriptionContent");
    if ("free" === userSubscription.tier) t.innerHTML = '\n                    <div style="text-align: center; padding: 2rem;">\n                        <div style="font-size: 3rem; margin-bottom: 1rem;">✓</div>\n                        <div style="font-size: 1.2rem; font-weight: 700; color: #2d3748; margin-bottom: 0.5rem;">\n                            You\'re on the FREE plan\n                        </div>\n                        <div style="color: #4a5568; margin-bottom: 2rem;">\n                            Upgrade to add photos and unlock premium features\n                        </div>\n                        <button class="premium-upgrade-btn" onclick="openUpgradeModal(); closeSubscriptionModal();">\n                            View Premium Plans\n                        </button>\n                    </div>\n                ';
    else {
        const e = "basic" === userSubscription.tier ? "✓✓ BASIC" : "✓✓✓ PRO",
            n = new Date(userSubscription.expires_at),
            o = "basic" === userSubscription.tier ? `${userSubscription.photos_used} / 20 photos used` : "Unlimited ads & photos (20/ad) ∞";
        t.innerHTML = `\n                    <div class="subscription-card">\n                        <div class="subscription-tier">${e}</div>\n                        <div class="subscription-price">$${userSubscription.price}/month</div>\n                    </div>\n                    \n                    <div class="subscription-details">\n                        <div class="subscription-detail-row">\n                            <span class="detail-label">Status:</span>\n                            <span class="detail-value status-active">✅ ${userSubscription.status.toUpperCase()}</span>\n                        </div>\n                        <div class="subscription-detail-row">\n                            <span class="detail-label">Photos:</span>\n                            <span class="detail-value">${o}</span>\n                        </div>\n                        <div class="subscription-detail-row">\n                            <span class="detail-label">Next billing:</span>\n                            <span class="detail-value">${n.toLocaleDateString()}</span>\n                        </div>\n                        <div class="subscription-detail-row">\n                            <span class="detail-label">Auto-renew:</span>\n                            <span class="detail-value">${userSubscription.auto_renew?"ON":"OFF"}</span>\n                        </div>\n                    </div>\n                    \n                    ${"basic"===userSubscription.tier?'\n                        <button class="upgrade-to-pro-btn" style="margin-bottom: 1rem;" onclick="openUpgradeModal(\'pro\'); closeSubscriptionModal();">\n                            Upgrade to PRO for unlimited ads and photos (20 per ad)\n                        </button>\n                    ':""}\n                    \n                    ${userSubscription.auto_renew?`\n                        <button class="cancel-subscription-btn" onclick="cancelSubscription()">\n                            Cancel Subscription\n                        </button>\n                        <div class="cancellation-note">\n                            Your access continues until ${n.toLocaleDateString()}\n                        </div>\n                    `:`\n                        <div class="cancellation-note">\n                            Your subscription will expire on ${n.toLocaleDateString()}\n                        </div>\n                    `}\n                `
    }
    e.classList.add("show")
}

function closeSubscriptionModal() {
    document.getElementById("subscriptionModal").classList.remove("show")
}

function cancelSubscription() {
    confirm("Are you sure you want to cancel? Your premium access will continue until the end of your billing period.") && (userSubscription.auto_renew = !1, saveSubscription(), showSuccess("Subscription cancelled. Your access continues until " + new Date(userSubscription.expires_at).toLocaleDateString()), closeSubscriptionModal())
}

function openPostModal() {
    if (!currentUser) return alert("Please login or register to post ads!"), void openLoginModal();
    // Build 025: Navigate to standalone post page (survives Android photo picker)
    window.location.href = '/post.html';
}

function closePostModal() {
    document.getElementById("postModal").classList.remove("show"), resetForm(), uploadedPhotos = [], isPostingAd = !1
}

function resetForm() {
    document.getElementById("postForm").reset(), itemLocationData = {
        address: "",
        latitude: null,
        longitude: null
    }, document.getElementById("locationResult").style.display = "none";
    const e = document.getElementById("contactCounter");
    e && (e.textContent = "0/100"), document.querySelectorAll(".location-option-btn").forEach(e => {
        e.classList.remove("selected")
    })
}

function autoDetectLocationForPost() {
    navigator.geolocation && (document.getElementById("locationResult").style.display = "block", document.getElementById("locationResultText").textContent = "📍 Auto-detecting your location...", document.getElementById("locationCoordsText").textContent = "", navigator.geolocation.getCurrentPosition(async function(e) {
            const t = e.coords.latitude,
                n = e.coords.longitude;
            if (console.log("📍 Auto-detected location for post:", t, n), !itemLocationData.latitude) {
                let e = `Location at ${formatCoordinates(t,n)}`;
                try {
                    const o = await reverseGeocode(t, n);
                    o && o.friendly_name && (e = o.friendly_name)
                } catch (e) {
                    console.error("Auto reverse geocode failed:", e)
                }
                itemLocationData = {
                    address: e,
                    latitude: t,
                    longitude: n
                }, document.getElementById("locationResultText").textContent = e, document.getElementById("locationCoordsText").textContent = `${t.toFixed(6)}, ${n.toFixed(6)}`, document.getElementById("locationResult").style.display = "block", console.log("✅ Auto-location set for post:", itemLocationData)
            }
        },
        function(e) {
            console.log("📍 Auto-detect failed (user can pick manually):", e.message), document.getElementById("locationResult").style.display = "none"
        }, {
            enableHighAccuracy: !0,
            timeout: 1e4,
            maximumAge: 6e4
        }))
}

function getCurrentGPS() {
    return new Promise(e => {
        navigator.geolocation ? navigator.geolocation.getCurrentPosition(function(t) {
            e({
                latitude: t.coords.latitude,
                longitude: t.coords.longitude
            })
        }, function() {
            e({
                latitude: null,
                longitude: null
            })
        }, {
            enableHighAccuracy: !0,
            timeout: 8e3,
            maximumAge: 6e4
        }) : e({
            latitude: null,
            longitude: null
        })
    })
}

function clearLocationSelections() {
    document.querySelectorAll(".location-option-btn").forEach(e => {
        e.classList.remove("selected"), e.style.borderColor = "#e2e8f0", e.style.backgroundColor = "#f8fafc"
    })
}

function useMyLocation() {
    navigator.geolocation ? (clearLocationSelections(), console.log("Requesting geolocation..."), document.getElementById("locationResult").style.display = "block", document.getElementById("locationResultText").textContent = "Getting your location...", document.getElementById("locationCoordsText").textContent = "", navigator.geolocation.getCurrentPosition(async function(e) {
            const t = e.coords.latitude,
                n = e.coords.longitude;
            console.log("Got coordinates:", t, n), document.getElementById("locationResultText").textContent = "Finding your location...";
            try {
                const e = (await reverseGeocode(t, n)).friendly_name || `Location at ${formatCoordinates(t,n)}`;
                itemLocationData = {
                    address: e,
                    latitude: t,
                    longitude: n
                }, document.getElementById("locationResultText").textContent = e, document.getElementById("locationCoordsText").textContent = `${t.toFixed(6)}, ${n.toFixed(6)}`
            } catch (e) {
                console.error("Reverse geocoding failed:", e);
                const o = `Location at ${formatCoordinates(t,n)}`;
                itemLocationData = {
                    address: o,
                    latitude: t,
                    longitude: n
                }, document.getElementById("locationResultText").textContent = o, document.getElementById("locationCoordsText").textContent = `${t.toFixed(6)}, ${n.toFixed(6)}`
            }
            console.log("Location set:", itemLocationData)
        },
        function(e) {
            console.error("Geolocation error:", e), document.getElementById("locationResult").style.display = "none";
            let t = "";
            switch (e.code) {
                case e.PERMISSION_DENIED:
                    t = '📍 Location access denied.\n\nPlease enable location permission in your browser settings and try again, or use "Pin on Map" instead.';
                    break;
                case e.POSITION_UNAVAILABLE:
                    t = '📍 Location unavailable.\n\nCould not determine your position. Please check your GPS settings or use "Pin on Map" instead.';
                    break;
                case e.TIMEOUT:
                    t = '📍 Location request timed out.\n\nTaking too long to get GPS signal. Please try again or use "Pin on Map" instead.';
                    break;
                default:
                    t = '📍 Could not get your location.\n\nPlease try "Pin on Map" instead.'
            }
            alert(t)
        }, {
            enableHighAccuracy: !0,
            timeout: 15e3,
            maximumAge: 0
        })) : alert("Geolocation is not supported by your browser")
}

function openMapPicker() {
    clearLocationSelections(), document.getElementById("mapModal").classList.add("show"), setTimeout(() => {
        initMap()
    }, 100)
}

function closeMapPicker() {
    document.getElementById("mapModal").classList.remove("show"), map && (map.remove(), map = null, marker = null)
}

function initMap() {
    map && map.remove(), map = L.map("map").setView([0, 0], 2), L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19
    }).addTo(map), map.on("click", async function(e) {
        const t = e.latlng.lat,
            n = e.latlng.lng;
        marker && map.removeLayer(marker), marker = L.marker([t, n]).addTo(map), document.getElementById("mapSelectedAddress").textContent = "Finding location...";
        const o = `Location at ${formatCoordinates(t,n)}`;
        itemLocationData = {
            address: o,
            latitude: t,
            longitude: n
        };
        let s = o;
        try {
            const e = await reverseGeocode(t, n);
            e && e.friendly_name && (s = e.friendly_name, itemLocationData.address = s)
        } catch (e) {
            console.error("Reverse geocoding failed:", e)
        }
        document.getElementById("mapSelectedAddress").textContent = s, document.getElementById("mapConfirmBtn").disabled = !1
    }), setTimeout(() => {
        map.invalidateSize()
    }, 100)
}

function confirmMapLocation() {
    itemLocationData.address && (document.getElementById("locationResult").style.display = "block", document.getElementById("locationResultText").textContent = itemLocationData.address, itemLocationData.latitude && itemLocationData.longitude && (document.getElementById("locationCoordsText").textContent = `${itemLocationData.latitude.toFixed(6)}, ${itemLocationData.longitude.toFixed(6)}`), closeMapPicker())
}

function copyCurrentLocation() {
    itemLocationData.latitude && itemLocationData.longitude && copyCoordinates(itemLocationData.latitude, itemLocationData.longitude)
}
let isPostingAd = !1,
    postRequestCounter = 0,
    sessionAdCount = 0;
// ========== AD PREVIEW & POST FLOW (Build 024) ==========
// Step 1: handlePostSubmit validates and opens preview modal (no posting yet)
// Build 025: Direct post flow — no preview modal, no success modal, just a toast
let previewAdData = null; // Legacy — unused

async function handlePostSubmit(e) {
    e.preventDefault(), e.stopPropagation();
    const reqNum = ++postRequestCounter;
    console.log(`🚀 POST #${reqNum} - handlePostSubmit() called (direct post, Build 025)`);
    if (isPostingAd) return void console.log(`⛔ POST #${reqNum} BLOCKED - Already posting!`);
    if (!currentUser) return alert("Please login to post ads"), void openLoginModal();
    if (!itemLocationData.latitude || !itemLocationData.longitude) return void alert("Please select a location for your item");
    const keywords = document.getElementById("keywords").value.trim(),
        contact = document.getElementById("contact").value.trim();
    if (!keywords) return void alert("Please enter ad text");
    if (!validateContent(keywords, "ad keywords")) return;
    if (contact && !validateContent(contact, "contact information")) return;

    const submitBtn = document.getElementById("submitBtn");

    // Wait for uploads to finish (max 90s)
    if (uploadedPhotos.some(p => p.uploading === true)) {
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Waiting for photos..."; }
        let waited = 0;
        while (uploadedPhotos.some(p => p.uploading === true) && waited < 90000) {
            await new Promise(r => setTimeout(r, 500));
            waited += 500;
            const remaining = uploadedPhotos.filter(p => p.uploading === true).length;
            if (submitBtn) submitBtn.textContent = `Waiting for ${remaining} photo(s)...`;
        }
        if (uploadedPhotos.some(p => p.uploading === true)) {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Post Ad"; }
            alert("Some photos are still uploading. Please wait a moment and try again.");
            return;
        }
    }

    // Collect server-confirmed photos
    const seen = new Set();
    const validPhotos = uploadedPhotos.filter(p => {
        const thumb = p.thumb || p.thumb_url || "";
        const full = p.full || p.url || "";
        const hasServer = (thumb.length > 0 || full.length > 0);
        const notUploading = p.uploading !== true;
        const key = thumb || full;
        if (seen.has(key)) return false;
        if (hasServer && key) seen.add(key);
        return hasServer && notUploading;
    }).map(p => ({
        thumb: p.thumb || p.thumb_url || "",
        full: p.full || p.url || p.thumb || p.thumb_url || ""
    }));

    const totalSelected = uploadedPhotos.length;
    if (totalSelected > 0 && validPhotos.length < totalSelected) {
        const lost = totalSelected - validPhotos.length;
        if (validPhotos.length === 0) {
            if (!confirm(`None of your ${totalSelected} photo(s) uploaded successfully. Post without photos?`)) {
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Post Ad"; }
                return;
            }
        } else {
            alert(`Note: ${lost} of ${totalSelected} photo(s) didn't upload. Posting with ${validPhotos.length} photo(s).`);
        }
    }

    console.log(`📸 Posting with ${validPhotos.length} server-confirmed photos from ${totalSelected} selected`);

    const adData = {
        id: Date.now(),
        user_id: currentUser.id,
        username: currentUser.username,
        keywords: keywords,
        description: "",
        contact: contact || "",
        location_lat: itemLocationData.latitude,
        location_lng: itemLocationData.longitude,
        location_address: itemLocationData.address,
        photos: validPhotos,
        premium_tier: userSubscription.tier,
        country_code: currentUser.country_code || "",
        country_name: currentUser.country_name || "",
        country_flag: currentUser.country_flag || "",
        member_since: currentUser.created_at || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Posting..."; }
    isPostingAd = true;

    try {
        if ("basic" === userSubscription.tier && validPhotos.length > 0) {
            userSubscription.photos_used += validPhotos.length;
            saveSubscription();
        }

        const isLocal = "file:" === window.location.protocol || "localhost" === window.location.hostname || "127.0.0.1" === window.location.hostname;

        if (isLocal) {
            const ads = JSON.parse(localStorage.getItem("tangleme_ads") || "[]");
            ads.unshift(adData);
            localStorage.setItem("tangleme_ads", JSON.stringify(ads));
            sessionAdCount++;
            closePostModal();
            showPostSuccessToast();
            loadPostedAds(true);
            loadMyAds();
        } else {
            const resp = await fetch("/api/post-ad.php", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                credentials: "include",
                body: JSON.stringify(adData)
            });
            const result = await resp.json();
            console.log("📥 Server response:", result);
            if (result.success) {
                console.log("✅ Ad posted! ID:", result.id);
                sessionAdCount++;
                closePostModal();
                showPostSuccessToast();
                loadPostedAds(true);
                loadMyAds();
            } else {
                alert("Error: " + (result.error || "Failed to post ad"));
            }
        }
    } catch (err) {
        console.error("Post ad error:", err);
        alert("Failed to post ad. Please try again.");
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Post Ad"; }
        isPostingAd = false;
        uploadedPhotos.length = 0;
        displayPhotoPreview();
    }
}

// Toast notification instead of success modal
function showPostSuccessToast() {
    const existing = document.getElementById("postSuccessToast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.id = "postSuccessToast";
    toast.innerHTML = '✅ Ad posted! Visible to others nearby.';
    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#10b981,#059669);color:#fff;padding:14px 28px;border-radius:50px;font-size:15px;font-weight:600;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,0.3);white-space:nowrap;transition:opacity 0.5s;';
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = "0"; }, 2500);
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3200);
}

// Legacy stubs — these functions may be referenced elsewhere
function showAdPostedSuccess(id) { lastPostedAdId = id; sessionAdCount++; showPostSuccessToast(); }
function closeAdPostedModal() { const m = document.getElementById("adPostedModal"); if (m) m.classList.remove("show"); lastPostedAdId = null; }
function viewJustPostedAd() { closeAdPostedModal(); openMyAdsModal(); }

let adsCurrentPage = 1,
    adsIsLoading = !1,
    adsHasMore = !0,
    adsTotalCount = 0;
async function loadPostedAds(e) {
    if (adsIsLoading || !adsHasMore && !e) return;
    e && (adsCurrentPage = 1, adsHasMore = !0), adsIsLoading = !0;
    const t = document.getElementById("adsContainer");
    try {
        const n = "file:" === window.location.protocol || "localhost" === window.location.hostname || "127.0.0.1" === window.location.hostname;
        let o = [];
        if (n) o = JSON.parse(localStorage.getItem("tangleme_ads") || "[]"), console.log(`📦 Loaded ${o.length} ads from localStorage`), adsHasMore = !1;
        else {
            let e = `/api/get-ads-paginated.php?page=${adsCurrentPage}&limit=20`;
            const t = await fetch(e),
                n = await t.json();
            n.success && (o = n.ads || [], adsHasMore = n.pagination?.has_next || !1, adsTotalCount = n.pagination?.total || 0, adsCurrentPage++)
        }
        e && (t.innerHTML = ""), o.length > 0 ? (o.forEach(e => {
            t.appendChild(createAdCard(e, !1))
        }), document.getElementById("postedAdsSection").classList.add("show"), document.getElementById("postedAdsSection").style.display = "", updateLoadMoreButton()) : e && (t.innerHTML = '\n                        <div class="no-ads-message">\n                            <div class="no-ads-icon">📭</div>\n                            <div class="no-ads-text">No ads posted yet</div>\n                            <div class="no-ads-subtext">Be the first to post!</div>\n                        </div>\n                    ')
    } catch (n) {
        console.error("Error loading ads:", n);
        try {
            const n = await fetch("/api/get-ads.php"),
                o = await n.json(),
                s = o.success && (o.ads || o.data) || [];
            e && (t.innerHTML = ""), s.length > 0 && (s.forEach(e => t.appendChild(createAdCard(e, !1))), document.getElementById("postedAdsSection").classList.add("show")), adsHasMore = !1
        } catch (e) {
            console.error("Fallback also failed:", e)
        }
    } finally {
        adsIsLoading = !1
    }
}

function updateLoadMoreButton() {
    let e = document.getElementById("loadMoreBtn");
    const t = document.getElementById("postedAdsSection");
    !e && t && (e = document.createElement("button"), e.id = "loadMoreBtn", e.className = "load-more-btn", e.textContent = "Load More Ads", e.onclick = function() {
        e.disabled = !0, e.textContent = "Loading...", loadPostedAds(!1).then(() => {
            e.disabled = !1, e.textContent = "Load More Ads", updateLoadMoreButton()
        })
    }, t.appendChild(e)), e && (e.style.display = adsHasMore ? "block" : "none")
}
async function loadMyAds() {
    if (currentUser) {
        console.log("📦 loadMyAds: Loading ads for user", currentUser.id);
        try {
            const e = document.getElementById("myAdsContainer"),
                t = "file:" === window.location.protocol || "localhost" === window.location.hostname || "127.0.0.1" === window.location.hostname;
            let n = [];
            if (t) n = JSON.parse(localStorage.getItem("tangleme_ads") || "[]").filter(e => String(e.user_id) === String(currentUser.id)), console.log(`📦 LOCAL: Found ${n.length} of my ads`);
            else {
                const e = `/api/get-my-ads.php?user_id=${currentUser.id}`;
                console.log("📦 Fetching:", e);
                const t = await fetch(e, {
                        credentials: "include"
                    }),
                    o = await t.json();
                console.log("📦 Response:", o), o.success ? n = o.ads || o.data || [] : (console.error("📦 Error:", o.error), n = [])
            }
            if (console.log(`📦 My Ads loaded: ${n.length}`), n.length > 0) {
                e.innerHTML = "";
                const t = n.length;
                n.forEach((n, o) => {
                    const s = o + 1;
                    e.appendChild(createAdCard(n, !0, s, t))
                })
            } else e.innerHTML = '\n                        <div class="no-ads-message">\n                            <div class="no-ads-icon">📝</div>\n                            <div class="no-ads-text">You haven\'t posted any ads yet</div>\n                            <div class="no-ads-subtext">Click "Post New" to create your first ad!</div>\n                        </div>\n                    '
        } catch (e) {
            console.error("Error loading my ads:", e)
        }
    } else console.log("📦 loadMyAds: No current user")
}

function createAdCard(e, t) {
    const n = document.createElement("div");
    n.className = "ad-card";
    const o = formatMemberDate(e.member_since),
        s = "pro" === e.premium_tier ? "✓✓✓" : "basic" === e.premium_tier ? "✓✓" : "",
        a = JSON.parse(localStorage.getItem("tangleme_my_tangles") || "[]").some(t => String(t.id) === String(e.id)),
        r = a ? "star-saved" : "",
        i = a ? "⭐" : "☆";
    return n.innerHTML = `\n                <div class="ad-header">\n                    <div class="ad-keywords">${escapeHtml(e.keywords)} ${s}</div>\n                    <div class="ad-header-actions">\n                        ${t?`<button class="ad-delete-btn" onclick="deleteAd(${e.id})">×</button>`:""}\n                        <button class="ad-star-btn ${r}" onclick="toggleSaveAd(${e.id}, this)" title="${a?"Remove from My Tangles":"Save to My Tangles"}">\n                            ${i}\n                        </button>\n                    </div>\n                </div>\n                \n                ${e.username?`\n                <div class="ad-posted-by">\n                    <div class="posted-by-label">Posted by</div>\n                    <div class="posted-by-username">${escapeHtml(e.username)}</div>\n                    <div class="posted-by-country">\n                        <span>${e.country_code||""}</span>\n                        ${e.country_code?`<span class="fi fi-${e.country_code.toLowerCase()}"></span>`:""}\n                        <span>${escapeHtml(e.country_name||"")}</span>\n                    </div>\n                    <div class="posted-by-date">Tangle since: ${o}</div>\n                </div>\n                `:""}\n                \n                ${e.photos&&e.photos.length>0?`\n                <div class="ad-photo-carousel" id="carousel-${e.id}" data-photos='${JSON.stringify(e.photos).replace(/'/g,"&#39;")}'>\n                    <img class="ad-photo-main" \n                         src="/${e.photos[0].full||e.photos[0].thumb||e.photos[0]}" \n                         alt="Photo 1" \n                         onclick="openCarouselLightbox(${e.id},0)">\n                    ${e.photos.length>1?`\n                    <div class="ad-photo-thumbnails">\n                        ${e.photos.map((t,n)=>`\n                            <img class="ad-photo-thumb ${0===n?"active":""}" \n                                 src="/${t.thumb||t.full||t}" \n                                 alt="Thumb ${n+1}"\n                                 onclick="switchCarouselPhoto(${e.id}, ${n}, '${t.full||t.thumb||t}')">\n                        `).join("")}\n                    </div>\n                    `:""}\n                    <div class="ad-photo-count">📷 ${e.photos.length}</div>\n                </div>\n                `:""}\n                \n                <div class="ad-description">${escapeHtml(e.description||"")}</div>\n                \n                <div class="ad-locations">\n                    <div class="ad-location-item">\n                        <span class="ad-location-label">📍 Location:</span>\n                        <span class="ad-location-value">${escapeHtml(e.location_address||"Unknown")}</span>\n                    </div>\n                </div>\n                \n                <div class="ad-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">\n                    <button class="btn-action btn-message" onclick="openMessageModal(${e.id}, '${escapeJsString(e.username||"User")}')">\n                        💬 Message\n                    </button>\n                    <button class="btn-action btn-share" onclick="shareAd(${e.id}, '${escapeJsString(e.keywords)}', '${escapeJsString(e.description||"")}')">\n                        📤 Share\n                    </button>\n                </div>\n            `, n
}

function switchCarouselPhoto(adId, photoIdx, fullPath) {
    const carousel = document.getElementById(`carousel-${adId}`);
    if (!carousel) return;
    const mainImg = carousel.querySelector(".ad-photo-main"),
        thumbs = carousel.querySelectorAll(".ad-photo-thumb");
    if (mainImg) {
        const src = fullPath.startsWith("/") ? fullPath : "/" + fullPath;
        mainImg.src = src;
        mainImg.onclick = () => openCarouselLightbox(adId, photoIdx);
    }
    thumbs.forEach((el, i) => {
        el.classList.toggle("active", i === photoIdx)
    })
}

function viewPhoto(e) {
    if (typeof TangleLightbox !== "undefined") {
        TangleLightbox.open([e], 0)
    } else {
        window.open(e, "_blank")
    }
}

function toggleSaveAd(e, t) {
    let n = JSON.parse(localStorage.getItem("tangleme_my_tangles") || "[]");
    const o = n.findIndex(t => String(t.id) === String(e));
    if (o >= 0) n.splice(o, 1), t.classList.remove("star-saved"), t.innerHTML = "☆", t.title = "Save to My Tangles", showSuccess("Removed from My Tangles");
    else {
        const o = JSON.parse(localStorage.getItem("tangleme_ads") || "[]").find(t => t.id == e);
        o ? (n.push({
            id: o.id,
            keywords: o.keywords,
            description: o.description,
            username: o.username,
            location_address: o.location_address,
            saved_at: (new Date).toISOString()
        }), t.classList.add("star-saved"), t.innerHTML = "⭐", t.title = "Remove from My Tangles", showSuccess("Saved to My Tangles! ⭐")) : (n.push({
            id: e,
            saved_at: (new Date).toISOString()
        }), t.classList.add("star-saved"), t.innerHTML = "⭐", t.title = "Remove from My Tangles", showSuccess("Saved to My Tangles! ⭐"))
    }
    localStorage.setItem("tangleme_my_tangles", JSON.stringify(n)), document.getElementById("myTanglesSection")?.classList.contains("show") && loadMyTangles()
}

function isAdSaved(e) {
    // Build 026: Check server-side savedTangles by user_id first
    if (savedTangles && savedTangles.length > 0) {
        // Find this ad in lastSearchResults to get user_id
        const ad = (typeof lastSearchResults !== "undefined" && lastSearchResults.find(t => String(t.id) === String(e))) || null;
        if (ad && ad.user_id) {
            return savedTangles.some(t => String(t.saved_user_id) === String(ad.user_id));
        }
    }
    // Fallback: localStorage check
    return JSON.parse(localStorage.getItem("tangleme_my_tangles") || "[]").some(t => String(t.id) === String(e))
}

function contactAdvertiser(e) {
    closeSearchResultsModal();
    const t = JSON.parse(localStorage.getItem("tangleme_ads") || "[]").find(t => t.id == e);
    t && "function" == typeof openSendMessage ? openSendMessage(e, t.username, t.keywords) : (showSuccess("Opening message for ad #" + e), document.getElementById("sendMessageModal") && (document.getElementById("messageAdTitle").textContent = "Ad #" + e, document.getElementById("sendMessageModal").classList.add("show")))
}
async function shareAd(e, t, n) {
    const o = `https://tangle-me.com/ad.php?id=${e}`,
        s = `${t||"Check out this ad"} - Tangle-me`,
        a = n ? n.substring(0, 80) : t || "Interesting ad";
    if (navigator.share) try {
        await navigator.share({
            title: s,
            text: a,
            url: o
        }), console.log("Shared successfully via Web Share API")
    } catch (e) {
        "AbortError" !== e.name && (console.error("Share failed:", e), showShareModal(o, s, a))
    } else showShareModal(o, s, a)
}

function showShareModal(e, t, n) {
    const o = document.createElement("div");
    o.className = "modal show", o.id = "shareModal", o.innerHTML = `\n                <div class="modal-content" style="max-width: 400px;">\n                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>\n                    <h2 style="margin-bottom: 0.5rem; text-align: center;">📤 Share Ad</h2>\n                    <p style="text-align: center; color: #718096; font-size: 0.85rem; margin-bottom: 1rem;">${escapeHtml(t)}</p>\n                    \n                    \x3c!-- Direct Link Copy --\x3e\n                    <div style="background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem;">\n                        <label style="font-size: 0.75rem; color: #718096; display: block; margin-bottom: 0.25rem;">Share Link:</label>\n                        <div style="display: flex; gap: 0.5rem;">\n                            <input type="text" id="shareLinkInput" value="${e}" readonly \n                                   style="flex: 1; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.8rem; background: white;">\n                            <button onclick="copyShareLink()" style="background: #667eea; color: white; border: none; padding: 0.5rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; white-space: nowrap;">\n                                📋 Copy\n                            </button>\n                        </div>\n                    </div>\n                    \n                    \x3c!-- Build 015.1 - Share via Apps (now includes Facebook) --\x3e\n                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">\n                        <button onclick="shareViaWhatsApp('${e}', '${escapeJsString(n)}')" \n                                style="background: #25D366; color: white; border: none; padding: 0.75rem; border-radius: 8px; cursor: pointer; font-size: 0.9rem;">\n                            💬 WhatsApp\n                        </button>\n                        <button onclick="shareViaFacebook('${e}')" \n                                style="background: #1877F2; color: white; border: none; padding: 0.75rem; border-radius: 8px; cursor: pointer; font-size: 0.9rem;">\n                            👥 Facebook\n                        </button>\n                        <button onclick="shareViaEmail('${e}', '${escapeJsString(t)}', '${escapeJsString(n)}')" \n                                style="background: #4A5568; color: white; border: none; padding: 0.75rem; border-radius: 8px; cursor: pointer; font-size: 0.9rem;">\n                            ✉️ Email\n                        </button>\n                        <button onclick="shareViaTwitter('${e}', '${escapeJsString(n)}')" \n                                style="background: #1DA1F2; color: white; border: none; padding: 0.75rem; border-radius: 8px; cursor: pointer; font-size: 0.9rem;">\n                            🐦 Twitter\n                        </button>\n                    </div>\n                    \n                    <p style="text-align: center; font-size: 0.75rem; color: #a0aec0;">\n                        Recipients will see a preview with photo & details\n                    </p>\n                </div>\n            `, document.body.appendChild(o)
}

function copyShareLink() {
    const e = document.getElementById("shareLinkInput");
    e.select(), e.setSelectionRange(0, 99999), document.execCommand("copy"), showSuccess("Link copied! 📋"), document.getElementById("shareModal")?.remove()
}

function shareViaWhatsApp(e, t) {
    const n = encodeURIComponent(`${t}\n\n🔗 ${e}\n\n━━━━━━━━━━━━━━━━\n📱 Shared via Tangle-me\n🌐 Free Global Classifieds`);
    window.open(`https://wa.me/?text=${n}`, "_blank"), document.getElementById("shareModal")?.remove()
}

function shareViaEmail(e, t, n) {
    const o = encodeURIComponent(t),
        s = encodeURIComponent(`${n}\n\nView ad: ${e}\n\n---\nShared via Tangle-me - Free Global Classifieds\nhttps://tangle-me.com`);
    window.location.href = `mailto:?subject=${o}&body=${s}`, document.getElementById("shareModal")?.remove()
}

function shareViaFacebook(e) {
    const t = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(e)}`;
    window.open(t, "_blank", "width=600,height=400"), document.getElementById("shareModal")?.remove()
}

function shareViaTwitter(e, t) {
    const n = `https://twitter.com/intent/tweet?text=${encodeURIComponent(t.substring(0,200))}&url=${encodeURIComponent(e)}`;
    window.open(n, "_blank", "width=600,height=400"), document.getElementById("shareModal")?.remove()
}

function openMessageModal(e, t) {
    const n = document.createElement("div");
    n.className = "modal show", n.id = "messageModal", n.innerHTML = `\n                <div class="modal-content" style="max-width: 400px;">\n                    <button class="modal-close" onclick="closeMessageModal()">×</button>\n                    <h2 style="margin-bottom: 0.5rem;">💬 Message ${escapeHtml(t)}</h2>\n                    <p style="font-size: 0.85rem; color: #718096; margin-bottom: 1rem;">Send a message about this ad</p>\n                    \n                    <textarea id="messageText" placeholder="Hi, I'm interested in your ad..." style="width: 100%; height: 120px; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 1rem; resize: none;"></textarea>\n                    \n                    <button class="btn-primary" style="width: 100%; margin-top: 1rem;" onclick="sendMessage(${e}, '${escapeJsString(t)}')">\n                        📤 Send Message\n                    </button>\n                    <button class="btn-secondary" style="width: 100%; margin-top: 0.5rem;" onclick="closeMessageModal()">\n                        Cancel\n                    </button>\n                </div>\n            `, document.body.appendChild(n), setTimeout(() => document.getElementById("messageText")?.focus(), 100)
}

function closeMessageModal() {
    document.getElementById("messageModal")?.remove()
}

function sendMessage(e, t) {
    const n = document.getElementById("messageText")?.value.trim();
    if (!n) return void alert("Please enter a message");
    if (!currentUser) return alert("Please login to send messages"), closeMessageModal(), void openLoginModal();
    const o = JSON.parse(localStorage.getItem("tangleme_messages") || "[]");
    o.push({
        id: Date.now(),
        ad_id: e,
        to_username: t,
        from_username: currentUser.username,
        message: n,
        sent_at: (new Date).toISOString(),
        read: !1
    }), localStorage.setItem("tangleme_messages", JSON.stringify(o)), closeMessageModal(), showSuccess("Message sent! 💬")
}

function viewPhoto(e) {
    if (typeof TangleLightbox !== "undefined") {
        TangleLightbox.open([e], 0)
    } else {
        const t = new Image;
        t.src = e, t.style.maxWidth = "90%", t.style.maxHeight = "90vh", t.style.margin = "auto", t.style.display = "block";
        const n = document.createElement("div");
        n.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; cursor: pointer;", n.appendChild(t), n.onclick = () => document.body.removeChild(n), document.body.appendChild(n)
    }
}

function openCarouselLightbox(adId, startIdx) {
    const c = document.getElementById("carousel-" + adId) || document.getElementById("my-carousel-" + adId) || document.getElementById("detail-carousel-" + adId);
    if (!c) {
        return
    }
    let urls = [];

    // Build 026: Read from data-photos attribute (reliable, always complete)
    const photosData = c.getAttribute("data-photos");
    if (photosData) {
        try {
            const photos = JSON.parse(photosData.replace(/&#39;/g, "'"));
            photos.forEach(function(p) {
                let fullUrl = "";
                if (typeof p === "string") {
                    fullUrl = p;
                } else {
                    fullUrl = p.full || p.thumb || "";
                    // Ensure we use the full-size version, not thumb
                    if (fullUrl.indexOf("/thumbs/") !== -1) {
                        fullUrl = fullUrl.replace("/thumbs/", "/");
                    }
                }
                if (fullUrl) {
                    // Ensure absolute path with leading /
                    if (!fullUrl.startsWith("/") && !fullUrl.startsWith("http")) {
                        fullUrl = "/" + fullUrl;
                    }
                    urls.push(fullUrl);
                }
            });
        } catch(err) {
            console.error("Error parsing data-photos:", err);
        }
    }

    // Fallback: read from DOM elements if data-photos not available
    if (urls.length === 0) {
        const thumbs = c.querySelectorAll(".ad-photo-thumb");
        const mainImg = c.querySelector(".ad-photo-main");
        if (thumbs.length > 0) {
            thumbs.forEach(function(t) {
                let s = t.src || "";
                if (s) {
                    s = s.replace("/thumbs/", "/");
                    urls.push(s)
                }
            });
        } else if (mainImg) {
            let s = mainImg.src || "";
            if (s) {
                s = s.replace("/thumbs/", "/");
                urls.push(s);
            }
        }
    }

    // Filter out any empty or invalid entries to prevent black slides
    urls = urls.filter(function(u) { return u && u.length > 1; });

    if (urls.length > 0 && typeof TangleLightbox !== "undefined") {
        TangleLightbox.open(urls, startIdx || 0)
    } else if (urls.length > 0) {
        viewPhoto(urls[startIdx || 0])
    }
}

function formatMemberDate(e) {
    if (!e) return "Unknown";
    const t = new Date(e);
    return `${t.getDate()}-${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][t.getMonth()]}-${t.getFullYear()}`
}
async function deleteAd(e) {
    if (confirm("Are you sure you want to delete this ad?")) try {
        if ("file:" === window.location.protocol || "localhost" === window.location.hostname || "127.0.0.1" === window.location.hostname) {
            console.log("LOCAL MODE: Deleting ad from localStorage");
            const t = JSON.parse(localStorage.getItem("tangleme_ads") || "[]").filter(t => t.id !== e);
            localStorage.setItem("tangleme_ads", JSON.stringify(t)), showSuccess("Ad deleted successfully!"), loadPostedAds(!0), loadMyAds();
            const n = document.getElementById("adDetailModal");
            n && n.classList.contains("show") && n.classList.remove("show")
        } else {
            const t = await fetch("/api/delete-ad.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        ad_id: e,
                        user_id: currentUser.id,
                        user_email: currentUser.email
                    })
                }),
                n = await t.json();
            console.log("Delete result:", n), n.success ? (showSuccess("Ad deleted successfully!"), loadPostedAds(!0), loadMyAds()) : alert("Error: " + (n.error || "Failed to delete ad"))
        }
    } catch (e) {
        console.error("Delete ad error:", e), alert("Failed to delete ad. Please try again.")
    }
}

function escapeHtml(e) {
    const t = document.createElement("div");
    return t.textContent = e, t.innerHTML
}

function escapeJsString(e) {
    return e ? String(e).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t") : ""
}
const BLOCKED_WORDS = ["fuck", "fucking", "fucked", "fucker", "fucks", "motherfucker", "motherfucking", "shit", "shitting", "bullshit", "shitty", "shithead", "bitch", "bitches", "bitchy", "bitching", "asshole", "arsehole", "ass", "arse", "asswipe", "bastard", "bastards", "damn", "goddamn", "dammit", "crap", "crappy", "piss", "pissed", "pissing", "cock", "cocks", "cocksucker", "dick", "dicks", "dickhead", "pussy", "pussies", "cunt", "cunts", "whore", "whores", "whorehouse", "slut", "sluts", "slutty", "twat", "twats", "wanker", "wankers", "wank", "tosser", "tossers", "bellend", "knob", "knobhead", "prick", "pricks", "douche", "douchebag", "scumbag", "scum", "nigger", "nigga", "niggers", "niggas", "negro", "negros", "spic", "spics", "spick", "wetback", "wetbacks", "beaner", "beaners", "chink", "chinks", "gook", "gooks", "jap", "japs", "kike", "kikes", "wop", "wops", "dago", "dagos", "polack", "polacks", "cracker", "crackers", "honky", "honkey", "honkies", "gringo", "gringos", "paki", "pakis", "raghead", "ragheads", "towelhead", "towelheads", "coon", "coons", "darkie", "darkies", "redskin", "redskins", "squaw", "zipperhead", "faggot", "faggots", "fag", "fags", "dyke", "dykes", "homo", "homos", "tranny", "trannies", "shemale", "shemales", "ladyboy", "ladyboys", "sissy", "sissies", "pansy", "pansies", "retard", "retarded", "retards", "spaz", "spazz", "spastic", "cripple", "crippled", "midget", "midgets", "mongoloid", "porn", "porno", "pornography", "pornographic", "xxx", "xxxx", "sexworker", "escort service", "escorts", "prostitute", "prostitution", "prostitutes", "hooker", "hookers", "callgirl", "stripper", "strippers", "stripclub", "nude", "nudes", "nudity", "naked", "nakedness", "topless", "bottomless", "blowjob", "blowjobs", "handjob", "handjobs", "titjob", "footjob", "rimjob", "cumshot", "cumshots", "creampie", "gangbang", "threesome", "foursome", "orgy", "masturbate", "masturbation", "masturbating", "dildo", "dildos", "vibrator", "vibrators", "buttplug", "fleshlight", "penis", "penises", "vagina", "vaginas", "clitoris", "clit", "scrotum", "ballsack", "nutsack", "erection", "boner", "hardon", "orgasm", "orgasms", "cumming", "horny", "aroused", "kinky", "kink", "fetish", "fetishes", "bdsm", "bondage", "domination", "submission", "sadism", "masochism", "sadomasochism", "dickpic", "onlyfans", "fansly", "camgirl", "webcamgirl", "adultcontent", "adultentertanment", "eroticmassage", "sensualmassage", "happyending", "nurumassage", "bodyrub", "sugardaddy", "sugarmommy", "sugarmama", "sugarbaby", "findom", "paypig", "sexting", "hookup", "swingers", "swinging", "cuckold", "cuckolding", "milf", "dilf", "gilf", "jailbait", "lolita", "cocaine", "coke", "blow", "snow", "yayo", "heroin", "smack", "horse", "junk", "meth", "methamphetamine", "crystalmeth", "ice", "crank", "speed", "mdma", "ecstasy", "molly", "xtc", "lsd", "acid", "tabs", "blotter", "weed", "marijuana", "cannabis", "pot", "ganja", "reefer", "dope", "hash", "hashish", "420", "420friendly", "fourtwenty", "drugdealer", "drugdeal", "drugdealing", "buydrugs", "selldrugs", "sellingdrugs", "crack", "crackcocaine", "rock", "opioid", "opioids", "oxy", "oxycontin", "oxycodone", "fentanyl", "fent", "ketamine", "ket", "specialk", "pcp", "angeldust", "mushrooms", "shrooms", "magicmushrooms", "psilocybin", "dmt", "ayahuasca", "ghb", "liquidecstasy", "rohypnol", "roofies", "roofie", "xanax", "xans", "bars", "benzos", "adderall", "addies", "ritalin", "codeine", "lean", "purpledrank", "sizzurp", "poppers", "amylnitrite", "whippets", "nitrous", "krokodil", "bathsalts", "spice", "k2", "syntheticweed", "buygun", "sellgun", "gunsforsale", "illegalweapon", "illegalweapons", "illegalfirearm", "unregisteredgun", "ghostgun", "hitman", "contractkiller", "assassin", "assassination", "murderforhire", "killformoney", "killsomeone", "murdersomeone", "bombmaking", "makeabomb", "howtomakebomb", "explosive", "explosives", "c4", "dynamite", "tnt", "terrorist", "terrorism", "terrorattack", "massshooting", "schoolshooting", "genocide", "ethniccleansing", "killer", "killers", "nigerianprince", "moneylaundering", "moneylaunder", "laundermoney", "pyramidscheme", "ponzischeme", "ponzi", "getrichquick", "getrichfast", "wiretransferscam", "creditcardfraud", "ccfraud", "identitytheft", "stealidentity", "phishing", "phish", "advancefee", "advancefeefraud", "lotterywinner", "youhavewon", "claimyourprize", "unclaimedfunds", "inheritancescam", "romancescam", "workfromhomescam", "mlm", "multilevelmarketing", "fakepassport", "fakeid", "fakedocuments", "counterfeit", "counterfeitmoney", "stolencreditcard", "stolencc", "carding", "carder", "fullz", "bankdrop", "moneymule", "childporn", "childpornography", "cp", "cplinks", "pedo", "pedophile", "pedophilia", "paedophile", "underage", "underage", "minordating", "dateminors", "childabuse", "abusechildren", "childtrafficking", "traffickingchildren", "grooming", "groomchildren", "murder", "murderer", "murdered", "rape", "rapist", "raping", "raped", "molest", "molester", "molesting", "torture", "tortured", "torturing", "kidnap", "kidnapping", "kidnapper", "assault", "assaulted", "assaulting", "strangle", "strangling", "choke", "dismember", "decapitate", "mutilate"],
    STOP_WORDS = ["a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "from", "as", "is", "was", "are", "were", "been", "be", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "must", "shall", "can", "need", "this", "that", "these", "those", "i", "you", "he", "she", "it", "we", "they", "what", "which", "who", "whom", "when", "where", "why", "how", "all", "each", "every", "both", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "just", "also", "now", "here", "there", "am", "if", "about", "into", "through", "during", "before", "after", "above", "below", "between", "under", "again", "further", "then", "once", "any", "your", "my", "his", "her", "its", "our", "their", "up", "down", "out", "off", "over", "around", "near", "looking", "want", "wanted", "need", "needed", "sell", "selling", "buy", "buying"];

function moderateContent(e) {
    if (!e || "string" != typeof e) return {
        isClean: !0,
        blockedWords: [],
        isSuspicious: !1
    };
    let t = e.toLowerCase().replace(/\s+/g, " ").trim(),
        n = t.replace(/\s/g, "");
    const o = [];
    for (const e of BLOCKED_WORDS) new RegExp("\\b" + e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "gi").test(t) && o.push(e), n.includes(e.replace(/\s/g, "")) && (o.includes(e) || o.push(e));
    const s = t.replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t").replace(/8/g, "b").replace(/@/g, "a").replace(/\$/g, "s").replace(/\*/g, "");
    if (s !== t)
        for (const e of BLOCKED_WORDS) new RegExp("\\b" + e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "gi").test(s) && !o.includes(e) && o.push(e + " (disguised)");
    const a = [/f+u+c+k+/gi, /s+h+i+t+/gi, /b+i+t+c+h+/gi, /a+s+s+h+o+l+e+/gi, /p+u+s+s+y+/gi, /c+u+n+t+/gi, /w+h+o+r+e+/gi, /s+l+u+t+/gi, /n+i+g+g+e+r+/gi, /f+a+g+g+o+t+/gi, /r+e+t+a+r+d+/gi, /c+o+c+k+/gi, /d+i+c+k+/gi, /k+i+l+l+e+r+/gi];
    for (const e of a)
        if (e.test(t)) {
            o.push("[stretched word detected]");
            break
        } const r = [...new Set(o)];
    return {
        isClean: 0 === r.length,
        blockedWords: r,
        isSuspicious: !1
    }
}

function validateContentSilent(e) {
    const t = moderateContent(e);
    return t.isClean;
}

function validateContent(e, t = "content") {
    const n = moderateContent(e);
    return !!n.isClean || (alert(`⚠️ Content Violation\n\nYour ${t} contains prohibited content that violates our Terms of Service.\n\nProhibited content includes:\n• Vulgar or offensive language\n• Racial slurs or hate speech\n• Adult/pornographic material\n• Illegal drugs or substances\n• Weapons or violence\n• Scams or fraudulent content\n• Content harmful to children\n\nPlease revise your ${t} and try again.`), console.log("🚫 Blocked content in " + t + ":", n.blockedWords), !1)
}

function extractSearchKeywords(e) {
    if (!e || "string" != typeof e) return [];
    const t = e.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter(e => e.length > 1).filter(e => !STOP_WORDS.includes(e));
    return [...new Set(t)]
}

function linkifyText(e) {
    if (!e) return "";
    let t = escapeHtml(e);
    return t = t.replace(/(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi, function(e) {
        let t = e;
        return e.match(/^https?:\/\//i) || (t = "https://" + e), `<a href="${t}" target="_blank" rel="noopener noreferrer" style="color: #667eea; text-decoration: underline;">${e}</a>`
    }), t = t.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi, function(e) {
        return `<a href="mailto:${e}" style="color: #667eea; text-decoration: underline;">${e}</a>`
    }), t = t.replace(/(\+?[\d][\d\s\-().]{7,}[\d])/g, function(e) {
        return `<a href="tel:${e.replace(/[\s\-().]/g,"")}" style="color: #667eea; text-decoration: underline;">${e}</a>`
    }), t
}

function showSuccess(e) {
    document.getElementById("successMessage").textContent = e, document.getElementById("successModal").classList.add("show")
}

function closeSuccessModal() {
    document.getElementById("successModal").classList.remove("show")
}
console.log("✅ Content Moderation loaded - " + BLOCKED_WORDS.length + " blocked terms");
let lastPostedAdId = null;

// Build 025: Old success modal functions removed — stubs defined earlier
// postAnotherAd still needed for any remaining references
function postAnotherAd() {
    closeAdPostedModal();
    uploadedPhotos.length = 0;
    const e = {
            ...itemLocationData
        },
        t = document.getElementById("contact") ? document.getElementById("contact").value : "";
    setTimeout(() => {
        if (openPostModal(), e.latitude && e.longitude) {
            itemLocationData = e;
            const t = document.getElementById("locationResult"),
                n = document.getElementById("locationResultText"),
                o = document.getElementById("locationCoordsText");
            t && (t.style.display = "block"), n && (n.textContent = e.address || "Location set"), o && (o.textContent = `${e.latitude.toFixed(6)}, ${e.longitude.toFixed(6)}`)
        }
        if (t) {
            const e = document.getElementById("contact");
            e && (e.value = t, updateCharCounter("contact", "contactCounter", 100))
        }
        displayPhotoPreview();
        initPhotoUploadUI();
        updateMultiPostBanner()
    }, 300)
}

function updateMultiPostBanner() {
    let e = document.getElementById("multiPostBanner");
    if (sessionAdCount > 0) {
        if (!e) {
            e = document.createElement("div"), e.id = "multiPostBanner", e.style.cssText = "background:linear-gradient(135deg,#10b981,#059669);color:#fff;padding:0.6rem 1rem;border-radius:8px;margin-bottom:0.75rem;font-size:0.9rem;font-weight:600;display:flex;align-items:center;gap:0.5rem;";
            const t = document.getElementById("postForm");
            t && t.insertBefore(e, t.firstChild)
        }
        e.innerHTML = `✅ ${sessionAdCount} ad${sessionAdCount>1?"s":""} posted this session — keep going!`, e.style.display = "flex"
    } else e && (e.style.display = "none")
}
let findSearchLocation = {
        address: "",
        latitude: null,
        longitude: null
    },
    findSearchKeyword = "";

// Find is now a full page (find.html) — old modal functions removed

function levenshteinDistance(e, t) {
    const n = [];
    for (let e = 0; e <= t.length; e++) n[e] = [e];
    for (let t = 0; t <= e.length; t++) n[0][t] = t;
    for (let o = 1; o <= t.length; o++)
        for (let s = 1; s <= e.length; s++) t.charAt(o - 1) === e.charAt(s - 1) ? n[o][s] = n[o - 1][s - 1] : n[o][s] = Math.min(n[o - 1][s - 1] + 1, n[o][s - 1] + 1, n[o - 1][s] + 1);
    return n[t.length][e.length]
}

function normalizeText(e) {
    return (e || "").toLowerCase().trim().replace(/\s+/g, " ")
}

function smartMatch(e, t) {
    const n = normalizeText(e),
        o = normalizeText(t);
    return n && o && o.includes(n) ? {
        match: !0,
        score: 100
    } : {
        match: !1,
        score: 0
    }
}

// ─── Build 029: MULTI-FACTOR SEARCH RANKING ENGINE ───
// Invisible to users — best results surface automatically
// Priority: 1. Distance  2. Photos (paying users)  3. Relevance  4. Freshness  5. Completeness

var RANK_WEIGHTS = { distance: 0.40, photos: 0.25, relevance: 0.20, freshness: 0.10, completeness: 0.05 };
var MAX_SEARCH_RESULTS = 20;

function wordMatchScore(query, text) {
    // Word-by-word matching: "Toyota FJ Cruiser" → ["toyota","fj","cruiser"]
    if (!query || !text) return 0;
    var qNorm = normalizeText(query);
    var tNorm = normalizeText(text);
    if (!qNorm || !tNorm) return 0;
    
    // Exact phrase match = highest score
    if (tNorm.includes(qNorm)) return 100;
    
    // Word-by-word matching
    var queryWords = qNorm.split(/\s+/).filter(function(w) { return w.length > 1; });
    if (queryWords.length === 0) return 0;
    
    var matchedWords = 0;
    for (var i = 0; i < queryWords.length; i++) {
        if (tNorm.includes(queryWords[i])) matchedWords++;
    }
    
    if (matchedWords === 0) return 0;
    
    // All words match (any order) = 80, proportional otherwise
    var ratio = matchedWords / queryWords.length;
    return Math.round(ratio * 80);
}

function calcRelevanceScore(query, ad) {
    if (!query || !query.trim()) return 50; // No keyword = neutral relevance
    var kwScore = wordMatchScore(query, ad.keywords || "");
    var descScore = wordMatchScore(query, ad.description || "") * 0.5; // Description worth half
    return Math.min(100, Math.max(kwScore, descScore));
}

function calcDistanceScore(ad, maxDist) {
    var dist = ad.distance_km;
    if (!dist || dist >= 99999) return 0; // No GPS = lowest
    if (maxDist <= 0) maxDist = 50; // Default reference for scoring
    // Closer = higher score, linear scale
    var score = 100 * (1 - (dist / maxDist));
    return Math.max(0, Math.min(100, Math.round(score)));
}

function calcPhotoScore(ad) {
    // Paying users have photos — they get priority
    var photos = ad.photos;
    if (!photos) return 0;
    if (typeof photos === "string") {
        try { photos = JSON.parse(photos); } catch(e) { return 0; }
    }
    if (!Array.isArray(photos) || photos.length === 0) return 0;
    // More photos = slightly higher (up to 100)
    return Math.min(100, 50 + (photos.length * 10));
}

function calcFreshnessScore(ad) {
    var created = ad.created_at;
    if (!created) return 20; // Unknown age = low
    var ageMs = Date.now() - new Date(created).getTime();
    var ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays < 1) return 100;      // Today
    if (ageDays < 7) return 80;       // This week
    if (ageDays < 30) return 50;      // This month
    if (ageDays < 90) return 30;      // Last 3 months
    return 10;                        // Older
}

function calcCompletenessScore(ad) {
    var score = 0;
    if (ad.description && ad.description.length > 20) score += 35;
    if (ad.contact && ad.contact.trim()) score += 35;
    if (ad.location_address && ad.location_address !== "Unknown") score += 30;
    return Math.min(100, score);
}

function rankSearchResults(ads, keyword, radius) {
    if (!ads || ads.length === 0) return [];
    
    // Determine max distance in dataset for normalizing distance scores
    var maxDist = radius > 0 ? radius : 50;
    var adsWithGPS = ads.filter(function(a) { return a.distance_km && a.distance_km < 99999; });
    if (adsWithGPS.length > 0) {
        var farthest = adsWithGPS[adsWithGPS.length - 1].distance_km || 50;
        if (farthest > maxDist) maxDist = farthest;
    }
    
    // Score each ad
    var scored = ads.map(function(ad) {
        var dScore = calcDistanceScore(ad, maxDist);
        var pScore = calcPhotoScore(ad);
        var rScore = calcRelevanceScore(keyword, ad);
        var fScore = calcFreshnessScore(ad);
        var cScore = calcCompletenessScore(ad);
        
        var composite = (
            dScore * RANK_WEIGHTS.distance +
            pScore * RANK_WEIGHTS.photos +
            rScore * RANK_WEIGHTS.relevance +
            fScore * RANK_WEIGHTS.freshness +
            cScore * RANK_WEIGHTS.completeness
        );
        
        ad._rankScore = Math.round(composite * 10) / 10;
        ad._rankDetail = { d: dScore, p: pScore, r: rScore, f: fScore, c: cScore };
        return ad;
    });
    
    // Sort by composite score descending
    scored.sort(function(a, b) { return b._rankScore - a._rankScore; });
    
    // Cap at MAX_SEARCH_RESULTS
    var capped = scored.slice(0, MAX_SEARCH_RESULTS);
    
    console.log('📊 RANK: ' + ads.length + ' ads scored → top ' + capped.length + ' shown. Weights:', RANK_WEIGHTS);
    if (capped.length > 0) {
        console.log('📊 Top 3:', capped.slice(0, 3).map(function(a) {
            return { id: a.id, score: a._rankScore, dist: a.distance_km, photos: (a.photos ? (typeof a.photos === 'string' ? JSON.parse(a.photos || '[]').length : a.photos.length) : 0), detail: a._rankDetail };
        }));
    }
    
    return capped;
}

function smartFilterAds(e, t) {
    if (!t || "" === t.trim()) return e;
    // Build 029: Word-by-word matching across keywords AND description
    var results = [];
    for (var i = 0; i < e.length; i++) {
        var ad = e[i];
        var kwScore = wordMatchScore(t, ad.keywords || "");
        var descScore = wordMatchScore(t, ad.description || "");
        // Include ad if any word matches anywhere
        if (kwScore > 0 || descScore > 0) {
            results.push(ad);
        }
    }
    return results;
}

// Dead modal functions removed (executeKeywordSearch, showSmartSearchResultsModal,
// selectAroundMeForFind, openMapForFind, selectAroundMe) — Find is now find.html

function initMapSearch() {
    mapSearch && mapSearch.remove(), mapSearch = L.map("mapSearch").setView([0, 0], 2), L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19
    }).addTo(mapSearch), mapSearch.on("click", async function(e) {
        const t = e.latlng.lat,
            n = e.latlng.lng;
        markerSearch && mapSearch.removeLayer(markerSearch), markerSearch = L.marker([t, n]).addTo(mapSearch), document.getElementById("mapSearchSelectedAddress").textContent = "Finding location...";
        const o = `Location at ${formatCoordinates(t,n)}`;
        searchLocation = {
            address: o,
            latitude: t,
            longitude: n
        };
        let s = o;
        try {
            const e = await reverseGeocode(t, n);
            e && e.friendly_name && (s = e.friendly_name, searchLocation.address = s)
        } catch (e) {
            console.error("Reverse geocoding failed:", e)
        }
        document.getElementById("mapSearchSelectedAddress").textContent = s, document.getElementById("mapSearchConfirmBtn").disabled = !1
    }), setTimeout(() => {
        mapSearch.invalidateSize()
    }, 100)
}

function closeMapSearch() {
    document.getElementById("mapSearchModal").classList.remove("show"), mapSearch && (mapSearch.remove(), mapSearch = null, markerSearch = null)
}

function confirmMapSearch() {
    searchLocation.latitude && searchLocation.longitude && (findSearchLocation = {
        address: searchLocation.address,
        latitude: searchLocation.latitude,
        longitude: searchLocation.longitude
    }, closeMapSearch(), openRadiusSelectorForFind())
}

function openAddressSearchModal() {
    document.getElementById("addressSearchModal").classList.add("show"), document.getElementById("modalAddressInput").value = "", document.getElementById("addressSearchLoading").style.display = "none", document.getElementById("addressSearchError").style.display = "none", document.getElementById("addressSearchResults").style.display = "none", setTimeout(() => {
        document.getElementById("modalAddressInput").focus()
    }, 100)
}

function closeAddressSearchModal() {
    document.getElementById("addressSearchModal").classList.remove("show")
}
async function performAddressSearch() {
    const e = document.getElementById("modalAddressInput");
    if (console.log("Search button clicked"), console.log("Input element:", e), !e) return console.error("Modal address input element not found!"), void alert("Error: Search input not found. Please close and reopen the modal.");
    const t = e.value.trim();
    if (console.log("Input value:", t), !t || 0 === t.length) return alert("Please enter a location to search from"), void e.focus();
    const n = document.getElementById("addressSearchLoading"),
        o = document.getElementById("addressSearchError"),
        s = document.getElementById("addressSearchResults");
    n && (n.style.display = "block"), o && (o.style.display = "none"), s && (s.style.display = "none", s.innerHTML = "");
    try {
        console.log("Fetching results for:", t), await new Promise(e => setTimeout(e, 1e3));
        const e = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(t)}&limit=10&addressdetails=1`);
        if (!e.ok) throw new Error(`HTTP ${e.status}: ${e.statusText}`);
        const a = await e.json();
        if (console.log("Results received:", a.length), n && (n.style.display = "none"), 0 === a.length) return void(o && (o.style.display = "block"));
        a.forEach(e => {
            const t = document.createElement("div");
            t.className = "address-result-item", t.innerHTML = `\n                        <div class="address-result-main">${e.display_name.split(",")[0]}</div>\n                        <div class="address-result-detail">${e.display_name}</div>\n                    `, t.onclick = () => selectAddressFromModal(e), s && s.appendChild(t)
        }), s && (s.style.display = "block")
    } catch (e) {
        console.error("Address search error:", e), n && (n.style.display = "none"), o && (o.style.display = "block")
    }
}

function selectAddressFromModal(e) {
    searchLocation = {
        address: e.display_name,
        latitude: parseFloat(e.lat),
        longitude: parseFloat(e.lon)
    }, closeAddressSearchModal(), openRadiusSelector()
}

function openRadiusSelector() {
    document.getElementById("radiusLocationDisplay").textContent = searchLocation.address || "Selected Location";
    const e = document.getElementById("radiusOptions");
    e.innerHTML = "";
    [{value: 1, label: "1 km"}, {value: 5, label: "5 km"}, {value: 10, label: "10 km"}, {value: 25, label: "25 km"}, {value: 50, label: "50 km"}, {value: 0, label: "Global"}].forEach(t => {
        const n = document.createElement("div");
        n.className = "radius-option";
        n.setAttribute("data-radius", t.value);
        "Global" === t.label ? n.innerHTML = '<div class="radius-value" style="font-size: 1.2rem;">🌍</div><div class="radius-label" style="font-weight: 600;">Global</div>' : n.innerHTML = '<div class="radius-value">' + t.value + '</div><div class="radius-label">km</div>';
        e.appendChild(n);
    });
    // Event delegation — handles clicks on any child element
    e.onclick = function(ev) {
        var opt = ev.target.closest(".radius-option");
        if (!opt) return;
        var val = parseInt(opt.getAttribute("data-radius"));
        document.querySelectorAll(".radius-option").forEach(function(o) { o.classList.remove("selected"); });
        opt.classList.add("selected");
        selectedRadius = val;
        document.getElementById("radiusConfirmBtn").disabled = false;
    };
    document.getElementById("radiusConfirmBtn").onclick = confirmRadiusSearch;
    document.getElementById("radiusModal").classList.add("show");
}

function openRadiusSelectorForFind() {
    const e = findSearchLocation.address.length > 50 ? findSearchLocation.address.substring(0, 47) + "..." : findSearchLocation.address;
    document.getElementById("radiusLocationDisplay").textContent = e || "Selected Location";
    const t = findSearchKeyword ? `🔎 Searching for: "${findSearchKeyword}"` : "🔎 Searching all ads";
    let n = document.getElementById("radiusKeywordDisplay");
    if (!n) {
        const e = document.querySelector(".radius-location-info");
        e && (n = document.createElement("div"), n.id = "radiusKeywordDisplay", n.style.cssText = "text-align: center; margin-top: 0.5rem; font-size: 0.9rem; color: #667eea; font-weight: 500;", e.appendChild(n))
    }
    n && (n.textContent = t);
    const o = document.getElementById("radiusOptions");
    o.innerHTML = "";
    [{value: 1, label: "1 km"}, {value: 5, label: "5 km"}, {value: 10, label: "10 km"}, {value: 25, label: "25 km"}, {value: 50, label: "50 km"}, {value: 0, label: "Global"}].forEach(e => {
        const t = document.createElement("div");
        t.className = "radius-option";
        t.setAttribute("data-radius", e.value);
        "Global" === e.label ? t.innerHTML = '<div class="radius-value" style="font-size: 1.2rem;">🌍</div><div class="radius-label" style="font-weight: 600;">Global</div>' : t.innerHTML = '<div class="radius-value">' + e.value + '</div><div class="radius-label">km</div>';
        o.appendChild(t);
    });
    // Event delegation — handles clicks on any child element
    o.onclick = function(ev) {
        var opt = ev.target.closest(".radius-option");
        if (!opt) return;
        var val = parseInt(opt.getAttribute("data-radius"));
        document.querySelectorAll(".radius-option").forEach(function(el) { el.classList.remove("selected"); });
        opt.classList.add("selected");
        selectedFindRadius = val;
        document.getElementById("radiusConfirmBtn").disabled = false;
    };
    const s = document.getElementById("radiusConfirmBtn");
    s.onclick = confirmFindSearch;
    s.disabled = true;
    document.getElementById("radiusModal").classList.add("show");
}
let selectedFindRadius = null;

async function confirmFindSearch() {
    if (null !== selectedFindRadius && findSearchLocation.latitude && findSearchLocation.longitude) {
        document.getElementById("radiusModal").classList.remove("show");
        var lat = findSearchLocation.latitude;
        var lng = findSearchLocation.longitude;
        var radius = selectedFindRadius;
        var keyword = findSearchKeyword || "";
        
        // Block empty keyword + Global
        if (!keyword.trim() && radius === 0) {
            alert('Please enter a search term for global search.');
            return;
        }
        
        console.log("🔍 Find Search:", { keyword: keyword, location: findSearchLocation, radius: radius });
        window._radiusFallbackUsed = 0;
        showSearchLoadingModal();
        
        try {
            var allAds = [];
            
            // ALWAYS fetch global — filter client-side
            try {
                var resp = await fetch("/api/search-ad.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ latitude: lat, longitude: lng, radius_km: 99999, keyword: keyword })
                });
                var data = await resp.json();
                if (resp.ok && data.success) {
                    allAds = data.ads || [];
                }
            } catch(err) {
                console.error("search-ad.php failed:", err);
            }
            
            // Fallback
            if (allAds.length === 0) {
                try {
                    var resp2 = await fetch("/api/get-ads.php");
                    var data2 = await resp2.json();
                    allAds = data2.ads || data2.data || [];
                } catch(err2) {
                    console.error("Fallback failed:", err2);
                }
            }
            
            // Keyword filter
            if (keyword && allAds.length > 0) {
                allAds = smartFilterAds(allAds, keyword);
            }
            
            // Calculate distance for every ad
            if (lat && lng) {
                allAds.forEach(function(ad) {
                    var aLat = parseFloat(ad.location_lat || ad.latitude || 0);
                    var aLng = parseFloat(ad.location_lng || ad.location_lon || ad.longitude || 0);
                    if (aLat && aLng) {
                        ad.distance_km = Math.round(calculateDistance(lat, lng, aLat, aLng) * 10) / 10;
                    } else {
                        ad.distance_km = 99999;
                    }
                });
                allAds.sort(function(a, b) { return (a.distance_km || 99999) - (b.distance_km || 99999); });
            }
            
            // Client-side radius filter
            var results = allAds;
            
            // Diagnostic: log GPS stats
            var withGPS = allAds.filter(function(ad) { return ad.distance_km < 99999; }).length;
            console.log('📊 CONFIRM-FIND DEBUG:', { total: allAds.length, withGPS: withGPS, radius: radius });
            if (allAds.length > 0) {
                console.log('📊 First 3 ads:', allAds.slice(0, 3).map(function(a) { return { id: a.id, lat: a.location_lat, lon: a.location_lon, dist: a.distance_km }; }));
            }
            
            if (radius > 0 && lat && lng) {
                var withinRadius = allAds.filter(function(ad) {
                    return ad.distance_km < 99999 && ad.distance_km <= radius;
                });
                if (withinRadius.length > 0) {
                    results = withinRadius;
                } else if (allAds.length > 0) {
                    // Build 028: Fallback — show nearest results with warning
                    results = allAds;
                    window._radiusFallbackUsed = radius;
                }
            }
            
            // Build 029: Multi-factor ranking + cap at 20
            results = rankSearchResults(results, keyword, radius);
            
            showFindResultsModal(results);
        } catch(err) {
            console.error("Search error:", err);
            closeSearchResultsModal();
            showError("Search failed. Please try again.");
        }
        selectedFindRadius = null;
    }
}

function showSearchLoadingModal() {
    let e = document.getElementById("searchResultsModal");
    e || (e = document.createElement("div"), e.className = "modal", e.id = "searchResultsModal", document.body.appendChild(e)), e.innerHTML = '\n                <div class="search-results-modal-content">\n                    <div style="text-align: center; padding: 3rem;">\n                        <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>\n                        <div style="font-size: 1.2rem; font-weight: 600; color: #2d3748;">Searching...</div>\n                        <div style="font-size: 0.9rem; color: #718096; margin-top: 0.5rem;">Finding ads in your area</div>\n                    </div>\n                </div>\n            ', e.classList.add("show")
}

function showFindResultsModal(e) {
    lastSearchResults = e;
    let t = document.getElementById("searchResultsModal");
    t || (t = document.createElement("div"), t.className = "modal", t.id = "searchResultsModal", document.body.appendChild(t));
    const n = findSearchKeyword ? `"${findSearchKeyword}"` : "All ads",
        o = findSearchLocation.address || "Selected location",
        radiusText = selectedFindRadius > 0 ? selectedFindRadius + "km radius" : "🌍 Global";
    
    // Build 028: Radius fallback banner
    var fallbackRadius = window._radiusFallbackUsed || 0;
    window._radiusFallbackUsed = 0;
    var fallbackBanner = (fallbackRadius > 0 && e.length > 0) ? 
        '<div style="background:#fff3cd;border:1px solid #f59e0b;border-radius:8px;padding:0.75rem 1rem;margin-bottom:1rem;font-size:0.85rem;color:#92400e;">⚠️ No ads found within <strong>' + fallbackRadius + 'km</strong>. Showing nearest results sorted by distance.</div>' : '';
    
    let r = "";
    if (e.length > 0) {
        r = e.map(e => {
            const t = isAdSaved(e.id),
                n = t ? "saved" : "",
                o = "premium_plus" === e.premium_tier ? "⭐ Premium+" : "premium" === e.premium_tier ? "✨ Premium" : "",
                s = e.distance_km && e.distance_km < 99999 ? `${e.distance_km}km away` : "",
                aLat = parseFloat(e.location_lat || e.latitude || 0),
                aLng = parseFloat(e.location_lng || e.location_lon || e.longitude || 0),
                coordsBox = (aLat && aLng) ? `<div style="display:inline-flex;align-items:center;gap:0.5rem;background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:0.4rem 0.6rem;margin-top:0.35rem;"><a href="https://www.google.com/maps?q=${aLat},${aLng}" target="_blank" rel="noopener" style="color:#667eea;text-decoration:none;font-size:0.8rem;font-weight:500;font-family:monospace;">${aLat.toFixed(5)}, ${aLng.toFixed(5)}</a><button onclick="navigator.clipboard.writeText('${aLat},${aLng}');this.innerHTML='✓';setTimeout(()=>{this.innerHTML='<svg width=\\'14\\' height=\\'14\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'#667eea\\' stroke-width=\\'2\\'><rect x=\\'9\\' y=\\'9\\' width=\\'13\\' height=\\'13\\' rx=\\'2\\'/><path d=\\'M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1\\'/></svg><div style=\\'font-size:0.55rem;color:#667eea;\\'>Copy</div>'},1500)" style="background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;padding:0;min-width:28px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#667eea" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg><div style="font-size:0.55rem;color:#667eea;">Copy</div></button></div>` : "",
                a = e.created_at ? getTimeAgo(e.created_at) : "";
            return `
                        <div class="search-result-card" data-ad-id="${e.id}">
                            <div class="result-card-header">
                                <span class="result-ad-number">#${e.ad_number||e.id}</span>
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    ${s?`<span style="font-size: 0.8rem; color: #667eea; font-weight: 500;">📍 ${s}</span>`:""}
                                    <button class="result-star-btn ${n}" onclick="toggleSaveAdFromResults(${e.id}, this, ${JSON.stringify(e).replace(/"/g,"&quot;")})" title="${t?"Remove from My Tangles":"Save to My Tangles"}">
                                        ${t?"★":"☆"}
                                    </button>
                                </div>
                            </div>
                            <div class="result-keywords">${escapeHtml(e.keywords||"")} ${o?`<span class="premium-badge-small">${o}</span>`:""}</div>
                            ${a?`<div style="font-size: 0.75rem; color: #718096; margin-bottom: 0.3rem;">🕐 ${a}</div>`:""}
                            <div class="result-description">${e.description?escapeHtml(e.description.substring(0,120))+(e.description.length>120?"...":""):""}</div>
                            <div class="result-location">📍 ${escapeHtml(e.location_address||e.location||"Location not specified")}</div>
                            ${coordsBox}
                            <div class="result-actions">
                                <button class="btn-result-view" onclick="viewAdFromResults(${e.id})">View Details</button>
                                <button class="btn-result-contact" onclick="contactFromResults(${e.id}, '${escapeJsString(e.username||"")}', '${escapeJsString(e.keywords||"")}', ${e.user_id})">💬 Contact</button>
                            </div>
                        </div>
                    `
        }).join("");
    } else {
        // Radius-aware empty state
        const emptyMsg = selectedFindRadius > 0
            ? `No ads found within ${selectedFindRadius}km`
            : "No ads found";
        const emptyHint = selectedFindRadius > 0
            ? "Try increasing your search radius"
            : "Try different keywords or a different location";
        r = `
                    <div class="no-results-found">
                        <div class="no-results-icon">📍</div>
                        <div class="no-results-title">${emptyMsg}</div>
                        <div class="no-results-text">${emptyHint}</div>
                    </div>
                `;
    }
    t.innerHTML = `
                <div class="search-results-modal-content">
                    <button class="modal-close" onclick="closeSearchResultsModal()">×</button>
                    <h2 class="search-results-title">🔍 Search Results</h2>
                    <div class="search-results-summary">
                        <div class="summary-count">${e.length} ad${1!==e.length?"s":""} found</div>
                        <div class="summary-criteria">
                            <span class="criteria-keyword">${escapeHtml(n)}</span>
                            <span class="criteria-separator">•</span>
                            <span class="criteria-radius">${radiusText}</span>
                            <span class="criteria-separator">•</span>
                            <span class="criteria-location">${escapeHtml(o)}</span>
                        </div>
                    </div>
                    <div class="search-results-container">
                        ${fallbackBanner}
                        ${r}
                    </div>
                    <div class="search-results-footer">
                        <button class="btn-secondary" onclick="closeSearchResultsModal()" data-i18n="close">Close</button>
                        <button class="btn-primary" onclick="newFindSearch()" data-i18n="new_search">🔍 New Search</button>
                    </div>
                </div>
            `;
    t.classList.add("show");
}

function closeSearchResultsModal() {
    const e = document.getElementById("searchResultsModal");
    e && e.classList.remove("show")
}

function newFindSearch() {
    closeSearchResultsModal(), window.location.href = '/find.html'
}

// Build 026: Unified save-to-tangles from search results — uses server API
async function toggleSaveTangleFromResults(userId, adId, btn) {
    if (!currentUser) return alert("Please login to save contacts"), void openLoginModal();
    if (!userId) return void showSuccess("Cannot save — user info not available for this ad.");

    // Check if already saved
    const alreadySaved = savedTangles.some(t => String(t.saved_user_id) === String(userId));
    if (alreadySaved) {
        // Already saved — save this additional ad to junction table silently
        try {
            var resp = await fetch("/api/save-tangle.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ saved_user_id: userId, ad_id: adId, notes: "", user_id: currentUser.id })
            });
            var data = await resp.json();
            if (data.success) {
                await loadSavedTangles();
                btn.classList.add("saved");
                btn.innerHTML = "★";
                showSuccess("Ad #" + adId + " added to saved ads! ⭐");
            }
        } catch (err) {
            console.error("Error adding ad to tangle:", err);
        }
    } else {
        // First time saving this user — use modal with Ad# pre-populated
        // Find username from the ad in lastSearchResults
        var ad = lastSearchResults.find(function(a) { return a.user_id == userId; });
        var username = ad ? (ad.username || "Unknown") : "Unknown";
        var keywords = ad ? (ad.keywords || "") : "";
        openSaveTangleModal(userId, username, adId, keywords);
        // Update button optimistically
        btn.classList.add("saved");
        btn.innerHTML = "★";
    }
}

// Build 028: Quiet remove (no confirm dialog) for toggle use
async function removeSavedTangleQuiet(userId) {
    try {
        const resp = await fetch("/api/remove-tangle-ad.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ saved_user_id: userId, user_id: currentUser.id })
        });
        const data = await resp.json();
        if (data.success) {
            await loadSavedTangles();
            // Update any star buttons on page
            document.querySelectorAll(".star-btn, .result-star-btn").forEach(b => {
                const oc = b.getAttribute("onclick") || "";
                if (oc.includes("(" + userId + ",") || oc.includes("(" + userId + ")")) {
                    b.classList.remove("saved");
                    b.innerHTML = "☆";
                }
            });
        }
    } catch (err) {
        console.error("Error removing tangle:", err);
    }
}

// Backward compatibility: old function name redirects to new one
function toggleSaveAdFromResults(adId, btn, adData) {
    // Extract user_id from adData object or from the card's data
    let userId = null;
    if (adData && adData.user_id) {
        userId = adData.user_id;
    } else {
        // Try to find in lastSearchResults
        const ad = (typeof lastSearchResults !== "undefined") && lastSearchResults.find(a => String(a.id) === String(adId));
        if (ad) userId = ad.user_id;
    }
    if (userId) {
        toggleSaveTangleFromResults(userId, adId, btn);
    } else {
        showSuccess("Cannot save — user info not available. Try from a different search.");
    }
}
let lastSearchResults = [];

function viewAdFromResults(adId) {
    var ad = lastSearchResults.find(function(a) { return a.id == adId; });
    if (!ad) return showError("Ad not found");
    
    _currentTranslateAd = ad;
    
    var modal = document.getElementById("adViewDetailModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.className = "modal";
        modal.id = "adViewDetailModal";
        document.body.appendChild(modal);
    }
    
    var timeAgo = ad.created_at ? getTimeAgo(ad.created_at) : "Recently posted";
    var loc = escapeHtml(ad.location_address || ad.location || "Not specified");
    var contact = ad.contact || "Not provided";
    var memberSince = ad.member_since ? new Date(ad.member_since).toLocaleDateString() : "";
    var distance = ad.distance_km && ad.distance_km < 99999 ? ad.distance_km + " km away" : "";
    var username = escapeHtml(ad.username || "Anonymous");
    var flag = ad.country_flag || "";
    
    // Parse photos
    var photos = [];
    if (ad.photos) {
        photos = typeof ad.photos === "string" ? JSON.parse(ad.photos || "[]") : ad.photos;
    }
    
    // Build photo carousel HTML with lightbox support
    var photosHtml = "";
    if (photos.length > 0) {
        var mainSrc = photos[0].full || photos[0].thumb || (typeof photos[0] === "string" ? photos[0] : "");
        if (mainSrc && !mainSrc.startsWith("/") && !mainSrc.startsWith("http")) mainSrc = "/" + mainSrc;
        
        var photosJson = JSON.stringify(photos).replace(/'/g, "&#39;");
        
        photosHtml = '<div class="ad-photo-carousel" id="detail-carousel-' + ad.id + '" data-photos=\'' + photosJson + '\' style="margin-bottom:1rem;">' +
            '<img src="' + mainSrc + '" style="width:100%;max-height:240px;object-fit:contain;border-radius:8px;cursor:pointer;background:#f0f0f0;" onclick="openCarouselLightbox(' + ad.id + ',0)" onerror="this.style.display=\'none\'">';
        
        if (photos.length > 1) {
            photosHtml += '<div style="display:flex;gap:0.5rem;overflow-x:auto;padding:0.5rem 0;">';
            photos.forEach(function(p, idx) {
                var thumbSrc = (typeof p === "string" ? p : p.thumb || p.full || "");
                if (thumbSrc && !thumbSrc.startsWith("/") && !thumbSrc.startsWith("http")) thumbSrc = "/" + thumbSrc;
                var fullSrc = (typeof p === "string" ? p : p.full || p.thumb || "");
                if (fullSrc && !fullSrc.startsWith("/") && !fullSrc.startsWith("http")) fullSrc = "/" + fullSrc;
                photosHtml += '<img src="' + thumbSrc + '" style="width:60px;height:60px;object-fit:cover;border-radius:6px;cursor:pointer;border:2px solid ' + (idx === 0 ? '#667eea' : 'transparent') + ';" onclick="openDetailCarouselPhoto(' + ad.id + ',' + idx + ',\'' + fullSrc + '\')" onerror="this.style.display=\'none\'">';
            });
            photosHtml += '</div>';
        }
        
        photosHtml += '<div style="text-align:right;font-size:0.75rem;color:#718096;margin-top:0.25rem;">📷 ' + photos.length + '</div></div>';
    }
    
    // Contact display
    var contactHtml = contact !== "Not provided" ? linkifyText(escapeHtml(contact)) : '<em style="color:#a0aec0">Not provided</em>';
    
    // Save button
    var isSaved = savedTangles.some(function(s) { return String(s.saved_user_id) === String(ad.user_id); });
    
    modal.innerHTML =
        '<div class="auth-modal-content" style="max-width:500px;max-height:90vh;overflow-y:auto;">' +
            '<button class="modal-close" onclick="document.getElementById(\'adViewDetailModal\').classList.remove(\'show\')">×</button>' +
            '<h2 style="font-size:1.2rem;color:#2d3748;margin-bottom:0.5rem;padding-right:2rem;">📋 Ad Details</h2>' +
            
            '<div style="background:#f7fafc;border-radius:10px;padding:1rem;margin-bottom:0.75rem;">' +
                '<div id="adDetailTranslatableText" style="font-size:1.1rem;font-weight:700;color:#2d3748;margin-bottom:0.5rem;">' + escapeHtml(ad.keywords || "") + '</div>' +
                (ad.description ? '<div style="color:#4a5568;font-size:0.9rem;line-height:1.6;margin-bottom:0.5rem;white-space:pre-wrap;">' + escapeHtml(ad.description) + '</div>' : '') +
                '<div style="font-size:0.8rem;color:#718096;">🕐 ' + timeAgo + '</div>' +
            '</div>' +
            
            '<div id="translateBtnRow" style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.75rem;">' +
                '<button id="translateAdBtn" style="padding:0.45rem 0.9rem;border:2px solid #667eea;border-radius:8px;background:linear-gradient(135deg,#f0f4ff,#e8f0fe);color:#667eea;font-size:0.82rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:0.3rem;">🌐 Translate</button>' +
            '</div>' +
            
            photosHtml +
            
            '<div style="display:flex;flex-direction:column;gap:0.6rem;margin-bottom:1rem;">' +
                '<div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid #e2e8f0;">' +
                    '<span style="color:#718096;font-size:0.85rem;">📍 Location</span>' +
                    '<span style="color:#2d3748;font-size:0.85rem;font-weight:500;text-align:right;max-width:60%;">' + loc + '</span>' +
                '</div>' +
                (distance ? '<div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid #e2e8f0;"><span style="color:#718096;font-size:0.85rem;">📏 Distance</span><span style="color:#667eea;font-size:0.85rem;font-weight:500;">' + distance + '</span></div>' : '') +
                '<div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid #e2e8f0;">' +
                    '<span style="color:#718096;font-size:0.85rem;">📞 Contact</span>' +
                    '<span style="color:#2d3748;font-size:0.85rem;font-weight:500;">' + contactHtml + '</span>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid #e2e8f0;">' +
                    '<span style="color:#718096;font-size:0.85rem;">👤 Posted by</span>' +
                    '<span style="color:#2d3748;font-size:0.85rem;font-weight:500;">' + flag + ' ' + username + '</span>' +
                '</div>' +
                (memberSince ? '<div style="display:flex;justify-content:space-between;padding:0.5rem 0;"><span style="color:#718096;font-size:0.85rem;">📅 Member since</span><span style="color:#2d3748;font-size:0.85rem;font-weight:500;">' + memberSince + '</span></div>' : '') +
            '</div>' +
            
            '<div style="display:flex;gap:0.5rem;">' +
                '<button onclick="document.getElementById(\'adViewDetailModal\').classList.remove(\'show\')" style="flex:1;padding:0.8rem;border:2px solid #e2e8f0;border-radius:10px;background:white;color:#4a5568;font-weight:600;cursor:pointer;">Back</button>' +
                (currentUser && ad.user_id ? '<button id="detailSaveBtn-' + ad.id + '" onclick="toggleSaveTangleFromResults(' + ad.user_id + ',' + ad.id + ',this)" style="padding:0.8rem;border:2px solid #f6e05e;border-radius:10px;background:#fffff0;color:#d69e2e;font-weight:600;cursor:pointer;min-width:52px;">' + (isSaved ? '⭐' : '☆') + '</button>' : '') +
                (currentUser ? '<button onclick="document.getElementById(\'adViewDetailModal\').classList.remove(\'show\');contactFromResults(' + ad.id + ',\'' + escapeJsString(ad.username || "") + '\',\'' + escapeJsString(ad.keywords || "") + '\',' + ad.user_id + ')" style="flex:1;padding:0.8rem;border:none;border-radius:10px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;font-weight:600;cursor:pointer;">💬 Message</button>' : '') +
            '</div>' +
        '</div>';
    
    modal.classList.add("show");
    
    // Wire translate button
    var translateBtn = document.getElementById('translateAdBtn');
    if (translateBtn) {
        translateBtn.addEventListener('click', function() {
            var a = _currentTranslateAd;
            if (!a) return;
            var fullText = (a.keywords || '') + (a.description ? '\n' + a.description : '');
            translateAdInModal(a.id, fullText, a.contact || '');
        });
    }
}

// Helper: switch photo in detail carousel when thumbnail clicked
function openDetailCarouselPhoto(adId, idx, fullSrc) {
    var carousel = document.getElementById('detail-carousel-' + adId);
    if (!carousel) return;
    var mainImg = carousel.querySelector('img');
    if (mainImg && fullSrc) {
        if (!fullSrc.startsWith('/') && !fullSrc.startsWith('http')) fullSrc = '/' + fullSrc;
        mainImg.src = fullSrc;
        mainImg.onclick = function() { openCarouselLightbox(adId, idx); };
    }
    // Update thumbnail borders
    var thumbs = carousel.querySelectorAll('div img');
    thumbs.forEach(function(t, i) { t.style.borderColor = i === idx ? '#667eea' : 'transparent'; });
}

// Store current ad for translation
var _currentTranslateAd = null;

function contactFromResults(adId, username, keywords, userId) {
    closeSearchResultsModal();
    sendMessageToAd(adId, username, keywords, userId);
}

// ─── AI TRANSLATION ───
async function translateAdInModal(adId, text, contact) {
    var targetLang = currentLanguage || 'en';
    var btn = document.getElementById('translateAdBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Translating...'; }
    
    try {
        var resp = await fetch('/api/translate-ad.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ad_id: adId, target_lang: targetLang, text: text, contact: contact || '' })
        });
        var data = await resp.json();
        
        if (data.success && data.translated_text) {
            var textEl = document.getElementById('adDetailTranslatableText');
            if (textEl) {
                textEl.innerHTML = escapeHtml(data.translated_text);
                textEl.style.borderLeft = '3px solid #667eea';
                textEl.style.paddingLeft = '0.75rem';
            }
            if (btn) { btn.innerHTML = '✅ Translated'; btn.disabled = true; btn.style.opacity = '0.6'; }
            
            // Add "show original" toggle
            var row = document.getElementById('translateBtnRow');
            if (row && !document.getElementById('origAdBtn')) {
                var origBtn = document.createElement('button');
                origBtn.id = 'origAdBtn';
                origBtn.style.cssText = 'padding:0.4rem 0.8rem;border:1px solid #e2e8f0;border-radius:8px;background:#fff;color:#718096;font-size:0.78rem;cursor:pointer;';
                origBtn.textContent = '↩ Original';
                origBtn.onclick = function() {
                    if (textEl) { textEl.innerHTML = escapeHtml(text); textEl.style.borderLeft = 'none'; textEl.style.paddingLeft = '0'; }
                    if (btn) { btn.innerHTML = '🌐 Translate'; btn.disabled = false; btn.style.opacity = '1'; }
                    origBtn.remove();
                };
                row.appendChild(origBtn);
            }
        } else {
            if (btn) { btn.innerHTML = '❌ Failed — try again'; btn.disabled = false; }
        }
    } catch(err) {
        console.error('Translation error:', err);
        if (btn) { btn.innerHTML = '❌ Network error'; btn.disabled = false; }
    }
}

function calculateDistance(e, t, n, o) {
    const s = (n - e) * Math.PI / 180,
        a = (o - t) * Math.PI / 180,
        r = Math.sin(s / 2) * Math.sin(s / 2) + Math.cos(e * Math.PI / 180) * Math.cos(n * Math.PI / 180) * Math.sin(a / 2) * Math.sin(a / 2);
    return 2 * Math.atan2(Math.sqrt(r), Math.sqrt(1 - r)) * 6371
}

function clearSearch() {
    isSearchActive = false;
    var section = document.getElementById("postedAdsSection");
    if (section) { section.classList.remove("show"); section.style.display = "none"; }
    var header = document.getElementById("searchResultsHeader");
    if (header) header.classList.remove("show");
    var container = document.getElementById("adsContainer");
    if (container) container.innerHTML = "";
}

function closeRadiusModal() {
    document.getElementById("radiusModal").classList.remove("show"), selectedRadius = null, document.getElementById("radiusConfirmBtn").disabled = !0, document.querySelectorAll(".radius-option").forEach(e => e.classList.remove("selected"))
}

async function confirmRadiusSearch() {
    if (selectedRadius !== null && searchLocation.latitude && searchLocation.longitude) {
        document.getElementById("radiusModal").classList.remove("show");
        var lat = searchLocation.latitude;
        var lng = searchLocation.longitude;
        var radius = selectedRadius;
        var keyword = findSearchKeyword || "";
        
        // Block empty keyword + Global
        if (!keyword.trim() && radius === 0) {
            alert('Please enter a search term for global search.');
            return;
        }
        
        window._radiusFallbackUsed = 0;
        showSearchLoadingModal();
        
        try {
            var allAds = [];
            
            // ALWAYS fetch global — filter client-side
            try {
                var resp = await fetch("/api/search-ad.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ latitude: lat, longitude: lng, radius_km: 99999, keyword: keyword })
                });
                var data = await resp.json();
                if (resp.ok && data.success) {
                    allAds = data.ads || data.data || [];
                }
            } catch(err) {
                console.error("search-ad.php failed:", err);
            }
            
            // Fallback
            if (allAds.length === 0) {
                try {
                    var resp2 = await fetch("/api/get-ads.php");
                    var data2 = await resp2.json();
                    allAds = data2.ads || data2.data || [];
                } catch(err2) {}
            }
            
            // Keyword filter
            if (keyword && allAds.length > 0) {
                allAds = smartFilterAds(allAds, keyword);
            }
            
            // Calculate distance for every ad
            if (lat && lng) {
                allAds.forEach(function(ad) {
                    var aLat = parseFloat(ad.location_lat || ad.latitude || 0);
                    var aLng = parseFloat(ad.location_lng || ad.location_lon || ad.longitude || 0);
                    if (aLat && aLng) {
                        ad.distance_km = Math.round(calculateDistance(lat, lng, aLat, aLng) * 10) / 10;
                    } else {
                        ad.distance_km = 99999;
                    }
                });
                allAds.sort(function(a, b) { return (a.distance_km || 99999) - (b.distance_km || 99999); });
            }
            
            // Client-side radius filter
            var results = allAds;
            
            // Diagnostic: log GPS stats
            var withGPS = allAds.filter(function(ad) { return ad.distance_km < 99999; }).length;
            console.log('📊 RADIUS-SEARCH DEBUG:', { total: allAds.length, withGPS: withGPS, radius: radius });
            if (allAds.length > 0) {
                console.log('📊 First 3 ads:', allAds.slice(0, 3).map(function(a) { return { id: a.id, lat: a.location_lat, lon: a.location_lon, dist: a.distance_km }; }));
            }
            
            if (radius > 0 && lat && lng) {
                var withinRadius = allAds.filter(function(ad) {
                    return ad.distance_km < 99999 && ad.distance_km <= radius;
                });
                if (withinRadius.length > 0) {
                    results = withinRadius;
                } else if (allAds.length > 0) {
                    // Build 028: Fallback — show nearest results with warning
                    results = allAds;
                    window._radiusFallbackUsed = radius;
                }
            }
            
            isSearchActive = true;
            // Use showFindResultsModal for consistent display with distance badges
            findSearchKeyword = keyword;
            findSearchLocation = { latitude: lat, longitude: lng, address: searchLocation.address || "Selected location" };
            selectedFindRadius = radius;
            
            // Build 029: Multi-factor ranking + cap at 20
            results = rankSearchResults(results, keyword, radius);
            
            showFindResultsModal(results);
        } catch(err) {
            console.error("Search error:", err);
            alert("Search failed. Please try again.");
        }
    }
}

// Dead code removed (Build 027): showSearchResultsModal, duplicate closeSearchResultsModal, newSearch
// Active versions: showFindResultsModal, closeSearchResultsModal (line 2616), newFindSearch

async function checkSession() {
    try {
        if ("file:" === window.location.protocol || "localhost" === window.location.hostname || "127.0.0.1" === window.location.hostname) {
            console.log("LOCAL MODE: Checking localStorage for session");
            const e = localStorage.getItem("tangleme_current_user");
            e ? (currentUser = JSON.parse(e), updateAuthUI(!0), loadMyAds()) : (currentUser = null, updateAuthUI(!1))
        } else {
            const e = await fetch("/api/check-session.php", {
                    credentials: "include",
                    cache: "no-store"
                }),
                t = await e.json();
            if (t.loggedIn) currentUser = t.user, !currentUser.tier && currentUser.subscription_tier && (currentUser.tier = currentUser.subscription_tier), localStorage.setItem("tangleme_current_user", JSON.stringify(currentUser)), updateAuthUI(!0), loadMyAds(), await syncSubscriptionStatus();
            else {
                const e = localStorage.getItem("tangleme_current_user"),
                    t = new URLSearchParams(window.location.search),
                    n = t.has("success") || t.has("session_id"),
                    o = t.has("contact") || t.has("save");
                if (e) try {
                    const t = JSON.parse(e);
                    if (t && t.id && t.email) {
                        console.log("✅ Valid localStorage session found - attempting restoration");
                        const e = await fetch("/api/restore-session.php", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                credentials: "include",
                                body: JSON.stringify({
                                    user_id: t.id,
                                    email: t.email
                                })
                            }),
                            s = await e.json();
                        s.success ? (console.log("✅ Session restored successfully"), currentUser = s.user || t, !currentUser.tier && currentUser.subscription_tier && (currentUser.tier = currentUser.subscription_tier), localStorage.setItem("tangleme_current_user", JSON.stringify(currentUser)), updateAuthUI(!0), loadMyAds(), await syncSubscriptionStatus()) : n || o ? (console.log("✅ Special redirect detected - using localStorage temporarily"), currentUser = t, updateAuthUI(!0), loadMyAds(), await syncSubscriptionStatus()) : (console.log("🔒 Session expired - login required"), currentUser = null, updateAuthUI(!1))
                    } else console.log("🧹 Invalid localStorage data - clearing"), localStorage.removeItem("tangleme_current_user"), currentUser = null, updateAuthUI(!1)
                } catch (e) {
                    console.error("Error parsing stored user:", e), localStorage.removeItem("tangleme_current_user"), currentUser = null, updateAuthUI(!1)
                } else currentUser = null, updateAuthUI(!1);
                n && window.history.replaceState({}, document.title, window.location.pathname)
            }
        }
    } catch (e) {
        console.error("Session check error:", e), updateAuthUI(!1)
    }
}

function updateAuthUI(e) {
    document.getElementById("headerAuth");
    const t = document.getElementById("headerUserBtn"),
        n = document.getElementById("userDropdown"),
        o = document.getElementById("hamburgerLoginBtn"),
        s = document.getElementById("hamburgerSignupBtn"),
        a = document.getElementById("hamburgerSubscriptionBtn"),
        r = document.getElementById("hamburgerSettingsBtn"),
        i = document.getElementById("hamburgerUserSection"),
        l = document.getElementById("hamburgerDivider");
    if (e && currentUser) {
        o && (o.style.display = "none"), s && (s.style.display = "none"), a && (a.style.display = "block"), r && (r.style.display = "block"), i && (i.style.display = "block"), l && (l.style.display = "block");
        const e = document.getElementById("headerRow2");
        if (e && (e.style.display = "flex"), t) {
            t.style.display = "flex";
            const e = document.getElementById("headerUserFlag"),
                n = userCountry.code || currentUser.country_code?.toLowerCase() || "";
            e && n && (e.innerHTML = `<span class="fi fi-${n}"></span>`);
            const o = document.getElementById("headerUserBtnText");
            o && (o.textContent = currentUser.username || currentUser.email || "User")
        }
        const n = document.getElementById("userDropdownId"),
            d = document.getElementById("userDropdownFlag"),
            c = document.getElementById("userDropdownCountry");
        n && (n.textContent = currentUser.username || currentUser.email || "");
        const u = userCountry.code || currentUser.country_code?.toLowerCase() || "",
            m = userCountry.name || currentUser.country_name || "";
        d && u && (d.innerHTML = `<span class="fi fi-${u}"></span>`), c && (c.textContent = m);
        const g = document.getElementById("hamburgerUserId"),
            p = document.getElementById("hamburgerUserFlag"),
            h = document.getElementById("hamburgerUserCountry");
        g && (g.textContent = currentUser.username || currentUser.email || ""), p && u && (p.innerHTML = `<span class="fi fi-${u}"></span>`), h && (h.textContent = m), u || detectUserCountry(), updateHeaderTierBadge()
    } else {
        const e = document.getElementById("headerTierBadge");
        e && (e.style.display = "none");
        const t = document.getElementById("headerRow2");
        t && (t.style.display = "none");
        const d = document.getElementById("headerUserBtn");
        d && (d.style.display = "none"), o && (o.style.display = "block"), s && (s.style.display = "block"), a && (a.style.display = "none"), r && (r.style.display = "none"), i && (i.style.display = "none"), l && (l.style.display = "none"), d && (d.style.display = "none"), n && n.classList.remove("show")
    }
}

function toggleUserDropdown() {
    const e = document.getElementById("userDropdown");
    e && e.classList.toggle("show")
}

function openLoginModal() {
    document.getElementById("loginModal").classList.add("show"), document.getElementById("loginError").style.display = "none";
    const e = document.getElementById("loginEmail"),
        t = document.getElementById("loginPassword");
    t && (t.value = "");
    let n = !1;
    try {
        const t = localStorage.getItem("tangleme_current_user");
        if (t) {
            const o = JSON.parse(t);
            o && o.email && e && (e.value = o.email, n = !0)
        }
    } catch (e) {}!n && e && (e.value = ""), setTimeout(() => {
        n && t ? t.focus() : e && e.focus()
    }, 150), console.log("✅ Login modal opened, email prefilled:", n)
}

function switchAccount() {
    console.log("🔄 Switching account..."), document.getElementById("usernameInputDisplay").style.display = "none", document.getElementById("manualLoginField").style.display = "block", document.getElementById("switchAccountLink").style.display = "none", document.getElementById("loginIdentifierManual").value = "", document.getElementById("loginIdentifierManual").setAttribute("required", "required"), document.getElementById("loginPassword").value = "", document.getElementById("tangleInputLabel").style.display = "block", document.getElementById("forgotTangleLink").style.display = "block", document.getElementById("loginError").style.display = "none", setTimeout(() => {
        document.getElementById("loginIdentifierManual").focus()
    }, 100)
}

function handleForgotTangle() {
    console.log("❓ Forgot Tangle clicked"), "none" !== document.getElementById("usernameInputDisplay").style.display && switchAccount(), showForgotTangle()
}

function closeLoginModal() {
    document.getElementById("loginModal").classList.remove("show"), document.getElementById("loginEmail").value = "", document.getElementById("loginPassword").value = ""
}
async function performLogin() {
    console.log("🔘 performLogin() CALLED - Button clicked!");
    const e = document.getElementById("loginEmail").value.trim(),
        t = document.getElementById("loginPassword").value,
        n = document.getElementById("loginError");
    if (console.log("📋 Login attempt:"), console.log("  Email:", e), console.log("  Password length:", t.length), console.log("  Password (masked):", t ? "***" : "(empty)"), n.style.display = "none", n.textContent = "", !e && !t) return console.log("❌ Validation failed: Missing both email and password"), n.textContent = "Please enter your email and password", void(n.style.display = "block");
    if (!e) return console.log("❌ Validation failed: Missing email"), n.textContent = "Please enter your email address", n.style.display = "block", void document.getElementById("loginEmail").focus();
    if (!t) return console.log("❌ Validation failed: Missing password"), n.textContent = "Please enter your password", n.style.display = "block", void document.getElementById("loginPassword").focus();
    console.log("✅ Validation passed, proceeding with login...");
    try {
        const o = "file:" === window.location.protocol || "localhost" === window.location.hostname || "127.0.0.1" === window.location.hostname;
        if (console.log("🌐 Running mode:", o ? "LOCAL (localStorage) - PHASE 1" : "BACKEND (API) - PHASE 1.5"), o) {
            const o = JSON.parse(localStorage.getItem("tangleme_users") || "[]");
            console.log("👥 Total users in system:", o.length), console.log("📝 Users:", o.map(e => e.username));
            const s = o.find(n => (n.email === e || n.username === e) && n.password === t);
            s ? (console.log("✅ LOGIN SUCCESS!"), console.log("  User found:", s.username), console.log("  Email:", s.email), localStorage.setItem("tangleme_current_user", JSON.stringify(s)), currentUser = s, console.log("📝 Registering device..."), saveDeviceRegistration(s.email, s.username), console.log("✅ Device registered!"), showSuccess("Welcome back!"), updateAuthUI(!0), closeLoginModal(), loadMyAds(), handlePendingActions(), console.log("🎉 Login complete!")) : (console.log("❌ LOGIN FAILED!"), console.log("  Tried identifier:", e), console.log("  Password length:", t.length), console.log("  No matching user found"), n.textContent = "Invalid email or password", n.style.display = "block")
        } else {
            console.log("🌐 Calling backend API...");
            const o = await getDeviceFingerprint();
            console.log("📱 Device ID:", o);
            const s = await fetch("/api/login.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        identifier: e,
                        password: t,
                        deviceId: o
                    })
                }),
                a = await s.json();
            console.log("📡 API Response:", a), a.success ? (console.log("✅ LOGIN SUCCESS from backend!"), currentUser = a.user, !currentUser.tier && currentUser.subscription_tier && (currentUser.tier = currentUser.subscription_tier), localStorage.setItem("tangleme_current_user", JSON.stringify(currentUser)), saveDeviceRegistration(a.user.email, a.user.username), showSuccess("Welcome back!"), updateAuthUI(!0), closeLoginModal(), loadMyAds(), await syncSubscriptionStatus(), handlePendingActions(), a.user && !a.user.email_verified && setTimeout(() => {
                sendVerificationEmail(a.user.email, a.user.id)
            }, 2e3), console.log("🎉 Login complete!")) : (console.log("❌ LOGIN FAILED from backend"), n.textContent = a.error || "Login failed", n.style.display = "block")
        }
    } catch (e) {
        console.error("💥 Login error:", e), n.textContent = "Login failed. Please try again.", n.style.display = "block"
    }
}
async function handleLogin(e) {
    e && e.preventDefault(), console.log("⚠️ handleLogin called (legacy), redirecting to performLogin..."), await performLogin()
}

function useDifferentUser() {
    localStorage.removeItem("tangleme_current_user"), document.getElementById("savedUsernameDisplay").style.display = "none", document.getElementById("loginIdentifier").style.display = "block", document.getElementById("loginIdentifier").value = "", document.getElementById("loginPassword").value = "", document.getElementById("loginIdentifier").focus(), console.log("Saved username cleared - showing full login form")
}

function showForgotPassword() {
    closeLoginModal();
    const e = document.getElementById("forgotPasswordModal");
    e ? (e.classList.add("show"), document.getElementById("forgotStep1").style.display = "block", document.getElementById("forgotStep2").style.display = "none", document.getElementById("forgotStep3").style.display = "none", document.getElementById("forgotBackToLogin").style.display = "block", document.getElementById("forgotPasswordError").style.display = "none", document.getElementById("forgotPasswordSuccess").style.display = "none", document.getElementById("forgotEmail").value = "", setTimeout(() => document.getElementById("forgotEmail").focus(), 300)) : alert("Password recovery is currently unavailable. Please contact admin@tangle-me.com")
}

function showForgotTangle() {
    const e = localStorage.getItem("tangleme_device_data");
    let t = "";
    if (e) try {
        const n = JSON.parse(e);
        n.username && (t = `This device was registered with: ${n.username.split(".")[0]}.***.***.`)
    } catch (e) {
        console.error("Error loading device data:", e)
    }
    alert(t ? `${t}\n\nTo recover your full Tangle ID, check your registered email for the welcome message, or contact support.` : "To recover your Tangle ID, please:\n\n1. Check your registered email for the welcome message\n2. Contact support with your registered email\n\n💡 Your Tangle ID is three words separated by dots (e.g., water.olive.zebra)")
}
document.addEventListener("click", function(e) {
    const t = document.getElementById("userDropdown"),
        n = document.getElementById("headerUserBtn");
    t && t.classList.contains("show") && (t.contains(e.target) || n.contains(e.target) || t.classList.remove("show"))
});
let resetTimerInterval = null,
    resetEmail = "";

function closeForgotPasswordModal() {
    document.getElementById("forgotPasswordModal").classList.remove("show"), resetTimerInterval && (clearInterval(resetTimerInterval), resetTimerInterval = null)
}

function forgotToLogin() {
    closeForgotPasswordModal(), openLoginModal()
}
async function sendResetCode() {
    const e = document.getElementById("forgotEmail").value.trim(),
        t = document.getElementById("forgotPasswordError"),
        n = document.getElementById("forgotPasswordSuccess"),
        o = document.getElementById("sendResetCodeBtn");
    if (t.style.display = "none", n.style.display = "none", !e) return t.textContent = "Please enter your email address.", void(t.style.display = "block");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return t.textContent = "Please enter a valid email address.", void(t.style.display = "block");
    o.disabled = !0, o.textContent = "⏳ Sending...";
    try {
        const n = await fetch("/api/forgot-password.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: e
                })
            }),
            o = await n.json();
        if (o.success) {
            resetEmail = e, document.getElementById("forgotStep1").style.display = "none", document.getElementById("forgotStep2").style.display = "block", document.getElementById("forgotEmailDisplay").textContent = e, setupResetCodeInputs(), startResetTimer();
            const t = document.getElementById("resendResetBtn");
            t.disabled = !0, setTimeout(() => {
                t.disabled = !1
            }, 6e4)
        } else t.textContent = o.error || "Email not found. Please check and try again.", t.style.display = "block"
    } catch (e) {
        console.error("Forgot password error:", e), t.textContent = "Network error. Please try again.", t.style.display = "block"
    } finally {
        o.disabled = !1, o.innerHTML = "📧 Send Reset Code"
    }
}

function setupResetCodeInputs() {
    const e = document.getElementById("resetCodeInputs");
    e.querySelectorAll("input").forEach((e, t) => {
        e.value = "";
        const n = e.cloneNode(!0);
        e.parentNode.replaceChild(n, e)
    });
    const t = e.querySelectorAll("input");
    t.forEach((e, n) => {
        e.addEventListener("input", e => {
            e.target.value && n < t.length - 1 && t[n + 1].focus()
        }), e.addEventListener("keydown", e => {
            "Backspace" === e.key && !e.target.value && n > 0 && t[n - 1].focus()
        }), e.addEventListener("paste", e => {
            e.preventDefault();
            const o = (e.clipboardData || window.clipboardData).getData("text").trim().replace(/\D/g, "").split("");
            o.forEach((e, o) => {
                o + n < t.length && (t[o + n].value = e)
            });
            const s = Math.min(n + o.length, t.length) - 1;
            t[s].focus()
        })
    }), setTimeout(() => t[0].focus(), 300)
}

function startResetTimer() {
    resetTimerInterval && clearInterval(resetTimerInterval);
    let e = 900;
    const t = document.getElementById("resetTimer");
    t.style.color = "#6b7280", resetTimerInterval = setInterval(() => {
        e--;
        const n = Math.floor(e / 60),
            o = e % 60;
        t.textContent = `Code expires in ${n}:${o.toString().padStart(2,"0")}`, e <= 0 && (clearInterval(resetTimerInterval), t.textContent = "Code expired. Please request a new one.", t.style.color = "#ef4444")
    }, 1e3)
}
async function resetPassword() {
    const e = document.getElementById("forgotPasswordError"),
        t = document.getElementById("resetPasswordBtn");
    e.style.display = "none";
    const n = document.getElementById("resetCodeInputs").querySelectorAll("input");
    let o = "";
    if (n.forEach(e => {
            o += e.value
        }), 6 !== o.length) return e.textContent = "Please enter the full 6-digit code.", void(e.style.display = "block");
    const s = document.getElementById("newPassword").value,
        a = document.getElementById("confirmNewPassword").value;
    if (!s || s.length < 6) return e.textContent = "Password must be at least 6 characters.", void(e.style.display = "block");
    if (s !== a) return e.textContent = "Passwords do not match.", void(e.style.display = "block");
    t.disabled = !0, t.textContent = "⏳ Resetting...";
    try {
        const t = await fetch("/api/reset-password.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: resetEmail,
                    code: o,
                    new_password: s
                })
            }),
            n = await t.json();
        n.success ? (resetTimerInterval && (clearInterval(resetTimerInterval), resetTimerInterval = null), document.getElementById("forgotStep2").style.display = "none", document.getElementById("forgotStep3").style.display = "block", document.getElementById("forgotBackToLogin").style.display = "none", document.getElementById("forgotPasswordError").style.display = "none", n.username ? document.getElementById("resetTangleId").textContent = n.username : document.getElementById("resetSuccessInfo").style.display = "none") : (e.textContent = n.error || "Invalid code or reset failed. Please try again.", e.style.display = "block")
    } catch (t) {
        console.error("Reset password error:", t), e.textContent = "Network error. Please try again.", e.style.display = "block"
    } finally {
        t.disabled = !1, t.innerHTML = "🔒 Reset Password"
    }
}
async function resendResetCode() {
    if (!resetEmail) return;
    const e = document.getElementById("resendResetBtn");
    e.disabled = !0, e.textContent = "Sending...";
    try {
        const e = await fetch("/api/forgot-password.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: resetEmail
            })
        });
        if ((await e.json()).success) {
            startResetTimer();
            const e = document.getElementById("forgotPasswordSuccess");
            e.textContent = "✅ New code sent! Check your email.", e.style.display = "block", setTimeout(() => {
                e.style.display = "none"
            }, 5e3);
            const t = document.getElementById("resetCodeInputs").querySelectorAll("input");
            t.forEach(e => {
                e.value = ""
            }), t[0].focus()
        }
    } catch (e) {
        console.error("Resend code error:", e)
    } finally {
        setTimeout(() => {
            e.disabled = !1, e.textContent = "Resend code"
        }, 6e4)
    }
}
async function openRegisterModal() {
    document.getElementById("registerModal").classList.add("show"), document.getElementById("registerError").style.display = "none", document.getElementById("emailExistsNotice").style.display = "none", showDeviceHistoryWarning(), await initializeUsernameSystem()
}

function closeRegisterModal() {
    document.getElementById("registerModal").classList.remove("show"), document.getElementById("registerEmail").value = "", document.getElementById("registerPassword").value = "", resetUsernameSection()
}

function toggleHamburgerMenu() {
    document.getElementById("hamburgerMenu").classList.toggle("open")
}

function closeHamburgerMenu() {
    document.getElementById("hamburgerMenu").classList.remove("open")
}

function openLoginFromMenu() {
    closeHamburgerMenu(), setTimeout(() => {
        openLoginModal()
    }, 300)
}

function openRegisterFromMenu() {
    closeHamburgerMenu(), setTimeout(() => {
        openRegisterModal()
    }, 300)
}

function openAboutFromMenu() {
    closeHamburgerMenu(), setTimeout(() => {
        openAboutModal()
    }, 300)
}

function openSubscriptionFromMenu() {
    closeHamburgerMenu(), setTimeout(() => {
        openSubscriptionModal()
    }, 300)
}

function openSettingsFromMenu() {
    closeHamburgerMenu(), setTimeout(() => {
        openSettingsModal()
    }, 300)
}

function openSettingsModal() {
    if (!currentUser) return void showError("Please log in first");
    document.getElementById("settingsUsername").textContent = currentUser.username || "N/A", document.getElementById("settingsEmail").textContent = currentUser.email || "N/A", document.getElementById("settingsCountry").textContent = (currentUser.country_flag || "") + " " + (currentUser.country_name || "Not detected");
    const e = currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    }) : "Unknown";
    document.getElementById("settingsMemberSince").textContent = e, document.getElementById("settingsModal").classList.add("show")
}

function closeSettingsModal() {
    document.getElementById("settingsModal").classList.remove("show")
}

function showDeleteAccountModal() {
    closeSettingsModal(), document.getElementById("deleteConfirmation").value = "", currentUser && currentUser.username && (document.getElementById("deleteAccountTangleId").textContent = currentUser.username), document.getElementById("deleteAccountModal").classList.add("show")
}

function closeDeleteAccountModal() {
    document.getElementById("deleteAccountModal").classList.remove("show"), document.getElementById("deleteConfirmation").value = ""
}
async function confirmDeleteAccount() {
    if ("DEACTIVATE" === document.getElementById("deleteConfirmation").value.trim())
        if (currentUser) {
            console.log("🔄 Deactivating account:", currentUser.username);
            try {
                const e = "file:" === window.location.protocol || "localhost" === window.location.hostname || "127.0.0.1" === window.location.hostname;
                if (!e) {
                    const e = await fetch("/api/deactivate.php", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            credentials: "include",
                            body: JSON.stringify({
                                userId: currentUser.id,
                                email: currentUser.email
                            })
                        }),
                        t = await e.json();
                    if (!t.success) return void alert("Failed to deactivate account: " + (t.error || "Unknown error"));
                    console.log("✅ Account deactivated in backend")
                }
                const t = currentUser.username,
                    n = currentUser.email;
                if (markAccountDeletedInHistory(currentUser.username), localStorage.removeItem("tangleme_current_user"), e) {
                    const e = JSON.parse(localStorage.getItem("tangleme_users") || "[]").map(e => String(e.id) === String(currentUser.id) ? {
                        ...e,
                        active: !1,
                        deleted_at: (new Date).toISOString()
                    } : e);
                    localStorage.setItem("tangleme_users", JSON.stringify(e))
                }
                currentUser = null, closeDeleteAccountModal(), updateAuthUI(!1), alert(`Account "${t}" has been deactivated.\n\nYour Tangle ID and data are preserved.\n\nTo reactivate: Login with your email (${n}) and password anytime.`), console.log("✅ Account deactivation complete")
            } catch (e) {
                console.error("❌ Deactivation error:", e), alert("Failed to deactivate account. Please try again.")
            }
        } else alert("No user logged in");
    else alert('Please type "DEACTIVATE" (in capitals) to confirm')
}

function handleLogout() {
    console.log("🚪 Logging out..."), closeHamburgerMenu(), performLogout(!0)
}

function closeLogoutOptions() {
    const e = document.getElementById("logoutOptionsModal");
    e && (e.style.display = "none")
}

function performLogout(e = !1) {
    console.log("🚪 Logging out... Forget device:", e);
    const t = localStorage.getItem("tangleme_language");
    localStorage.clear(), t && localStorage.setItem("tangleme_language", t), currentUser = null, lastKnownUnreadCount = -1, sessionAdCount = 0, updateAuthUI(!1), closeLogoutOptions(), showSuccess("Logged out successfully. PWA reset to unregistered state."), clearSearch(), userSubscription = {
        tier: "free",
        price: 0,
        photos_used: 0,
        photos_limit: 0,
        status: "active",
        started_at: null,
        expires_at: null,
        auto_renew: !0,
        payment_confirmed: !1
    }, saveSubscription()
}

function openAboutModal() {
    document.getElementById("aboutModal").classList.add("show")
}

function closeAboutModal() {
    document.getElementById("aboutModal").classList.remove("show")
}

function openContactModal() {
    closeHamburgerMenu(), setTimeout(() => {
        document.getElementById("contactModal").classList.add("show")
    }, 300)
}

function closeContactModal() {
    document.getElementById("contactModal").classList.remove("show")
}

function openTermsModal() {
    closeHamburgerMenu(), setTimeout(() => {
        document.getElementById("termsModal").classList.add("show")
    }, 300)
}

function closeTermsModal() {
    document.getElementById("termsModal").classList.remove("show")
}

function openPrivacyModal() {
    closeHamburgerMenu(), setTimeout(() => {
        document.getElementById("privacyModal").classList.add("show")
    }, 300)
}

function closePrivacyModal() {
    document.getElementById("privacyModal").classList.remove("show")
}
async function initializeUsernameSystem() {
    document.getElementById("usernameLoading").style.display = "block", document.getElementById("countryDisplay").style.display = "none", document.getElementById("usernameDisplay").style.display = "none", document.getElementById("usernameActions").style.display = "none";
    try {
        if (userCountry && userCountry.code) detectedCountry = {
            flag: userCountry.flag || userCountry.code.toLowerCase(),
            code: userCountry.code.toUpperCase(),
            name: userCountry.name || userCountry.code.toUpperCase()
        };
        else {
            const e = Intl.DateTimeFormat().resolvedOptions().timeZone;
            detectedCountry = getCountryFromTimezone(e)
        }
        const e = document.getElementById("countryFlag");
        e.className = `fi fi-${detectedCountry.code.toLowerCase()}`, e.textContent = "", document.getElementById("countryCode").textContent = detectedCountry.code, document.getElementById("countryName").textContent = detectedCountry.name, document.getElementById("countryDisplay").style.display = "flex", await generateUsernameAuto()
    } catch (e) {
        console.error("Error initializing username system:", e), detectedCountry = {
            flag: "🌍",
            code: "XX",
            name: "International"
        };
        const t = document.getElementById("countryFlag");
        t.className = "", t.textContent = "🌍", document.getElementById("countryCode").textContent = detectedCountry.code, document.getElementById("countryName").textContent = detectedCountry.name, document.getElementById("countryDisplay").style.display = "flex", await generateUsernameAuto()
    }
}

function getCountryFromTimezone(e) {
    return {
        "Africa/Johannesburg": {
            flag: "🇿🇦",
            code: "ZA",
            name: "South Africa"
        },
        "Africa/Cairo": {
            flag: "🇪🇬",
            code: "EG",
            name: "Egypt"
        },
        "Africa/Lagos": {
            flag: "🇳🇬",
            code: "NG",
            name: "Nigeria"
        },
        "America/New_York": {
            flag: "🇺🇸",
            code: "US",
            name: "United States"
        },
        "America/Los_Angeles": {
            flag: "🇺🇸",
            code: "US",
            name: "United States"
        },
        "America/Chicago": {
            flag: "🇺🇸",
            code: "US",
            name: "United States"
        },
        "America/Sao_Paulo": {
            flag: "🇧🇷",
            code: "BR",
            name: "Brazil"
        },
        "America/Mexico_City": {
            flag: "🇲🇽",
            code: "MX",
            name: "Mexico"
        },
        "Europe/London": {
            flag: "🇬🇧",
            code: "GB",
            name: "United Kingdom"
        },
        "Europe/Paris": {
            flag: "🇫🇷",
            code: "FR",
            name: "France"
        },
        "Europe/Berlin": {
            flag: "🇩🇪",
            code: "DE",
            name: "Germany"
        },
        "Europe/Madrid": {
            flag: "🇪🇸",
            code: "ES",
            name: "Spain"
        },
        "Europe/Rome": {
            flag: "🇮🇹",
            code: "IT",
            name: "Italy"
        },
        "Europe/Amsterdam": {
            flag: "🇳🇱",
            code: "NL",
            name: "Netherlands"
        },
        "Asia/Tokyo": {
            flag: "🇯🇵",
            code: "JP",
            name: "Japan"
        },
        "Asia/Shanghai": {
            flag: "🇨🇳",
            code: "CN",
            name: "China"
        },
        "Asia/Hong_Kong": {
            flag: "🇭🇰",
            code: "HK",
            name: "Hong Kong"
        },
        "Asia/Singapore": {
            flag: "🇸🇬",
            code: "SG",
            name: "Singapore"
        },
        "Asia/Dubai": {
            flag: "🇦🇪",
            code: "AE",
            name: "UAE"
        },
        "Asia/Kolkata": {
            flag: "🇮🇳",
            code: "IN",
            name: "India"
        },
        "Australia/Sydney": {
            flag: "🇦🇺",
            code: "AU",
            name: "Australia"
        },
        "Pacific/Auckland": {
            flag: "🇳🇿",
            code: "NZ",
            name: "New Zealand"
        }
    } [e] || {
        flag: "🌍",
        code: "XX",
        name: "International"
    }
}
document.addEventListener("click", function(e) {
    const t = document.getElementById("hamburgerMenu"),
        n = document.querySelector(".hamburger-btn");
    t && t.classList.contains("open") && !t.contains(e.target) && !n.contains(e.target) && closeHamburgerMenu()
});
const usernameWords = ["alpha", "beta", "gamma", "delta", "echo", "foxtrot", "golf", "hotel", "india", "juliet", "kilo", "lima", "mike", "november", "oscar", "papa", "brave", "swift", "noble", "bright", "clear", "wise", "kind", "calm", "ocean", "river", "storm", "cloud", "thunder", "lightning", "breeze", "wave", "mountain", "valley", "forest", "desert", "island", "glacier", "canyon", "volcano", "tiger", "eagle", "falcon", "panther", "wolf", "bear", "lion", "hawk", "ruby", "emerald", "diamond", "sapphire", "pearl", "jade", "amber", "crystal", "sunrise", "sunset", "midnight", "dawn", "dusk", "twilight", "aurora", "eclipse", "autumn", "spring", "summer", "winter", "season", "harvest", "blossom", "frost", "rocket", "comet", "meteor", "planet", "solar", "lunar", "cosmic", "stellar"];
async function generateUsernameAuto() {
    try {
        const e = usernameWords[Math.floor(Math.random() * usernameWords.length)],
            t = usernameWords[Math.floor(Math.random() * usernameWords.length)],
            n = usernameWords[Math.floor(Math.random() * usernameWords.length)];
        generatedUsername = `${e}.${t}.${n}`.toLowerCase(), displayGeneratedUsername()
    } catch (e) {
        console.error("Generate username error:", e), document.getElementById("usernameLoading").textContent = "⚠️ Failed to generate username"
    }
}

function displayGeneratedUsername() {
    console.log("[USERNAME] Displaying username:", generatedUsername);
    try {
        const e = document.getElementById("usernameLoading");
        e && (e.style.display = "none", console.log("[USERNAME] Hidden loading element"));
        const t = document.getElementById("usernameValue");
        if (t ? (t.textContent = generatedUsername, console.log("[USERNAME] Set username value")) : console.error("[USERNAME] usernameValue element not found!"), detectedCountry) {
            const e = document.getElementById("usernameCountryFull");
            if (e) {
                const t = "XX" !== detectedCountry.code ? `<span class="fi fi-${detectedCountry.code.toLowerCase()}"></span>` : "<span>🌍</span>";
                e.innerHTML = `\n                            <span>${detectedCountry.code}</span>\n                            ${t}\n                            <span>${detectedCountry.name}</span>\n                        `, console.log("[USERNAME] Set country info")
            }
        }
        const n = document.getElementById("usernameDisplay");
        n ? (n.style.display = "block", console.log("[USERNAME] Showing username display")) : console.error("[USERNAME] usernameDisplay element not found!");
        const o = document.getElementById("usernameActions");
        o ? (o.style.display = "flex", console.log("[USERNAME] Showing action buttons")) : console.error("[USERNAME] usernameActions element not found!"), console.log("[USERNAME] Display complete!")
    } catch (e) {
        console.error("[USERNAME] Error displaying username:", e)
    }
}
async function regenerateUsername() {
    document.getElementById("usernameActions").style.display = "none", document.getElementById("usernameLoading").style.display = "block", document.getElementById("usernameLoading").textContent = "🔄 Generating new username...", await generateUsernameAuto()
}

function toggleCustomize() {
    const e = document.getElementById("customizeSection");
    if ("none" !== e.style.display) e.style.display = "none";
    else {
        const t = generatedUsername.split(".");
        document.getElementById("word1").value = t[0] || "", document.getElementById("word2").value = t[1] || "", document.getElementById("word3").value = t[2] || "", e.style.display = "block"
    }
}

function cancelCustomize() {
    document.getElementById("customizeSection").style.display = "none", document.getElementById("word1").value = "", document.getElementById("word2").value = "", document.getElementById("word3").value = "", document.getElementById("validationMessage").style.display = "none"
}
async function validateCustomUsername() {
    clearTimeout(customValidationTimeout);
    const e = document.getElementById("word1").value.trim().toLowerCase(),
        t = document.getElementById("word2").value.trim().toLowerCase(),
        n = document.getElementById("word3").value.trim().toLowerCase(),
        o = document.getElementById("validationMessage"),
        s = document.getElementById("applyCustomBtn");
    if (!e || !t || !n) return o.style.display = "none", void(s.disabled = !0);
    const a = /^[a-z0-9]{2,20}$/;
    return a.test(e) && a.test(t) && a.test(n) ? validateContentSilent(`${e} ${t} ${n}`) ? (o.className = "validation-message validation-checking", o.textContent = "🔄 Checking username...", o.style.display = "block", s.disabled = !0, void(customValidationTimeout = setTimeout(() => {
        const a = `${e}.${t}.${n}`;
        o.className = "validation-message validation-success", o.textContent = `✅ ${a} is available!`, s.disabled = !1
    }, 500))) : (o.className = "validation-message validation-error", o.textContent = "❌ Username contains inappropriate language", o.style.display = "block", void(s.disabled = !0)) : (o.className = "validation-message validation-error", o.textContent = "❌ Each word must be 2-20 characters (letters/numbers only)", o.style.display = "block", void(s.disabled = !0))
}

function applyCustomUsername() {
    const e = document.getElementById("word1").value.trim().toLowerCase(),
        t = document.getElementById("word2").value.trim().toLowerCase(),
        n = document.getElementById("word3").value.trim().toLowerCase();
    generatedUsername = `${e}.${t}.${n}`, displayGeneratedUsername(), cancelCustomize()
}

function resetUsernameSection() {
    document.getElementById("usernameLoading").style.display = "block", document.getElementById("usernameLoading").textContent = "🔄 Generating your unique username...", document.getElementById("countryDisplay").style.display = "none", document.getElementById("usernameDisplay").style.display = "none", document.getElementById("usernameActions").style.display = "none", document.getElementById("customizeSection").style.display = "none", generatedUsername = "", detectedCountry = null
}

function getDeviceFingerprint() {
    const e = localStorage.getItem("tangleme_device_fingerprint");
    if (e) return console.log("📱 Using cached device ID:", e), e;
    console.log("🆕 Generating NEW device ID...");
    const t = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency || 0,
            deviceMemory: navigator.deviceMemory || 0,
            screenResolution: `${screen.width}x${screen.height}`,
            colorDepth: screen.colorDepth,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        n = JSON.stringify(t);
    let o = 0;
    for (let e = 0; e < n.length; e++) o = (o << 5) - o + n.charCodeAt(e), o &= o;
    const s = "device_" + Math.abs(o).toString(36);
    return localStorage.setItem("tangleme_device_fingerprint", s), console.log("✅ New device ID cached:", s), s
}

function getDeviceHistory() {
    const e = localStorage.getItem("tangleme_device_history");
    return e ? JSON.parse(e) : []
}

function saveDeviceHistory(e) {
    localStorage.setItem("tangleme_device_history", JSON.stringify(e))
}

function addToDeviceHistory(e) {
    const t = getDeviceFingerprint(),
        n = getDeviceHistory(),
        o = {
            deviceId: t,
            username: e.username,
            email: e.email,
            createdAt: e.created_at || (new Date).toISOString(),
            deletedAt: null,
            isDeleted: !1
        };
    n.push(o), saveDeviceHistory(n), console.log("Added to device history:", o)
}

function markAccountDeletedInHistory(e) {
    const t = getDeviceFingerprint(),
        n = getDeviceHistory();
    for (let o = n.length - 1; o >= 0; o--)
        if (n[o].deviceId === t && n[o].username === e && !n[o].isDeleted) {
            n[o].isDeleted = !0, n[o].deletedAt = (new Date).toISOString(), saveDeviceHistory(n), console.log("Marked as deleted in history:", n[o]);
            break
        }
}

function checkDeviceHistoryForWarning() {
    const e = getDeviceFingerprint(),
        t = getDeviceHistory().filter(t => t.deviceId === e && t.isDeleted);
    if (t.length > 0) {
        const e = t[t.length - 1];
        return {
            hasPreviousAccount: !0,
            previousUsername: e.username,
            deletedAt: e.deletedAt,
            count: t.length
        }
    }
    return {
        hasPreviousAccount: !1
    }
}

function showDeviceHistoryWarning() {
    const e = checkDeviceHistoryForWarning(),
        t = document.getElementById("deviceHistoryWarning");
    return e.hasPreviousAccount ? (document.getElementById("previousUsername").textContent = e.previousUsername, document.getElementById("previousDeletedDate").textContent = new Date(e.deletedAt).toLocaleDateString(), t.style.display = "block", console.log(`Device history: ${e.count} previous account(s)`), e) : (t.style.display = "none", null)
}

function checkDeviceRegistration() {
    const e = getDeviceFingerprint(),
        t = localStorage.getItem("tangleme_device_id");
    if (console.log("🔍 CHECKING DEVICE REGISTRATION:"), console.log("  Current Device ID:", e), console.log("  Stored Device ID:", t), console.log("  Match:", t === e), t && t === e) {
        const e = JSON.parse(localStorage.getItem("tangleme_device_data") || "{}");
        return console.log("  ✅ Device IS registered!"), console.log("  Stored data:", e), {
            isRegistered: !0,
            email: e.email,
            username: e.username,
            registeredAt: e.registeredAt
        }
    }
    return console.log("  ❌ Device NOT registered"), {
        isRegistered: !1,
        deviceId: e
    }
}

function saveDeviceRegistration(e, t) {
    const n = getDeviceFingerprint();
    console.log("📝 SAVING DEVICE REGISTRATION:"), console.log("  Email:", e), console.log("  Username:", t), console.log("  Device ID:", n), localStorage.setItem("tangleme_device_id", n), localStorage.setItem("tangleme_device_data", JSON.stringify({
        email: e,
        username: t,
        registeredAt: (new Date).toISOString(),
        deviceId: n
    })), console.log("✅ Device registration saved to localStorage"), console.log("  Check: tangleme_device_id =", localStorage.getItem("tangleme_device_id")), console.log("  Check: tangleme_device_data =", localStorage.getItem("tangleme_device_data"))
}
async function handleRegister(e) {
    e.preventDefault();
    const t = "file:" !== window.location.protocol && "localhost" !== window.location.hostname && "127.0.0.1" !== window.location.hostname,
        n = checkDeviceRegistration();
    if (n.isRegistered && !t) {
        const e = document.getElementById("registerError");
        return e.innerHTML = `This device has already been used to register.<br>Account: ${n.username}<br>Registered: ${new Date(n.registeredAt).toLocaleDateString()}`, void(e.style.display = "block")
    }
    if (n.isRegistered && t && (console.log("🔄 MIGRATION MODE: Device has Phase 1 registration, allowing backend migration"), console.log("   Existing user:", n.username), console.log("   Will register in backend database")), !generatedUsername) return void alert("Please wait for username to be generated");
    const o = document.getElementById("registerEmail").value,
        s = document.getElementById("registerPassword").value,
        a = document.getElementById("registerError"),
        r = document.getElementById("registerSubmitBtn");
    r.disabled = !0, r.textContent = "Creating Account...";
    try {
        const e = "file:" === window.location.protocol || "localhost" === window.location.hostname || "127.0.0.1" === window.location.hostname;
        if (console.log("🌐 Registration mode:", e ? "LOCAL (localStorage)" : "BACKEND (API) - PHASE 1.5"), e) {
            console.log("LOCAL MODE: Using localStorage for registration");
            const e = JSON.parse(localStorage.getItem("tangleme_users") || "[]"),
                t = e.find(e => e.email === o);
            if (t) return a.style.display = "none", document.getElementById("existingUsername").textContent = t.username, document.getElementById("emailExistsNotice").style.display = "block", sessionStorage.setItem("pendingLogin_username", t.username), sessionStorage.setItem("pendingLogin_email", o), r.disabled = !1, void(r.textContent = "Create Account");
            document.getElementById("emailExistsNotice").style.display = "none";
            const i = {
                id: Date.now(),
                email: o,
                password: s,
                username: generatedUsername,
                country_code: detectedCountry?.code || null,
                country_name: detectedCountry?.name || null,
                country_flag: detectedCountry?.flag || null,
                created_at: (new Date).toISOString(),
                device_id: n.deviceId
            };
            e.push(i), localStorage.setItem("tangleme_users", JSON.stringify(e)), localStorage.setItem("tangleme_current_user", JSON.stringify(i)), saveDeviceRegistration(o, generatedUsername), addToDeviceHistory(i), currentUser = i, updateAuthUI(!0), closeRegisterModal(), loadMyAds(), showSuccess(`Welcome to Tangle-me, ${generatedUsername}!`)
        } else {
            console.log("🌐 Calling registration API...");
            const e = await fetch("/api/register.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        email: o,
                        password: s,
                        username: generatedUsername,
                        country: detectedCountry?.code || "ZA",
                        countryName: detectedCountry?.name || "South Africa",
                        deviceId: n.deviceId
                    })
                }),
                t = await e.json();
            console.log("📡 Registration API Response:", t), t.success ? (console.log("✅ REGISTRATION SUCCESS from backend!"), saveDeviceRegistration(o, generatedUsername), addToDeviceHistory(t.user), localStorage.setItem("tangleme_current_user", JSON.stringify(t.user)), currentUser = t.user, updateAuthUI(!0), closeRegisterModal(), loadMyAds(), syncSubscriptionStatus(), showSuccess(`Welcome to Tangle-me, ${generatedUsername}!`), console.log("🎉 Registration complete!"), t.user && t.user.email && setTimeout(() => {
                sendVerificationEmail(t.user.email, t.user.id)
            }, 1500)) : "email_exists" === t.error && t.existingUsername ? (console.log("⚠️ Email exists for username:", t.existingUsername), a.style.display = "none", document.getElementById("existingUsername").textContent = t.existingUsername, document.getElementById("emailExistsNotice").style.display = "block", sessionStorage.setItem("pendingLogin_username", t.existingUsername), sessionStorage.setItem("pendingLogin_email", o)) : (console.log("❌ REGISTRATION FAILED from backend"), document.getElementById("emailExistsNotice").style.display = "none", a.textContent = t.error || "Registration failed", a.style.display = "block")
        }
    } catch (e) {
        console.error("Registration error:", e), a.textContent = "Registration failed. Please try again.", a.style.display = "block"
    } finally {
        r.disabled = !1, r.textContent = "Create Account"
    }
}

function switchToRegister() {
    closeLoginModal(), openRegisterModal()
}

function switchToLogin() {
    closeRegisterModal(), openLoginModal()
}

function loginWithExistingAccount() {
    const e = sessionStorage.getItem("pendingLogin_username");
    sessionStorage.getItem("pendingLogin_email"), e ? (closeRegisterModal(), document.getElementById("loginModal").classList.add("show"), document.getElementById("loginError").style.display = "none", document.getElementById("displayedUsername").textContent = e, document.getElementById("usernameInputDisplay").style.display = "block", document.getElementById("manualLoginField").style.display = "none", document.getElementById("switchAccountLink").style.display = "block", document.getElementById("loginIdentifier").value = e, sessionStorage.setItem("crossDeviceLogin", "true"), setTimeout(() => {
        document.getElementById("loginPassword").focus()
    }, 100), console.log("✅ Cross-device login initiated for:", e)) : console.error("No pending login username found")
}

function togglePasswordVisibility(e, t) {
    const n = document.getElementById(e);
    "password" === n.type ? (n.type = "text", t.textContent = "🙈", t.setAttribute("aria-label", "Hide password")) : (n.type = "password", t.textContent = "👁️", t.setAttribute("aria-label", "Show password"))
}
const dummyAds = [{
    id: 9991,
    keywords: "Victorian House for Sale - 4 Bedroom with Sea View",
    description: "Stunning Victorian house with breathtaking ocean views. 4 spacious bedrooms, modern kitchen, beautiful garden. Walking distance to beaches and city center. Perfect family home in prestigious neighborhood.",
    contact: "Email: property@capetown.com | WhatsApp: +27 21 555 1234",
    location_address: "Camps Bay, Cape Town, South Africa",
    location_lat: -33.9526,
    location_lng: 18.3776,
    username: "ocean.sunset.wave",
    user_id: 9991,
    country_flag: "🇿🇦",
    country_code: "ZA",
    country_name: "South Africa",
    member_since: "2024-01-15",
    created_at: "2024-12-15 10:30:00"
}, {
    id: 9992,
    keywords: "Piso en el Centro - 3 Habitaciones cerca del Retiro",
    description: "Hermoso piso de 3 habitaciones en pleno centro de Madrid, a pocos pasos del Parque del Retiro. Completamente renovado, mucha luz natural, cocina moderna. Ideal para familias o profesionales.",
    contact: "Teléfono: +34 91 555 7890 | Email: pisos@madrid.es",
    location_address: "Retiro, Madrid, Spain",
    location_lat: 40.4168,
    location_lng: -3.6847,
    username: "madrid.sol.plaza",
    user_id: 9992,
    country_flag: "🇪🇸",
    country_code: "ES",
    country_name: "Spain",
    member_since: "2024-02-20",
    created_at: "2024-12-10 14:20:00"
}, {
    id: 9993,
    keywords: "Appartement Haussmannien - Vue sur la Tour Eiffel",
    description: "Magnifique appartement haussmannien avec vue imprenable sur la Tour Eiffel. 5 pièces, hauts plafonds, parquet d'origine, cheminées. Quartier prestigieux, proche de tous commerces et transports.",
    contact: "Tél: +33 1 45 55 7890 | Email: immobilier@paris.fr",
    location_address: "7ème Arrondissement, Paris, France",
    location_lat: 48.8584,
    location_lng: 2.2945,
    username: "paris.etoile.lumiere",
    user_id: 9993,
    country_flag: "🇫🇷",
    country_code: "FR",
    country_name: "France",
    member_since: "2023-11-05",
    created_at: "2024-11-28 09:15:00"
}, {
    id: 9994,
    keywords: "BMW 5er - Top Zustand, Vollausstattung",
    description: "BMW 5er in hervorragendem Zustand. Vollausstattung mit Ledersitzen, Navigationssystem, Panoramadach. Nur 45.000 km gelaufen, Scheckheftgepflegt. Nichtraucherfahrzeug. Ein Besitzer.",
    contact: "Tel: +49 30 555 4321 | Email: auto@berlin.de",
    location_address: "Mitte, Berlin, Germany",
    location_lat: 52.52,
    location_lng: 13.405,
    username: "berlin.tor.mauer",
    user_id: 9994,
    country_flag: "🇩🇪",
    country_code: "DE",
    country_name: "Germany",
    member_since: "2024-03-12",
    created_at: "2024-12-20 16:45:00"
}, {
    id: 9995,
    keywords: "Cobertura Duplex - Vista Paulista com Piscina",
    description: "Cobertura duplex de luxo com vista panorâmica da Avenida Paulista. 4 suítes, piscina privativa, churrasqueira, 4 vagas de garagem. Condomínio completo com academia, salão de festas, segurança 24h.",
    contact: "WhatsApp: +55 11 9 5555-1234 | Email: imoveis@saopaulo.com.br",
    location_address: "Jardins, São Paulo, Brazil",
    location_lat: -23.5629,
    location_lng: -46.6544,
    username: "samba.ipanema.carnival",
    user_id: 9995,
    country_flag: "🇧🇷",
    country_code: "BR",
    country_name: "Brazil",
    member_since: "2023-09-08",
    created_at: "2024-12-05 11:00:00"
}, {
    id: 9996,
    keywords: "四合院出租 - 北京传统庭院别墅",
    description: "正宗北京四合院出租，位于二环内核心地段。传统建筑风格，现代化装修。三个独立卧室，私人庭院，停车位。适合家庭居住或商务接待。交通便利，近地铁站。",
    contact: "微信: Beijing2024 | 电话: +86 10 8888 5678",
    location_address: "Dongcheng District, Beijing, China",
    location_lat: 39.9042,
    location_lng: 116.4074,
    username: "dragon.wall.temple",
    user_id: 9996,
    country_flag: "🇨🇳",
    country_code: "CN",
    country_name: "China",
    member_since: "2024-04-18",
    created_at: "2024-12-01 08:20:00"
}];

function showDummyAds() {
    closePostModal(), closeMyTangles(), closeMessages();
    const e = document.getElementById("resultsContainer");
    if (!e) return;
    e.style.display = "block", e.innerHTML = "";
    const t = document.createElement("button");
    t.className = "results-close", t.innerHTML = "×", t.onclick = closeResults, t.setAttribute("aria-label", "Close results"), e.appendChild(t);
    const n = document.createElement("div");
    n.style.cssText = "color: #fff; font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; text-align: center;", n.textContent = "🌟 Tangle-me Demo - Example Ads", e.appendChild(n);
    const o = document.createElement("div");
    o.className = "ads-container", dummyAds.forEach(e => {
        o.appendChild(createAdCard(e, !1, null, null))
    }), e.appendChild(o), e.scrollIntoView({
        behavior: "smooth"
    })
}

function showDummyAdsFromMenu() {
    closeHamburgerMenu(), showDummyAds()
}

function closeResults() {
    const e = document.getElementById("resultsContainer");
    e && (e.style.display = "none", e.innerHTML = "")
}
setInterval(function() {
    currentUser && updateMessageBadge()
}, 3e4);
let currentLanguage = "en",
    i18nInitialized = !1;
const translations = {
    en: {
        tagline: "Your one stop advertising agency",
        post_free: "Post Ad",
        post_desc: "Text ads always free",
        find: "Find",
        find_desc: "Search by distance or location",
        my_tangles: "My Tangles",
        my_tangles_desc: "Saved contacts",
        login: "Login",
        register: "Register",
        logout: "Logout",
        messages: "Messages",
        posted_by: "Posted by",
        tangle_since: "Tangle since",
        location: "Location",
        contact: "Contact",
        send_message: "Send Message",
        edit: "Edit",
        share: "Share",
        delete: "Delete",
        my_ads: "My Ads",
        my_ads_desc: "View & manage your ads",
        no_ads: "No ads posted yet",
        be_first: "Be the first to post!",
        welcome_back: "Welcome Back!",
        create_account: "Create Account",
        email: "Email",
        password: "Password",
        name: "Name (optional)",
        save: "Save",
        cancel: "Cancel",
        close: "Close",
        send: "Send",
        inbox: "Inbox",
        sent: "Sent",
        no_messages: "No messages yet",
        no_tangles: "No saved Tangles yet",
        post_ad_title: "Post Your Ad",
        choose_plan: "Choose Your Plan",
        my_subscription: "My Subscription",
        settings: "Settings",
        deactivate_account: "Deactivate Account",
        about: "About Tangle-me",
        contact_us: "Contact Us",
        edit_ad: "Edit Ad",
        my_note: "My Note",
        ad_details: "Ad Details",
        search_results: "Search Results",
        post_ad: "Post Ad",
        save_changes: "Save Changes",
        save_note: "Save Note",
        new_search: "New Search",
        view_my_ad: "View My Ad",
        post_another: "Post Another Ad",
        done: "Done",
        keywords_label: "Keywords describing your offer",
        keywords_placeholder: "e.g., Au pair service London",
        description_label: "Additional ad description",
        description_placeholder: "Describe what you want to advertise...",
        item_location: "Advert location:",
        location_subtitle: "Choose how to specify the advert's location",
        contact_label: "Contact Information",
        contact_placeholder: "Email, phone, WhatsApp...",
        optional: "(Optional)",
        use_my_location: "Use My Location",
        gps_location: "GPS-based current location",
        pin_on_map: "Pin on Map",
        drop_pin: "Drop a pin anywhere",
        enter_address: "Enter Address",
        search_location: "Search by location name",
        search_location_title: "Search Location",
        address_help: "Enter a precise or approximate address",
        address_placeholder: "e.g., Brussels, Belgium",
        choose_username: "Your Unique Tangle ID",
        your_username: "Your Tangle ID",
        login_subtitle: "Login to manage your ads",
        password_placeholder: "Enter your password",
        no_account: "Don't have an account?",
        register_here: "Register here",
        join_tangles: "Join the Tangles!",
        your_country: "Your Country:",
        username_subtitle: "3 unique words that represent you",
        regenerate: "Generate New",
        customize: "Edit Words",
        generating_username: "Generating your unique username...",
        customize_username: "Customize Your Username",
        type_message: "Type your message here...",
        message_hint: "Include your contact method so advertiser can reach you",
        your_tangle_id: "Your Tangle ID",
        member_since: "Member Since",
        manage_subscription: "Manage Subscription",
        danger_zone: "Danger Zone",
        search_radius: "Search Radius",
        select_radius: "Select search radius",
        around_me: "Around Me",
        free_tier: "Free",
        basic_tier: "Basic",
        pro_tier: "Pro",
        per_month: "/month",
        photos: "photos",
        unlimited: "Unlimited",
        current_plan: "Current Plan",
        upgrade: "Upgrade",
        advertiser: "Advertiser",
        loading: "Loading...",
        error: "Error",
        success: "Success",
        confirm: "Confirm",
        manage_ads: "Manage your posted advertisements",
        current_geolocation: "Current device geolocation",
        demo: "Tangle-me Demo",
        about_welcome: "Welcome to Tangle-me, your global classifieds platform connecting users (or Tangles in our language) where YOU are in control. You don't need one platform for selling your house, another for selling your car, or another for posting your CV looking for job opportunities. Here you can find auto technicians, electricians, French-speaking Au pairs, architects, lawyers, real estate agents, and more—geolocating them around you or anywhere worldwide.",
        our_mission: "Our Mission",
        mission_text: "We believe that advertising your products or services should be accessible to everyone, everywhere. Advertise so you can be found.",
        how_it_works: "How It Works",
        how_it_works_text: "This app works only if your device geolocation is ON, which is your normal device behaviour in general. When advertising or looking for posted ads, use your current device geolocation or drop a 📍 on the map to indicate where your ad is relevant for searches and to whom the ad is addressed. Then define a radius around this location for users looking for ads in that particular area.",
        how_it_works_example: "Example: You are in Europe but you have a house in Melbourne, Australia that you want to sell. Drop a 📍 in the suburb where your house is located, provide a full description, and wait for someone from around the world to find your ad. Once a match is made between users, the built-in messaging app can be used for connection, but you are free to use any other platform for contact.",
        why_choose: "Why Choose Tangle-me?",
        free_forever: "Free Forever:",
        free_forever_desc: "Text advertisements never cost a penny",
        global_reach: "Global Reach:",
        global_reach_desc: "Available in 10 languages across the world",
        simple_fast: "Simple & Fast:",
        simple_fast_desc: "Post your ad in seconds, no complicated forms",
        built_trust: "Built on Trust:",
        built_trust_desc: "Connect with verified Tangles (trusted contacts)",
        supported_languages: "Supported Languages",
        languages_list: "English, Spanish, French, German, Portuguese, Chinese, Arabic, Hindi, Russian, Japanese",
        browser_tip: "Browser Recommendation:",
        browser_tip_desc: "For best user experience use Brave, Chrome, Edge or any Chromium-based browser.",
        contact_intro: "Have questions, feedback, or need help? We'd love to hear from you!",
        email_us: "Email us at:",
        email_tip: "Tip:",
        email_tip_desc: "Click the email address above to open your default email app.",
        terms: "Terms",
        privacy: "Privacy",
        terms_title: "📜 Terms & Conditions",
        privacy_title: "🔒 Privacy Policy",
        legal_english_note: "Legal documents are provided in English.",
        i_understand: "I Understand",
        add_photos: "Add Photos",
        add_photo: "Add Photo",
        photos_remaining: "photos remaining",
        upgrade_for_photos: "Upgrade for Photos",
        upgrade_to_pro: "Upgrade to PRO",
        your_plan: "Your Plan:",
        manage_ads: "Manage your posted advertisements",
        post_new: "Post New",
        bulk_upload: "Smart Upload",
        loading: "Loading...",
        bulk_upload_title: "Smart Upload",
        bulk_upload_desc: "Upload files with text & photos — AI creates your ads",
        bulk_step1_title: "Download Template",
        bulk_step1_desc: "Get the CSV template with the correct format",
        bulk_step2_title: "Fill Your Ads",
        bulk_step2_desc: "Add up to 50 ads per upload",
        bulk_step3_title: "Upload & Confirm",
        bulk_step3_desc: "Preview your ads before posting",
        download_template: "Download Template",
        select_csv: "Select CSV File",
        csv_hint: "or drag and drop",
        preview: "Preview",
        post_all_ads: "Post All Ads",
        posting: "Posting...",
        posted: "posted",
        failed: "failed",
        valid: "valid",
        ads: "ads",
        post: "Post",
        confirm_post: "Post",
        no_valid_ads: "No valid ads to post",
        cancel_upload: "Upload in progress. Are you sure you want to cancel?",
        login_required: "Please login to use bulk upload",
        invalid_file: "Please select a CSV file",
        csv_empty: "CSV file is empty or has no data rows",
        install_app: "Install Tangle-me",
        install_app_desc: "Add to your home screen for quick access",
        install: "Install",
        back: "Back",
        your_ad: "Your Ad",
        advertise_anywhere: "Advertise anywhere in the world",
        photos_title: "Photos",
        photos_require_sub: "Photos require a subscription",
        photos_sub_desc: "Basic (€2.99/mo) for 20 photos or Pro (€9.99/mo) for unlimited ads and photos (20 per ad)",
        view_plans: "View Plans",
        this_ad: "This ad",
        photo_tip: "First photo becomes the main image. Tap × to remove.",
        uploading_photos: "Uploading photos...",
        please_login_post: "Please log in to post ads",
        return_main: "Return to the main page to log in or register",
        go_main: "Go to Main Page",
        map_hint_post: "Tap on the map to set your ad's location",
        detecting: "Detecting...",
        search_title: "Search",
        find_ads: "Find Ads",
        search_placeholder: "e.g. Toyota FJ Cruiser, apartment to let, plumber...",
        use_current_location: "Use my current location",
        drop_pin_world: "Drop a pin anywhere in the world",
        map_hint_find: "Tap on the map to drop a pin",
        search_location_label: "Search Location:",
        search_btn: "Search",
        km: "km",
        global_search: "Global",
        limit_reached: "Limit reached",
        location_title: "Location",
        contact_title: "Contact"
    },
    es: {
        tagline: "Tu agencia publicitaria integral",
        post_free: "Publicar",
        post_desc: "Anuncios de texto siempre gratis",
        find: "Buscar",
        find_desc: "Buscar por distancia o ubicación",
        my_tangles: "Mis Tangles",
        my_tangles_desc: "Contactos guardados",
        login: "Iniciar Sesión",
        register: "Registrarse",
        logout: "Cerrar Sesión",
        messages: "Mensajes",
        posted_by: "Publicado por",
        tangle_since: "Tangle desde",
        location: "Ubicación",
        contact: "Contacto",
        send_message: "Enviar Mensaje",
        edit: "Editar",
        share: "Compartir",
        delete: "Eliminar",
        my_ads: "Mis Anuncios",
        my_ads_desc: "Ver y gestionar tus anuncios",
        no_ads: "No hay anuncios publicados",
        be_first: "¡Sé el primero en publicar!",
        welcome_back: "¡Bienvenido de nuevo!",
        create_account: "Crear Cuenta",
        email: "Correo Electrónico",
        password: "Contraseña",
        name: "Nombre (opcional)",
        save: "Guardar",
        cancel: "Cancelar",
        close: "Cerrar",
        send: "Enviar",
        inbox: "Bandeja de entrada",
        sent: "Enviados",
        no_messages: "No hay mensajes",
        no_tangles: "No hay Tangles guardados",
        post_ad_title: "Publica Tu Anuncio",
        choose_plan: "Elige Tu Plan",
        my_subscription: "Mi Suscripción",
        settings: "Configuración",
        deactivate_account: "Desactivar Cuenta",
        about: "Acerca de Tangle-me",
        contact_us: "Contáctanos",
        edit_ad: "Editar Anuncio",
        my_note: "Mi Nota",
        ad_details: "Detalles del Anuncio",
        search_results: "Resultados de Búsqueda",
        post_ad: "Publicar Anuncio",
        save_changes: "Guardar Cambios",
        save_note: "Guardar Nota",
        new_search: "Nueva Búsqueda",
        view_my_ad: "Ver Mi Anuncio",
        post_another: "Publicar Otro",
        done: "Hecho",
        keywords_label: "Palabras clave de tu oferta",
        keywords_placeholder: "ej., Servicio de au pair Madrid",
        description_label: "Descripción adicional",
        description_placeholder: "Describe lo que ofreces...",
        item_location: "Ubicación del anuncio:",
        location_subtitle: "Elige cómo especificar la ubicación",
        contact_label: "Información de Contacto",
        contact_placeholder: "Email, teléfono, WhatsApp...",
        optional: "(Opcional)",
        use_my_location: "Usar Mi Ubicación",
        gps_location: "Ubicación GPS actual",
        pin_on_map: "Marcar en Mapa",
        drop_pin: "Coloca un pin",
        enter_address: "Ingresar Dirección",
        search_location: "Buscar por ubicación",
        search_location_title: "Buscar Ubicación",
        address_help: "Ingresa una dirección",
        address_placeholder: "ej., Madrid, España",
        choose_username: "Tu Tangle ID Único",
        your_username: "Tu Tangle ID",
        login_subtitle: "Inicia sesión para gestionar tus anuncios",
        password_placeholder: "Ingresa tu contraseña",
        no_account: "¿No tienes cuenta?",
        register_here: "Regístrate aquí",
        join_tangles: "¡Únete a los Tangles!",
        your_country: "Tu País:",
        username_subtitle: "3 palabras únicas que te representan",
        regenerate: "Generar Nuevo",
        customize: "Editar Palabras",
        generating_username: "Generando tu usuario único...",
        customize_username: "Personaliza Tu Usuario",
        type_message: "Escribe tu mensaje aquí...",
        message_hint: "Incluye tu método de contacto",
        your_tangle_id: "Tu Tangle ID",
        member_since: "Miembro Desde",
        manage_subscription: "Gestionar Suscripción",
        danger_zone: "Zona de Peligro",
        search_radius: "Radio de Búsqueda",
        select_radius: "Selecciona el radio",
        around_me: "A Mi Alrededor",
        free_tier: "Gratis",
        basic_tier: "Básico",
        pro_tier: "Pro",
        per_month: "/mes",
        photos: "fotos",
        unlimited: "Ilimitado",
        current_plan: "Plan Actual",
        upgrade: "Mejorar",
        advertiser: "Anunciante",
        loading: "Cargando...",
        error: "Error",
        success: "Éxito",
        confirm: "Confirmar",
        manage_ads: "Gestiona tus anuncios publicados",
        current_geolocation: "Geolocalización del dispositivo",
        demo: "Demo de Tangle-me",
        about_welcome: "Bienvenido a Tangle-me, tu plataforma global de clasificados que conecta usuarios (o Tangles en nuestro idioma) donde <strong>tú</strong> tienes el control. No necesitas una plataforma para vender tu casa, otra para vender tu coche, u otra para publicar tu CV buscando oportunidades laborales. Aquí puedes encontrar técnicos de autos, electricistas, Au pairs de habla francesa, arquitectos, abogados, agentes inmobiliarios y más—geolocalizándolos cerca de ti o en cualquier parte del mundo.",
        our_mission: "Nuestra Misión",
        mission_text: "Creemos que anunciar tus productos o servicios debe ser accesible para todos, en todas partes. Anuncia para que te encuentren.",
        how_it_works: "Cómo Funciona",
        how_it_works_text: "Esta app solo funciona si la geolocalización de tu dispositivo está ACTIVADA, lo cual es el comportamiento normal de tu dispositivo. Al anunciar o buscar anuncios, usa tu geolocalización actual o coloca un 📍 en el mapa para indicar dónde es relevante tu anuncio y a quién va dirigido. Luego define un radio alrededor de esta ubicación para usuarios que buscan anuncios en esa área.",
        how_it_works_example: "Ejemplo: Estás en Europa pero tienes una casa en Melbourne, Australia que quieres vender. Coloca un 📍 en el suburbio donde está tu casa, proporciona una descripción completa y espera a que alguien del mundo encuentre tu anuncio. Una vez que se conectan los usuarios, se puede usar la mensajería integrada, pero eres libre de usar cualquier otra plataforma de contacto.",
        why_choose: "¿Por qué elegir Tangle-me?",
        free_forever: "Gratis Para Siempre:",
        free_forever_desc: "Los anuncios de texto nunca cuestan nada",
        global_reach: "Alcance Global:",
        global_reach_desc: "Disponible en 10 idiomas en todo el mundo",
        simple_fast: "Simple y Rápido:",
        simple_fast_desc: "Publica tu anuncio en segundos, sin formularios complicados",
        built_trust: "Basado en Confianza:",
        built_trust_desc: "Conecta con Tangles verificados (contactos de confianza)",
        supported_languages: "Idiomas Soportados",
        languages_list: "Inglés, Español, Francés, Alemán, Portugués, Chino, Árabe, Hindi, Ruso, Japonés",
        browser_tip: "Recomendación de Navegador:",
        browser_tip_desc: "Para mejor experiencia usa Brave, Chrome, Edge o cualquier navegador basado en Chromium.",
        contact_intro: "¿Tienes preguntas, comentarios o necesitas ayuda? ¡Nos encantaría saber de ti!",
        email_us: "Escríbenos a:",
        email_tip: "Consejo:",
        email_tip_desc: "Haz clic en la dirección de correo para abrir tu aplicación de email.",
        terms: "Términos",
        privacy: "Privacidad",
        terms_title: "📜 Términos y Condiciones",
        privacy_title: "🔒 Política de Privacidad",
        legal_english_note: "Los documentos legales están disponibles en inglés.",
        i_understand: "Entendido",
        add_photos: "Agregar Fotos",
        add_photo: "Agregar Foto",
        photos_remaining: "fotos restantes",
        upgrade_for_photos: "Mejora para Fotos",
        upgrade_to_pro: "Mejora a PRO",
        your_plan: "Tu Plan:",
        manage_ads: "Gestiona tus anuncios publicados",
        post_new: "Nuevo Anuncio",
        bulk_upload: "Carga Inteligente",
        loading: "Cargando...",
        bulk_upload_title: "Carga Inteligente",
        bulk_upload_desc: "Sube archivos con texto y fotos — la IA crea tus anuncios",
        bulk_step1_title: "Descargar Plantilla",
        bulk_step1_desc: "Obtén la plantilla CSV con el formato correcto",
        bulk_step2_title: "Completa tus Anuncios",
        bulk_step2_desc: "Añade hasta 50 anuncios por carga",
        bulk_step3_title: "Subir y Confirmar",
        bulk_step3_desc: "Previsualiza tus anuncios antes de publicar",
        download_template: "Descargar Plantilla",
        select_csv: "Seleccionar Archivo CSV",
        csv_hint: "o arrastra y suelta",
        preview: "Vista Previa",
        post_all_ads: "Publicar Todos",
        posting: "Publicando...",
        posted: "publicados",
        failed: "fallidos",
        valid: "válidos",
        ads: "anuncios",
        post: "Publicar",
        confirm_post: "¿Publicar",
        no_valid_ads: "No hay anuncios válidos para publicar",
        cancel_upload: "Carga en progreso. ¿Estás seguro de cancelar?",
        login_required: "Inicia sesión para usar carga masiva",
        invalid_file: "Selecciona un archivo CSV",
        csv_empty: "El archivo CSV está vacío o no tiene datos",
        install_app: "Instalar Tangle-me",
        install_app_desc: "Agregar a tu pantalla de inicio",
        install: "Instalar",
        back: "Atrás",
        your_ad: "Tu Anuncio",
        advertise_anywhere: "Anuncia en cualquier parte del mundo",
        photos_title: "Fotos",
        photos_require_sub: "Las fotos requieren una suscripción",
        photos_sub_desc: "Básico (€2.99/mes) para 20 fotos o Pro (€9.99/mes) para anuncios y fotos ilimitados (20 por anuncio)",
        view_plans: "Ver Planes",
        this_ad: "Este anuncio",
        photo_tip: "La primera foto será la imagen principal. Toca × para eliminar.",
        uploading_photos: "Subiendo fotos...",
        please_login_post: "Inicia sesión para publicar anuncios",
        return_main: "Vuelve a la página principal para iniciar sesión o registrarte",
        go_main: "Ir a Página Principal",
        map_hint_post: "Toca el mapa para establecer la ubicación de tu anuncio",
        detecting: "Detectando...",
        search_title: "Buscar",
        find_ads: "Buscar Anuncios",
        search_placeholder: "ej. Toyota FJ Cruiser, departamento, plomero...",
        use_current_location: "Usar mi ubicación actual",
        drop_pin_world: "Coloca un pin en cualquier lugar del mundo",
        map_hint_find: "Toca el mapa para colocar un pin",
        search_location_label: "Ubicación de búsqueda:",
        search_btn: "Buscar",
        km: "km",
        global_search: "Global",
        limit_reached: "Límite alcanzado",
        location_title: "Ubicación",
        contact_title: "Contacto"
    },
    fr: {
        tagline: "Votre agence publicitaire tout-en-un",
        post_free: "Publier",
        post_desc: "Annonces texte toujours gratuites",
        find: "Rechercher",
        find_desc: "Rechercher par distance ou lieu",
        my_tangles: "Mes Tangles",
        my_tangles_desc: "Contacts sauvegardés",
        login: "Connexion",
        register: "S'inscrire",
        logout: "Déconnexion",
        messages: "Messages",
        posted_by: "Publié par",
        tangle_since: "Tangle depuis",
        location: "Emplacement",
        contact: "Contact",
        send_message: "Envoyer un Message",
        edit: "Modifier",
        share: "Partager",
        delete: "Supprimer",
        my_ads: "Mes Annonces",
        my_ads_desc: "Voir et gérer vos annonces",
        no_ads: "Aucune annonce publiée",
        be_first: "Soyez le premier à publier!",
        welcome_back: "Bienvenue!",
        create_account: "Créer un Compte",
        email: "Email",
        password: "Mot de passe",
        name: "Nom (optionnel)",
        save: "Enregistrer",
        cancel: "Annuler",
        close: "Fermer",
        send: "Envoyer",
        inbox: "Boîte de réception",
        sent: "Envoyés",
        no_messages: "Aucun message",
        no_tangles: "Aucun Tangle sauvegardé",
        post_ad_title: "Publiez Votre Annonce",
        choose_plan: "Choisissez Votre Plan",
        my_subscription: "Mon Abonnement",
        settings: "Paramètres",
        deactivate_account: "Désactiver le Compte",
        about: "À propos de Tangle-me",
        contact_us: "Contactez-nous",
        edit_ad: "Modifier l'Annonce",
        my_note: "Ma Note",
        ad_details: "Détails de l'Annonce",
        search_results: "Résultats de Recherche",
        post_ad: "Publier l'Annonce",
        save_changes: "Enregistrer les Modifications",
        save_note: "Enregistrer la Note",
        new_search: "Nouvelle Recherche",
        view_my_ad: "Voir Mon Annonce",
        post_another: "Publier une Autre",
        done: "Terminé",
        keywords_label: "Mots-clés de votre offre",
        keywords_placeholder: "ex., Service au pair Paris",
        description_label: "Description supplémentaire",
        description_placeholder: "Décrivez ce que vous offrez...",
        item_location: "Emplacement de l'annonce:",
        location_subtitle: "Choisissez comment spécifier l'emplacement",
        contact_label: "Informations de Contact",
        contact_placeholder: "Email, téléphone, WhatsApp...",
        optional: "(Optionnel)",
        use_my_location: "Utiliser Ma Position",
        gps_location: "Position GPS actuelle",
        pin_on_map: "Marquer sur la Carte",
        drop_pin: "Déposer un marqueur",
        enter_address: "Entrer l'Adresse",
        search_location: "Rechercher par lieu",
        search_location_title: "Rechercher un Lieu",
        address_help: "Entrez une adresse",
        address_placeholder: "ex., Paris, France",
        choose_username: "Votre Tangle ID Unique",
        your_username: "Votre Tangle ID",
        login_subtitle: "Connectez-vous pour gérer vos annonces",
        password_placeholder: "Entrez votre mot de passe",
        no_account: "Pas de compte?",
        register_here: "Inscrivez-vous ici",
        join_tangles: "Rejoignez les Tangles!",
        your_country: "Votre Pays:",
        username_subtitle: "3 mots uniques qui vous représentent",
        regenerate: "Générer Nouveau",
        customize: "Modifier les Mots",
        generating_username: "Génération de votre identifiant...",
        customize_username: "Personnalisez Votre Identifiant",
        type_message: "Tapez votre message ici...",
        message_hint: "Incluez votre méthode de contact",
        your_tangle_id: "Votre Tangle ID",
        member_since: "Membre Depuis",
        manage_subscription: "Gérer l'Abonnement",
        danger_zone: "Zone Dangereuse",
        search_radius: "Rayon de Recherche",
        select_radius: "Sélectionnez le rayon",
        around_me: "Autour de Moi",
        free_tier: "Gratuit",
        basic_tier: "Basique",
        pro_tier: "Pro",
        per_month: "/mois",
        photos: "photos",
        unlimited: "Illimité",
        current_plan: "Plan Actuel",
        upgrade: "Améliorer",
        advertiser: "Annonceur",
        loading: "Chargement...",
        error: "Erreur",
        success: "Succès",
        confirm: "Confirmer",
        manage_ads: "Gérez vos annonces publiées",
        current_geolocation: "Géolocalisation de l'appareil",
        demo: "Démo Tangle-me",
        about_welcome: "Bienvenue sur Tangle-me, votre plateforme mondiale de petites annonces connectant les utilisateurs (ou Tangles dans notre langage) où <strong>vous</strong> êtes aux commandes. Vous n'avez pas besoin d'une plateforme pour vendre votre maison, une autre pour vendre votre voiture, ou une autre pour publier votre CV à la recherche d'opportunités d'emploi. Ici, vous pouvez trouver des techniciens auto, des électriciens, des Au pairs francophones, des architectes, des avocats, des agents immobiliers et plus encore—en les géolocalisant autour de vous ou n'importe où dans le monde.",
        our_mission: "Notre Mission",
        mission_text: "Nous croyons que la publicité de vos produits ou services doit être accessible à tous, partout. Annoncez pour être trouvé.",
        how_it_works: "Comment Ça Marche",
        how_it_works_text: "Cette application ne fonctionne que si la géolocalisation de votre appareil est ACTIVÉE, ce qui est le comportement normal de votre appareil en général. Lorsque vous publiez ou recherchez des annonces, utilisez votre géolocalisation actuelle ou déposez un 📍 sur la carte pour indiquer où votre annonce est pertinente pour les recherches et à qui elle s'adresse. Ensuite, définissez un rayon autour de cet emplacement pour les utilisateurs recherchant des annonces dans cette zone.",
        how_it_works_example: "<strong>Exemple :</strong> Vous êtes en Europe mais vous avez une maison à Melbourne, en Australie, que vous voulez vendre. Déposez un 📍 dans le quartier où se trouve votre maison, fournissez une description complète et attendez que quelqu'un dans le monde trouve votre annonce. Une fois la connexion établie entre utilisateurs, la messagerie intégrée peut être utilisée, mais vous êtes libre d'utiliser toute autre plateforme de contact.",
        why_choose: "Pourquoi choisir Tangle-me?",
        free_forever: "Gratuit Pour Toujours:",
        free_forever_desc: "Les annonces texte ne coûtent jamais rien",
        global_reach: "Portée Mondiale:",
        global_reach_desc: "Disponible en 6 langues à travers le monde",
        simple_fast: "Simple et Rapide:",
        simple_fast_desc: "Publiez votre annonce en secondes, sans formulaires compliqués",
        built_trust: "Basé sur la Confiance:",
        built_trust_desc: "Connectez-vous avec des Tangles vérifiés (contacts de confiance)",
        supported_languages: "Langues Prises en Charge",
        languages_list: "Anglais, Espagnol, Français, Allemand, Portugais, Chinois, Arabe, Hindi, Russe, Japonais",
        browser_tip: "Recommandation de Navigateur:",
        browser_tip_desc: "Pour une meilleure expérience, utilisez Brave, Chrome, Edge ou tout navigateur basé sur Chromium.",
        contact_intro: "Vous avez des questions, des commentaires ou besoin d'aide? Nous serions ravis de vous entendre!",
        email_us: "Écrivez-nous à:",
        email_tip: "Astuce:",
        email_tip_desc: "Cliquez sur l'adresse e-mail ci-dessus pour ouvrir votre application de messagerie.",
        terms: "Conditions",
        privacy: "Confidentialité",
        terms_title: "📜 Conditions Générales",
        privacy_title: "🔒 Politique de Confidentialité",
        legal_english_note: "Les documents juridiques sont fournis en anglais.",
        i_understand: "J'ai compris",
        add_photos: "Ajouter Photos",
        add_photo: "Ajouter Photo",
        photos_remaining: "photos restantes",
        upgrade_for_photos: "Améliorer pour Photos",
        upgrade_to_pro: "Améliorer vers PRO",
        your_plan: "Votre Plan:",
        manage_ads: "Gérez vos annonces publiées",
        post_new: "Nouvelle Annonce",
        bulk_upload: "Upload Intelligent",
        loading: "Chargement...",
        bulk_upload_title: "Upload Intelligent",
        bulk_upload_desc: "Téléchargez des fichiers avec texte et photos — l'IA crée vos annonces",
        bulk_step1_title: "Télécharger le Modèle",
        bulk_step1_desc: "Obtenez le modèle CSV avec le bon format",
        bulk_step2_title: "Remplissez vos Annonces",
        bulk_step2_desc: "Ajoutez jusqu'à 50 annonces par téléchargement",
        bulk_step3_title: "Télécharger et Confirmer",
        bulk_step3_desc: "Prévisualisez vos annonces avant publication",
        download_template: "Télécharger le Modèle",
        select_csv: "Sélectionner Fichier CSV",
        csv_hint: "ou glisser-déposer",
        preview: "Aperçu",
        post_all_ads: "Publier Tout",
        posting: "Publication...",
        posted: "publiées",
        failed: "échouées",
        valid: "valides",
        ads: "annonces",
        post: "Publier",
        confirm_post: "Publier",
        no_valid_ads: "Aucune annonce valide à publier",
        cancel_upload: "Téléchargement en cours. Êtes-vous sûr d'annuler?",
        login_required: "Connectez-vous pour utiliser le téléchargement en masse",
        invalid_file: "Veuillez sélectionner un fichier CSV",
        csv_empty: "Le fichier CSV est vide ou sans données",
        install_app: "Installer Tangle-me",
        install_app_desc: "Ajouter à votre écran d'accueil",
        install: "Installer",
        back: "Retour",
        your_ad: "Votre Annonce",
        advertise_anywhere: "Annoncez n'importe où dans le monde",
        photos_title: "Photos",
        photos_require_sub: "Les photos nécessitent un abonnement",
        photos_sub_desc: "Basic (2,99€/mois) pour 20 photos ou Pro (9,99€/mois) pour annonces et photos illimitées (20 par annonce)",
        view_plans: "Voir les Plans",
        this_ad: "Cette annonce",
        photo_tip: "La première photo sera l'image principale. Appuyez × pour supprimer.",
        uploading_photos: "Envoi des photos...",
        please_login_post: "Connectez-vous pour publier des annonces",
        return_main: "Retournez à la page principale pour vous connecter",
        go_main: "Aller à la Page Principale",
        map_hint_post: "Appuyez sur la carte pour définir l'emplacement",
        detecting: "Détection...",
        search_title: "Recherche",
        find_ads: "Trouver des Annonces",
        search_placeholder: "ex. Toyota FJ Cruiser, appartement, plombier...",
        use_current_location: "Utiliser ma position actuelle",
        drop_pin_world: "Placez un repère n'importe où dans le monde",
        map_hint_find: "Appuyez sur la carte pour placer un repère",
        search_location_label: "Lieu de recherche :",
        search_btn: "Rechercher",
        km: "km",
        global_search: "Global",
        limit_reached: "Limite atteinte",
        location_title: "Lieu",
        contact_title: "Contact"
    },
    de: {
        tagline: "Ihre Werbeagentur aus einer Hand",
        post_free: "Anzeige",
        post_desc: "Textanzeigen immer kostenlos",
        find: "Suchen",
        find_desc: "Nach Entfernung oder Ort suchen",
        my_tangles: "Meine Tangles",
        my_tangles_desc: "Gespeicherte Kontakte",
        login: "Anmelden",
        register: "Registrieren",
        logout: "Abmelden",
        messages: "Nachrichten",
        posted_by: "Gepostet von",
        tangle_since: "Tangle seit",
        location: "Standort",
        contact: "Kontakt",
        send_message: "Nachricht Senden",
        edit: "Bearbeiten",
        share: "Teilen",
        delete: "Löschen",
        my_ads: "Meine Anzeigen",
        my_ads_desc: "Anzeigen anzeigen und verwalten",
        no_ads: "Noch keine Anzeigen",
        be_first: "Seien Sie der Erste!",
        welcome_back: "Willkommen zurück!",
        create_account: "Konto Erstellen",
        email: "E-Mail",
        password: "Passwort",
        name: "Name (optional)",
        save: "Speichern",
        cancel: "Abbrechen",
        close: "Schließen",
        send: "Senden",
        inbox: "Posteingang",
        sent: "Gesendet",
        no_messages: "Keine Nachrichten",
        no_tangles: "Keine gespeicherten Tangles",
        post_ad_title: "Anzeige Aufgeben",
        choose_plan: "Wählen Sie Ihren Plan",
        my_subscription: "Mein Abonnement",
        settings: "Einstellungen",
        deactivate_account: "Konto Deaktivieren",
        about: "Über Tangle-me",
        contact_us: "Kontaktieren Sie uns",
        edit_ad: "Anzeige Bearbeiten",
        my_note: "Meine Notiz",
        ad_details: "Anzeigendetails",
        search_results: "Suchergebnisse",
        post_ad: "Anzeige Aufgeben",
        save_changes: "Änderungen Speichern",
        save_note: "Notiz Speichern",
        new_search: "Neue Suche",
        view_my_ad: "Meine Anzeige Ansehen",
        post_another: "Weitere Aufgeben",
        done: "Fertig",
        keywords_label: "Schlüsselwörter Ihres Angebots",
        keywords_placeholder: "z.B., Au-pair Service Berlin",
        description_label: "Zusätzliche Beschreibung",
        description_placeholder: "Beschreiben Sie Ihr Angebot...",
        item_location: "Standort der Anzeige:",
        location_subtitle: "Wählen Sie die Standortangabe",
        contact_label: "Kontaktinformationen",
        contact_placeholder: "E-Mail, Telefon, WhatsApp...",
        optional: "(Optional)",
        use_my_location: "Meinen Standort Verwenden",
        gps_location: "Aktueller GPS-Standort",
        pin_on_map: "Auf Karte Markieren",
        drop_pin: "Markierung setzen",
        enter_address: "Adresse Eingeben",
        search_location: "Nach Ort suchen",
        search_location_title: "Ort Suchen",
        address_help: "Geben Sie eine Adresse ein",
        address_placeholder: "z.B., Berlin, Deutschland",
        choose_username: "Ihre Einzigartige Tangle ID",
        your_username: "Ihre Tangle ID",
        login_subtitle: "Melden Sie sich an um Ihre Anzeigen zu verwalten",
        password_placeholder: "Passwort eingeben",
        no_account: "Kein Konto?",
        register_here: "Hier registrieren",
        join_tangles: "Treten Sie den Tangles bei!",
        your_country: "Ihr Land:",
        username_subtitle: "3 einzigartige Wörter für Sie",
        regenerate: "Neu Generieren",
        customize: "Wörter Bearbeiten",
        generating_username: "Generiere Ihre ID...",
        customize_username: "ID Anpassen",
        type_message: "Nachricht hier eingeben...",
        message_hint: "Kontaktmethode angeben",
        your_tangle_id: "Ihre Tangle ID",
        member_since: "Mitglied Seit",
        manage_subscription: "Abonnement Verwalten",
        danger_zone: "Gefahrenzone",
        search_radius: "Suchradius",
        select_radius: "Radius auswählen",
        around_me: "Um Mich Herum",
        free_tier: "Kostenlos",
        basic_tier: "Basis",
        pro_tier: "Pro",
        per_month: "/Monat",
        photos: "Fotos",
        unlimited: "Unbegrenzt",
        current_plan: "Aktueller Plan",
        upgrade: "Upgraden",
        advertiser: "Inserent",
        loading: "Laden...",
        error: "Fehler",
        success: "Erfolg",
        confirm: "Bestätigen",
        manage_ads: "Verwalten Sie Ihre Anzeigen",
        current_geolocation: "Aktuelle Geräte-Geolokalisierung",
        demo: "Tangle-me Demo",
        about_welcome: "Willkommen bei Tangle-me, Ihrer globalen Kleinanzeigen-Plattform, die Benutzer (oder Tangles in unserer Sprache) verbindet, wo <strong>Sie</strong> die Kontrolle haben. Sie brauchen keine Plattform zum Verkauf Ihres Hauses, eine andere für Ihr Auto, oder eine weitere für Ihren Lebenslauf bei der Jobsuche. Hier finden Sie Kfz-Techniker, Elektriker, französischsprachige Au-pairs, Architekten, Anwälte, Immobilienmakler und mehr—georeferenziert in Ihrer Nähe oder weltweit.",
        our_mission: "Unsere Mission",
        mission_text: "Wir glauben, dass Werbung für Ihre Produkte oder Dienstleistungen für jeden und überall zugänglich sein sollte. Werben Sie, damit Sie gefunden werden.",
        how_it_works: "Wie Es Funktioniert",
        how_it_works_text: "Diese App funktioniert nur, wenn die Geolokalisierung Ihres Geräts EINGESCHALTET ist, was das normale Verhalten Ihres Geräts ist. Wenn Sie inserieren oder nach Anzeigen suchen, verwenden Sie Ihre aktuelle Geolokalisierung oder setzen Sie einen 📍 auf der Karte, um anzugeben, wo Ihre Anzeige für Suchen relevant ist und an wen sie sich richtet. Definieren Sie dann einen Radius um diesen Standort für Benutzer, die in diesem Bereich nach Anzeigen suchen.",
        how_it_works_example: "<strong>Beispiel:</strong> Sie sind in Europa, aber Sie haben ein Haus in Melbourne, Australien, das Sie verkaufen möchten. Setzen Sie einen 📍 in dem Vorort, wo sich Ihr Haus befindet, geben Sie eine vollständige Beschreibung an und warten Sie, bis jemand aus der ganzen Welt Ihre Anzeige findet. Sobald eine Verbindung zwischen Benutzern hergestellt ist, kann die integrierte Messaging-App verwendet werden, aber Sie können auch jede andere Kontaktplattform nutzen.",
        why_choose: "Warum Tangle-me wählen?",
        free_forever: "Für Immer Kostenlos:",
        free_forever_desc: "Textanzeigen kosten niemals etwas",
        global_reach: "Globale Reichweite:",
        global_reach_desc: "Verfügbar in 10 Sprachen weltweit",
        simple_fast: "Einfach & Schnell:",
        simple_fast_desc: "Veröffentlichen Sie Ihre Anzeige in Sekunden, ohne komplizierte Formulare",
        built_trust: "Auf Vertrauen Gebaut:",
        built_trust_desc: "Verbinden Sie sich mit verifizierten Tangles (vertrauenswürdige Kontakte)",
        supported_languages: "Unterstützte Sprachen",
        languages_list: "Englisch, Spanisch, Französisch, Deutsch, Portugiesisch, Chinesisch, Arabisch, Hindi, Russisch, Japanisch",
        browser_tip: "Browser-Empfehlung:",
        browser_tip_desc: "Für beste Erfahrung verwenden Sie Brave, Chrome, Edge oder einen Chromium-basierten Browser.",
        contact_intro: "Haben Sie Fragen, Feedback oder brauchen Sie Hilfe? Wir würden gerne von Ihnen hören!",
        email_us: "Schreiben Sie uns an:",
        email_tip: "Tipp:",
        email_tip_desc: "Klicken Sie auf die E-Mail-Adresse oben, um Ihre E-Mail-App zu öffnen.",
        terms: "AGB",
        privacy: "Datenschutz",
        terms_title: "📜 Allgemeine Geschäftsbedingungen",
        privacy_title: "🔒 Datenschutzerklärung",
        legal_english_note: "Rechtliche Dokumente werden auf Englisch bereitgestellt.",
        i_understand: "Verstanden",
        add_photos: "Fotos Hinzufügen",
        add_photo: "Foto Hinzufügen",
        photos_remaining: "Fotos übrig",
        upgrade_for_photos: "Upgrade für Fotos",
        upgrade_to_pro: "Upgrade zu PRO",
        your_plan: "Ihr Plan:",
        manage_ads: "Verwalten Sie Ihre Anzeigen",
        post_new: "Neue Anzeige",
        bulk_upload: "Smart Upload",
        loading: "Laden...",
        bulk_upload_title: "Smart Upload",
        bulk_upload_desc: "Dateien mit Text & Fotos hochladen — KI erstellt Ihre Anzeigen",
        bulk_step1_title: "Vorlage Herunterladen",
        bulk_step1_desc: "Holen Sie sich die CSV-Vorlage im richtigen Format",
        bulk_step2_title: "Anzeigen Ausfüllen",
        bulk_step2_desc: "Fügen Sie bis zu 50 Anzeigen pro Upload hinzu",
        bulk_step3_title: "Hochladen & Bestätigen",
        bulk_step3_desc: "Vorschau Ihrer Anzeigen vor dem Posten",
        download_template: "Vorlage Herunterladen",
        select_csv: "CSV-Datei Auswählen",
        csv_hint: "oder per Drag & Drop",
        preview: "Vorschau",
        post_all_ads: "Alle Posten",
        posting: "Wird gepostet...",
        posted: "gepostet",
        failed: "fehlgeschlagen",
        valid: "gültig",
        ads: "Anzeigen",
        post: "Posten",
        confirm_post: "Posten",
        no_valid_ads: "Keine gültigen Anzeigen zum Posten",
        cancel_upload: "Upload läuft. Sind Sie sicher, dass Sie abbrechen möchten?",
        login_required: "Bitte melden Sie sich an, um Smart Upload zu nutzen",
        invalid_file: "Bitte wählen Sie eine CSV-Datei",
        csv_empty: "CSV-Datei ist leer oder enthält keine Daten",
        install_app: "Tangle-me installieren",
        install_app_desc: "Zum Startbildschirm hinzufügen",
        install: "Installieren",
        back: "Zurück",
        your_ad: "Deine Anzeige",
        advertise_anywhere: "Überall auf der Welt werben",
        photos_title: "Fotos",
        photos_require_sub: "Fotos erfordern ein Abonnement",
        photos_sub_desc: "Basic (2,99€/Monat) für 20 Fotos oder Pro (9,99€/Monat) für unbegrenzte Anzeigen und Fotos (20 pro Anzeige)",
        view_plans: "Pläne Ansehen",
        this_ad: "Diese Anzeige",
        photo_tip: "Das erste Foto wird zum Hauptbild. Tippe × zum Entfernen.",
        uploading_photos: "Fotos werden hochgeladen...",
        please_login_post: "Bitte anmelden um Anzeigen zu erstellen",
        return_main: "Kehre zur Hauptseite zurück um dich anzumelden",
        go_main: "Zur Hauptseite",
        map_hint_post: "Tippe auf die Karte um den Standort festzulegen",
        detecting: "Erkennung...",
        search_title: "Suche",
        find_ads: "Anzeigen Finden",
        search_placeholder: "z.B. Toyota FJ Cruiser, Wohnung, Handwerker...",
        use_current_location: "Meinen aktuellen Standort verwenden",
        drop_pin_world: "Setze eine Nadel überall auf der Welt",
        map_hint_find: "Tippe auf die Karte um eine Nadel zu setzen",
        search_location_label: "Suchstandort:",
        search_btn: "Suchen",
        km: "km",
        global_search: "Global",
        limit_reached: "Limit erreicht",
        location_title: "Standort",
        contact_title: "Kontakt"
    },
    pt: {
        tagline: "Sua agência de publicidade completa",
        post_free: "Publicar",
        post_desc: "Anúncios de texto sempre grátis",
        find: "Encontrar",
        find_desc: "Pesquisar por distância ou local",
        my_tangles: "Meus Tangles",
        my_tangles_desc: "Contatos salvos",
        login: "Entrar",
        register: "Registrar",
        logout: "Sair",
        messages: "Mensagens",
        posted_by: "Publicado por",
        tangle_since: "Tangle desde",
        location: "Localização",
        contact: "Contato",
        send_message: "Enviar Mensagem",
        edit: "Editar",
        share: "Compartilhar",
        delete: "Excluir",
        my_ads: "Meus Anúncios",
        my_ads_desc: "Ver e gerenciar seus anúncios",
        no_ads: "Nenhum anúncio publicado",
        be_first: "Seja o primeiro a publicar!",
        welcome_back: "Bem-vindo de volta!",
        create_account: "Criar Conta",
        email: "Email",
        password: "Senha",
        name: "Nome (opcional)",
        save: "Salvar",
        cancel: "Cancelar",
        close: "Fechar",
        send: "Enviar",
        inbox: "Caixa de entrada",
        sent: "Enviados",
        no_messages: "Nenhuma mensagem",
        no_tangles: "Nenhum Tangle salvo",
        post_ad_title: "Publique Seu Anúncio",
        choose_plan: "Escolha Seu Plano",
        my_subscription: "Minha Assinatura",
        settings: "Configurações",
        deactivate_account: "Desativar Conta",
        about: "Sobre o Tangle-me",
        contact_us: "Fale Conosco",
        edit_ad: "Editar Anúncio",
        my_note: "Minha Nota",
        ad_details: "Detalhes do Anúncio",
        search_results: "Resultados da Busca",
        post_ad: "Publicar Anúncio",
        save_changes: "Salvar Alterações",
        save_note: "Salvar Nota",
        new_search: "Nova Busca",
        view_my_ad: "Ver Meu Anúncio",
        post_another: "Publicar Outro",
        done: "Concluído",
        keywords_label: "Palavras-chave da sua oferta",
        keywords_placeholder: "ex., Serviço de au pair Lisboa",
        description_label: "Descrição adicional",
        description_placeholder: "Descreva o que você oferece...",
        item_location: "Localização do anúncio:",
        location_subtitle: "Escolha como especificar a localização",
        contact_label: "Informações de Contato",
        contact_placeholder: "Email, telefone, WhatsApp...",
        optional: "(Opcional)",
        use_my_location: "Usar Minha Localização",
        gps_location: "Localização GPS atual",
        pin_on_map: "Marcar no Mapa",
        drop_pin: "Colocar um pin",
        enter_address: "Inserir Endereço",
        search_location: "Buscar por local",
        search_location_title: "Buscar Local",
        address_help: "Insira um endereço",
        address_placeholder: "ex., Lisboa, Portugal",
        choose_username: "Seu Tangle ID Único",
        your_username: "Seu Tangle ID",
        login_subtitle: "Entre para gerenciar seus anúncios",
        password_placeholder: "Digite sua senha",
        no_account: "Não tem conta?",
        register_here: "Registre-se aqui",
        join_tangles: "Junte-se aos Tangles!",
        your_country: "Seu País:",
        username_subtitle: "3 palavras únicas que te representam",
        regenerate: "Gerar Novo",
        customize: "Editar Palavras",
        generating_username: "Gerando seu usuário único...",
        customize_username: "Personalize Seu Usuário",
        type_message: "Digite sua mensagem aqui...",
        message_hint: "Inclua seu método de contato",
        your_tangle_id: "Seu Tangle ID",
        member_since: "Membro Desde",
        manage_subscription: "Gerenciar Assinatura",
        danger_zone: "Zona de Perigo",
        search_radius: "Raio de Busca",
        select_radius: "Selecione o raio",
        around_me: "Ao Meu Redor",
        free_tier: "Grátis",
        basic_tier: "Básico",
        pro_tier: "Pro",
        per_month: "/mês",
        photos: "fotos",
        unlimited: "Ilimitado",
        current_plan: "Plano Atual",
        upgrade: "Melhorar",
        advertiser: "Anunciante",
        loading: "Carregando...",
        error: "Erro",
        success: "Sucesso",
        confirm: "Confirmar",
        manage_ads: "Gerencie seus anúncios publicados",
        current_geolocation: "Geolocalização do dispositivo",
        demo: "Demo do Tangle-me",
        about_welcome: "Bem-vindo ao Tangle-me, sua plataforma global de classificados conectando usuários (ou Tangles em nossa linguagem) onde <strong>você</strong> está no controle. Você não precisa de uma plataforma para vender sua casa, outra para vender seu carro, ou outra para postar seu CV procurando oportunidades de emprego. Aqui você pode encontrar técnicos de automóveis, eletricistas, Au pairs que falam francês, arquitetos, advogados, corretores de imóveis e mais—geolocalizando-os perto de você ou em qualquer lugar do mundo.",
        our_mission: "Nossa Missão",
        mission_text: "Acreditamos que anunciar seus produtos ou serviços deve ser acessível a todos, em todos os lugares. Anuncie para ser encontrado.",
        how_it_works: "Como Funciona",
        how_it_works_text: "Este aplicativo só funciona se a geolocalização do seu dispositivo estiver ATIVADA, o que é o comportamento normal do seu dispositivo em geral. Ao anunciar ou procurar anúncios, use sua geolocalização atual ou coloque um 📍 no mapa para indicar onde seu anúncio é relevante para buscas e a quem ele se destina. Em seguida, defina um raio ao redor deste local para usuários que procuram anúncios nessa área.",
        how_it_works_example: "<strong>Exemplo:</strong> Você está na Europa, mas tem uma casa em Melbourne, Austrália, que deseja vender. Coloque um 📍 no subúrbio onde sua casa está localizada, forneça uma descrição completa e espere que alguém de qualquer lugar do mundo encontre seu anúncio. Uma vez feita a conexão entre usuários, o aplicativo de mensagens integrado pode ser usado, mas você é livre para usar qualquer outra plataforma de contato.",
        why_choose: "Por que escolher o Tangle-me?",
        free_forever: "Grátis Para Sempre:",
        free_forever_desc: "Anúncios de texto nunca custam nada",
        global_reach: "Alcance Global:",
        global_reach_desc: "Disponível em 10 idiomas ao redor do mundo",
        simple_fast: "Simples e Rápido:",
        simple_fast_desc: "Publique seu anúncio em segundos, sem formulários complicados",
        built_trust: "Construído na Confiança:",
        built_trust_desc: "Conecte-se com Tangles verificados (contatos confiáveis)",
        supported_languages: "Idiomas Suportados",
        languages_list: "Inglês, Espanhol, Francês, Alemão, Português, Chinês, Árabe, Hindi, Russo, Japonês",
        browser_tip: "Recomendação de Navegador:",
        browser_tip_desc: "Para melhor experiência, use Brave, Chrome, Edge ou qualquer navegador baseado em Chromium.",
        contact_intro: "Tem perguntas, feedback ou precisa de ajuda? Adoraríamos ouvir de você!",
        email_us: "Envie-nos um email:",
        email_tip: "Dica:",
        email_tip_desc: "Clique no endereço de email acima para abrir seu aplicativo de email.",
        terms: "Termos",
        privacy: "Privacidade",
        terms_title: "📜 Termos e Condições",
        privacy_title: "🔒 Política de Privacidade",
        legal_english_note: "Os documentos legais são fornecidos em inglês.",
        i_understand: "Entendi",
        add_photos: "Adicionar Fotos",
        add_photo: "Adicionar Foto",
        photos_remaining: "fotos restantes",
        upgrade_for_photos: "Upgrade para Fotos",
        upgrade_to_pro: "Upgrade para PRO",
        your_plan: "Seu Plano:",
        manage_ads: "Gerencie seus anúncios publicados",
        post_new: "Novo Anúncio",
        bulk_upload: "Upload Inteligente",
        loading: "Carregando...",
        bulk_upload_title: "Upload Inteligente",
        bulk_upload_desc: "Carregue arquivos com texto e fotos — a IA cria seus anúncios",
        bulk_step1_title: "Baixar Modelo",
        bulk_step1_desc: "Obtenha o modelo CSV com o formato correto",
        bulk_step2_title: "Preencha seus Anúncios",
        bulk_step2_desc: "Adicione até 50 anúncios por upload",
        bulk_step3_title: "Enviar e Confirmar",
        bulk_step3_desc: "Visualize seus anúncios antes de publicar",
        download_template: "Baixar Modelo",
        select_csv: "Selecionar Arquivo CSV",
        csv_hint: "ou arraste e solte",
        preview: "Visualização",
        post_all_ads: "Publicar Todos",
        posting: "Publicando...",
        posted: "publicados",
        failed: "falharam",
        valid: "válidos",
        ads: "anúncios",
        post: "Publicar",
        confirm_post: "Publicar",
        no_valid_ads: "Nenhum anúncio válido para publicar",
        cancel_upload: "Upload em andamento. Tem certeza que deseja cancelar?",
        login_required: "Faça login para usar upload em massa",
        invalid_file: "Por favor selecione um arquivo CSV",
        csv_empty: "O arquivo CSV está vazio ou sem dados",
        install_app: "Instalar Tangle-me",
        install_app_desc: "Adicionar à tela inicial",
        install: "Instalar",
        back: "Voltar",
        your_ad: "Seu Anúncio",
        advertise_anywhere: "Anuncie em qualquer lugar do mundo",
        photos_title: "Fotos",
        photos_require_sub: "Fotos requerem uma assinatura",
        photos_sub_desc: "Básico (€2,99/mês) para 20 fotos ou Pro (€9,99/mês) para anúncios e fotos ilimitados (20 por anúncio)",
        view_plans: "Ver Planos",
        this_ad: "Este anúncio",
        photo_tip: "A primeira foto será a imagem principal. Toque × para remover.",
        uploading_photos: "Enviando fotos...",
        please_login_post: "Faça login para publicar anúncios",
        return_main: "Volte à página principal para fazer login ou se registrar",
        go_main: "Ir para Página Principal",
        map_hint_post: "Toque no mapa para definir a localização do seu anúncio",
        detecting: "Detectando...",
        search_title: "Pesquisar",
        find_ads: "Encontrar Anúncios",
        search_placeholder: "ex. Toyota FJ Cruiser, apartamento, encanador...",
        use_current_location: "Usar minha localização atual",
        drop_pin_world: "Coloque um pin em qualquer lugar do mundo",
        map_hint_find: "Toque no mapa para colocar um pin",
        search_location_label: "Local de pesquisa:",
        search_btn: "Pesquisar",
        km: "km",
        global_search: "Global",
        limit_reached: "Limite atingido",
        location_title: "Localização",
        contact_title: "Contato"
    },
    zh: {
        tagline: "您的一站式广告代理",
        post_free: "发布",
        post_desc: "文字广告永久免费",
        find: "查找",
        find_desc: "按距离或位置搜索",
        my_tangles: "我的Tangles",
        my_tangles_desc: "保存的联系人",
        login: "登录",
        register: "注册",
        logout: "登出",
        messages: "消息",
        posted_by: "发布者",
        tangle_since: "Tangle自",
        location: "位置",
        contact: "联系方式",
        send_message: "发送消息",
        edit: "编辑",
        share: "分享",
        delete: "删除",
        my_ads: "我的广告",
        my_ads_desc: "查看和管理您的广告",
        no_ads: "还没有广告",
        be_first: "成为第一个发布的人！",
        welcome_back: "欢迎回来！",
        create_account: "创建账户",
        email: "邮箱",
        password: "密码",
        name: "姓名（可选）",
        save: "保存",
        cancel: "取消",
        close: "关闭",
        send: "发送",
        inbox: "收件箱",
        sent: "已发送",
        no_messages: "没有消息",
        no_tangles: "没有保存的Tangles",
        post_ad_title: "发布您的广告",
        choose_plan: "选择您的计划",
        my_subscription: "我的订阅",
        settings: "设置",
        deactivate_account: "停用账户",
        about: "关于 Tangle-me",
        contact_us: "联系我们",
        edit_ad: "编辑广告",
        my_note: "我的备注",
        ad_details: "广告详情",
        search_results: "搜索结果",
        post_ad: "发布广告",
        save_changes: "保存更改",
        save_note: "保存备注",
        new_search: "新搜索",
        view_my_ad: "查看我的广告",
        post_another: "再发布一个",
        done: "完成",
        keywords_label: "描述您的产品的关键词",
        keywords_placeholder: "例如：互惠生服务 北京",
        description_label: "附加描述",
        description_placeholder: "描述您提供的内容...",
        item_location: "广告位置：",
        location_subtitle: "选择如何指定位置",
        contact_label: "联系信息",
        contact_placeholder: "邮箱、电话、微信...",
        optional: "（可选）",
        use_my_location: "使用我的位置",
        gps_location: "当前GPS位置",
        pin_on_map: "在地图上标记",
        drop_pin: "放置图钉",
        enter_address: "输入地址",
        search_location: "按位置搜索",
        search_location_title: "搜索位置",
        address_help: "输入一个地址",
        address_placeholder: "例如：北京，中国",
        choose_username: "您的唯一 Tangle ID",
        your_username: "您的 Tangle ID",
        login_subtitle: "登录以管理您的广告",
        password_placeholder: "输入您的密码",
        no_account: "没有账户？",
        register_here: "在这里注册",
        join_tangles: "加入 Tangles！",
        your_country: "您的国家：",
        username_subtitle: "代表您的3个独特词语",
        regenerate: "重新生成",
        customize: "编辑词语",
        generating_username: "正在生成您的用户名...",
        customize_username: "自定义您的用户名",
        type_message: "在此输入您的消息...",
        message_hint: "包含您的联系方式",
        your_tangle_id: "您的 Tangle ID",
        member_since: "成为会员于",
        manage_subscription: "管理订阅",
        danger_zone: "危险区域",
        search_radius: "搜索半径",
        select_radius: "选择半径",
        around_me: "我周围",
        free_tier: "免费",
        basic_tier: "基础",
        pro_tier: "专业",
        per_month: "/月",
        photos: "照片",
        unlimited: "无限",
        current_plan: "当前计划",
        upgrade: "升级",
        advertiser: "广告主",
        loading: "加载中...",
        error: "错误",
        success: "成功",
        confirm: "确认",
        manage_ads: "管理您发布的广告",
        current_geolocation: "当前设备地理位置",
        demo: "Tangle-me 演示",
        about_welcome: "欢迎来到 Tangle-me，这是一个连接用户（或我们称之为 Tangles）的全球分类广告平台，<strong>您</strong>完全掌控。您不需要一个平台来卖房子，另一个来卖车，或者另一个来发布简历寻找工作机会。在这里，您可以找到汽车技术人员、电工、法语保姆、建筑师、律师、房地产经纪人等等——在您周围或世界任何地方进行地理定位。",
        our_mission: "我们的使命",
        mission_text: "我们相信，广告您的产品或服务应该对每个人、每个地方都是可访问的。发布广告，让人们找到您。",
        how_it_works: "如何使用",
        how_it_works_text: "此应用程序仅在您的设备地理位置打开时才能工作，这是您设备的正常行为。在发布或查找广告时，使用您当前的设备地理位置或在地图上放置📍以指示您的广告适合搜索的位置以及广告针对的对象。然后围绕此位置定义一个半径，供在该特定区域寻找广告的用户使用。",
        how_it_works_example: "<strong>示例：</strong>您在欧洲，但您在澳大利亚墨尔本有一套房子想要出售。在您房子所在的郊区放置一个📍，提供完整的描述，然后等待世界各地的人找到您的广告。一旦用户之间建立联系，就可以使用内置的消息应用程序进行连接，但您可以自由使用任何其他联系平台。",
        why_choose: "为什么选择 Tangle-me？",
        free_forever: "永久免费：",
        free_forever_desc: "文字广告永远不收费",
        global_reach: "全球覆盖：",
        global_reach_desc: "全球提供6种语言",
        simple_fast: "简单快捷：",
        simple_fast_desc: "几秒钟内发布广告，无需复杂表单",
        built_trust: "建立信任：",
        built_trust_desc: "与经过验证的 Tangles（可信联系人）连接",
        supported_languages: "支持的语言",
        languages_list: "英语、西班牙语、法语、德语、葡萄牙语、中文、阿拉伯语、印地语、俄语、日语",
        browser_tip: "浏览器建议：",
        browser_tip_desc: "为获得最佳体验，请使用 Brave、Chrome、Edge 或任何基于 Chromium 的浏览器。",
        contact_intro: "有问题、反馈或需要帮助？我们很乐意听取您的意见！",
        email_us: "发送邮件至：",
        email_tip: "提示：",
        email_tip_desc: "点击上面的电子邮件地址打开您的邮件应用程序。",
        terms: "条款",
        privacy: "隐私",
        terms_title: "📜 条款和条件",
        privacy_title: "🔒 隐私政策",
        legal_english_note: "法律文件以英文提供。",
        i_understand: "我了解",
        add_photos: "添加照片",
        add_photo: "添加照片",
        photos_remaining: "照片剩余",
        upgrade_for_photos: "升级以添加照片",
        upgrade_to_pro: "升级到PRO",
        your_plan: "您的套餐：",
        manage_ads: "管理您发布的广告",
        post_new: "发布新广告",
        bulk_upload: "智能上传",
        loading: "加载中...",
        bulk_upload_title: "智能上传",
        bulk_upload_desc: "上传包含文字和图片的文件 — AI自动创建广告",
        bulk_step1_title: "下载模板",
        bulk_step1_desc: "获取正确格式的CSV模板",
        bulk_step2_title: "填写广告",
        bulk_step2_desc: "每次最多上传50个广告",
        bulk_step3_title: "上传并确认",
        bulk_step3_desc: "发布前预览您的广告",
        download_template: "下载模板",
        select_csv: "选择CSV文件",
        csv_hint: "或拖放文件",
        preview: "预览",
        post_all_ads: "发布所有广告",
        posting: "正在发布...",
        posted: "已发布",
        failed: "失败",
        valid: "有效",
        ads: "广告",
        post: "发布",
        confirm_post: "确认发布",
        no_valid_ads: "没有有效的广告可发布",
        cancel_upload: "上传进行中。确定要取消吗？",
        login_required: "请登录以使用批量上传",
        invalid_file: "请选择CSV文件",
        csv_empty: "CSV文件为空或没有数据",
        install_app: "安装 Tangle-me",
        install_app_desc: "添加到主屏幕以便快速访问",
        install: "安装",
        back: "返回",
        your_ad: "您的广告",
        advertise_anywhere: "在全球任何地方发布广告",
        photos_title: "照片",
        photos_require_sub: "照片需要订阅",
        photos_sub_desc: "基础版(€2.99/月) 20张照片 或 专业版(€9.99/月) 无限广告和照片(每条广告20张)",
        view_plans: "查看方案",
        this_ad: "此广告",
        photo_tip: "第一张照片将成为主图。点击×删除。",
        uploading_photos: "正在上传照片...",
        please_login_post: "请登录后发布广告",
        return_main: "返回主页登录或注册",
        go_main: "返回主页",
        map_hint_post: "点击地图设置广告位置",
        detecting: "检测中...",
        search_title: "搜索",
        find_ads: "查找广告",
        search_placeholder: "例如：丰田FJ巡洋舰、公寓出租、水管工...",
        use_current_location: "使用我的当前位置",
        drop_pin_world: "在世界任何地方放置标记",
        map_hint_find: "点击地图放置标记",
        search_location_label: "搜索位置：",
        search_btn: "搜索",
        km: "公里",
        global_search: "全球",
        limit_reached: "已达上限",
        location_title: "位置",
        contact_title: "联系方式"
    },
    ar: {
        tagline: "وكالتك الإعلانية الشاملة",
        post_free: "نشر إعلان",
        post_desc: "الإعلانات النصية مجانية دائماً",
        find: "بحث",
        find_desc: "البحث حسب المسافة أو الموقع",
        my_tangles: "تانغلز الخاصة بي",
        my_tangles_desc: "جهات الاتصال المحفوظة",
        login: "تسجيل الدخول",
        register: "إنشاء حساب",
        logout: "تسجيل الخروج",
        messages: "الرسائل",
        posted_by: "نُشر بواسطة",
        tangle_since: "عضو منذ",
        location: "الموقع",
        contact: "اتصل",
        send_message: "إرسال رسالة",
        edit: "تعديل",
        share: "مشاركة",
        delete: "حذف",
        my_ads: "إعلاناتي",
        my_ads_desc: "عرض وإدارة إعلاناتك",
        no_ads: "لا توجد إعلانات بعد",
        be_first: "كن أول من ينشر!",
        welcome_back: "مرحباً بعودتك!",
        create_account: "إنشاء حساب",
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        name: "الاسم (اختياري)",
        save: "حفظ",
        cancel: "إلغاء",
        close: "إغلاق",
        send: "إرسال",
        inbox: "صندوق الوارد",
        sent: "المرسلة",
        no_messages: "لا توجد رسائل بعد",
        no_tangles: "لا توجد تانغلز محفوظة",
        post_ad_title: "انشر إعلانك",
        choose_plan: "اختر خطتك",
        my_subscription: "اشتراكي",
        settings: "الإعدادات",
        deactivate_account: "تعطيل الحساب",
        about: "عن Tangle-me",
        contact_us: "اتصل بنا",
        edit_ad: "تعديل الإعلان",
        my_note: "ملاحظتي",
        ad_details: "تفاصيل الإعلان",
        search_results: "نتائج البحث",
        post_ad: "نشر الإعلان",
        save_changes: "حفظ التغييرات",
        save_note: "حفظ الملاحظة",
        new_search: "بحث جديد",
        view_my_ad: "عرض إعلاني",
        post_another: "نشر إعلان آخر",
        done: "تم",
        keywords_label: "كلمات تصف عرضك",
        keywords_placeholder: "مثال: خدمة مربية أطفال الرياض",
        description_label: "وصف إضافي للإعلان",
        description_placeholder: "صف ما تريد الإعلان عنه...",
        item_location: "موقع الإعلان:",
        location_subtitle: "اختر كيفية تحديد موقع الإعلان",
        contact_label: "معلومات الاتصال",
        contact_placeholder: "بريد إلكتروني، هاتف، واتساب...",
        optional: "(اختياري)",
        use_my_location: "استخدام موقعي",
        gps_location: "الموقع الحالي عبر GPS",
        pin_on_map: "تحديد على الخريطة",
        drop_pin: "ضع علامة",
        enter_address: "أدخل العنوان",
        search_location: "البحث بالموقع",
        search_location_title: "بحث الموقع",
        address_help: "أدخل عنواناً دقيقاً أو تقريبياً",
        address_placeholder: "مثال: الرياض، السعودية",
        choose_username: "هويتك الفريدة في Tangle",
        your_username: "هوية Tangle الخاصة بك",
        login_subtitle: "سجل الدخول لإدارة إعلاناتك",
        password_placeholder: "أدخل كلمة المرور",
        no_account: "ليس لديك حساب؟",
        register_here: "سجل هنا",
        join_tangles: "انضم إلى تانغلز!",
        your_country: "بلدك:",
        username_subtitle: "3 كلمات فريدة تمثلك",
        regenerate: "توليد جديد",
        customize: "تعديل الكلمات",
        generating_username: "جاري إنشاء اسم المستخدم الفريد...",
        customize_username: "تخصيص اسم المستخدم",
        type_message: "اكتب رسالتك هنا...",
        message_hint: "أضف طريقة التواصل ليتمكن المعلن من الوصول إليك",
        your_tangle_id: "هوية Tangle الخاصة بك",
        member_since: "عضو منذ",
        manage_subscription: "إدارة الاشتراك",
        danger_zone: "منطقة خطرة",
        search_radius: "نطاق البحث",
        select_radius: "اختر نطاق البحث",
        around_me: "حولي",
        free_tier: "مجاني",
        basic_tier: "أساسي",
        pro_tier: "احترافي",
        per_month: "/شهر",
        photos: "صور",
        unlimited: "غير محدود",
        current_plan: "الخطة الحالية",
        upgrade: "ترقية",
        advertiser: "المعلن",
        loading: "جاري التحميل...",
        error: "خطأ",
        success: "نجاح",
        confirm: "تأكيد",
        manage_ads: "إدارة إعلاناتك المنشورة",
        current_geolocation: "الموقع الجغرافي الحالي للجهاز",
        demo: "عرض Tangle-me",
        about_welcome: "مرحباً بك في Tangle-me، منصتك العالمية للإعلانات المبوبة التي تربط المستخدمين حيث أنت المتحكم.",
        our_mission: "مهمتنا",
        mission_text: "نؤمن بأن الإعلان عن منتجاتك أو خدماتك يجب أن يكون متاحاً للجميع، في كل مكان.",
        how_it_works: "كيف يعمل",
        how_it_works_text: "يعمل هذا التطبيق عندما يكون تحديد الموقع مفعلاً على جهازك. استخدم موقعك الحالي أو ضع علامة على الخريطة لتحديد منطقة إعلانك.",
        how_it_works_example: "مثال: أنت في أوروبا ولكن لديك منزل في ملبورن، أستراليا تريد بيعه. ضع علامة في الحي وانتظر من يجد إعلانك.",
        why_choose: "لماذا تختار Tangle-me؟",
        free_forever: "مجاني للأبد:",
        free_forever_desc: "الإعلانات النصية لا تكلف شيئاً",
        global_reach: "وصول عالمي:",
        global_reach_desc: "متوفر بعدة لغات حول العالم",
        simple_fast: "بسيط وسريع:",
        simple_fast_desc: "انشر إعلانك في ثوانٍ",
        built_trust: "مبني على الثقة:",
        built_trust_desc: "تواصل مع تانغلز موثوقة",
        supported_languages: "اللغات المدعومة",
        languages_list: "الإنجليزية، الإسبانية، الفرنسية، الألمانية، البرتغالية، الصينية، العربية، الهندية، الروسية، اليابانية",
        browser_tip: "توصية المتصفح:",
        browser_tip_desc: "للحصول على أفضل تجربة استخدم Brave أو Chrome أو Edge.",
        contact_intro: "هل لديك أسئلة أو ملاحظات؟ نحب أن نسمع منك!",
        email_us: "راسلنا على:",
        email_tip: "نصيحة:",
        email_tip_desc: "انقر على عنوان البريد الإلكتروني لفتح تطبيق البريد.",
        terms: "الشروط",
        privacy: "الخصوصية",
        terms_title: "📜 الشروط والأحكام",
        privacy_title: "🔒 سياسة الخصوصية",
        legal_english_note: "الوثائق القانونية متوفرة باللغة الإنجليزية.",
        i_understand: "أفهم",
        add_photos: "إضافة صور",
        add_photo: "إضافة صورة",
        photos_remaining: "صور متبقية",
        upgrade_for_photos: "ترقية للصور",
        upgrade_to_pro: "ترقية إلى احترافي",
        your_plan: "خطتك:",
        post_new: "نشر جديد",
        bulk_upload: "رفع ذكي",
        bulk_upload_title: "رفع ذكي",
        bulk_upload_desc: "ارفع عدة إعلانات باستخدام ملف CSV",
        download_template: "تحميل القالب",
        select_csv: "اختر ملف CSV",
        csv_hint: "أو اسحب وأفلت",
        preview: "معاينة",
        post_all_ads: "نشر جميع الإعلانات",
        posting: "جاري النشر...",
        posted: "تم النشر",
        failed: "فشل",
        valid: "صالح",
        ads: "إعلانات",
        post: "نشر",
        confirm_post: "تأكيد النشر",
        no_valid_ads: "لا توجد إعلانات صالحة للنشر",
        login_required: "يرجى تسجيل الدخول",
        invalid_file: "يرجى اختيار ملف CSV",
        csv_empty: "ملف CSV فارغ",
        install_app: "تثبيت Tangle-me",
        install_app_desc: "أضف إلى الشاشة الرئيسية للوصول السريع",
        install: "تثبيت",
        back: "رجوع",
        your_ad: "إعلانك",
        advertise_anywhere: "أعلن في أي مكان في العالم",
        photos_title: "صور",
        photos_require_sub: "الصور تتطلب اشتراك",
        photos_sub_desc: "أساسي (€2.99/شهر) لـ 20 صورة أو احترافي (€9.99/شهر) لإعلانات وصور غير محدودة (20 لكل إعلان)",
        view_plans: "عرض الخطط",
        this_ad: "هذا الإعلان",
        photo_tip: "الصورة الأولى ستكون الصورة الرئيسية. اضغط × للحذف.",
        uploading_photos: "جاري رفع الصور...",
        please_login_post: "يرجى تسجيل الدخول لنشر الإعلانات",
        return_main: "عد إلى الصفحة الرئيسية لتسجيل الدخول",
        go_main: "الذهاب للصفحة الرئيسية",
        map_hint_post: "انقر على الخريطة لتعيين موقع إعلانك",
        detecting: "جاري الكشف...",
        search_title: "بحث",
        find_ads: "البحث عن إعلانات",
        search_placeholder: "مثال: تويوتا، شقة للإيجار، سباك...",
        use_current_location: "استخدام موقعي الحالي",
        drop_pin_world: "ضع علامة في أي مكان في العالم",
        map_hint_find: "انقر على الخريطة لوضع علامة",
        search_location_label: "موقع البحث:",
        search_btn: "بحث",
        km: "كم",
        global_search: "عالمي",
        limit_reached: "تم بلوغ الحد",
        location_title: "الموقع",
        contact_title: "الاتصال"
    },
    hi: {
        tagline: "आपकी वन-स्टॉप विज्ञापन एजेंसी",
        post_free: "विज्ञापन दें",
        post_desc: "टेक्स्ट विज्ञापन हमेशा मुफ्त",
        find: "खोजें",
        find_desc: "दूरी या स्थान से खोजें",
        my_tangles: "मेरे टैंगल्स",
        my_tangles_desc: "सहेजे गए संपर्क",
        login: "लॉगिन",
        register: "रजिस्टर",
        logout: "लॉगआउट",
        messages: "संदेश",
        posted_by: "द्वारा पोस्ट",
        tangle_since: "टैंगल सदस्य",
        location: "स्थान",
        contact: "संपर्क",
        send_message: "संदेश भेजें",
        edit: "संपादित",
        share: "शेयर",
        delete: "हटाएं",
        my_ads: "मेरे विज्ञापन",
        my_ads_desc: "अपने विज्ञापन देखें और प्रबंधित करें",
        no_ads: "अभी तक कोई विज्ञापन नहीं",
        be_first: "पहले पोस्ट करने वाले बनें!",
        welcome_back: "वापसी पर स्वागत!",
        create_account: "खाता बनाएं",
        email: "ईमेल",
        password: "पासवर्ड",
        name: "नाम (वैकल्पिक)",
        save: "सहेजें",
        cancel: "रद्द",
        close: "बंद",
        send: "भेजें",
        inbox: "इनबॉक्स",
        sent: "भेजे गए",
        no_messages: "अभी कोई संदेश नहीं",
        no_tangles: "कोई सहेजे गए टैंगल्स नहीं",
        post_ad_title: "अपना विज्ञापन दें",
        choose_plan: "अपनी योजना चुनें",
        my_subscription: "मेरी सदस्यता",
        settings: "सेटिंग्स",
        deactivate_account: "खाता निष्क्रिय करें",
        about: "Tangle-me के बारे में",
        contact_us: "संपर्क करें",
        edit_ad: "विज्ञापन संपादित करें",
        my_note: "मेरा नोट",
        ad_details: "विज्ञापन विवरण",
        search_results: "खोज परिणाम",
        post_ad: "विज्ञापन दें",
        save_changes: "बदलाव सहेजें",
        save_note: "नोट सहेजें",
        new_search: "नई खोज",
        view_my_ad: "मेरा विज्ञापन देखें",
        post_another: "और विज्ञापन दें",
        done: "हो गया",
        keywords_label: "अपनी पेशकश का वर्णन करने वाले कीवर्ड",
        keywords_placeholder: "उदा., ऑ पेयर सेवा दिल्ली",
        description_label: "अतिरिक्त विज्ञापन विवरण",
        description_placeholder: "आप क्या विज्ञापित करना चाहते हैं, वर्णन करें...",
        item_location: "विज्ञापन स्थान:",
        location_subtitle: "विज्ञापन का स्थान कैसे निर्दिष्ट करें चुनें",
        contact_label: "संपर्क जानकारी",
        contact_placeholder: "ईमेल, फोन, व्हाट्सऐप...",
        optional: "(वैकल्पिक)",
        use_my_location: "मेरा स्थान उपयोग करें",
        gps_location: "GPS-आधारित वर्तमान स्थान",
        pin_on_map: "मैप पर पिन करें",
        drop_pin: "पिन लगाएं",
        enter_address: "पता दर्ज करें",
        search_location: "स्थान से खोजें",
        search_location_title: "स्थान खोजें",
        address_help: "एक सटीक या अनुमानित पता दर्ज करें",
        address_placeholder: "उदा., नई दिल्ली, भारत",
        choose_username: "आपकी अनूठी Tangle ID",
        your_username: "आपकी Tangle ID",
        login_subtitle: "विज्ञापन प्रबंधित करने के लिए लॉगिन करें",
        password_placeholder: "अपना पासवर्ड दर्ज करें",
        no_account: "खाता नहीं है?",
        register_here: "यहां रजिस्टर करें",
        join_tangles: "टैंगल्स में शामिल हों!",
        your_country: "आपका देश:",
        username_subtitle: "3 अनूठे शब्द जो आपका प्रतिनिधित्व करते हैं",
        regenerate: "नया बनाएं",
        customize: "शब्द संपादित करें",
        generating_username: "आपका अनूठा यूज़रनेम बना रहे हैं...",
        customize_username: "अपना यूज़रनेम कस्टमाइज़ करें",
        type_message: "अपना संदेश यहां लिखें...",
        message_hint: "अपनी संपर्क विधि शामिल करें",
        your_tangle_id: "आपकी Tangle ID",
        member_since: "सदस्य तब से",
        manage_subscription: "सदस्यता प्रबंधित करें",
        danger_zone: "खतरनाक क्षेत्र",
        search_radius: "खोज दायरा",
        select_radius: "खोज दायरा चुनें",
        around_me: "मेरे आसपास",
        free_tier: "मुफ्त",
        basic_tier: "बेसिक",
        pro_tier: "प्रो",
        per_month: "/माह",
        photos: "फोटो",
        unlimited: "असीमित",
        current_plan: "वर्तमान योजना",
        upgrade: "अपग्रेड",
        advertiser: "विज्ञापक",
        loading: "लोड हो रहा है...",
        error: "त्रुटि",
        success: "सफलता",
        confirm: "पुष्टि",
        manage_ads: "अपने प्रकाशित विज्ञापन प्रबंधित करें",
        current_geolocation: "डिवाइस का वर्तमान भू-स्थान",
        demo: "Tangle-me डेमो",
        about_welcome: "Tangle-me में आपका स्वागत है, आपका वैश्विक क्लासीफाइड प्लेटफॉर्म जो उपयोगकर्ताओं को जोड़ता है।",
        our_mission: "हमारा मिशन",
        mission_text: "हमारा मानना है कि विज्ञापन सभी के लिए सुलभ होना चाहिए।",
        how_it_works: "यह कैसे काम करता है",
        how_it_works_text: "यह ऐप तभी काम करता है जब आपके डिवाइस का जियोलोकेशन चालू हो। अपने स्थान का उपयोग करें या मैप पर पिन लगाएं।",
        how_it_works_example: "उदाहरण: आप यूरोप में हैं लेकिन ऑस्ट्रेलिया में आपका घर है। उस इलाके में पिन लगाएं और खरीदार का इंतजार करें।",
        why_choose: "Tangle-me क्यों चुनें?",
        free_forever: "हमेशा मुफ्त:",
        free_forever_desc: "टेक्स्ट विज्ञापनों पर कोई शुल्क नहीं",
        global_reach: "वैश्विक पहुंच:",
        global_reach_desc: "दुनिया भर में कई भाषाओं में उपलब्ध",
        simple_fast: "सरल और तेज:",
        simple_fast_desc: "सेकंडों में विज्ञापन पोस्ट करें",
        built_trust: "भरोसे पर बना:",
        built_trust_desc: "सत्यापित टैंगल्स से जुड़ें",
        supported_languages: "समर्थित भाषाएं",
        languages_list: "अंग्रेजी, स्पेनिश, फ्रेंच, जर्मन, पुर्तगाली, चीनी, अरबी, हिंदी, रूसी, जापानी",
        browser_tip: "ब्राउज़र अनुशंसा:",
        browser_tip_desc: "सर्वोत्तम अनुभव के लिए Brave, Chrome या Edge का उपयोग करें।",
        contact_intro: "कोई सवाल या मदद चाहिए? हम आपसे सुनना चाहते हैं!",
        email_us: "हमें ईमेल करें:",
        email_tip: "टिप:",
        email_tip_desc: "ईमेल ऐप खोलने के लिए पते पर क्लिक करें।",
        terms: "शर्तें",
        privacy: "गोपनीयता",
        terms_title: "📜 नियम और शर्तें",
        privacy_title: "🔒 गोपनीयता नीति",
        legal_english_note: "कानूनी दस्तावेज अंग्रेजी में उपलब्ध हैं।",
        i_understand: "मैं समझता/समझती हूं",
        add_photos: "फोटो जोड़ें",
        add_photo: "फोटो जोड़ें",
        photos_remaining: "फोटो बाकी",
        upgrade_for_photos: "फोटो के लिए अपग्रेड करें",
        upgrade_to_pro: "प्रो में अपग्रेड करें",
        your_plan: "आपकी योजना:",
        post_new: "नया पोस्ट",
        bulk_upload: "स्मार्ट अपलोड",
        install_app: "Tangle-me इंस्टॉल करें",
        install_app_desc: "होम स्क्रीन पर जोड़ें",
        install: "इंस्टॉल",
        back: "वापस",
        your_ad: "आपका विज्ञापन",
        advertise_anywhere: "दुनिया में कहीं भी विज्ञापन दें",
        photos_title: "फोटो",
        photos_require_sub: "फोटो के लिए सदस्यता आवश्यक",
        photos_sub_desc: "बेसिक (€2.99/माह) 20 फोटो या प्रो (€9.99/माह) असीमित विज्ञापन और फोटो (प्रति विज्ञापन 20)",
        view_plans: "प्लान देखें",
        this_ad: "यह विज्ञापन",
        photo_tip: "पहली फोटो मुख्य छवि बनेगी। × दबाएं हटाने के लिए।",
        uploading_photos: "फोटो अपलोड हो रही हैं...",
        please_login_post: "विज्ञापन पोस्ट करने के लिए लॉगिन करें",
        return_main: "लॉगिन या रजिस्टर करने के लिए मुख्य पृष्ठ पर लौटें",
        go_main: "मुख्य पृष्ठ पर जाएं",
        map_hint_post: "विज्ञापन का स्थान सेट करने के लिए मैप पर टैप करें",
        detecting: "पता लगा रहे हैं...",
        search_title: "खोज",
        find_ads: "विज्ञापन खोजें",
        search_placeholder: "उदा. टोयोटा, किराए का फ्लैट, प्लंबर...",
        use_current_location: "मेरा वर्तमान स्थान उपयोग करें",
        drop_pin_world: "दुनिया में कहीं भी पिन लगाएं",
        map_hint_find: "पिन लगाने के लिए मैप पर टैप करें",
        search_location_label: "खोज स्थान:",
        search_btn: "खोजें",
        km: "किमी",
        global_search: "वैश्विक",
        limit_reached: "सीमा पूरी",
        location_title: "स्थान",
        contact_title: "संपर्क"
    },
    ru: {
        tagline: "Ваше универсальное рекламное агентство",
        post_free: "Разместить",
        post_desc: "Текстовые объявления всегда бесплатны",
        find: "Найти",
        find_desc: "Поиск по расстоянию или местоположению",
        my_tangles: "Мои Tangles",
        my_tangles_desc: "Сохранённые контакты",
        login: "Войти",
        register: "Регистрация",
        logout: "Выйти",
        messages: "Сообщения",
        posted_by: "Размещено",
        tangle_since: "Участник с",
        location: "Местоположение",
        contact: "Контакт",
        send_message: "Отправить сообщение",
        edit: "Редактировать",
        share: "Поделиться",
        delete: "Удалить",
        my_ads: "Мои объявления",
        my_ads_desc: "Просмотр и управление объявлениями",
        no_ads: "Объявлений пока нет",
        be_first: "Будьте первым!",
        welcome_back: "С возвращением!",
        create_account: "Создать аккаунт",
        email: "Эл. почта",
        password: "Пароль",
        name: "Имя (необязательно)",
        save: "Сохранить",
        cancel: "Отмена",
        close: "Закрыть",
        send: "Отправить",
        inbox: "Входящие",
        sent: "Отправленные",
        no_messages: "Сообщений пока нет",
        no_tangles: "Нет сохранённых Tangles",
        post_ad_title: "Разместите объявление",
        choose_plan: "Выберите план",
        my_subscription: "Моя подписка",
        settings: "Настройки",
        deactivate_account: "Деактивировать аккаунт",
        about: "О Tangle-me",
        contact_us: "Свяжитесь с нами",
        edit_ad: "Редактировать объявление",
        my_note: "Моя заметка",
        ad_details: "Детали объявления",
        search_results: "Результаты поиска",
        post_ad: "Разместить",
        save_changes: "Сохранить изменения",
        save_note: "Сохранить заметку",
        new_search: "Новый поиск",
        view_my_ad: "Посмотреть объявление",
        post_another: "Разместить ещё",
        done: "Готово",
        keywords_label: "Ключевые слова вашего предложения",
        keywords_placeholder: "напр., Услуги няни Москва",
        description_label: "Дополнительное описание",
        description_placeholder: "Опишите, что вы хотите рекламировать...",
        item_location: "Местоположение объявления:",
        location_subtitle: "Выберите способ указания местоположения",
        contact_label: "Контактная информация",
        contact_placeholder: "Email, телефон, WhatsApp...",
        optional: "(Необязательно)",
        use_my_location: "Моё местоположение",
        gps_location: "Текущее местоположение GPS",
        pin_on_map: "Отметить на карте",
        drop_pin: "Поставить метку",
        enter_address: "Ввести адрес",
        search_location: "Поиск по местоположению",
        search_location_title: "Поиск местоположения",
        address_help: "Введите точный или приблизительный адрес",
        address_placeholder: "напр., Москва, Россия",
        choose_username: "Ваш уникальный Tangle ID",
        your_username: "Ваш Tangle ID",
        login_subtitle: "Войдите для управления объявлениями",
        password_placeholder: "Введите пароль",
        no_account: "Нет аккаунта?",
        register_here: "Зарегистрируйтесь",
        join_tangles: "Присоединяйтесь к Tangles!",
        your_country: "Ваша страна:",
        username_subtitle: "3 уникальных слова, представляющих вас",
        regenerate: "Сгенерировать новый",
        customize: "Изменить слова",
        generating_username: "Создаём ваш уникальный логин...",
        customize_username: "Настройте свой логин",
        type_message: "Введите сообщение...",
        message_hint: "Укажите способ связи",
        your_tangle_id: "Ваш Tangle ID",
        member_since: "Участник с",
        manage_subscription: "Управление подпиской",
        danger_zone: "Опасная зона",
        search_radius: "Радиус поиска",
        select_radius: "Выберите радиус",
        around_me: "Вокруг меня",
        free_tier: "Бесплатно",
        basic_tier: "Базовый",
        pro_tier: "Про",
        per_month: "/месяц",
        photos: "фото",
        unlimited: "Безлимит",
        current_plan: "Текущий план",
        upgrade: "Улучшить",
        advertiser: "Рекламодатель",
        loading: "Загрузка...",
        error: "Ошибка",
        success: "Успех",
        confirm: "Подтвердить",
        manage_ads: "Управляйте своими объявлениями",
        current_geolocation: "Текущее местоположение устройства",
        demo: "Демо Tangle-me",
        about_welcome: "Добро пожаловать в Tangle-me — вашу глобальную платформу объявлений, где ВЫ управляете.",
        our_mission: "Наша миссия",
        mission_text: "Мы верим, что реклама должна быть доступна каждому, везде.",
        how_it_works: "Как это работает",
        how_it_works_text: "Приложение работает с включённой геолокацией. Используйте текущее местоположение или поставьте метку на карте.",
        how_it_works_example: "Пример: Вы в Европе, но у вас дом в Мельбурне. Поставьте метку и ждите покупателя.",
        why_choose: "Почему Tangle-me?",
        free_forever: "Бесплатно навсегда:",
        free_forever_desc: "Текстовые объявления абсолютно бесплатны",
        global_reach: "Глобальный охват:",
        global_reach_desc: "Доступно на нескольких языках",
        simple_fast: "Просто и быстро:",
        simple_fast_desc: "Разместите объявление за секунды",
        built_trust: "Основано на доверии:",
        built_trust_desc: "Связывайтесь с проверенными Tangles",
        supported_languages: "Поддерживаемые языки",
        languages_list: "Английский, Испанский, Французский, Немецкий, Португальский, Китайский, Арабский, Хинди, Русский, Японский",
        browser_tip: "Рекомендация браузера:",
        browser_tip_desc: "Используйте Brave, Chrome или Edge.",
        contact_intro: "Вопросы или нужна помощь? Мы рады помочь!",
        email_us: "Напишите нам:",
        email_tip: "Совет:",
        email_tip_desc: "Нажмите на адрес для открытия почтового приложения.",
        terms: "Условия",
        privacy: "Конфиденциальность",
        terms_title: "📜 Условия использования",
        privacy_title: "🔒 Политика конфиденциальности",
        legal_english_note: "Юридические документы на английском языке.",
        i_understand: "Понятно",
        add_photos: "Добавить фото",
        add_photo: "Добавить фото",
        photos_remaining: "фото осталось",
        upgrade_for_photos: "Улучшить для фото",
        upgrade_to_pro: "Улучшить до PRO",
        your_plan: "Ваш план:",
        post_new: "Новое объявление",
        bulk_upload: "Умная загрузка",
        install_app: "Установить Tangle-me",
        install_app_desc: "Добавить на главный экран",
        install: "Установить",
        back: "Назад",
        your_ad: "Ваше объявление",
        advertise_anywhere: "Рекламируйте в любой точке мира",
        photos_title: "Фото",
        photos_require_sub: "Фото требуют подписки",
        photos_sub_desc: "Базовый (€2.99/мес) 20 фото или Про (€9.99/мес) безлимитные объявления и фото (20 на объявление)",
        view_plans: "Смотреть планы",
        this_ad: "Это объявление",
        photo_tip: "Первое фото станет главным. Нажмите × для удаления.",
        uploading_photos: "Загрузка фото...",
        please_login_post: "Войдите, чтобы размещать объявления",
        return_main: "Вернитесь на главную для входа или регистрации",
        go_main: "На главную",
        map_hint_post: "Нажмите на карту для указания местоположения",
        detecting: "Определение...",
        search_title: "Поиск",
        find_ads: "Найти объявления",
        search_placeholder: "напр. Toyota, квартира, сантехник...",
        use_current_location: "Использовать моё местоположение",
        drop_pin_world: "Поставьте метку в любой точке мира",
        map_hint_find: "Нажмите на карту для метки",
        search_location_label: "Место поиска:",
        search_btn: "Найти",
        km: "км",
        global_search: "Глобальный",
        limit_reached: "Лимит достигнут",
        location_title: "Местоположение",
        contact_title: "Контакт"
    },
    ja: {
        tagline: "あなたのワンストップ広告エージェンシー",
        post_free: "広告を出す",
        post_desc: "テキスト広告は常に無料",
        find: "探す",
        find_desc: "距離や場所で検索",
        my_tangles: "マイタングル",
        my_tangles_desc: "保存した連絡先",
        login: "ログイン",
        register: "登録",
        logout: "ログアウト",
        messages: "メッセージ",
        posted_by: "投稿者",
        tangle_since: "タングル会員",
        location: "場所",
        contact: "連絡先",
        send_message: "メッセージを送信",
        edit: "編集",
        share: "共有",
        delete: "削除",
        my_ads: "マイ広告",
        my_ads_desc: "広告を表示・管理",
        no_ads: "まだ広告がありません",
        be_first: "最初に投稿しましょう！",
        welcome_back: "おかえりなさい！",
        create_account: "アカウント作成",
        email: "メールアドレス",
        password: "パスワード",
        name: "名前（任意）",
        save: "保存",
        cancel: "キャンセル",
        close: "閉じる",
        send: "送信",
        inbox: "受信箱",
        sent: "送信済み",
        no_messages: "メッセージはまだありません",
        no_tangles: "保存されたタングルはありません",
        post_ad_title: "広告を投稿",
        choose_plan: "プランを選択",
        my_subscription: "マイサブスクリプション",
        settings: "設定",
        deactivate_account: "アカウント無効化",
        about: "Tangle-meについて",
        contact_us: "お問い合わせ",
        edit_ad: "広告を編集",
        my_note: "マイメモ",
        ad_details: "広告詳細",
        search_results: "検索結果",
        post_ad: "広告を投稿",
        save_changes: "変更を保存",
        save_note: "メモを保存",
        new_search: "新しい検索",
        view_my_ad: "広告を見る",
        post_another: "別の広告を投稿",
        done: "完了",
        keywords_label: "提供内容を表すキーワード",
        keywords_placeholder: "例：オペアサービス 東京",
        description_label: "追加の広告説明",
        description_placeholder: "広告したい内容を説明してください...",
        item_location: "広告の場所：",
        location_subtitle: "広告の場所の指定方法を選択",
        contact_label: "連絡先情報",
        contact_placeholder: "メール、電話、WhatsApp...",
        optional: "（任意）",
        use_my_location: "現在地を使用",
        gps_location: "GPS現在地",
        pin_on_map: "地図にピン",
        drop_pin: "ピンを置く",
        enter_address: "住所を入力",
        search_location: "場所で検索",
        search_location_title: "場所を検索",
        address_help: "正確または概算の住所を入力",
        address_placeholder: "例：東京、日本",
        choose_username: "あなたのユニークなTangle ID",
        your_username: "あなたのTangle ID",
        login_subtitle: "広告管理のためにログイン",
        password_placeholder: "パスワードを入力",
        no_account: "アカウントがありませんか？",
        register_here: "こちらで登録",
        join_tangles: "タングルに参加！",
        your_country: "あなたの国：",
        username_subtitle: "あなたを表す3つのユニークな単語",
        regenerate: "新規生成",
        customize: "単語を編集",
        generating_username: "ユニークなユーザー名を生成中...",
        customize_username: "ユーザー名をカスタマイズ",
        type_message: "メッセージを入力...",
        message_hint: "連絡方法を含めてください",
        your_tangle_id: "あなたのTangle ID",
        member_since: "会員登録日",
        manage_subscription: "サブスクリプション管理",
        danger_zone: "危険ゾーン",
        search_radius: "検索範囲",
        select_radius: "検索範囲を選択",
        around_me: "周辺",
        free_tier: "無料",
        basic_tier: "ベーシック",
        pro_tier: "プロ",
        per_month: "/月",
        photos: "写真",
        unlimited: "無制限",
        current_plan: "現在のプラン",
        upgrade: "アップグレード",
        advertiser: "広告主",
        loading: "読み込み中...",
        error: "エラー",
        success: "成功",
        confirm: "確認",
        manage_ads: "投稿した広告を管理",
        current_geolocation: "デバイスの現在地",
        demo: "Tangle-meデモ",
        about_welcome: "Tangle-meへようこそ。あなたがコントロールする、グローバルなクラシファイド広告プラットフォームです。",
        our_mission: "私たちの使命",
        mission_text: "広告は誰にでもアクセス可能であるべきだと信じています。",
        how_it_works: "使い方",
        how_it_works_text: "このアプリは位置情報がオンの時に動作します。現在地を使用するか、地図にピンを置いてください。",
        how_it_works_example: "例：ヨーロッパにいても、メルボルンの家を売りたい場合。その地域にピンを置いて買い手を待ちましょう。",
        why_choose: "なぜTangle-me？",
        free_forever: "永久無料：",
        free_forever_desc: "テキスト広告は一切無料",
        global_reach: "グローバルリーチ：",
        global_reach_desc: "世界中で複数言語に対応",
        simple_fast: "シンプル＆高速：",
        simple_fast_desc: "数秒で広告を投稿",
        built_trust: "信頼の構築：",
        built_trust_desc: "信頼されたタングルとつながる",
        supported_languages: "対応言語",
        languages_list: "英語、スペイン語、フランス語、ドイツ語、ポルトガル語、中国語、アラビア語、ヒンディー語、ロシア語、日本語",
        browser_tip: "ブラウザ推奨：",
        browser_tip_desc: "Brave、Chrome、Edgeをご使用ください。",
        contact_intro: "ご質問やサポートが必要ですか？お気軽にどうぞ！",
        email_us: "メール：",
        email_tip: "ヒント：",
        email_tip_desc: "メールアドレスをクリックしてアプリを開きます。",
        terms: "利用規約",
        privacy: "プライバシー",
        terms_title: "📜 利用規約",
        privacy_title: "🔒 プライバシーポリシー",
        legal_english_note: "法的文書は英語で提供されています。",
        i_understand: "理解しました",
        add_photos: "写真を追加",
        add_photo: "写真を追加",
        photos_remaining: "枚残り",
        upgrade_for_photos: "写真のためにアップグレード",
        upgrade_to_pro: "PROにアップグレード",
        your_plan: "あなたのプラン：",
        post_new: "新規投稿",
        bulk_upload: "スマートアップロード",
        install_app: "Tangle-meをインストール",
        install_app_desc: "ホーム画面に追加",
        install: "インストール",
        back: "戻る",
        your_ad: "あなたの広告",
        advertise_anywhere: "世界中どこでも広告できます",
        photos_title: "写真",
        photos_require_sub: "写真にはサブスクリプションが必要",
        photos_sub_desc: "ベーシック(€2.99/月) 写真20枚 またはプロ(€9.99/月) 無制限の広告と写真(広告あたり20枚)",
        view_plans: "プランを見る",
        this_ad: "この広告",
        photo_tip: "最初の写真がメイン画像になります。×で削除。",
        uploading_photos: "写真をアップロード中...",
        please_login_post: "広告を投稿するにはログインしてください",
        return_main: "メインページに戻ってログインまたは登録",
        go_main: "メインページへ",
        map_hint_post: "地図をタップして広告の場所を設定",
        detecting: "検出中...",
        search_title: "検索",
        find_ads: "広告を探す",
        search_placeholder: "例：トヨタ、アパート、配管工...",
        use_current_location: "現在地を使用",
        drop_pin_world: "世界中どこにでもピンを置けます",
        map_hint_find: "地図をタップしてピンを置く",
        search_location_label: "検索場所：",
        search_btn: "検索",
        km: "km",
        global_search: "グローバル",
        limit_reached: "上限に達しました",
        location_title: "場所",
        contact_title: "連絡先"
    }
};

function initializeLanguage() {
    const e = localStorage.getItem("tangleme_language") || "en";
    currentLanguage = e, createLanguageSwitcher(), applyTranslations(), i18nInitialized = !0, console.log("Language initialized:", currentLanguage)
}

function createLanguageSwitcher() {
    if (document.getElementById("languageSwitcher")) return;
    const e = document.getElementById("headerAuth");
    if (!e) return;
    const t = document.createElement("button");
    t.className = "language-btn", t.id = "languageSwitcher", t.onclick = toggleLanguageMenu;
    const n = {
        en: "gb",
        es: "es",
        fr: "fr",
        de: "de",
        pt: "pt",
        zh: "cn",
        ar: "sa",
        hi: "in",
        ru: "ru",
        ja: "jp"
    } [currentLanguage] || "gb";
    t.innerHTML = `<span class="fi fi-${n}" style="display: inline-block; width: 20px; height: 15px; background-size: contain; background-position: center; background-repeat: no-repeat; vertical-align: middle;"></span> ${currentLanguage.toUpperCase()} ▼`, e.insertBefore(t, e.firstChild), createLanguageDropdown()
}

function createLanguageDropdown() {
    const e = document.getElementById("languageDropdown");
    e && e.remove();
    const t = document.createElement("div");
    t.id = "languageDropdown", t.className = "language-dropdown", t.style.display = "none", t.innerHTML = [{
        code: "en",
        flagCode: "gb",
        name: "English"
    }, {
        code: "es",
        flagCode: "es",
        name: "Español"
    }, {
        code: "fr",
        flagCode: "fr",
        name: "Français"
    }, {
        code: "de",
        flagCode: "de",
        name: "Deutsch"
    }, {
        code: "pt",
        flagCode: "pt",
        name: "Português"
    }, {
        code: "zh",
        flagCode: "cn",
        name: "中文"
    }, {
        code: "ar",
        flagCode: "sa",
        name: "العربية"
    }, {
        code: "hi",
        flagCode: "in",
        name: "हिन्दी"
    }, {
        code: "ru",
        flagCode: "ru",
        name: "Русский"
    }, {
        code: "ja",
        flagCode: "jp",
        name: "日本語"
    }].map(e => `\n        <div class="language-option" onclick="switchLanguage('${e.code}')" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer;">\n            <span class="fi fi-${e.flagCode}" style="display: inline-block; width: 24px; height: 18px; background-size: contain; background-position: center; background-repeat: no-repeat; border-radius: 2px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);"></span>\n            <span class="lang-name" style="font-weight: 600; color: #2d3748;">${e.name}</span>\n        </div>\n    `).join(""), document.body.appendChild(t)
}

function toggleLanguageMenu() {
    const e = document.getElementById("languageDropdown"),
        t = document.getElementById("languageSwitcher");
    if (e && t)
        if ("block" === e.style.display) e.style.display = "none";
        else {
            const n = t.getBoundingClientRect();
            e.style.position = "absolute", e.style.top = n.bottom + 5 + "px", e.style.right = "10px", e.style.display = "block"
        }
}

function switchLanguage(e) {
    console.log(`🌐 Switching language to: ${e.toUpperCase()}`), currentLanguage = e, localStorage.setItem("tangleme_language", e);
    const t = {
            en: "gb",
            es: "es",
            fr: "fr",
            de: "de",
            pt: "pt",
            zh: "cn",
            ar: "sa",
            hi: "in",
            ru: "ru",
            ja: "jp"
        } [e] || "gb",
        n = document.getElementById("languageSwitcher");
    n && (n.innerHTML = `<span class="fi fi-${t}" style="display: inline-block; width: 20px; height: 15px; background-size: contain; background-position: center; background-repeat: no-repeat; vertical-align: middle;"></span> ${e.toUpperCase()} ▼`);
    const o = document.getElementById("languageSwitcherBtn");
    o && (o.innerHTML = `<span class="fi fi-${t}" style="display: inline-block; width: 20px; height: 15px; background-size: contain; background-position: center; background-repeat: no-repeat; vertical-align: middle;"></span> ${e.toUpperCase()} ▼`, console.log(`✅ Updated language button to: ${e.toUpperCase()}`));
    const s = document.getElementById("languageDropdown");
    s && (s.style.display = "none"), console.log("🔄 Calling applyTranslations()..."), applyTranslations()
}

function toggleLanguageDropdown() {
    document.getElementById("languageDropdown") || createLanguageDropdown();
    const e = document.getElementById("languageDropdown"),
        t = document.getElementById("languageSwitcherBtn");
    if (e && t)
        if ("block" === e.style.display) e.style.display = "none";
        else {
            const n = t.getBoundingClientRect();
            e.style.position = "fixed", e.style.top = n.bottom + 5 + "px", e.style.left = n.left + "px", e.style.display = "block"
        }
}

function applyTranslations() {
    const e = translations[currentLanguage] || translations.en;
    console.log(`🌍 Applying translations for: ${currentLanguage.toUpperCase()}`);
    const t = document.querySelectorAll("[data-i18n]");
    console.log(`📝 Found ${t.length} elements with data-i18n attribute`);
    let n = 0;
    t.forEach(t => {
        const o = t.getAttribute("data-i18n");
        e[o] ? (void 0 !== t.placeholder && null !== t.placeholder ? t.placeholder = e[o] : t.textContent = e[o], n++) : o && console.warn(`⚠️ Missing translation for key: ${o} in ${currentLanguage}`)
    }), console.log(`✅ Updated ${n} elements`)
}

function initMap() {
    map && map.remove(), navigator.geolocation ? navigator.geolocation.getCurrentPosition(function(e) {
        const t = e.coords.latitude,
            n = e.coords.longitude;
        console.log("Map centered on user location:", t, n), map = L.map("map").setView([t, n], 13), L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
            maxZoom: 19
        }).addTo(map), setupMapClickHandler(), setTimeout(() => {
            map.invalidateSize()
        }, 100)
    }, function(e) {
        console.log("Geolocation failed, using world view:", e.message), createFallbackMap()
    }, {
        enableHighAccuracy: !1,
        timeout: 5e3,
        maximumAge: 3e5
    }) : (console.log("Geolocation not supported"), createFallbackMap())
}

function createFallbackMap() {
    map = L.map("map").setView([0, 0], 2), L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19
    }).addTo(map), setupMapClickHandler(), setTimeout(() => {
        map.invalidateSize()
    }, 100)
}

function setupMapClickHandler() {
    map.on("click", async function(e) {
        const t = e.latlng.lat,
            n = e.latlng.lng;
        marker && map.removeLayer(marker), marker = L.marker([t, n]).addTo(map), document.getElementById("mapSelectedAddress").textContent = "Finding location...";
        const o = `Location at ${formatCoordinates(t,n)}`;
        itemLocationData = {
            address: o,
            latitude: t,
            longitude: n
        };
        let s = o;
        try {
            const e = await reverseGeocode(t, n);
            e && e.friendly_name && (s = e.friendly_name, itemLocationData.address = s)
        } catch (e) {
            console.error("Reverse geocoding error:", e)
        }
        document.getElementById("mapSelectedAddress").textContent = s, document.getElementById("mapConfirmBtn").disabled = !1
    })
}

function initMapSearch() {
    mapSearch && mapSearch.remove(), navigator.geolocation ? navigator.geolocation.getCurrentPosition(function(e) {
        const t = e.coords.latitude,
            n = e.coords.longitude;
        mapSearch = L.map("mapSearch").setView([t, n], 13), L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
            maxZoom: 19
        }).addTo(mapSearch), setupMapSearchClickHandler(), setTimeout(() => {
            mapSearch.invalidateSize()
        }, 100)
    }, function(e) {
        createFallbackMapSearch()
    }, {
        enableHighAccuracy: !1,
        timeout: 5e3,
        maximumAge: 3e5
    }) : createFallbackMapSearch()
}

function createFallbackMapSearch() {
    mapSearch = L.map("mapSearch").setView([0, 0], 2), L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19
    }).addTo(mapSearch), setupMapSearchClickHandler(), setTimeout(() => {
        mapSearch.invalidateSize()
    }, 100)
}

function setupMapSearchClickHandler() {
    mapSearch.on("click", async function(e) {
        const t = e.latlng.lat,
            n = e.latlng.lng;
        markerSearch && mapSearch.removeLayer(markerSearch), markerSearch = L.marker([t, n]).addTo(mapSearch), document.getElementById("mapSearchSelectedAddress").textContent = "Finding location...";
        const o = `Location at ${formatCoordinates(t,n)}`;
        searchLocation = {
            address: o,
            latitude: t,
            longitude: n
        }, findSearchLocation = {
            address: o,
            latitude: t,
            longitude: n
        };
        let s = o;
        try {
            const e = await reverseGeocode(t, n);
            e && e.friendly_name && (s = e.friendly_name, searchLocation.address = s, findSearchLocation.address = s)
        } catch (e) {
            console.error("Reverse geocoding error:", e)
        }
        document.getElementById("mapSearchSelectedAddress").textContent = s, document.getElementById("mapSearchConfirmBtn").disabled = !1
    })
}

function createAdCard(e, t, n, o) {
    const s = document.createElement("div");
    s.className = "ad-card";
    const a = formatMemberDate(e.member_since),
        r = currentUser && String(currentUser.id) === String(e.user_id),
        i = savedTangles.some(t => String(t.saved_user_id) === String(e.user_id)),
        l = escapeJsString(e.keywords || ""),
        d = escapeJsString(e.description || ""),
        c = e.created_at ? getTimeAgo(e.created_at) : "";
    return s.innerHTML = `\n        \x3c!-- Build 007: Ad ID Badge --\x3e\n        <div class="ad-id-badge">Ad #${e.id}</div>\n        \n        <div class="ad-header-top" style="padding-right: 70px;">\n            <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; flex: 1;">\n                <div class="ad-keywords" style="flex: 1;">${escapeHtml(e.keywords)}</div>\n            </div>\n            ${!r&&currentUser&&e.user_id?`\n                <button class="star-btn ${i?"saved":""}" \n                        onclick="toggleSaveTangle(${e.user_id}, ${e.id}, this)"\n                        title="${i?"Remove from My Tangles":"Save to My Tangles"}">\n                    ${i?"⭐":"☆"}\n                </button>\n            `:""}\n        </div>\n        \n        \x3c!-- v4.3.6 - Posted timestamp --\x3e\n        ${c?`\n        <div class="ad-posted-time" style="font-size: 0.8rem; color: #718096; margin-bottom: 0.5rem;">\n            🕐 Posted: ${c}\n        </div>\n        `:""}\n        \n        ${e.username?`\n        <div class="ad-posted-by">\n            <div class="posted-by-label">Posted by</div>\n            <div class="posted-by-username">${escapeHtml(e.username)}</div>\n            <div class="posted-by-country">\n                <span>${e.country_flag||""}</span>\n                <span>${e.country_code||""}</span>\n                <span>${escapeHtml(e.country_name||"")}</span>\n            </div>\n            <div class="posted-by-date">Tangle since: ${a}</div>\n        </div>\n        `:""}\n        \n        ${e.photos&&e.photos.length>0?`\n        <div class="ad-photo-carousel" id="carousel-${e.id}" data-photos='${JSON.stringify(e.photos).replace(/'/g,"&#39;")}'>\n            <img class="ad-photo-main" \n                 src="/${e.photos[0].full||e.photos[0].thumb||e.photos[0]}" \n                 alt="Photo 1" \n                 onerror="this.style.display='none'; console.log('Photo load error:', this.src)"\n                 onclick="openCarouselLightbox(${e.id},0)">\n            ${e.photos.length>1?'<div class="ad-photo-thumbnails">'+e.photos.map((t,n)=>'<img class="ad-photo-thumb '+(0===n?"active":"")+'" src="/'+(t.thumb||t.full||t)+'" alt="Thumb '+(n+1)+'" onerror="this.style.display=\'none\'" onclick="switchCarouselPhoto('+e.id+", "+n+", '"+(t.full||t.thumb||t)+"')\">").join("")+"</div>":""}\n            <div class="ad-photo-count">📷 ${e.photos.length}</div>\n        </div>\n        `:""}\n        \n        <div class="ad-description">${escapeHtml(e.description)}</div>\n        \n        <div class="ad-locations">\n            <div class="ad-location-item">\n                <span class="ad-location-label">📍 Location:</span>\n                <span class="ad-location-value">${escapeHtml(e.location_address||"Unknown")}</span>\n            </div>\n        </div>\n        \n        <div class="ad-contact">\n            <span class="ad-contact-label">📞 Contact:</span>\n            <span class="ad-contact-value">${linkifyText(e.contact||"")}</span>\n        </div>\n        \n        <div class="ad-actions">\n            ${r?`\n                <button class="ad-action-btn" onclick="editAd(${e.id})">✏️ Edit</button>\n                <button class="ad-action-btn" onclick="shareAd(${e.id}, '${l}', '${d}')">🔗 Share</button>\n                <button class="ad-action-btn" onclick="deleteAd(${e.id})" style="background: #f44336;">🗑️ Delete</button>\n            `:currentUser?`\n                <button class="ad-action-btn" onclick="sendMessageToAd(${e.id}, '${escapeJsString(e.username)}', '${escapeJsString(e.keywords)}', ${e.user_id})">💬 Send Message</button>\n                <button class="ad-action-btn" onclick="shareAd(${e.id}, '${l}', '${d}')">🔗 Share</button>\n            `:`\n                <button class="ad-action-btn" onclick="alert('Please login to send messages')">💬 Message (Login Required)</button>\n                <button class="ad-action-btn" onclick="shareAd(${e.id}, '${l}', '${d}')">🔗 Share</button>\n            `}\n        </div>\n        ${!r&&currentUser?`<button class="ad-report-flag" onclick="showReportModal(${e.id})" title="Report this ad">🚩</button>`:""}\n    `, s
}
async function loadMyAds() {
    if (currentUser) try {
        const e = await fetch(`/api/get-my-ads.php?user_id=${currentUser.id}`, {
                credentials: "include"
            }),
            t = await e.json(),
            n = document.getElementById("myAdsContainer") || document.getElementById("myAdsModalContainer");
        if (!n) return void console.log("My Ads container not found - modal may not be open");
        const o = t.success && (t.ads || t.data) || [];
        if (o.length > 0) {
            n.innerHTML = "";
            const e = o.length;
            o.forEach((t, o) => {
                const s = o + 1;
                n.appendChild(createAdCard(t, !0, s, e))
            }), console.log(`📦 My Ads loaded: ${e}`)
        } else n.innerHTML = '\n                <div class="no-ads-message">\n                    <div class="no-ads-icon">📝</div>\n                    <div class="no-ads-text">You haven\'t posted any ads yet</div>\n                    <div class="no-ads-subtext">Click "Post New" to create your first ad!</div>\n                </div>\n            '
    } catch (e) {
        console.error("Error loading my ads:", e)
    }
}

function editAd(e) {
    if ("file:" === window.location.protocol || "localhost" === window.location.hostname || "127.0.0.1" === window.location.hostname) {
        const t = JSON.parse(localStorage.getItem("tangleme_ads") || "[]").find(t => t.id == e);
        t ? openEditAdModal(t) : alert("Ad not found")
    } else fetch(`/api/get-my-ads.php?user_id=${currentUser.id}`, {
        credentials: "include"
    }).then(e => e.json()).then(t => {
        if (t.success) {
            const n = t.ads || t.data || [],
                o = n.find(t => String(t.id) === String(e));
            o ? openEditAdModal(o) : (console.error("Edit: Ad not found in response. adId:", e, "ads:", n), alert("Ad not found. Please refresh and try again."))
        } else console.error("Edit: API error:", t.error), alert("Error loading ad: " + (t.error || "Please try again."))
    }).catch(e => {
        console.error("Error fetching ad:", e), alert("Error loading ad for editing")
    })
}

// Build 024: Enhanced edit modal with photo management
let editAdPhotos = []; // Current photos being edited

function openEditAdModal(e) {
    currentEditAdId = e.id;
    document.getElementById("editAdId").value = e.id;
    let t = e.keywords || "";
    e.description && e.description.trim() && (t += "\n\n" + e.description);
    document.getElementById("editKeywords").value = t;
    document.getElementById("editContact").value = e.contact || "";

    // Build 024: Load photos into edit modal
    editAdPhotos = (e.photos && Array.isArray(e.photos)) ? e.photos.map(p => ({
        thumb: p.thumb || "",
        full: p.full || p.thumb || ""
    })) : [];
    renderEditAdPhotos();

    document.getElementById("editAdModal").classList.add("show");
}

function renderEditAdPhotos() {
    let container = document.getElementById("editAdPhotosContainer");
    if (!container) {
        // Inject photo container into edit modal if it doesn't exist
        const editForm = document.getElementById("editAdForm") || document.querySelector("#editAdModal form");
        if (editForm) {
            const div = document.createElement("div");
            div.id = "editAdPhotosContainer";
            div.style.cssText = "margin-bottom: 1rem;";
            // Insert before the submit button area
            const submitBtn = editForm.querySelector("button[type=submit], .btn-primary");
            if (submitBtn && submitBtn.parentElement) {
                submitBtn.parentElement.parentElement.insertBefore(div, submitBtn.parentElement);
            } else {
                editForm.appendChild(div);
            }
            container = div;
        } else return;
    }

    if (editAdPhotos.length === 0) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = `
        <div style="font-weight: 600; font-size: 0.85rem; color: #4a5568; margin-bottom: 0.5rem;">
            Photos (${editAdPhotos.length})
            <span style="font-size: 0.75rem; color: #a0aec0; font-weight: 400; margin-left: 0.5rem;">Drag to rearrange</span>
        </div>
        <div id="editPhotoGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 0.5rem;">
            ${editAdPhotos.map((p, i) => {
                const src = p.full ? (p.full.startsWith("/") ? p.full : "/" + p.full) :
                            p.thumb ? (p.thumb.startsWith("/") ? p.thumb : "/" + p.thumb) : "";
                return `
                <div class="edit-photo-item" draggable="true" data-idx="${i}"
                     style="position: relative; border-radius: 6px; overflow: hidden; aspect-ratio: 1; border: 2px solid ${i === 0 ? '#3b82f6' : '#e2e8f0'}; cursor: grab; background: #f7fafc;">
                    <img src="${src}" alt="Photo ${i+1}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.style.display='none'">
                    <div style="position: absolute; top: 2px; left: 2px; background: ${i === 0 ? '#3b82f6' : 'rgba(0,0,0,0.5)'}; color: white; font-size: 0.65rem; padding: 1px 5px; border-radius: 3px; font-weight: 700;">
                        ${i === 0 ? '★' : (i + 1)}
                    </div>
                    <button type="button" onclick="deleteEditPhoto(${i})"
                            style="position: absolute; top: 2px; right: 2px; background: rgba(220,38,38,0.85); color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1;">×</button>
                </div>`;
            }).join("")}
        </div>
    `;

    // Setup drag-and-drop for edit photos
    setTimeout(() => {
        const grid = document.getElementById("editPhotoGrid");
        if (!grid) return;
        let dragIdx = null;
        grid.querySelectorAll(".edit-photo-item").forEach(item => {
            item.addEventListener("dragstart", function(e) {
                dragIdx = parseInt(this.dataset.idx);
                this.style.opacity = "0.4";
                e.dataTransfer.effectAllowed = "move";
            });
            item.addEventListener("dragend", function() {
                this.style.opacity = "1";
            });
            item.addEventListener("dragover", function(e) {
                e.preventDefault();
                this.style.borderColor = "#3b82f6";
            });
            item.addEventListener("dragleave", function() {
                const idx = parseInt(this.dataset.idx);
                this.style.borderColor = idx === 0 ? "#3b82f6" : "#e2e8f0";
            });
            item.addEventListener("drop", function(e) {
                e.preventDefault();
                const dropIdx = parseInt(this.dataset.idx);
                if (dragIdx !== null && dragIdx !== dropIdx) {
                    const moved = editAdPhotos.splice(dragIdx, 1)[0];
                    editAdPhotos.splice(dropIdx, 0, moved);
                    renderEditAdPhotos();
                }
            });
            // Touch support
            let touchStartIdx = null;
            item.addEventListener("touchstart", function(e) {
                touchStartIdx = parseInt(this.dataset.idx);
            }, {passive: true});
            item.addEventListener("touchend", function(e) {
                if (touchStartIdx === null) return;
                const touch = e.changedTouches[0];
                const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
                if (dropTarget) {
                    const dropItem = dropTarget.closest(".edit-photo-item");
                    if (dropItem) {
                        const dropIdx = parseInt(dropItem.dataset.idx);
                        if (touchStartIdx !== dropIdx) {
                            const moved = editAdPhotos.splice(touchStartIdx, 1)[0];
                            editAdPhotos.splice(dropIdx, 0, moved);
                            renderEditAdPhotos();
                        }
                    }
                }
                touchStartIdx = null;
            });
        });
    }, 100);
}

function deleteEditPhoto(idx) {
    const photo = editAdPhotos[idx];
    if (!photo) return;
    // Delete from server
    if (photo.thumb && currentUser) {
        fetch("/api/delete-photo.php", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                user_id: currentUser.id,
                tier: userSubscription.tier,
                photo_path: photo.thumb
            })
        }).then(r => r.json()).then(d => {
            if (d.success && "basic" === userSubscription.tier) {
                userPhotoCount = Math.max(0, userPhotoCount - 1);
                initPhotoUploadUI();
            }
        }).catch(e => console.error("Error deleting edit photo:", e));
    }
    editAdPhotos.splice(idx, 1);
    renderEditAdPhotos();
}

function closeEditAd() {
    document.getElementById("editAdModal").classList.remove("show"), currentEditAdId = null, editAdPhotos = [];
}
async function handleEditAdSubmit(e) {
    e.preventDefault();
    const t = document.getElementById("editAdId").value,
        n = document.getElementById("editKeywords").value.trim(),
        o = document.getElementById("editContact").value.trim();
    if (!n) return void alert("Please enter ad content");
    const s = "file:" === window.location.protocol || "localhost" === window.location.hostname || "127.0.0.1" === window.location.hostname;
    try {
        if (s) {
            const e = JSON.parse(localStorage.getItem("tangleme_ads") || "[]"),
                s = e.findIndex(e => e.id == t);
            if (-1 !== s) {
                e[s].keywords = n, e[s].contact = o, e[s].photos = editAdPhotos, e[s].updated_at = (new Date).toISOString(), localStorage.setItem("tangleme_ads", JSON.stringify(e)), showSuccess("Ad updated successfully!"), closeEditAd(), loadPostedAds(!0), loadMyAds();
                const t = document.getElementById("adDetailModal");
                t && t.classList.contains("show") && t.classList.remove("show")
            } else alert("Ad not found")
        } else {
            const e = await fetch("/api/update-ad.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        ad_id: t,
                        user_id: currentUser.id,
                        keywords: n,
                        description: "",
                        contact: o,
                        photos: editAdPhotos
                    })
                }),
                s = await e.json();
            s.success ? (closeEditAd(), showSuccess("Ad updated successfully!"), loadPostedAds(!0), loadMyAds(), closeMyAdsModal()) : alert("Error: " + (s.error || "Failed to update ad"))
        }
    } catch (e) {
        console.error("Error updating ad:", e), alert("Failed to update ad. Please try again.")
    }
}
async function loadSavedTangles() {
    if (currentUser) try {
        const e = await fetch(`/api/get-saved-tangles.php?user_id=${currentUser.id}`, {
                credentials: "include"
            }),
            t = await e.json();
        t.success && t.data ? (savedTangles = t.data, console.log("Loaded saved Tangles from server:", savedTangles.length)) : (savedTangles = [], console.log("No saved Tangles found or error:", t.error))
    } catch (e) {
        console.error("Error loading saved Tangles:", e), savedTangles = []
    } else savedTangles = []
}

function loadMyTangles() {
    displaySavedTangles()
}

function openMyTangles() {
    if (!currentUser) return alert("Please login to view your saved Tangles"), void openLoginModal();
    displaySavedTangles(), document.getElementById("myTanglesModal").classList.add("show")
}

function closeMyTangles() {
    // Reset to tangles list view before closing
    backToTanglesList();
    document.getElementById("myTanglesModal").classList.remove("show")
}

function openMyAdsModal() {
    if (!currentUser) return alert("Please login to view your posted ads"), void openLoginModal();
    loadMyAdsModal(), updateMyAdsSubscriptionBanner(), document.getElementById("myAdsModal").classList.add("show"), syncSubscriptionStatus().then(() => {
        updateMyAdsSubscriptionBanner(), updateHeaderTierBadge()
    }).catch(() => {})
}

function closeMyAdsModal() {
    document.getElementById("myAdsModal").classList.remove("show")
}
async function loadMyAdsModal() {
    const e = document.getElementById("myAdsModalContainer");
    if (currentUser) {
        e.innerHTML = '\n        <div class="no-ads-message">\n            <div class="no-ads-icon">⏳</div>\n            <div class="no-ads-text">Loading your ads...</div>\n        </div>\n    ';
        try {
            const t = "file:" === window.location.protocol || "localhost" === window.location.hostname || "127.0.0.1" === window.location.hostname;
            let n = [];
            if (t) n = JSON.parse(localStorage.getItem("tangleme_ads") || "[]").filter(e => String(e.user_id) === String(currentUser.id));
            else {
                const e = await fetch(`/api/get-my-ads.php?user_id=${currentUser.id}`, {
                        credentials: "include"
                    }),
                    t = await e.json();
                t.success && (n = t.ads || t.data || [])
            }
            if (console.log("📝 My Ads loaded:", n.length), n.length > 0 && n[0].photos && console.log("📸 First ad photos:", n[0].photos), 0 === n.length) return void(e.innerHTML = '\n                <div class="no-ads-message">\n                    <div class="no-ads-icon">📝</div>\n                    <div class="no-ads-text">No ads posted yet</div>\n                    <div class="no-ads-subtext">Click "Post New" to create your first ad!</div>\n                </div>\n            ');
            e.innerHTML = "", n.forEach(t => {
                const n = createMyAdCard(t);
                e.appendChild(n)
            })
        } catch (t) {
            console.error("Error loading my ads:", t), e.innerHTML = '\n            <div class="no-ads-message">\n                <div class="no-ads-icon">❌</div>\n                <div class="no-ads-text">Failed to load ads</div>\n                <div class="no-ads-subtext">Please try again later</div>\n            </div>\n        '
        }
    } else e.innerHTML = '\n            <div class="no-ads-message">\n                <div class="no-ads-icon">🔒</div>\n                <div class="no-ads-text">Please login first</div>\n            </div>\n        '
}

function createMyAdCard(e) {
    const t = document.createElement("div");
    t.className = "ad-card", t.style.marginBottom = "1rem", t.id = `my-ad-${e.id}`;
    const n = formatMemberDate(e.created_at || e.member_since),
        o = e.country_code ? `<span class="fi fi-${e.country_code.toLowerCase()}"></span>` : "",
        s = e.country_name || "",
        a = e.keywords || "No title",
        r = e.description || "";
    let i = "";
    if (e.photos && e.photos.length > 0) {
        const t = e.photos[0],
            n = t.full || t.thumb || t,
            o = t.full || t.thumb || t;
        const photosJson = JSON.stringify(e.photos).replace(/'/g, "&#39;");
        i = `\n        <div class="ad-photo-carousel" id="my-carousel-${e.id}" data-photos='${photosJson}' style="position: relative; margin-bottom: 1rem;">\n            <img class="ad-photo-main" \n                 src="/${n}" \n                 alt="Photo 1" \n                 style="width: 100%; max-height: 300px; object-fit: contain; border-radius: 8px; cursor: pointer; background: #f0f0f0;"\n                 onerror="this.style.display='none'; console.log('Photo load error:', this.src)"\n                 onclick="openCarouselLightbox(${e.id},0)">\n            ${e.photos.length>1?`\n            <div class="ad-photo-thumbnails" style="display: flex; gap: 0.5rem; margin-top: 0.5rem; overflow-x: auto;">\n                ${e.photos.map((t,n)=>{const o=t.thumb||t.full||t,s=t.full||t.thumb||t;return`<img class="ad-photo-thumb ${0===n?"active":""}" \n                         src="/${o}" \n                         alt="Thumb ${n+1}"\n                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 2px solid ${0===n?"#3b82f6":"transparent"};"\n                         onerror="this.style.display='none'"\n                         onclick="switchMyAdPhoto(${e.id}, ${n}, '${s}')">`}).join("")}\n            </div>\n            `:""}\n            <div class="ad-photo-count" style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.6); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">📷 ${e.photos.length}</div>\n        </div>\n        `
    }
    return t.innerHTML = `\n        \x3c!-- Build 007: Ad ID Badge - permanent reference number --\x3e\n        <div class="ad-id-badge">Ad #${e.id}</div>\n        \n        <div class="my-ad-title" style="display: block; font-size: 1.1rem; font-weight: 600; color: #2d3748; margin-bottom: 0.75rem; line-height: 1.4; padding-right: 70px;">\n            ${escapeHtml(a)}\n        </div>\n        \n        ${i}\n        \n        ${r?`\n        <div class="my-ad-description" style="display: block; margin-bottom: 0.75rem; color: #4a5568; font-size: 0.95rem;">\n            ${escapeHtml(r)}\n        </div>\n        `:""}\n        \n        <div class="ad-locations" style="background: #f0f9ff; padding: 0.75rem; border-radius: 8px; margin-bottom: 0.75rem;">\n            <div class="ad-location-item" style="display: flex; align-items: flex-start; gap: 0.5rem;">\n                <span style="color: #e53e3e; flex-shrink: 0;">📍</span>\n                <span style="font-weight: 500; flex-shrink: 0;">Location:</span>\n                <span style="color: #3182ce; word-break: break-word;">${escapeHtml(e.location_address||"Unknown")}</span>\n            </div>\n            ${e.contact?`\n            <div class="ad-location-item" style="display: flex; align-items: flex-start; gap: 0.5rem; margin-top: 0.5rem;">\n                <span style="color: #38a169; flex-shrink: 0;">📞</span>\n                <span style="font-weight: 500; flex-shrink: 0;">Contact:</span>\n                <span style="color: #3182ce; word-break: break-word;">${escapeHtml(e.contact)}</span>\n            </div>\n            `:""}\n            ${o?`\n            <div class="ad-location-item" style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">\n                ${o}\n                <span>${s}</span>\n            </div>\n            `:""}\n        </div>\n        \n        <div style="font-size: 0.8rem; color: #718096; margin-bottom: 0.75rem;">\n            Posted: ${n}\n        </div>\n        \n        ${getExpiryBadgeHTML(e)}\n        \n        <div class="ad-actions" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem;">\n            <button class="btn-action" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 0.6rem; border: none; border-radius: 8px; cursor: pointer; font-size: 0.85rem;" onclick="editAd(${e.id})">\n                📝 Edit\n            </button>\n            <button class="btn-action" style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 0.6rem; border: none; border-radius: 8px; cursor: pointer; font-size: 0.85rem;" onclick="shareAd(${e.id}, '${escapeJsString(a)}', '${escapeJsString(r||"")}')">\n                🔗 Share\n            </button>\n            <button class="btn-action" style="background: linear-gradient(135deg, #f56565 0%, #c53030 100%); color: white; padding: 0.6rem; border: none; border-radius: 8px; cursor: pointer; font-size: 0.85rem;" onclick="deleteMyAd(${e.id})">\n                🗑️ Delete\n            </button>\n        </div>\n    `, t
}

function switchMyAdPhoto(e, t, n) {
    const o = document.getElementById(`my-carousel-${e}`);
    if (!o) return;
    const s = o.querySelector(".ad-photo-main"),
        a = o.querySelectorAll(".ad-photo-thumb");
    s && (s.src = "/" + n, s.onclick = () => openCarouselLightbox(e, t)), a.forEach((e, n) => {
        e.style.borderColor = n === t ? "#3b82f6" : "transparent"
    })
}
async function deleteMyAd(e) {
    if (confirm("Are you sure you want to delete this ad? This action cannot be undone.")) try {
        if ("file:" === window.location.protocol || "localhost" === window.location.hostname || "127.0.0.1" === window.location.hostname) {
            let t = JSON.parse(localStorage.getItem("tangleme_ads") || "[]");
            t = t.filter(t => t.id !== e), localStorage.setItem("tangleme_ads", JSON.stringify(t))
        } else {
            const t = await fetch("/api/delete-ad.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        ad_id: e,
                        user_id: currentUser.id,
                        user_email: currentUser.email
                    })
                }),
                n = await t.json();
            if (console.log("Delete result:", n), !n.success) throw new Error(n.error || "Delete failed")
        }
        const t = document.getElementById(`my-ad-${e}`);
        t && t.remove(), showSuccess("Ad deleted successfully! 🗑️"), loadMyAdsModal()
    } catch (e) {
        console.error("Delete error:", e), alert("Failed to delete ad. Please try again.")
    }
}
async function displaySavedTangles(skipReload) {
    const e = document.getElementById("tanglesContainer");
    // Show Tangles list (hide ads panel if visible)
    const adsPanel = document.getElementById("tangleAdsPanel");
    if (adsPanel) adsPanel.style.display = "none";
    if (e) e.style.display = "";

    if (!skipReload) await loadSavedTangles();
    if (0 === savedTangles.length) {
        e.innerHTML = '\n            <div class="no-tangles">\n                <div class="no-tangles-icon">⭐</div>\n                <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">No saved contacts yet</div>\n                <div style="font-size: 0.9rem; color: #718096;">Tap the ⭐ star on any ad to save that advertiser here</div>\n            </div>\n        ';
        return;
    }

    e.innerHTML = "";
    savedTangles.forEach(t => {
        const n = document.createElement("div");
        n.className = "tangle-card-v2";
        n.id = "tangle-card-" + t.saved_user_id;
        const label = t.notes || "";
        // Build 028: Use saved_ad_count (from junction table) instead of total_ads
        const adCount = parseInt(t.saved_ad_count) || 0;
        const username = t.saved_username || "unknown";
        const userId = t.saved_user_id;

        n.innerHTML = `
            <div class="tv2-top" onclick="viewTangleAds(${userId}, '${escapeJsString(username)}')">
                <div class="tv2-id">${escapeHtml(username)}</div>
                <div class="tv2-label" id="tv2-label-${userId}">${label ? escapeHtml(label) : '<span class="tv2-label-empty">tap to add note</span>'}</div>
                <div class="tv2-badge">${adCount} saved ad${adCount !== 1 ? 's' : ''}</div>
            </div>
            <div class="tv2-actions">
                <button class="tv2-btn tv2-btn-ads" onclick="viewTangleAds(${userId}, '${escapeJsString(username)}')">
                    📋 Ads (${adCount})
                </button>
                <button class="tv2-btn tv2-btn-contact" onclick="contactTangleUser(${userId}, '${escapeJsString(username)}')">
                    💬 Contact
                </button>
                <button class="tv2-btn tv2-btn-edit" onclick="editTangleLabel(${userId}, '${escapeJsString(username)}', '${escapeJsString(label)}')">
                    ✏️ Note
                </button>
                <button class="tv2-btn tv2-btn-remove" onclick="removeSavedTangle(${userId})">
                    🗑️
                </button>
            </div>
        `;
        e.appendChild(n);
    });
}
async function toggleSaveTangle(e, t, n) {
    if (!currentUser) return alert("Please login to save Tangles"), void openLoginModal();
    if (savedTangles.some(t => String(t.saved_user_id) === String(e))) {
        // Already saved — remove
        await removeSavedTangle(e);
        n.classList.remove("saved");
        n.textContent = "☆";
        n.title = "Save to My Tangles";
    } else {
        // First time saving — use modal with Ad# pre-populated
        // Find the ad data to get username/keywords
        var adCards = document.querySelectorAll(".ad-card");
        var username = "Unknown", keywords = "";
        adCards.forEach(function(card) {
            var starBtn = card.querySelector(".star-btn");
            if (starBtn === n) {
                var un = card.querySelector(".posted-by-username");
                if (un) username = un.textContent;
                var kw = card.querySelector(".ad-keywords");
                if (kw) keywords = kw.textContent;
            }
        });
        openSaveTangleModal(e, username, t, keywords);
        n.classList.add("saved");
        n.textContent = "⭐";
        n.title = "Remove from My Tangles";
    }
}
async function removeSavedTangle(e) {
    if (confirm("Remove this contact and all saved ads?")) try {
        // Build 028: Use remove-tangle-ad.php without ad_id to remove entire tangle
        const t = await fetch("/api/remove-tangle-ad.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    saved_user_id: e,
                    user_id: currentUser.id
                })
            }),
            n = await t.json();
        n.success ? (await loadSavedTangles(), displaySavedTangles(), document.querySelectorAll(".star-btn").forEach(t => {
            const n = t.getAttribute("onclick");
            n && n.includes(`toggleSaveTangle(${e},`) && (t.classList.remove("saved"), t.textContent = "☆")
        }), showSuccess("Contact removed")) : alert("Error: " + (n.error || "Failed to remove Tangle"))
    } catch (e) {
        console.error("Error removing Tangle:", e), alert("Failed to remove Tangle. Please try again.")
    }
}

// Build 028: Renamed to editTangleLabel — same backend, better UX name
function editTangleLabel(userId, username, currentLabel) {
    _pendingSaveTangle = null; // Ensure we're in edit mode, not save mode
    currentEditNoteUserId = userId;
    document.getElementById("editNoteUsername").textContent = username;
    document.getElementById("editNoteText").value = currentLabel;
    document.getElementById("noteCharCount").textContent = currentLabel.length;
    // Set modal to "Edit" mode
    var titleEl = document.querySelector("#editNoteModal .edit-note-title");
    if (titleEl) titleEl.textContent = "✏️ Edit Note";
    var saveBtn = document.querySelector("#editNoteModal .btn-primary");
    if (saveBtn) saveBtn.textContent = "Save Note";
    document.getElementById("editNoteModal").classList.add("show");
}
// Keep old function name as alias for backward compatibility
function editTangleNote(e, t, n) { editTangleLabel(e, t, n); }

function closeEditNote() {
    document.getElementById("editNoteModal").classList.remove("show");
    currentEditNoteUserId = null;
    _pendingSaveTangle = null;
    // Restore modal title to default
    var titleEl = document.querySelector("#editNoteModal .edit-note-title");
    if (titleEl) titleEl.textContent = "✏️ Edit Label";
    var saveBtn = document.querySelector("#editNoteModal .btn-primary");
    if (saveBtn) saveBtn.textContent = "Save Label";
}
async function saveEditedNote() {
    const noteText = document.getElementById("editNoteText").value.trim();
    
    // Build 028: Check if this is a NEW save (from message/search) or an EDIT
    if (_pendingSaveTangle) {
        // NEW SAVE MODE
        var ps = _pendingSaveTangle;
        try {
            var resp = await fetch("/api/save-tangle.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    saved_user_id: ps.savedUserId,
                    ad_id: ps.adId,
                    notes: noteText,
                    user_id: currentUser.id
                })
            });
            var data = await resp.json();
            if (data.success) {
                closeEditNote();
                await loadSavedTangles();
                loadMessages("inbox");
                showSuccess("Saved to My Tangles! ⭐");
            } else {
                alert("Error: " + (data.error || "Failed to save"));
            }
        } catch (err) {
            console.error("Error saving tangle:", err);
            alert("Failed to save. Please try again.");
        }
        return;
    }
    
    // EDIT EXISTING LABEL MODE
    const savedUserId = currentEditNoteUserId;
    try {
        const resp = await fetch("/api/update-tangle-note.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    saved_user_id: savedUserId,
                    notes: noteText,
                    user_id: currentUser.id
                })
            }),
            data = await resp.json();
        if (data.success) {
            closeEditNote();

            // Optimistic UI: update label directly in the card if visible
            const labelEl = document.getElementById("tv2-label-" + savedUserId);
            if (labelEl) {
                labelEl.innerHTML = noteText ? escapeHtml(noteText) : '<span class="tv2-label-empty">tap to add label</span>';
            }

            // Also update local savedTangles array so full refresh picks it up
            const entry = savedTangles.find(t => String(t.saved_user_id) === String(savedUserId));
            if (entry) entry.notes = noteText;

            // Refresh display using local data (skip server re-fetch since we just updated)
            await displaySavedTangles(true);
            showSuccess("Label updated!");
        } else {
            alert("Error: " + (data.error || "Failed to update label"));
        }
    } catch (err) {
        console.error("Error updating label:", err);
        alert("Failed to update label. Please try again.");
    }
}

// Build 026: Cache for currently viewed tangle's ads
let _tangleAdsCache = [];

// Build 026: View all ads by a saved Tangle user
async function viewTangleAds(userId, username) {
    const container = document.getElementById("tanglesContainer");
    let adsPanel = document.getElementById("tangleAdsPanel");

    // Create ads panel if it doesn't exist
    if (!adsPanel) {
        adsPanel = document.createElement("div");
        adsPanel.id = "tangleAdsPanel";
        container.parentNode.insertBefore(adsPanel, container.nextSibling);
    }

    // Hide the tangles list, show ads panel
    container.style.display = "none";
    adsPanel.style.display = "";
    adsPanel.innerHTML = `
        <div class="tv2-ads-header">
            <button class="tv2-back-btn" onclick="backToTanglesList()">← Back</button>
            <div class="tv2-ads-title">Ads by ${escapeHtml(username)}</div>
        </div>
        <div class="tv2-ads-loading">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">⏳</div>
            <div>Loading ads...</div>
        </div>
    `;

    try {
        // Build 028: Use get-tangle-ads.php to get only saved ads from junction table
        const resp = await fetch(`/api/get-tangle-ads.php?user_id=${currentUser.id}&saved_user_id=${userId}`, { credentials: "include" });
        const data = await resp.json();
        const ads = (data.success && data.ads) || [];
        _tangleAdsCache = ads; // Cache for detail viewing

        const adsContainer = adsPanel.querySelector(".tv2-ads-loading");
        if (ads.length === 0) {
            adsContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #718096;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📭</div>
                    <div>No saved ads for this contact</div>
                    <div style="font-size: 0.82rem; margin-top: 0.5rem; color: #a0aec0;">Star ⭐ ads from search results to save them here</div>
                </div>
            `;
            return;
        }

        // Check if this user is already saved and get the existing label
        const savedEntry = savedTangles.find(t => String(t.saved_user_id) === String(userId));
        const currentLabel = savedEntry ? savedEntry.notes || "" : "";

        // Show ad count
        let adsHTML = `<div class="tv2-ads-count">${ads.length} saved ad${ads.length !== 1 ? 's' : ''}</div>`;

        ads.forEach(ad => {
            const keywords = ad.keywords || "No title";
            const desc = ad.description || "";
            const hasPhotos = ad.photos && ad.photos.length > 0;
            const firstPhoto = hasPhotos ? (ad.photos[0].thumb || ad.photos[0].full || ad.photos[0]) : "";
            const location = ad.location_address || "Unknown";
            const adId = ad.id;

            adsHTML += `
                <div class="tv2-ad-card" id="tangle-ad-${adId}">
                    <div class="tv2-ad-content" onclick="viewTangleAdDetail(${adId})">
                        ${hasPhotos ? `<img class="tv2-ad-thumb" src="/${firstPhoto}" alt="" onerror="this.style.display='none'">` : ''}
                        <div class="tv2-ad-info">
                            <div class="tv2-ad-keywords">Ad #${adId} — ${escapeHtml(keywords)}</div>
                            ${desc ? `<div class="tv2-ad-desc">${escapeHtml(desc.substring(0, 80))}${desc.length > 80 ? '...' : ''}</div>` : ''}
                            <div class="tv2-ad-location">📍 ${escapeHtml(location)}</div>
                        </div>
                    </div>
                    <div class="tv2-ad-actions">
                        <button class="tv2-btn tv2-btn-contact" onclick="sendMessageToAd(${adId}, '${escapeJsString(ad.username || username)}', '${escapeJsString(keywords)}', ${userId})">💬 Message</button>
                        <button class="tv2-btn tv2-btn-remove" onclick="removeTangleAd(${userId}, ${adId}, '${escapeJsString(username)}')" title="Remove this ad">🗑️</button>
                    </div>
                </div>
            `;
        });

        adsContainer.outerHTML = adsHTML;

    } catch (err) {
        console.error("Error loading tangle ads:", err);
        adsPanel.querySelector(".tv2-ads-loading").innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #e53e3e;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">❌</div>
                <div>Failed to load ads. Please try again.</div>
            </div>
        `;
    }
}

// Build 028: Remove a specific saved ad from a tangle
async function removeTangleAd(savedUserId, adId, username) {
    if (!confirm("Remove this ad from saved list?")) return;
    try {
        var resp = await fetch("/api/remove-tangle-ad.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ user_id: currentUser.id, saved_user_id: savedUserId, ad_id: adId })
        });
        var data = await resp.json();
        if (data.success) {
            // Remove card from UI
            var card = document.getElementById("tangle-ad-" + adId);
            if (card) card.remove();
            
            // Update the count display
            var countEl = document.querySelector("#tangleAdsPanel .tv2-ads-count");
            if (countEl) {
                var remaining = data.remaining_ads || 0;
                countEl.textContent = remaining + " saved ad" + (remaining !== 1 ? "s" : "");
            }
            
            // Reload savedTangles to update badges
            await loadSavedTangles();
            showSuccess("Ad removed");
        } else {
            alert("Error: " + (data.error || "Failed to remove"));
        }
    } catch (err) {
        console.error("Error removing tangle ad:", err);
        alert("Failed to remove. Please try again.");
    }
}

function backToTanglesList() {
    const container = document.getElementById("tanglesContainer");
    const adsPanel = document.getElementById("tangleAdsPanel");
    if (adsPanel) adsPanel.style.display = "none";
    if (container) container.style.display = "";
}

// Build 026: View a specific ad in detail from the Tangles ads list
function viewTangleAdDetail(adId) {
    // Look in cached tangle ads first
    const ad = _tangleAdsCache.find(a => String(a.id) === String(adId));
    if (ad && typeof lastSearchResults !== "undefined") {
        // Inject into lastSearchResults so viewAdFromResults works
        if (!lastSearchResults.find(a => a.id == adId)) {
            lastSearchResults.push(ad);
        }
        viewAdFromResults(adId);
    } else {
        // Fallback: open ad sharing page
        window.open("/ad.php?id=" + adId, "_blank");
    }
}

// Build 026: Direct contact from My Tangles
function contactTangleUser(userId, username) {
    // Open send message modal with this user as recipient
    // Use a generic ad context since we're messaging from contacts, not a specific ad
    if (typeof sendMessageToAd === "function") {
        sendMessageToAd(0, username, "Contact from My Tangles", userId);
    } else {
        alert("Messaging is not available. Please try from an ad.");
    }
}
async function updateMessageBadge() {
    if (currentUser && currentUser.id) try {
        const e = await fetch(`/api/get-message-count.php?user_id=${currentUser.id}`, {
                credentials: "include"
            }),
            t = await e.json();
        if (t.success) {
            const e = t.unread_count || 0,
                n = document.getElementById("messageBadge");
            if (n && (e > 0 ? (n.textContent = e > 99 ? "99+" : e, n.classList.add("show")) : n.classList.remove("show")), "setAppBadge" in navigator) try {
                e > 0 ? await navigator.setAppBadge(e) : await navigator.clearAppBadge()
            } catch (e) {
                console.log("PWA badge not available:", e)
            }
            lastKnownUnreadCount >= 0 && e > lastKnownUnreadCount && fetchLatestSenderAndToast(e - lastKnownUnreadCount), lastKnownUnreadCount = e
        }
    } catch (e) {
        console.error("Error updating message badge:", e)
    }
}
async function fetchLatestSenderAndToast(e) {
    try {
        const t = await fetch(`/api/get-messages.php?type=inbox&user_id=${currentUser.id}`, {
                credentials: "include"
            }),
            n = await t.json();
        if (n.success && n.data && n.data.length > 0) {
            const t = n.data[0],
                o = t.sender_username || "Someone";
            1 === e ? showMessageToast(`New message from ${o}`, `Re: ${t.ad_keywords||"your ad"}`) : showMessageToast(`${e} new messages`, `Latest from ${o}`)
        } else showMessageToast("New message received", "Tap to view your inbox")
    } catch (e) {
        console.log("Toast fetch error:", e), showMessageToast("New message received", "Tap to view your inbox")
    }
}

function showMessageToast(e, t) {
    const n = document.getElementById("messagesModal");
    if (n && n.classList.contains("show")) return;
    const o = document.getElementById("messageToast"),
        s = document.getElementById("toastTitle"),
        a = document.getElementById("toastSubtitle");
    s.textContent = e, a.textContent = t, toastDismissTimer && clearTimeout(toastDismissTimer), o.classList.remove("hiding"), o.classList.add("show"), toastDismissTimer = setTimeout(() => {
        hideMessageToast()
    }, 5e3)
}

function hideMessageToast() {
    const e = document.getElementById("messageToast");
    e.classList.remove("show"), e.classList.add("hiding"), toastDismissTimer && (clearTimeout(toastDismissTimer), toastDismissTimer = null)
}

function handleToastClick() {
    hideMessageToast(), openMessages()
}

function urlBase64ToUint8Array(e) {
    const t = (e + "=".repeat((4 - e.length % 4) % 4)).replace(/-/g, "+").replace(/_/g, "/"),
        n = window.atob(t),
        o = new Uint8Array(n.length);
    for (let e = 0; e < n.length; e++) o[e] = n.charCodeAt(e);
    return o
}
async function subscribeToPush(e) {
    if ("PushManager" in window) try {
        const t = Notification.permission;
        if ("denied" === t) return void console.log("Push notifications blocked by user");
        let n = await e.pushManager.getSubscription();
        if (n) return await savePushSubscription(n), pushSubscription = n, void console.log("✅ Push: Already subscribed");
        if ("default" === t) return void showPushPermissionPrompt(e);
        await createPushSubscription(e)
    } catch (e) {
        console.error("Push subscription error:", e)
    } else console.log("Push notifications not supported")
}

function showPushPermissionPrompt(e) {
    const t = localStorage.getItem("tangleme_push_dismissed");
    if (t && (Date.now() - parseInt(t)) / 864e5 < 3) return;
    const n = document.createElement("div");
    n.id = "pushPermissionPrompt", n.style.cssText = "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:1rem 1.2rem;border-radius:14px;box-shadow:0 8px 30px rgba(102,126,234,0.4);z-index:10000;max-width:380px;width:calc(100% - 2rem);animation:slideUp 0.3s ease-out;", n.innerHTML = '\n        <div style="display:flex;align-items:center;gap:0.75rem;">\n            <span style="font-size:1.5rem;">🔔</span>\n            <div style="flex:1;">\n                <div style="font-weight:700;font-size:0.95rem;">Enable notifications?</div>\n                <div style="font-size:0.82rem;opacity:0.9;">Get notified when someone messages you about your ads</div>\n            </div>\n        </div>\n        <div style="display:flex;gap:0.5rem;margin-top:0.75rem;">\n            <button onclick="acceptPushPermission()" style="flex:1;padding:0.6rem;border:none;border-radius:8px;background:rgba(255,255,255,0.95);color:#4F46E5;font-weight:700;font-size:0.9rem;cursor:pointer;">Enable</button>\n            <button onclick="dismissPushPrompt()" style="flex:1;padding:0.6rem;border:2px solid rgba(255,255,255,0.4);border-radius:8px;background:transparent;color:#fff;font-weight:600;font-size:0.9rem;cursor:pointer;">Not now</button>\n        </div>\n    ', document.body.appendChild(n), window._pushRegistration = e
}
async function acceptPushPermission() {
    const e = document.getElementById("pushPermissionPrompt");
    e && e.remove();
    const t = window._pushRegistration || window.swRegistration;
    if (t) try {
        "granted" === await Notification.requestPermission() ? (await createPushSubscription(t), showSuccess("🔔 Notifications enabled!")) : localStorage.setItem("tangleme_push_dismissed", Date.now().toString())
    } catch (e) {
        console.error("Permission request failed:", e)
    }
}

function dismissPushPrompt() {
    const e = document.getElementById("pushPermissionPrompt");
    e && e.remove(), localStorage.setItem("tangleme_push_dismissed", Date.now().toString())
}
async function createPushSubscription(e) {
    try {
        const t = await e.pushManager.subscribe({
            userVisibleOnly: !0,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        pushSubscription = t, await savePushSubscription(t), console.log("✅ Push: Subscribed successfully")
    } catch (e) {
        console.error("Push subscription failed:", e)
    }
}
async function savePushSubscription(e) {
    if (currentUser && currentUser.id) try {
        const t = e.toJSON();
        await fetch("/api/save-push-subscription.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                user_id: currentUser.id,
                subscription: {
                    endpoint: t.endpoint,
                    keys: {
                        p256dh: t.keys.p256dh,
                        auth: t.keys.auth
                    }
                }
            })
        })
    } catch (e) {
        console.error("Failed to save push subscription:", e)
    }
}

function openMessages() {
    if (!currentUser) return alert("Please login to view messages"), void openLoginModal();
    currentMessageTab = "inbox", document.getElementById("messagesModal").classList.add("show"), loadMessages("inbox")
}

function closeMessages() {
    document.getElementById("messagesModal").classList.remove("show"), messageEditMode = !1, document.getElementById("messagesContainer").classList.remove("messages-edit-mode");
    const e = document.getElementById("btnEditMessages");
    e && (e.classList.remove("active"), e.textContent = "✏️ Edit");
    const t = document.getElementById("messagesSelectBar");
    t && t.classList.remove("show")
}

function switchMessageTab(e) {
    currentMessageTab = e, document.getElementById("inboxTab").classList.toggle("active", "inbox" === e), document.getElementById("sentTab").classList.toggle("active", "sent" === e), loadMessages(e)
}
async function loadMessages(e) {
    const t = document.getElementById("messagesContainer");
    t.innerHTML = '<div style="text-align:center;padding:2rem;color:#718096;">Loading...</div>', messageEditMode = !1, t.classList.remove("messages-edit-mode");
    const n = document.getElementById("btnEditMessages");
    n && (n.classList.remove("active"), n.textContent = "✏️ Edit");
    const o = document.getElementById("messagesSelectBar");
    if (o && o.classList.remove("show"), !currentUser || !currentUser.id) return t.innerHTML = '\n            <div class="no-messages">\n                <div class="no-messages-icon">🔒</div>\n                <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">Please log in</div>\n                <div style="font-size: 0.9rem;">Log in to view your messages</div>\n            </div>\n        ', void(document.getElementById("messagesToolbar").style.display = "none");
    try {
        const n = await fetch(`/api/get-messages.php?type=${e}&user_id=${currentUser.id}`, {
                credentials: "include"
            }),
            o = await n.json();
        o.success && o.data && o.data.length > 0 ? (document.getElementById("inboxCount").textContent = "inbox" === e ? o.count : "...", document.getElementById("sentCount").textContent = "sent" === e ? o.count : "...", t.innerHTML = "", o.data.forEach(n => {
            t.appendChild(createMessageCard(n, e))
        }), document.getElementById("messagesToolbar").style.display = "flex") : (t.innerHTML = `\n                <div class="no-messages">\n                    <div class="no-messages-icon">📭</div>\n                    <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">No ${e} messages</div>\n                    <div style="font-size: 0.9rem;">${"inbox"===e?"Messages you receive will appear here":"Messages you send will appear here"}</div>\n                </div>\n            `, document.getElementById("messagesToolbar").style.display = "none"), "inbox" === e && updateMessageBadge()
    } catch (e) {
        console.error("Error loading messages:", e), t.innerHTML = '\n            <div class="no-messages">\n                <div class="no-messages-icon">⚠️</div>\n                <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">Error loading messages</div>\n                <div style="font-size: 0.9rem;">Please try again</div>\n            </div>\n        ', document.getElementById("messagesToolbar").style.display = "none"
    }
}

function createMessageCard(e, t) {
    const n = document.createElement("div");
    n.className = "message-card" + (!1 === e.is_read && "inbox" === t ? " unread" : ""), n.dataset.messageId = e.id;
    const o = "inbox" === t ? e.sender_username : e.receiver_username,
        s = getTimeAgo(e.created_at);
    let a = "";
    if ("inbox" === t) {
        const t = savedTangles.some(t => String(t.saved_user_id) === String(e.sender_id)),
            n = t ? "saved" : "",
            o = t ? "⭐" : "☆";
        a = `\n            <div class="message-actions">\n                <button class="message-action-btn reply-btn" onclick="replyToMessage(${e.sender_id}, '${escapeJsString(e.sender_username)}', ${e.ad_id}, '${escapeJsString(e.ad_keywords)}')" title="Reply">\n                    💬 Reply\n                </button>\n                <button class="message-action-btn star-btn ${n}" onclick="saveMessageSender(${e.sender_id}, '${escapeJsString(e.sender_username)}', ${e.ad_id}, '${escapeJsString(e.ad_keywords)}')" title="Save to My Tangles">\n                    ${o} Save\n                </button>\n                <button class="message-action-btn" style="background: #f44336; color: white;" onclick="deleteSingleMessage(${e.id}, event)" title="Delete">\n                    🗑️ Delete\n                </button>\n            </div>\n        `
    } else a = `\n            <div class="message-actions">\n                <span class="message-status">✓ Sent</span>\n                <button class="message-action-btn" style="background: #f44336; color: white;" onclick="deleteSingleMessage(${e.id}, event)" title="Delete">\n                    🗑️ Delete\n                </button>\n            </div>\n        `;
    return n.innerHTML = `\n        <input type="checkbox" class="message-checkbox" data-msg-id="${e.id}" onchange="updateSelectedCount()">\n        <div class="message-header">\n            <div class="message-from">${"inbox"===t?"From: ":"To: "}${escapeHtml(o)}</div>\n            <div class="message-time">${s}</div>\n        </div>\n        <div class="message-ad-ref">Re: "${escapeHtml(e.ad_keywords||"Ad")}"</div>\n        <div class="message-text">${linkifyText(e.message)}</div>\n        ${a}\n    `, e.is_read || "inbox" !== t || (n.onclick = t => {
        t.target.classList.contains("message-action-btn") || t.target.closest(".message-action-btn") || t.target.classList.contains("message-checkbox") || t.target.classList.contains("message-action-btn") || t.target.closest(".message-action-btn") || markMessageAsRead(e.id, n)
    }), n
}

function replyToMessage(e, t, n, o) {
    currentSendMessageAdId = n, currentSendMessageKeywords = o, currentSendMessageReceiverId = e, document.getElementById("messageRecipient").textContent = t, document.getElementById("messageAdTitle").textContent = o || "Previous conversation", document.getElementById("messageText").value = "", document.getElementById("charCount").textContent = "0", document.getElementById("sendMessageModal").classList.add("show")
}
async function saveMessageSender(e, t, n, o) {
    if (!currentUser) return alert("Please login to save Tangles"), void openLoginModal();
    if (savedTangles.some(t => String(t.saved_user_id) === String(e))) return void(confirm(`${t} is already in your My Tangles. View your saved contacts?`) && (closeMessages(), openMyTangles()));
    // Build 028: Use proper modal instead of prompt()
    openSaveTangleModal(e, t, n, o);
}

// Build 028: Unified save-to-tangles modal flow
// Opens the edit note modal pre-populated with "Ad#X" for saving a new tangle
var _pendingSaveTangle = null;

function openSaveTangleModal(savedUserId, username, adId, adKeywords) {
    _pendingSaveTangle = { savedUserId: savedUserId, adId: adId };
    
    // Pre-populate note with ad reference
    var defaultNote = adId ? "Ad#" + adId : "";
    if (adKeywords && adKeywords !== "Ad" && adKeywords !== "Previous conversation") {
        defaultNote += defaultNote ? " - " + adKeywords.substring(0, 60) : adKeywords.substring(0, 60);
    }
    
    document.getElementById("editNoteUsername").textContent = username;
    document.getElementById("editNoteText").value = defaultNote;
    document.getElementById("noteCharCount").textContent = defaultNote.length;
    
    // Switch modal to "Save" mode
    var titleEl = document.querySelector("#editNoteModal .edit-note-title");
    if (titleEl) titleEl.textContent = "⭐ Save to My Tangles";
    var saveBtn = document.querySelector("#editNoteModal .btn-primary");
    if (saveBtn) saveBtn.textContent = "Save";
    
    document.getElementById("editNoteModal").classList.add("show");
}

function toggleMessageEditMode() {
    messageEditMode = !messageEditMode;
    const e = document.getElementById("messagesContainer"),
        t = document.getElementById("btnEditMessages"),
        n = document.getElementById("messagesSelectBar"),
        o = document.getElementById("selectAllMessages");
    messageEditMode ? (e.classList.add("messages-edit-mode"), t.classList.add("active"), t.textContent = "✅ Done", n.classList.add("show")) : (e.classList.remove("messages-edit-mode"), t.classList.remove("active"), t.textContent = "✏️ Edit", n.classList.remove("show"), e.querySelectorAll(".message-checkbox").forEach(e => {
        e.checked = !1, e.closest(".message-card").classList.remove("selected")
    }), o && (o.checked = !1), updateSelectedCount())
}

function toggleSelectAllMessages() {
    const e = document.getElementById("selectAllMessages");
    document.querySelectorAll("#messagesContainer .message-checkbox").forEach(t => {
        t.checked = e.checked;
        const n = t.closest(".message-card");
        n && n.classList.toggle("selected", e.checked)
    }), updateSelectedCount()
}

function updateSelectedCount() {
    const e = document.querySelectorAll("#messagesContainer .message-checkbox:checked").length,
        t = document.getElementById("selectedCount"),
        n = document.getElementById("btnDeleteSelected"),
        o = document.getElementById("selectAllMessages"),
        s = document.querySelectorAll("#messagesContainer .message-checkbox");
    t && (t.textContent = e > 0 ? `(${e})` : ""), n && (n.classList.toggle("enabled", e > 0), n.textContent = e > 0 ? `🗑️ Delete (${e})` : "🗑️ Delete Selected"), o && s.length > 0 && (o.checked = e === s.length), document.querySelectorAll("#messagesContainer .message-checkbox").forEach(e => {
        const t = e.closest(".message-card");
        t && t.classList.toggle("selected", e.checked)
    })
}
async function deleteSelectedMessages() {
    const e = document.querySelectorAll("#messagesContainer .message-checkbox:checked");
    if (0 === e.length) return;
    const t = e.length;
    if (!confirm(`Delete ${t} message${t>1?"s":""}? This cannot be undone.`)) return;
    const n = Array.from(e).map(e => parseInt(e.dataset.msgId));
    try {
        const e = await fetch("/api/delete-messages.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    user_id: currentUser.id,
                    message_ids: n,
                    type: currentMessageTab
                })
            }),
            t = await e.json();
        t.success ? (showSuccess(`${t.deleted_count} message${t.deleted_count>1?"s":""} deleted`), messageEditMode = !1, loadMessages(currentMessageTab)) : alert("Error: " + (t.error || "Failed to delete messages"))
    } catch (e) {
        console.error("Error deleting messages:", e), alert("Failed to delete messages. Please try again.")
    }
}
async function deleteSingleMessage(e, t) {
    if (t && t.stopPropagation(), confirm("Delete this message?")) try {
        const t = await fetch("/api/delete-messages.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    user_id: currentUser.id,
                    message_ids: [e],
                    type: currentMessageTab
                })
            }),
            n = await t.json();
        if (n.success) {
            const t = document.querySelector(`.message-card[data-message-id="${e}"]`);
            t ? (t.style.transition = "all 0.3s ease", t.style.opacity = "0", t.style.transform = "translateX(100%)", setTimeout(() => {
                loadMessages(currentMessageTab)
            }, 300)) : loadMessages(currentMessageTab), showSuccess("Message deleted")
        } else alert("Error: " + (n.error || "Failed to delete"))
    } catch (e) {
        console.error("Error deleting message:", e), alert("Failed to delete. Please try again.")
    }
}
async function markMessageAsRead(e, t) {
    try {
        const n = await fetch("/api/mark-message-read.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                message_id: e
            })
        });
        (await n.json()).success && (t.classList.remove("unread"), updateMessageBadge())
    } catch (e) {
        console.error("Error marking message as read:", e)
    }
}

function sendMessageToAd(e, t, n, o) {
    currentSendMessageAdId = e, currentSendMessageKeywords = n, currentSendMessageReceiverId = o || null, document.getElementById("messageRecipient").textContent = t, document.getElementById("messageAdTitle").textContent = n, document.getElementById("messageText").value = "", document.getElementById("charCount").textContent = "0", document.getElementById("sendMessageModal").classList.add("show")
}

function closeSendMessage() {
    document.getElementById("sendMessageModal").classList.remove("show"), currentSendMessageAdId = null, currentSendMessageKeywords = null, currentSendMessageReceiverId = null
}

function updateCharCount() {
    const e = document.getElementById("messageText");
    document.getElementById("charCount").textContent = e.value.length
}
async function handleSendMessage() {
    if (!currentUser || !currentUser.id) return alert("Please log in to send messages"), closeSendMessage(), void openLoginModal();
    const e = document.getElementById("messageText").value.trim();
    if (!e) return void alert("Please enter a message");
    if (e.length > 2e3) return void alert("Message is too long (max 2000 characters)");
    if (!validateContent(e, "message")) return;
    const t = document.getElementById("sendMessageBtn");
    t.disabled = !0, t.textContent = "Sending...";
    try {
        const t = await getCurrentGPS(),
            n = {
                ad_id: currentSendMessageAdId,
                ad_keywords: currentSendMessageKeywords,
                sender_id: currentUser.id,
                recipient_id: currentSendMessageReceiverId,
                message: e,
                sender_lat: t.latitude,
                sender_lng: t.longitude
            },
            o = await fetch("/api/send-message.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(n)
            }),
            s = await o.json();
        s.success ? (closeSendMessage(), showSuccess("Message sent successfully!")) : alert("Error: " + (s.error || "Failed to send message"))
    } catch (e) {
        console.error("Error sending message:", e), alert("Failed to send message. Please try again.")
    } finally {
        t.disabled = !1, t.textContent = "Send Message"
    }
}

function getTimeAgo(e) {
    if (!e) return "";
    const t = new Date(e);
    return isNaN(t.getTime()) ? "" : `${String(t.getDate()).padStart(2,"0")}-${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][t.getMonth()]}-${t.getFullYear()} ${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`
}

function updateAuthUI(e) {
    const t = document.getElementById("headerAuth"),
        n = document.getElementById("headerUserBtn"),
        o = document.getElementById("userDropdown"),
        s = document.getElementById("hamburgerLoginBtn"),
        a = document.getElementById("hamburgerSignupBtn"),
        r = document.getElementById("hamburgerSubscriptionBtn"),
        i = document.getElementById("hamburgerSettingsBtn"),
        l = document.getElementById("hamburgerUserSection"),
        d = document.getElementById("hamburgerDivider");
    if (e && currentUser) {
        if (s && (s.style.display = "none"), a && (a.style.display = "none"), r && (r.style.display = "block"), i && (i.style.display = "block"), l && (l.style.display = "block"), d && (d.style.display = "block"), n) {
            n.style.display = "flex";
            const e = document.getElementById("headerUserFlag"),
                t = userCountry.code || currentUser.country_code?.toLowerCase() || "";
            e && t && (e.innerHTML = `<span class="fi fi-${t}"></span>`);
            const o = document.getElementById("headerUserBtnText");
            o && (o.textContent = currentUser.username || currentUser.email || "User")
        }
        const e = document.getElementById("userDropdownId"),
            t = document.getElementById("userDropdownFlag"),
            o = document.getElementById("userDropdownCountry");
        e && (e.textContent = currentUser.username || currentUser.email || "");
        const c = userCountry.code || currentUser.country_code?.toLowerCase() || "",
            u = userCountry.name || currentUser.country_name || "";
        t && c && (t.innerHTML = `<span class="fi fi-${c}"></span>`), o && (o.textContent = u);
        const m = document.getElementById("hamburgerUserId"),
            g = document.getElementById("hamburgerUserFlag"),
            p = document.getElementById("hamburgerUserCountry");
        m && (m.textContent = currentUser.username || currentUser.email || ""), g && c && (g.innerHTML = `<span class="fi fi-${c}"></span>`), p && (p.textContent = u), c || detectUserCountry(), updateMessageBadge(), window.swRegistration && subscribeToPush(window.swRegistration)
    } else s && (s.style.display = "block"), a && (a.style.display = "block"), r && (r.style.display = "none"), i && (i.style.display = "none"), l && (l.style.display = "none"), d && (d.style.display = "none"), n && (n.style.display = "none"), o && o.classList.remove("show");
    t.innerHTML = '\n        <button class="hamburger-btn" onclick="toggleHamburgerMenu()" aria-label="Menu">\n            <div class="hamburger-icon">\n                <span></span>\n                <span></span>\n                <span></span>\n            </div>\n        </button>\n    '
}
document.addEventListener("click", function(e) {
    const t = document.getElementById("languageDropdown"),
        n = document.getElementById("languageSwitcher"),
        o = document.getElementById("languageSwitcherBtn");
    t && !(t.contains(e.target) || n && n.contains(e.target) || o && o.contains(e.target)) && (t.style.display = "none")
}), document.addEventListener("DOMContentLoaded", function() {
    const e = document.getElementById("editNoteText");
    e && e.addEventListener("input", function() {
        document.getElementById("noteCharCount").textContent = this.value.length
    });
    const t = document.getElementById("csvUploadZone");
    if (t) {
        function n(e) {
            e.preventDefault(), e.stopPropagation()
        } ["dragenter", "dragover", "dragleave", "drop"].forEach(e => {
            t.addEventListener(e, n, !1)
        }), ["dragenter", "dragover"].forEach(e => {
            t.addEventListener(e, () => {
                t.classList.add("drag-over")
            }, !1)
        }), ["dragleave", "drop"].forEach(e => {
            t.addEventListener(e, () => {
                t.classList.remove("drag-over")
            }, !1)
        }), t.addEventListener("drop", e => {
            const t = e.dataTransfer.files;
            t.length > 0 && (t[0].name.endsWith(".csv") ? (document.getElementById("csvFileInput").files = t, handleCSVSelect({
                target: {
                    files: t
                }
            })) : alert(translations[currentLanguage]?.invalid_file || "Please select a CSV file"))
        }, !1)
    }
}), document.addEventListener("keydown", function(e) {
    if ("Enter" !== e.key) return;
    const t = document.activeElement;
    if (t) {
        const e = "textarea" === t.tagName.toLowerCase(),
            n = t.isContentEditable,
            o = "true" === t.getAttribute("data-multiline");
        if (e || n || o) return
    }
    const n = document.querySelectorAll(".modal-overlay");
    let o = null;
    if (n.forEach(e => {
            "none" !== e.style.display && null !== e.offsetParent && (o = e)
        }), o || document.querySelectorAll('[id*="Modal"], [class*="modal"]').forEach(e => {
            "none" !== e.style.display && null !== e.offsetParent && (e.classList.contains("modal") || e.id.includes("Modal")) && (o = e)
        }), !o) return;
    const s = ['button[onclick*="handleLogin"]', 'button[onclick*="handleRegister"]', 'button[onclick*="sendMessage"]', 'button[onclick*="submitPost"]', 'button[onclick*="handleSearch"]', 'button[onclick*="confirm"]', 'button[onclick*="submit"]', "button.btn-primary", "button.primary-btn", 'button[type="submit"]', ".modal-footer button:last-child", ".modal-actions button:last-child"];
    let a = null;
    for (const e of s)
        if (a = o.querySelector(e), a && null !== a.offsetParent) break;
    a && !a.disabled && (e.preventDefault(), a.click(), console.log("⌨️ Enter key triggered:", a.textContent || a.innerText))
}), console.log("=== PHASE 1 JAVASCRIPT COMPLETE ==="), console.log("Features loaded: Map Auto-Location, Ad Numbering, My Tangles, Messaging, Edit/Share, Language Switcher");
let verifyTimerInterval = null,
    verifyTimerSeconds = 900,
    verifyUserId = null,
    verifyUserEmail = null;

function showVerificationModal(e, t) {
    verifyUserId = t, verifyUserEmail = e;
    const n = document.getElementById("verifyEmailModal"),
        o = document.getElementById("verifyEmailDisplay"),
        s = e.split("@");
    o.textContent = s[0][0] + "***@" + s[1], n.style.display = "flex", document.getElementById("verifyError").style.display = "none", document.getElementById("verifySuccess").style.display = "none", document.getElementById("verifyTimer").style.display = "";
    const a = document.querySelectorAll("#verifyCodeInputs input");
    a.forEach(e => e.value = ""), a[0] && a[0].focus(), startVerifyTimer();
    const r = document.getElementById("resendCodeBtn");
    r.disabled = !0;
    let i = 60;
    const l = setInterval(() => {
        i--, r.textContent = "Resend code (" + i + "s)", i <= 0 && (clearInterval(l), r.textContent = "Resend code", r.disabled = !1)
    }, 1e3)
}

function startVerifyTimer() {
    verifyTimerSeconds = 900, clearInterval(verifyTimerInterval), verifyTimerInterval = setInterval(() => {
        verifyTimerSeconds--;
        const e = Math.floor(verifyTimerSeconds / 60),
            t = verifyTimerSeconds % 60;
        document.getElementById("verifyTimer").textContent = "Code expires in " + e + ":" + t.toString().padStart(2, "0"), verifyTimerSeconds <= 0 && (clearInterval(verifyTimerInterval), document.getElementById("verifyTimer").textContent = "Code expired", document.getElementById("verifyError").textContent = 'Code expired. Tap "Resend code" for a new one.', document.getElementById("verifyError").style.display = "block")
    }, 1e3)
}

function closeVerificationModal() {
    document.getElementById("verifyEmailModal").style.display = "none", clearInterval(verifyTimerInterval)
}
async function sendVerificationEmail(e, t) {
    try {
        const n = await fetch("/api/send-verification.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: e,
                    user_id: t
                })
            }),
            o = await n.json();
        if (o.success && !o.already_verified) showVerificationModal(e, t);
        else if (o.already_verified) {
            const e = JSON.parse(localStorage.getItem("tangleme_current_user") || "{}");
            e.email_verified = !0, localStorage.setItem("tangleme_current_user", JSON.stringify(e))
        }
        return o
    } catch (e) {
        return console.error("Send verification error:", e), {
            success: !1,
            error: "Network error"
        }
    }
}
async function submitVerificationCode(e, t) {
    const n = document.getElementById("verifyError"),
        o = document.getElementById("verifySuccess");
    n.style.display = "none";
    try {
        const s = await fetch("/api/verify-email.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: e,
                    code: t
                })
            }),
            a = await s.json();
        if (a.success) {
            o.style.display = "block", clearInterval(verifyTimerInterval), document.getElementById("verifyTimer").style.display = "none";
            const e = JSON.parse(localStorage.getItem("tangleme_current_user") || "{}");
            e.email_verified = !0, localStorage.setItem("tangleme_current_user", JSON.stringify(e)), currentUser && (currentUser.email_verified = !0), setTimeout(() => {
                closeVerificationModal(), showSuccess("✅ Email verified successfully!")
            }, 1500)
        } else {
            n.textContent = a.error || "Invalid code", n.style.display = "block";
            const e = document.querySelectorAll("#verifyCodeInputs input");
            e.forEach(e => e.value = ""), e[0] && e[0].focus(), (a.code_invalidated || a.code_expired) && (document.getElementById("resendCodeBtn").disabled = !1, document.getElementById("resendCodeBtn").textContent = "Resend code")
        }
    } catch (e) {
        n.textContent = "Network error. Please try again.", n.style.display = "block"
    }
}
async function resendVerificationCode() {
    if (!verifyUserEmail || !verifyUserId) return;
    const e = document.getElementById("resendCodeBtn");
    if (e.disabled = !0, e.textContent = "Sending...", (await sendVerificationEmail(verifyUserEmail, verifyUserId)).success) {
        startVerifyTimer(), document.getElementById("verifyError").style.display = "none", showSuccess("New code sent!");
        let t = 60;
        const n = setInterval(() => {
            t--, e.textContent = "Resend code (" + t + "s)", t <= 0 && (clearInterval(n), e.textContent = "Resend code", e.disabled = !1)
        }, 1e3)
    } else e.textContent = "Resend code", e.disabled = !1
}

function getExpiryBadgeHTML(e) {
    if (!e.expires_at && !e.expired) return "";
    if (1 == e.expired) return '<div class="ad-expiry-badge expired">⏰ Expired <button class="btn-renew" onclick="renewAd(' + e.id + ')">Renew Ad</button></div>';
    if (e.expires_at) {
        const t = new Date(e.expires_at),
            n = new Date,
            o = Math.ceil((t - n) / 864e5);
        return o <= 0 ? '<div class="ad-expiry-badge expired">⏰ Expired <button class="btn-renew" onclick="renewAd(' + e.id + ')">Renew Ad</button></div>' : o <= 3 ? '<div class="ad-expiry-badge expiring-soon">⚠️ Expires in ' + o + " day" + (1 !== o ? "s" : "") + "</div>" : '<div class="ad-expiry-badge active">✅ Active — ' + o + " days left</div>"
    }
    return ""
}
async function renewAd(e) {
    if (currentUser) try {
        const t = await fetch("/api/renew-ad.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ad_id: e,
                    user_id: currentUser.id
                })
            }),
            n = await t.json();
        n.success ? (showSuccess("✅ " + n.message + ". " + n.renewals_remaining + " renewal(s) left."), loadMyAdsModal()) : showSuccess(n.error || "Failed to renew")
    } catch (e) {
        showSuccess("Network error. Please try again.")
    }
}
document.addEventListener("DOMContentLoaded", function() {
    const e = document.querySelectorAll("#verifyCodeInputs input");
    e.forEach((t, n) => {
        t.addEventListener("input", function(t) {
            const o = t.target.value.replace(/[^0-9]/g, "");
            if (t.target.value = o, o && n < e.length - 1 && e[n + 1].focus(), n === e.length - 1 && o) {
                const t = Array.from(e).map(e => e.value).join("");
                6 === t.length && submitVerificationCode(verifyUserId, t)
            }
        }), t.addEventListener("keydown", function(t) {
            "Backspace" === t.key && !t.target.value && n > 0 && e[n - 1].focus()
        }), t.addEventListener("paste", function(t) {
            t.preventDefault();
            const n = (t.clipboardData.getData("text") || "").replace(/[^0-9]/g, "");
            if (n.length >= 6) {
                for (let t = 0; t < 6; t++) e[t].value = n[t] || "";
                e[5].focus(), submitVerificationCode(verifyUserId, n.substr(0, 6))
            }
        })
    })
});
let reportSelectedReason = null,
    reportTargetAdId = null;

function showReportModal(e) {
    reportTargetAdId = e, reportSelectedReason = null, document.getElementById("reportAdModal").style.display = "flex", document.querySelectorAll(".report-reason-btn").forEach(e => e.classList.remove("selected")), document.getElementById("reportDetails").style.display = "none", document.getElementById("reportDetails").value = "", document.getElementById("reportSubmitBtn").disabled = !0
}

function closeReportModal() {
    document.getElementById("reportAdModal").style.display = "none", reportTargetAdId = null, reportSelectedReason = null
}
document.addEventListener("DOMContentLoaded", function() {
        document.querySelectorAll(".report-reason-btn").forEach(e => {
            e.addEventListener("click", function() {
                document.querySelectorAll(".report-reason-btn").forEach(e => e.classList.remove("selected")), e.classList.add("selected"), reportSelectedReason = e.dataset.reason, document.getElementById("reportDetails").style.display = "block", document.getElementById("reportSubmitBtn").disabled = !1
            })
        }), document.getElementById("reportSubmitBtn").addEventListener("click", async function() {
            if (!reportSelectedReason || !reportTargetAdId) return;
            if (!currentUser) return showSuccess("Please log in to report ads"), void closeReportModal();
            const e = document.getElementById("reportSubmitBtn");
            e.disabled = !0, e.textContent = "Submitting...";
            try {
                const e = await fetch("/api/report-ad.php", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            ad_id: reportTargetAdId,
                            user_id: currentUser.id,
                            reason: reportSelectedReason,
                            details: document.getElementById("reportDetails").value.trim() || null
                        })
                    }),
                    t = await e.json();
                t.success ? (closeReportModal(), showSuccess("🚩 Report submitted. Thank you!")) : showSuccess(t.error || "Failed to submit report")
            } catch (e) {
                showSuccess("Network error. Please try again.")
            } finally {
                e.disabled = !1, e.textContent = "Submit Report"
            }
        }), document.getElementById("reportCancelBtn").addEventListener("click", closeReportModal)
    }),
    function triggerBulkFileSelect() {
        const fi = document.getElementById('aiBulkFileInput');
        if (fi) {
            fi.value = '';
            fi.click();
        } else {
            openBulkUploadModal();
        }
    }

function handleBulkDropOnBtn(event) {
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
        openBulkUploadModal();
        setTimeout(function() {
            processAiBulkFiles(files);
        }, 350);
    }
}

function checkGeolocationOnLoad() {
    if (!navigator.geolocation) {
        showGeolocationReminder('Your browser does not support geolocation. Tangle-me requires location to work. Please use Chrome, Firefox, or Edge.');
        return;
    }
    if (navigator.permissions) {
        navigator.permissions.query({
            name: 'geolocation'
        }).then(function(r) {
            if (r.state === 'denied') showGeolocationReminder();
            r.onchange = function() {
                if (r.state === 'denied') showGeolocationReminder();
            };
        }).catch(function() {});
    }
}

function showGeolocationReminder(customMsg) {
    if (document.getElementById('geoReminderBanner')) return;
    const d = document.createElement('div');
    d.id = 'geoReminderBanner';
    d.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;padding:0.85rem 1rem;display:flex;align-items:center;gap:0.75rem;box-shadow:0 3px 15px rgba(0,0,0,.25);';
    d.innerHTML = '<span style="font-size:1.5rem;flex-shrink:0;">📍</span><div style="flex:1;font-size:0.88rem;line-height:1.4;"><strong>Location access is off</strong><br>' + (customMsg || 'Tangle-me needs your location to show nearby ads and let others find you. Please enable Location in your browser/device settings.') + '</div><button onclick="this.parentNode.remove()" style="background:rgba(255,255,255,.25);border:none;color:#fff;font-size:1.4rem;cursor:pointer;padding:0.2rem 0.6rem;border-radius:6px;flex-shrink:0;line-height:1;">×</button>';
    document.body.prepend(d);
    setTimeout(function() {
        const b = document.getElementById('geoReminderBanner');
        if (b) b.remove();
    }, 12000);
}

function showBulkUpgradeModal() {
    var m = document.createElement("div");
    m.className = "modal show";
    m.id = "bulkUpgradeInfoModal";
    m.innerHTML = '<div class="auth-modal-content" style="max-width:440px;"><button class="modal-close" onclick="document.getElementById(\'bulkUpgradeInfoModal\').remove()">\u00d7</button><h2 style="text-align:center;margin-bottom:0.5rem;">\ud83d\udcc1 Smart Upload</h2><p style="text-align:center;color:#718096;margin-bottom:1.5rem;">Pro feature \u2014 upload files, AI creates your ads</p><div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;padding:1.25rem;margin-bottom:1.5rem;"><div style="color:#2d3748;font-size:0.95rem;line-height:1.7;"><strong>How it works:</strong><br><br><strong style="color:#667eea;">Posting 1 ad?</strong><br>Upload a single file (PDF, Word, image, or text). Everything in the file becomes one ad.<br><br><strong style="color:#667eea;">Posting multiple ads?</strong><br>Create a ZIP file containing:<br>\u2022 A spreadsheet (CSV/Excel) listing each ad\u2019s title, description, contact, and photo filename<br>\u2022 The matching photo files<br><br><strong style="color:#667eea;">Alternative:</strong><br>ZIP with one folder per ad \u2014 each folder holds a text file + photos.<br><br><span style="color:#a0aec0;font-size:0.85rem;">Max 20 photos per ad \u2022 Up to 50 ads \u2022 Max 50 MB</span></div></div><div style="background:#f0fdf4;border:2px solid #22c55e;border-radius:12px;padding:1rem;margin-bottom:1.5rem;text-align:center;"><div style="font-weight:700;color:#166534;font-size:1.1rem;">\u2713\u2713\u2713 PRO Plan \u2014 \u20ac9.99/month</div><div style="color:#15803d;font-size:0.9rem;margin-top:0.25rem;">Unlimited ads \u2022 20 photos per ad \u2022 Smart Upload</div></div><button onclick="document.getElementById(\'bulkUpgradeInfoModal\').remove();openUpgradeModal(\'pro\')" style="width:100%;padding:1rem;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer;">\ud83d\ude80 Subscribe to Pro \u2014 \u20ac9.99/month</button><button onclick="document.getElementById(\'bulkUpgradeInfoModal\').remove()" style="width:100%;padding:0.75rem;background:none;border:1px solid #e2e8f0;border-radius:10px;font-size:0.9rem;color:#718096;cursor:pointer;margin-top:0.5rem;">Maybe Later</button></div>';
    document.body.appendChild(m);
}
console.log("=== BUILD 016 FEATURES LOADED: Email Verification, Ad Expiry, Pagination, Report ===");

// ========== BUILD 026: Card Photo Display Fix ==========
// Lightbox centering/sizing now fixed in tangle-lightbox.css source
// This only handles the in-card photo display
(function injectCardPhotoCSSFix() {
    const style = document.createElement("style");
    style.id = "card-photo-fix-026";
    style.textContent = `
        /* Build 026: Fix ad-photo-main in card — always show full image, centered */
        .ad-photo-carousel .ad-photo-main {
            width: 100% !important;
            max-height: 300px !important;
            object-fit: contain !important;
            border-radius: 8px;
            background: #f0f0f0;
            display: block !important;
        }
    `;
    document.head.appendChild(style);
    console.log("Build 026: Card photo CSS fix injected (lightbox fixed at source)");
})();

// ========== BUILD 026: My Tangles v2 CSS ==========
(function injectTanglesV2CSS() {
    const style = document.createElement("style");
    style.id = "tangles-v2-css-026";
    style.textContent = `
        /* ── My Tangles v2: Compact contact cards ── */
        .tangle-card-v2 {
            background: #fff;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            margin-bottom: 0.75rem;
            overflow: hidden;
            transition: box-shadow 0.2s;
        }
        .tangle-card-v2:active {
            box-shadow: 0 2px 12px rgba(102,126,234,0.15);
        }

        .tv2-top {
            padding: 0.85rem 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            min-height: 52px;
        }
        .tv2-top:active {
            background: #f7fafc;
        }

        .tv2-id {
            font-weight: 700;
            font-size: 0.95rem;
            color: #2d3748;
            white-space: nowrap;
            flex-shrink: 0;
        }

        .tv2-label {
            flex: 1;
            font-size: 0.85rem;
            color: #4a5568;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .tv2-label-empty {
            color: #cbd5e0;
            font-style: italic;
            font-size: 0.8rem;
        }

        .tv2-badge {
            flex-shrink: 0;
            background: #edf2f7;
            color: #667eea;
            font-size: 0.7rem;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 10px;
            white-space: nowrap;
        }

        .tv2-actions {
            display: flex;
            border-top: 1px solid #f0f0f0;
        }

        .tv2-btn {
            flex: 1;
            padding: 0.55rem 0.25rem;
            border: none;
            background: none;
            font-size: 0.78rem;
            font-weight: 600;
            cursor: pointer;
            color: #4a5568;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.25rem;
            transition: background 0.15s;
            -webkit-tap-highlight-color: rgba(102,126,234,0.1);
        }
        .tv2-btn:active {
            background: #f7fafc;
        }
        .tv2-btn + .tv2-btn {
            border-left: 1px solid #f0f0f0;
        }

        .tv2-btn-ads { color: #667eea; }
        .tv2-btn-contact { color: #38a169; }
        .tv2-btn-edit { color: #d69e2e; }
        .tv2-btn-remove { color: #e53e3e; flex: 0 0 48px; }

        /* ── Ads panel (shown when tapping a Tangle) ── */
        .tv2-ads-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid #e2e8f0;
        }
        .tv2-back-btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: #fff;
            border: none;
            padding: 0.4rem 0.9rem;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.85rem;
            cursor: pointer;
            flex-shrink: 0;
        }
        .tv2-back-btn:active { opacity: 0.85; }
        .tv2-ads-title {
            font-weight: 700;
            font-size: 1rem;
            color: #2d3748;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .tv2-ads-count {
            text-align: center;
            font-size: 0.8rem;
            color: #718096;
            margin-bottom: 0.75rem;
            font-weight: 500;
        }
        .tv2-ads-loading {
            text-align: center;
            padding: 2rem;
            color: #718096;
        }

        .tv2-ad-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            margin-bottom: 0.65rem;
            overflow: hidden;
        }

        .tv2-ad-content {
            display: flex;
            gap: 0.75rem;
            padding: 0.75rem;
            cursor: pointer;
        }
        .tv2-ad-content:active {
            background: #f7fafc;
        }

        .tv2-ad-thumb {
            width: 64px;
            height: 64px;
            border-radius: 8px;
            object-fit: cover;
            flex-shrink: 0;
            background: #f0f0f0;
        }

        .tv2-ad-info {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
        }
        .tv2-ad-keywords {
            font-weight: 600;
            font-size: 0.9rem;
            color: #2d3748;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .tv2-ad-desc {
            font-size: 0.8rem;
            color: #718096;
            line-height: 1.3;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .tv2-ad-location {
            font-size: 0.75rem;
            color: #a0aec0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .tv2-ad-actions {
            display: flex;
            border-top: 1px solid #f0f0f0;
        }
        .tv2-ad-actions .tv2-btn {
            padding: 0.5rem;
            font-size: 0.78rem;
        }
    `;
    document.head.appendChild(style);
})();
