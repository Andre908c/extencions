(function() {
    let config = { activo: true, modoAd: false, focusMode: false, roeManual: true };

    const inyectarCSS = () => {
        if (document.getElementById('yt-player-controls-css')) return;
        const style = document.createElement('style');
        style.id = 'yt-player-controls-css';
        style.innerHTML = `
            /* Botones estilo nativo de YouTube para el reproductor */
            .ytp-button.ext-player-btn {
                display: inline-flex !important;
                align-items: center;
                justify-content: center;
                width: auto !important;
                padding: 0 10px !important;
                font-size: 11px !important;
                font-weight: bold !important;
                transition: color 0.2s;
            }
            #btn-roe-player { color: #aaa; }
            #btn-roe-player.active { color: #ff0000; text-shadow: 0 0 8px #ff0000; }
            
            #btn-focus-player { color: #aaa; }
            #btn-focus-player.active { color: #00ffcc; text-shadow: 0 0 8px #00ffcc; }

            /* Ocultar previsualización si estamos en Watch */
            body[mode="watch"] ytd-video-preview { display: none !important; }
        `;
        document.head.appendChild(style);
    };

    // Función para inyectar en los controles del reproductor
    const inyectarEnReproductor = () => {
        const controlesDerecha = document.querySelector('.ytp-right-controls');
        if (!controlesDerecha) return;

        // 1. BOTÓN ROBO DE VIDEO (ROE)
        if (!document.getElementById('btn-roe-player')) {
            const btnRoe = document.createElement('button');
            btnRoe.id = 'btn-roe-player';
            btnRoe.className = 'ytp-button ext-player-btn' + (config.roeManual ? ' active' : '');
            btnRoe.innerText = 'ROBO';
            btnRoe.title = 'Activar/Desactivar Robo de Video (ROE)';
            btnRoe.onclick = () => {
                config.roeManual = !config.roeManual;
                btnRoe.classList.toggle('active', config.roeManual);
            };
            controlesDerecha.prepend(btnRoe);
        }

        // 2. BOTÓN PAUSA INTELIGENTE (FOCUS)
        if (!document.getElementById('btn-focus-player')) {
            const btnFocus = document.createElement('button');
            btnFocus.id = 'btn-focus-player';
            btnFocus.className = 'ytp-button ext-player-btn' + (config.focusMode ? ' active' : '');
            btnFocus.innerText = 'FOCUS';
            btnFocus.title = 'Pausa Inteligente al previsualizar';
            btnFocus.onclick = () => {
                config.focusMode = !config.focusMode;
                btnFocus.classList.toggle('active', config.focusMode);
            };
            controlesDerecha.prepend(btnFocus);
        }
    };

    const motorLogica = () => {
        const v = document.querySelector('video.html5-main-video');
        if (!v) return;

        // ROBO DE VIDEO (Aceleración)
        if (config.roeManual) {
            const ad = document.querySelector('.ad-showing, .ytp-ad-player-overlay');
            if (ad) {
                v.playbackRate = 8.0; v.muted = true; config.modoAd = true;
            } else if (config.modoAd) {
                v.playbackRate = 1.0; v.muted = false; config.modoAd = false;
            }
        }

        // PAUSA INTELIGENTE
        if (config.focusMode && window.location.pathname.includes('/watch')) {
            const p = document.querySelector('ytd-video-preview');
            const isHover = (p && p.style.display !== 'none');
            if (isHover && !v.paused) v.pause();
            else if (!isHover && v.paused) v.play();
        }
    };

    // Bucle de alta frecuencia para combatir la limpieza de YouTube
    setInterval(() => {
        const esWatch = window.location.pathname.includes('/watch');
        document.body.setAttribute('mode', esWatch ? 'watch' : 'home');

        if (esWatch) {
            inyectarCSS();
            inyectarEnReproductor();
            motorLogica();
        }
        
        // Bloqueo de subtítulos en previsualización
        const pV = document.querySelector('ytd-video-preview video');
        if (pV && pV.textTracks) {
            for (let i = 0; i < pV.textTracks.length; i++) pV.textTracks[i].mode = 'disabled';
        }
    }, 400);
})();
