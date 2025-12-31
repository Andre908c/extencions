(function() {
    let modoAdActivo = false;
    let previewHabilitada = true; // Estado inicial: encendido

    // --- 1. ESTILOS: 300px, CENTRADO Y BOTÓN TOGGLE ---
    const inyectarCSS = () => {
        if (document.getElementById('yt-toggle-v28-css')) return;
        const style = document.createElement('style');
        style.id = 'yt-pops-v28-css';
        style.innerHTML = `
            /* Ocultar preview si está desactivada */
            .preview-desactivada ytd-video-preview { display: none !important; }

            ytd-video-preview, #preview.ytd-video-preview {
                width: 300px !important; height: auto !important;
                position: fixed !important; top: 50% !important; left: 50% !important;
                transform: translate(-50%, -50%) !important;
                z-index: 2147483647 !important;
                border: 2px solid #ff0000 !important; border-radius: 8px !important;
                background: #000 !important; pointer-events: none !important;
                display: flex !important; flex-direction: column !important;
                box-shadow: 0 0 30px rgba(0,0,0,0.6) !important;
            }

            /* Botón de Activación en la barra de YouTube */
            #btn-preview-toggle {
                background: #333; color: white; border: 1px solid #ff0000;
                padding: 5px 12px; border-radius: 20px; cursor: pointer;
                font-family: 'Roboto', sans-serif; font-size: 12px; font-weight: bold;
                margin-right: 15px; align-self: center; transition: 0.3s;
            }
            #btn-preview-toggle.activo { background: #ff0000; border-color: white; }

            .yt-pops-bar-v28 {
                width: 100%; height: 35px; background: #111; color: white;
                display: flex; align-items: center; justify-content: center;
                font-family: 'Roboto', sans-serif; border-top: 1px solid #222;
            }
            .status-badge { color: #ff0000; border: 1px solid #ff0000; padding: 2px 8px; font-size: 10px; border-radius: 4px; }
        `;
        document.head.appendChild(style);
    };

    // --- 2. MOTOR DEL BOTÓN TOGGLE ---
    const inyectarBotonMaestro = () => {
        if (document.getElementById('btn-preview-toggle')) return;
        const barraYT = document.querySelector('#buttons.ytd-masthead');
        if (barraYT) {
            const btn = document.createElement('button');
            btn.id = 'btn-preview-toggle';
            btn.className = 'activo';
            btn.innerText = 'PREVIEW: ON';
            btn.onclick = () => {
                previewHabilitada = !previewHabilitada;
                btn.innerText = previewHabilitada ? 'PREVIEW: ON' : 'PREVIEW: OFF';
                btn.classList.toggle('activo');
                document.body.classList.toggle('preview-desactivada', !previewHabilitada);
            };
            barraYT.prepend(btn);
        }
    };

    // --- 3. GESTIÓN DE AUDIO Y LIMPIEZA ---
    const manejarAudioM = (e) => {
        if (!previewHabilitada) return;
        const preview = document.querySelector('ytd-video-preview');
        if (!preview || preview.style.display === 'none') return;
        const v = preview.querySelector('video');
        if (v && e.key.toLowerCase() === 'm') {
            e.stopImmediatePropagation();
            e.preventDefault();
            v.muted = !v.muted;
        }
    };

    const actualizarInterfaz = () => {
        const preview = document.querySelector('ytd-video-preview');
        if (!preview || !previewHabilitada || preview.style.display === 'none') return;

        const v = preview.querySelector('video');
        if (!v) return;

        let bar = preview.querySelector('.yt-pops-bar-v28');
        if (!bar) {
            bar = document.createElement('div');
            bar.className = 'yt-pops-bar-v28';
            preview.appendChild(bar);
        }
        bar.innerHTML = `<div class="status-badge">${v.muted ? 'MUTEADO (M)' : 'SONIDO (M)'}</div>`;
    };

    // --- 4. ROE 8X Y BOTÓN PiP ---
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

    // --- 5. ARRANQUE ---
    inyectarCSS();
    window.addEventListener('keydown', manejarAudioM, true);
    setInterval(() => {
        inyectarBotonMaestro();
        actualizarInterfaz();
        motorGlobal();
    }, 400);
})();