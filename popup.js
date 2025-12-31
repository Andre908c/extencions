(function() {
    let modoAdActivo = false;

    // --- 1. DISEÑO MINI (300px) ---
    const inyectarCSS = () => {
        if (document.getElementById('yt-pops-mini-css')) return;
        const style = document.createElement('style');
        style.id = 'yt-pops-mini-css';
        style.innerHTML = `
            ytd-video-preview, #preview.ytd-video-preview {
                width: 300px !important; /* Tamaño muy reducido para que no estorbe */
                height: auto !important;
                position: fixed !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                z-index: 2147483647 !important;
                border: 2px solid #ff0000 !important;
                border-radius: 8px !important;
                background: #000 !important;
                pointer-events: none !important;
                display: flex !important;
                flex-direction: column !important;
                box-shadow: 0 0 30px rgba(0,0,0,0.6) !important;
            }

            ytd-video-preview video {
                width: 100% !important;
                height: auto !important;
            }

            /* Bloqueo de subtítulos */
            .ytp-caption-window-container { display: none !important; }

            /* Barra inferior ultra-compacta */
            .yt-pops-bar-mini {
                width: 100%; height: 35px; background: #111; color: white;
                display: flex; align-items: center; justify-content: center;
                font-family: 'Roboto', sans-serif; border-top: 1px solid #222;
            }
            .mute-btn-style {
                color: #ff0000; padding: 1px 8px; border: 1px solid #ff0000;
                border-radius: 3px; font-size: 9px; font-weight: bold;
                text-transform: uppercase;
            }
        `;
        document.head.appendChild(style);
    };

    // --- 2. CONTROL DE AUDIO (M) ---
    const manejarAudio = (e) => {
        const preview = document.querySelector('ytd-video-preview');
        if (!preview || preview.style.display === 'none') return;
        const v = preview.querySelector('video');
        if (!v) return;

        if (e.key.toLowerCase() === 'm') {
            e.stopImmediatePropagation();
            e.preventDefault();
            v.muted = !v.muted;
        }
    };

    const actualizarBarra = () => {
        const preview = document.querySelector('ytd-video-preview');
        if (!preview || preview.style.display === 'none') return;
        const v = preview.querySelector('video');
        if (!v) return;

        let bar = preview.querySelector('.yt-pops-bar-mini');
        if (!bar) {
            bar = document.createElement('div');
            bar.className = 'yt-pops-bar-mini';
            preview.appendChild(bar);
        }

        const estado = v.muted ? "MUTEADO (M)" : "SONIDO (M)";
        bar.innerHTML = `<div class="mute-btn-style">${estado}</div>`;
    };

    // --- 3. ROE 8X Y BOTÓN 🔳 ---
    const motorGlobal = () => {
        const v = document.querySelector('video');
        if (!v || v.closest('ytd-video-preview')) return;
        const ad = document.querySelector('.ad-showing, .ytp-ad-player-overlay');
        if (ad && !modoAdActivo) {
            modoAdActivo = true; v.muted = true; v.playbackRate = 8.0;
        } else if (!ad && modoAdActivo) {
            modoAdActivo = false; v.playbackRate = 1.0;
        }
    };

    const inyectarBoton = () => {
        if (document.getElementById('btn-pops-pip') || !window.location.pathname.includes('/watch')) return;
        const controls = document.querySelector('.ytp-right-controls');
        if (controls) {
            const btn = document.createElement('button');
            btn.id = 'btn-pops-pip'; btn.innerHTML = '🔳';
            Object.assign(btn.style, { background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: '18px', padding: '0 8px' });
            btn.onclick = () => {
                const mainV = document.querySelector('video');
                if (document.pictureInPictureElement) document.exitPictureInPicture();
                else mainV.requestPictureInPicture();
            };
            controls.prepend(btn);
        }
    };

    // --- 4. LANZAMIENTO ---
    inyectarCSS();
    window.addEventListener('keydown', manejarAudio, true);
    setInterval(() => {
        actualizarBarra();
        motorGlobal();
        inyectarBoton();
    }, 300);
})();