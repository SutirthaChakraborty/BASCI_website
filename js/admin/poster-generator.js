/**
 * BASCI Admin - Poster Generator tab.
 * Flow: pick template -> describe the poster -> enhance prompt (Gemini text
 * model) -> generate image (Gemini image model, fed the BASCI logo plus an
 * optional reference photo) -> composite logo/caption on canvas -> download.
 */
(function () {
    'use strict';

    const ASPECT_SIZES = {
        '1:1': { w: 1080, h: 1080 },
        '4:5': { w: 1080, h: 1350 },
        '16:9': { w: 1350, h: 760 }
    };

    const LOGO_PATH = 'assets/images/logo.png';
    const MAX_REFERENCE_IMAGES = 6;

    function wrapText(ctx, text, maxWidth) {
        const words = text.split(/\s+/).filter(Boolean);
        const lines = [];
        let line = '';
        words.forEach((word) => {
            const test = line ? `${line} ${word}` : word;
            if (ctx.measureText(test).width > maxWidth && line) {
                lines.push(line);
                line = word;
            } else {
                line = test;
            }
        });
        if (line) lines.push(line);
        return lines;
    }

    function roundRectPath(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    class PosterGenerator {
        constructor() {
            this.templates = window.BASCIPosterTemplates || [];
            this.selectedTemplate = null;
            this.referenceImages = []; // [{mimeType, data, previewUrl, name}]
            this.enhancedPrompt = '';
            this.generatedImage = null; // HTMLImageElement

            this.grid = document.getElementById('posterTemplateGrid');
            this.detailsInput = document.getElementById('posterDetailsInput');
            this.refInput = document.getElementById('posterReferenceInput');
            this.refGallery = document.getElementById('posterReferenceGallery');
            this.enhanceBtn = document.getElementById('posterEnhanceBtn');
            this.enhancedWrap = document.getElementById('posterEnhancedWrap');
            this.enhancedText = document.getElementById('posterEnhancedText');
            this.generateBtn = document.getElementById('posterGenerateBtn');
            this.captionInput = document.getElementById('posterCaptionInput');
            this.subcaptionInput = document.getElementById('posterSubcaptionInput');
            this.logoPositionSelect = document.getElementById('posterLogoPosition');
            this.status = document.getElementById('posterStatus');
            this.canvas = document.getElementById('posterCanvas');
            this.canvasWrap = document.getElementById('posterCanvasWrap');
            this.downloadBtn = document.getElementById('posterDownloadBtn');
            this.startOverBtn = document.getElementById('posterStartOverBtn');

            if (!this.grid) return; // poster tab not present on this page
            this.renderTemplates();
            this.bindEvents();
        }

        renderTemplates() {
            this.grid.innerHTML = this.templates.map((t) => `
                <button type="button" class="poster-template-card" data-id="${t.id}" title="${t.description}">
                    <span class="poster-template-card__emoji">${t.emoji}</span>
                    <span class="poster-template-card__name">${t.name}</span>
                    <span class="poster-template-card__category">${t.category}</span>
                </button>
            `).join('');
        }

        bindEvents() {
            this.grid.addEventListener('click', (e) => {
                const btn = e.target.closest('.poster-template-card');
                if (!btn) return;
                this.selectTemplate(btn.dataset.id);
            });

            if (this.refInput) {
                this.refInput.addEventListener('change', () => this.handleReferenceUpload());
            }
            if (this.enhanceBtn) {
                this.enhanceBtn.addEventListener('click', () => this.enhance());
            }
            if (this.generateBtn) {
                this.generateBtn.addEventListener('click', () => this.generate());
            }
            if (this.downloadBtn) {
                this.downloadBtn.addEventListener('click', () => this.download());
            }
            if (this.startOverBtn) {
                this.startOverBtn.addEventListener('click', () => this.reset());
            }
            [this.captionInput, this.subcaptionInput, this.logoPositionSelect].forEach((el) => {
                if (el) el.addEventListener('input', () => this.renderComposite());
                if (el) el.addEventListener('change', () => this.renderComposite());
            });
        }

        selectTemplate(id) {
            this.selectedTemplate = this.templates.find((t) => t.id === id) || null;
            this.grid.querySelectorAll('.poster-template-card').forEach((el) => {
                el.classList.toggle('is-selected', el.dataset.id === id);
            });
            if (this.detailsInput && this.selectedTemplate) {
                this.detailsInput.placeholder = this.selectedTemplate.placeholder;
            }
            this.setStatus('');
        }

        async handleReferenceUpload() {
            const files = Array.from(this.refInput.files || []);
            if (!files.length) return;

            const room = MAX_REFERENCE_IMAGES - this.referenceImages.length;
            if (room <= 0) {
                this.setStatus(`You can attach up to ${MAX_REFERENCE_IMAGES} reference images.`, true);
                this.refInput.value = '';
                return;
            }
            const toAdd = files.slice(0, room);
            if (files.length > room) {
                this.setStatus(`Only added ${room} more image(s) - the ${MAX_REFERENCE_IMAGES}-image limit was reached.`, true);
            }

            try {
                for (const file of toAdd) {
                    const data = await window.BASCIGemini.blobToBase64(file);
                    this.referenceImages.push({
                        mimeType: file.type || 'image/jpeg',
                        data,
                        previewUrl: URL.createObjectURL(file),
                        name: file.name
                    });
                }
                this.renderReferenceGallery();
            } catch (err) {
                this.setStatus(err.message, true);
            } finally {
                this.refInput.value = '';
            }
        }

        renderReferenceGallery() {
            if (!this.refGallery) return;
            this.refGallery.innerHTML = this.referenceImages.map((img, i) => `
                <div class="poster-reference-thumb" data-index="${i}">
                    <img src="${img.previewUrl}" alt="${img.name || 'Reference image'}">
                    <button type="button" class="poster-reference-thumb__remove" data-index="${i}" aria-label="Remove image">&times;</button>
                </div>
            `).join('');
            this.refGallery.querySelectorAll('.poster-reference-thumb__remove').forEach((btn) => {
                btn.addEventListener('click', () => this.removeReferenceImage(Number(btn.dataset.index)));
            });
        }

        removeReferenceImage(index) {
            const [removed] = this.referenceImages.splice(index, 1);
            if (removed) URL.revokeObjectURL(removed.previewUrl);
            this.renderReferenceGallery();
        }

        clearReference() {
            this.referenceImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
            this.referenceImages = [];
            if (this.refInput) this.refInput.value = '';
            this.renderReferenceGallery();
        }

        setStatus(message, isError) {
            if (!this.status) return;
            this.status.textContent = message;
            this.status.classList.toggle('is-error', !!isError);
            this.status.classList.toggle('is-visible', !!message);
        }

        setBusy(isBusy, label) {
            [this.enhanceBtn, this.generateBtn].forEach((btn) => {
                if (btn) btn.disabled = isBusy;
            });
            if (isBusy) this.setStatus(label || 'Working...');
        }

        async enhance() {
            if (!this.selectedTemplate) {
                this.setStatus('Pick a template first.', true);
                return;
            }
            if (!window.BASCIGemini.hasApiKey()) {
                this.setStatus('Add your Gemini API key in the Settings tab first.', true);
                return;
            }
            this.setBusy(true, 'Enhancing your description with Gemini...');
            try {
                const enhanced = await window.BASCIGemini.enhancePrompt({
                    scaffold: this.selectedTemplate.scaffold,
                    details: this.detailsInput ? this.detailsInput.value.trim() : '',
                    aspect: this.selectedTemplate.aspect
                });
                this.enhancedPrompt = enhanced;
                if (this.enhancedText) this.enhancedText.value = enhanced;
                if (this.enhancedWrap) this.enhancedWrap.classList.add('is-visible');
                this.setStatus('Prompt enhanced. Review it below, then generate your poster.');
            } catch (err) {
                this.setStatus(err.message, true);
            } finally {
                this.setBusy(false);
            }
        }

        async generate() {
            const prompt = (this.enhancedText && this.enhancedText.value.trim()) || this.enhancedPrompt;
            if (!prompt) {
                this.setStatus('Enhance a description first (step 1) so there is a prompt to generate from.', true);
                return;
            }
            if (!window.BASCIGemini.hasApiKey()) {
                this.setStatus('Add your Gemini API key in the Settings tab first.', true);
                return;
            }
            this.setBusy(true, 'Generating your poster with Gemini... this can take up to 30 seconds.');
            try {
                const logo = await window.BASCIGemini.fetchAsBase64(LOGO_PATH, 'image/png');
                const images = [logo, ...this.referenceImages];

                const result = await window.BASCIGemini.generateImage({ prompt, images });
                const dataUrl = `data:${result.mimeType};base64,${result.data}`;
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = () => reject(new Error('Gemini returned image data that could not be loaded.'));
                    img.src = dataUrl;
                });
                this.generatedImage = img;
                if (this.canvasWrap) this.canvasWrap.classList.add('is-visible');
                await this.renderComposite();
                this.setStatus('Poster generated! Adjust the caption/logo below, then download.');
            } catch (err) {
                this.setStatus(err.message, true);
            } finally {
                this.setBusy(false);
            }
        }

        async renderComposite() {
            if (!this.generatedImage || !this.canvas) return;
            const aspect = (this.selectedTemplate && ASPECT_SIZES[this.selectedTemplate.aspect]) || ASPECT_SIZES['1:1'];
            this.canvas.width = aspect.w;
            this.canvas.height = aspect.h;
            const ctx = this.canvas.getContext('2d');
            const img = this.generatedImage;

            const scale = Math.max(aspect.w / img.naturalWidth, aspect.h / img.naturalHeight);
            const dw = img.naturalWidth * scale;
            const dh = img.naturalHeight * scale;
            ctx.drawImage(img, (aspect.w - dw) / 2, (aspect.h - dh) / 2, dw, dh);

            const caption = this.captionInput ? this.captionInput.value.trim() : '';
            const subcaption = this.subcaptionInput ? this.subcaptionInput.value.trim() : '';
            if (caption || subcaption) {
                if (document.fonts && document.fonts.ready) {
                    try {
                        await Promise.all([
                            document.fonts.load('800 48px Oswald'),
                            document.fonts.load('600 32px Montserrat'),
                            document.fonts.ready
                        ]);
                    } catch (e) { /* fall back to default font if webfonts fail to load */ }
                }
                const scrimHeight = aspect.h * 0.32;
                const gradient = ctx.createLinearGradient(0, aspect.h - scrimHeight, 0, aspect.h);
                gradient.addColorStop(0, 'rgba(10, 20, 12, 0)');
                gradient.addColorStop(1, 'rgba(6, 14, 8, 0.88)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, aspect.h - scrimHeight, aspect.w, scrimHeight);

                let y = aspect.h - 64;
                if (subcaption) {
                    ctx.font = `600 ${Math.round(aspect.w * 0.032)}px Montserrat, sans-serif`;
                    ctx.fillStyle = '#f0c040';
                    ctx.textAlign = 'left';
                    ctx.fillText(subcaption.toUpperCase(), aspect.w * 0.06, y);
                    y -= aspect.w * 0.06;
                }
                if (caption) {
                    ctx.font = `800 ${Math.round(aspect.w * 0.068)}px Oswald, sans-serif`;
                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'left';
                    const lines = wrapText(ctx, caption, aspect.w * 0.88).reverse();
                    lines.forEach((line) => {
                        ctx.fillText(line, aspect.w * 0.06, y);
                        y -= aspect.w * 0.075;
                    });
                }
            }

            await this.drawLogoBadge(ctx, aspect);
        }

        async drawLogoBadge(ctx, aspect) {
            try {
                const logoImg = await this.getLogoImage();
                const position = this.logoPositionSelect ? this.logoPositionSelect.value : 'bottom-right';
                if (position === 'none') return;
                const chip = Math.round(aspect.w * 0.16);
                const margin = Math.round(aspect.w * 0.045);
                let x = margin;
                let y = margin;
                if (position.includes('bottom')) y = aspect.h - chip - margin;
                if (position.includes('right')) x = aspect.w - chip - margin;
                if (position === 'top-center') x = (aspect.w - chip) / 2;

                ctx.save();
                roundRectPath(ctx, x, y, chip, chip, chip * 0.22);
                ctx.fillStyle = 'rgba(255,255,255,0.92)';
                ctx.shadowColor = 'rgba(0,0,0,0.35)';
                ctx.shadowBlur = chip * 0.15;
                ctx.fill();
                ctx.restore();

                const pad = chip * 0.14;
                const inner = chip - pad * 2;
                const logoScale = Math.min(inner / logoImg.naturalWidth, inner / logoImg.naturalHeight);
                const lw = logoImg.naturalWidth * logoScale;
                const lh = logoImg.naturalHeight * logoScale;
                ctx.drawImage(logoImg, x + (chip - lw) / 2, y + (chip - lh) / 2, lw, lh);
            } catch (e) {
                // logo failed to decode as an <img> - poster still usable without the badge
            }
        }

        getLogoImage() {
            if (this._logoImagePromise) return this._logoImagePromise;
            this._logoImagePromise = new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Could not load logo.png'));
                img.src = LOGO_PATH;
            });
            return this._logoImagePromise;
        }

        download() {
            if (!this.canvas || !this.generatedImage) {
                this.setStatus('Generate a poster first.', true);
                return;
            }
            if (window.location.protocol === 'file:') {
                this.setStatus('Downloads need this page served over http/https - open it via the published site or a local server, not by double-clicking the file.', true);
                return;
            }
            try {
                this.canvas.toBlob((blob) => {
                    if (!blob) return;
                    const name = (this.selectedTemplate ? this.selectedTemplate.id : 'poster');
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `basci-${name}-${Date.now()}.png`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                }, 'image/png', 0.95);
            } catch (err) {
                this.setStatus('Could not export the image (the browser blocked it as a security precaution). Try again from the published site.', true);
            }
        }

        reset() {
            this.selectedTemplate = null;
            this.enhancedPrompt = '';
            this.generatedImage = null;
            this.clearReference();
            if (this.detailsInput) this.detailsInput.value = '';
            if (this.enhancedText) this.enhancedText.value = '';
            if (this.captionInput) this.captionInput.value = '';
            if (this.subcaptionInput) this.subcaptionInput.value = '';
            if (this.enhancedWrap) this.enhancedWrap.classList.remove('is-visible');
            if (this.canvasWrap) this.canvasWrap.classList.remove('is-visible');
            this.grid.querySelectorAll('.poster-template-card').forEach((el) => el.classList.remove('is-selected'));
            this.setStatus('');
        }
    }

    document.addEventListener('basci:admin-unlocked', () => {
        if (!window.basciPosterGenerator) window.basciPosterGenerator = new PosterGenerator();
    }, { once: true });
})();
