(function() {
    // 1. CONFIGURACIÓN Y ESTADO
    let config = { 
        activo: true, 
        roeManual: true, 
        suspension: true,
        audioFocus: true 
    };
    
    let progresoRestaurado = false;
    let ultimaActividad = Date.now();
    let cerrandoPip = false; // Flag para evitar pausas accidentales al cerrar burbuja

    chrome.storage.local.get(['config'], (result) => {
        if (result.config) config = {...config, ...result.config};
    });

    // 2. ESTILOS ADAPTATIVOS
    const inyectarCSS = () => {
        if (document.getElementById('ext-v67-6-css')) return;
        const style = document.createElement('style');
        style.id = 'ext-v67-6-css';
        style.innerHTML = `
            .btn-ext-control {
                background: none !important; border: none !important;
                display: inline-flex !important; align-items: center !important;
                justify-content: center !important; cursor: pointer !important;
                vertical-align: middle !important; transition: 0.2s !important;
                width: 38px !important; height: 100% !important;
                opacity: 0.8;
            }
            .btn-ext-control svg { fill: currentColor; width: 20px; height: 20px; }
            .btn-ext-control.active svg { 
                fill: #ff4d4d !important; 
                filter: drop-shadow(0 0 3px rgba(255,77,77,0.5)); 
            }
            :fullscreen #ext-main-v67, :-webkit-full-screen #ext-main-v67, .video-fullscreen #ext-main-v67 { 
                display: none !important; 
            }
            #ext-security-alert {
                position: fixed; top: 15px; right: 15px; z-index: 2147483647;
                background: #222; color: #fff; padding: 12px 20px;
                border-radius: 8px; font-family: sans-serif; font-size: 13px;
                border-left: 4px solid #ff4d4d;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                animation: slideIn 0.5s ease-out; pointer-events: none;
            }
            @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `;
        document.head.appendChild(style);
    };

    // 3. AUDIO FOCUS CON PROTECCIÓN PiP
    const bc = new BroadcastChannel('ext_audio_focus');
    bc.onmessage = (msg) => {
        if (config.audioFocus && msg.data === 'pausa_otros') {
            const v = document.querySelector('video');
            // NO pausar si estamos en PiP o acabamos de cerrarlo
            if (v && !v.paused && !document.pictureInPictureElement && !cerrandoPip) {
                v.pause();
            }
        }
    };

    const verificarSeguridad = () => {
        const host = window.location.hostname;
        const esSeguro = host.includes('youtube') || host.includes('twitch') || host.includes('kick');
        if (!esSeguro && window.location.protocol !== 'https:' && !document.getElementById('ext-security-alert')) {
            const alertDiv = document.createElement('div');
            alertDiv.id = 'ext-security-alert';
            alertDiv.innerHTML = '⚠️ Conexión no cifrada. Sitio Inseguro.';
            document.body.appendChild(alertDiv);
            setTimeout(() => alertDiv.remove(), 6000); 
        }
    };

    const restaurarProgreso = () => {
        const v = document.querySelector('video');
        if (v && !progresoRestaurado) {
            chrome.storage.local.get([window.location.href], (result) => {
                if (result[window.location.href] > 1) v.currentTime = result[window.location.href];
            });
            progresoRestaurado = true;
        }
    };

    const crearControles = () => {
        const host = window.location.hostname;
        let barra = null;
        if (host.includes('youtube')) barra = document.querySelector('.ytp-right-controls');
        else if (host.includes('twitch')) barra = document.querySelector('.player-controls__right-control-group');
        else if (host.includes('kick')) barra = document.querySelector('.vjs-control-bar');

        if (!barra || document.getElementById('ext-main-v67')) return;

        const container = document.createElement('div');
        container.id = 'ext-main-v67';
        container.style.display = 'inline-flex';
        container.style.color = window.getComputedStyle(barra).color;

        const btnFocus = document.createElement('button');
        btnFocus.className = 'btn-ext-control' + (config.audioFocus ? ' active' : '');
        btnFocus.title = "Foco de Audio";
        btnFocus.innerHTML = `<svg viewBox="0 0 24 24"><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-2 17.77l-5-5H3V8h4l5-5v18z"/></svg>`;
        btnFocus.onclick = () => {
            config.audioFocus = !config.audioFocus;
            btnFocus.classList.toggle('active', config.audioFocus);
            chrome.storage.local.set({config});
        };

        const btnRam = document.createElement('button');
        btnRam.className = 'btn-ext-control' + (config.suspension ? ' active' : '');
        btnRam.title = "Ahorro de RAM";
        btnRam.innerHTML = `<svg viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 4h2v5H9V4z"/></svg>`;
        btnRam.onclick = () => {
            config.suspension = !config.suspension;
            btnRam.classList.toggle('active', config.suspension);
            chrome.storage.local.set({config});
        };

        const btnPip = document.createElement('button');
        btnPip.className = 'btn-ext-control';
        btnPip.title = "Extractor (PiP)";
        btnPip.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2z"/></svg>`;
        btnPip.onclick = async () => {
            const v = document.querySelector('video');
            if (!v) return;
            if (document.pictureInPictureElement) {
                cerrandoPip = true;
                await document.exitPictureInPicture();
                setTimeout(() => { cerrandoPip = false; v.play(); }, 200); // Forzar play al volver
            } else {
                await v.requestPictureInPicture();
            }
        };

        container.append(btnFocus, btnRam, btnPip);
        barra.prepend(container);
    };

    const motorPrincipal = () => {
        const v = document.querySelector('video');
        if (!v) return;

        if (!v.paused) {
            chrome.storage.local.set({ [window.location.href]: v.currentTime });
            v.onplay = () => { if (config.audioFocus) bc.postMessage('pausa_otros'); };
            ultimaActividad = Date.now();
        }

        const esAnuncio = document.querySelector('.ad-showing, .ad-interrupting, [data-a-target="video-ad-label"]');
        if (esAnuncio) {
            v.playbackRate = 16.0;
            v.muted = true;
            document.querySelector('.ytp-ad-skip-button, .ytp-skip-ad-button')?.click();
        } else if (v.playbackRate > 2 && config.roeManual) {
            v.playbackRate = 1.0;
            v.muted = false;
        }
    };

    setInterval(() => {
        inyectarCSS();
        crearControles();
        restaurarProgreso();
        motorPrincipal();
        verificarSeguridad();
    }, 1000);

    // Detección nativa para evitar pausas al cerrar PiP
    document.addEventListener('leavepictureinpicture', () => {
        const v = document.querySelector('video');
        if (v) setTimeout(() => v.play(), 100); 
    });
})();
