(function() {
    // 1. ESTADO Y CONFIGURACIÓN
    let config = { activo: true, roeManual: true, suspension: true, audioFocus: true };
    let progresoRestaurado = false;
    let cerrandoPip = false;
    let modoPuenteActivo = false;

    chrome.storage.local.get(['config'], (result) => {
        if (result.config) config = {...config, ...result.config};
    });

    // 2. CSS ADAPTATIVO (Incluye estilos para ambas alertas)
    const inyectarCSS = () => {
        if (document.getElementById('ext-v68-1-css')) return;
        const style = document.createElement('style');
        style.id = 'ext-v68-1-css';
        style.innerHTML = `
            .btn-ext-control {
                background: none !important; border: none !important;
                display: inline-flex !important; align-items: center !important;
                justify-content: center !important; cursor: pointer !important;
                vertical-align: middle !important; transition: 0.2s !important;
                width: 36px !important; height: 100% !important;
                padding: 0 4px !important; opacity: 0.8;
            }
            .btn-ext-control svg { fill: currentColor; width: 20px; height: 20px; }
            .btn-ext-control.active svg { fill: #ff4d4d !important; filter: drop-shadow(0 0 3px rgba(255,77,77,0.5)); }
            
            :fullscreen #ext-main-v67, .video-fullscreen #ext-main-v67 { display: none !important; }

            /* Estilo unificado para Alertas (Seguridad y Twitch Ads) */
            .ext-alert-notify {
                position: fixed; top: 15px; right: 15px; z-index: 2147483647;
                background: #222; color: #fff; padding: 12px 20px;
                border-radius: 8px; font-family: sans-serif; font-size: 13px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                animation: slideIn 0.5s ease-out; pointer-events: none;
                display: flex; align-items: center; gap: 10px;
            }
            .alert-sec { border-left: 4px solid #ff4d4d; }
            .alert-ads { border-left: 4px solid #9146ff; } /* Color Twitch */

            @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `;
        document.head.appendChild(style);
    };

    // 3. CANAL DE AUDIO FOCUS
    const bc = new BroadcastChannel('ext_audio_focus');
    bc.onmessage = (msg) => {
        if (config.audioFocus && msg.data === 'pausa_otros') {
            const v = document.querySelector('video');
            if (v && !v.paused && !document.pictureInPictureElement && !cerrandoPip) v.pause();
        }
    };

    // 4. VERIFICACIÓN DE SEGURIDAD (Se mantiene intacta)
    const verificarSeguridad = () => {
        const host = window.location.hostname;
        const esSeguro = host.includes('youtube') || host.includes('twitch') || host.includes('kick');
        if (!esSeguro && window.location.protocol !== 'https:' && !document.getElementById('ext-sec-alert')) {
            const alertDiv = document.createElement('div');
            alertDiv.id = 'ext-sec-alert';
            alertDiv.className = 'ext-alert-notify alert-sec';
            alertDiv.innerHTML = '⚠️ Conexión no cifrada. Sitio Inseguro.';
            document.body.appendChild(alertDiv);
            setTimeout(() => alertDiv.remove(), 6000); 
        }
    };

    // 5. GESTIÓN DE PUENTE ANTI-ADS CON AVISO
    const gestionarPuenteTwitch = async (video) => {
        const esAnuncio = document.querySelector('[data-a-target="video-ad-label"], .video-ad-label');
        
        if (esAnuncio && !modoPuenteActivo) {
            modoPuenteActivo = true;
            video.muted = true;
            video.playbackRate = 16.0;

            // Mostrar aviso al usuario (Estilo Seguridad pero para Ads)
            if (!document.getElementById('ext-tw-ads-alert')) {
                const adAlert = document.createElement('div');
                adAlert.id = 'ext-tw-ads-alert';
                adAlert.className = 'ext-alert-notify alert-ads';
                adAlert.innerHTML = '🚀 Puente Anti-Ads: Saltando anuncio en principal...';
                document.body.appendChild(adAlert);
            }

            try {
                if (!document.pictureInPictureElement) await video.requestPictureInPicture();
            } catch (e) {}
        } 
        else if (!esAnuncio && modoPuenteActivo) {
            modoPuenteActivo = false;
            video.playbackRate = 1.0;
            video.muted = false;
            
            // Quitar aviso
            document.getElementById('ext-tw-ads-alert')?.remove();
            
            if (document.pictureInPictureElement) await document.exitPictureInPicture();
        }
    };

    const crearControles = () => {
        const host = window.location.hostname;
        let barra = null;
        if (host.includes('youtube')) barra = document.querySelector('.ytp-right-controls');
        else if (host.includes('twitch')) barra = document.querySelector('.player-controls__right-control-group, [data-a-target="player-controls-right"]');
        else if (host.includes('kick')) barra = document.querySelector('.vjs-control-bar, .kick-player-controls-right');

        if (!barra || document.getElementById('ext-main-v67')) return;

        const container = document.createElement('div');
        container.id = 'ext-main-v67';
        container.style.display = 'inline-flex';
        container.style.alignItems = 'center';
        container.style.color = window.getComputedStyle(barra).color || '#fff';

        const btnFocus = document.createElement('button');
        btnFocus.className = 'btn-ext-control' + (config.audioFocus ? ' active' : '');
        btnFocus.innerHTML = `<svg viewBox="0 0 24 24"><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-2 17.77l-5-5H3V8h4l5-5v18z"/></svg>`;
        btnFocus.onclick = () => { config.audioFocus = !config.audioFocus; btnFocus.classList.toggle('active', config.audioFocus); chrome.storage.local.set({config}); };

        const btnRam = document.createElement('button');
        btnRam.className = 'btn-ext-control' + (config.suspension ? ' active' : '');
        btnRam.innerHTML = `<svg viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 4h2v5H9V4z"/></svg>`;
        btnRam.onclick = () => { config.suspension = !config.suspension; btnRam.classList.toggle('active', config.suspension); chrome.storage.local.set({config}); };

        const btnPip = document.createElement('button');
        btnPip.id = 'btn-pip-ext-global';
        btnPip.className = 'btn-ext-control';
        btnPip.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2z"/></svg>`;
        btnPip.onclick = async () => {
            const v = document.querySelector('video');
            if (document.pictureInPictureElement) await document.exitPictureInPicture();
            else if (v) await v.requestPictureInPicture();
        };

        container.append(btnFocus, btnRam, btnPip);
        barra.prepend(container);
    };

    const motorPrincipal = () => {
        const v = document.querySelector('video');
        const btnPip = document.getElementById('btn-pip-ext-global');
        if (btnPip) btnPip.classList.toggle('active', !!document.pictureInPictureElement);

        if (!v) return;

        // Solo en Twitch activamos el Puente de Video
        if (window.location.hostname.includes('twitch')) {
            gestionarPuenteTwitch(v);
        } else {
            // Para otras webs (YouTube/Kick) solo el salto normal
            const ad = document.querySelector('.ad-showing, .ad-interrupting');
            if (ad) {
                v.playbackRate = 16.0;
                v.muted = true;
                document.querySelector('.ytp-ad-skip-button, .ytp-skip-ad-button')?.click();
            } else if (v.playbackRate > 2) {
                v.playbackRate = 1.0;
                v.muted = false;
            }
        }

        if (!v.paused) {
            chrome.storage.local.set({ [window.location.href]: v.currentTime });
            v.onplay = () => { if (config.audioFocus) bc.postMessage('pausa_otros'); };
        }
    };

    setInterval(() => {
        inyectarCSS();
        crearControles();
        motorPrincipal();
        verificarSeguridad();
        if (!progresoRestaurado) {
            chrome.storage.local.get([window.location.href], (r) => {
                const video = document.querySelector('video');
                if (video && r[window.location.href]) video.currentTime = r[window.location.href];
            });
            progresoRestaurado = true;
        }
    }, 1000);

    document.addEventListener('leavepictureinpicture', () => {
        const v = document.querySelector('video');
        if (v && !modoPuenteActivo) setTimeout(() => v.play(), 100);
    });
})();
