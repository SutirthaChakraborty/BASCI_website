/**
 * BASCI Admin - Formation Builder tab.
 * Coach picks a team size + preset formation, builds a roster, drags
 * players onto a pitch (fully free repositioning), sets a tactical style
 * plus attack/defend/midfield notes, can show a mirrored opponent lineup,
 * and exports the lineup as an image (download or native share sheet).
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'basci_admin_formation_v2';
    const SAVED_LIST_KEY = 'basci_admin_formations_list_v2';
    const HTML2CANVAS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

    const STYLES = [
        { id: 'balanced', label: 'Balanced' },
        { id: 'attacking', label: 'Attacking - High Press' },
        { id: 'defensive', label: 'Defensive - Low Block' },
        { id: 'counter', label: 'Counter-Attack' },
        { id: 'possession', label: 'Possession' }
    ];

    let html2canvasPromise = null;
    function loadHtml2Canvas() {
        if (window.html2canvas) return Promise.resolve(window.html2canvas);
        if (html2canvasPromise) return html2canvasPromise;
        html2canvasPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = HTML2CANVAS_SRC;
            script.onload = () => resolve(window.html2canvas);
            script.onerror = () => reject(new Error('Could not load the image-export library. Check your connection.'));
            document.head.appendChild(script);
        });
        return html2canvasPromise;
    }

    function uid() {
        return `p${Math.random().toString(36).slice(2, 9)}`;
    }

    function clamp(n, min, max) {
        return Math.max(min, Math.min(max, n));
    }

    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    // Pointer-based drag helper. Reports both a live drag callback and a
    // final drop callback; if the pointer barely moved, onTap fires instead
    // (so a click/tap can open an edit panel while a real drag repositions).
    function makeDraggable(el, pitchEl, { onDrag, onDrop, onTap } = {}) {
        el.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            el.setPointerCapture(e.pointerId);
            el.classList.add('is-dragging');
            const startX = e.clientX, startY = e.clientY;
            let maxDist = 0;

            const move = (ev) => {
                maxDist = Math.max(maxDist, Math.hypot(ev.clientX - startX, ev.clientY - startY));
                const rect = pitchEl.getBoundingClientRect();
                const x = clamp(((ev.clientX - rect.left) / rect.width) * 100, 2, 98);
                const y = clamp(((ev.clientY - rect.top) / rect.height) * 100, 2, 98);
                if (onDrag) onDrag(x, y, ev);
            };
            const up = (ev) => {
                el.releasePointerCapture(e.pointerId);
                el.classList.remove('is-dragging');
                el.removeEventListener('pointermove', move);
                el.removeEventListener('pointerup', up);
                const rect = pitchEl.getBoundingClientRect();
                const over = ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom;
                const x = clamp(((ev.clientX - rect.left) / rect.width) * 100, 2, 98);
                const y = clamp(((ev.clientY - rect.top) / rect.height) * 100, 2, 98);
                if (maxDist < 6 && onTap) {
                    onTap();
                } else if (onDrop) {
                    onDrop(over, x, y, ev);
                }
            };
            el.addEventListener('pointermove', move);
            el.addEventListener('pointerup', up);
        });
    }

    class FormationBuilder {
        constructor() {
            this.formatSelect = document.getElementById('formationFormatSelect');
            this.presetGrid = document.getElementById('formationPresetGrid');
            this.styleSelect = document.getElementById('formationStyleSelect');
            this.titleInput = document.getElementById('formationTitleInput');
            this.opponentNameInput = document.getElementById('formationOpponentNameInput');
            this.matchDateInput = document.getElementById('formationMatchDateInput');
            this.venueInput = document.getElementById('formationVenueInput');

            this.rosterNameInput = document.getElementById('formationRosterInput');
            this.rosterNumberInput = document.getElementById('formationJerseyInput');
            this.rosterAddBtn = document.getElementById('formationRosterAddBtn');
            this.bench = document.getElementById('formationBench');
            this.autoNumberBtn = document.getElementById('formationAutoNumberBtn');
            this.flipBtn = document.getElementById('formationFlipBtn');

            this.opponentToggle = document.getElementById('formationOpponentToggle');
            this.opponentBadge = document.getElementById('formationOpponentBadge');
            this.opponentControls = document.getElementById('formationOpponentControls');
            this.opponentPresetSelect = document.getElementById('formationOpponentPresetSelect');
            this.opponentRosterInput = document.getElementById('formationOpponentRosterInput');
            this.opponentRosterAddBtn = document.getElementById('formationOpponentRosterAddBtn');
            this.opponentBench = document.getElementById('formationOpponentBench');
            this.opponentTokensLayer = document.getElementById('formationOpponentTokens');

            this.attackNotes = document.getElementById('formationAttackNotes');
            this.defendNotes = document.getElementById('formationDefendNotes');
            this.midfieldNotes = document.getElementById('formationMidfieldNotes');

            this.savedSelect = document.getElementById('formationSavedSelect');
            this.loadBtn = document.getElementById('formationLoadBtn');
            this.saveAsBtn = document.getElementById('formationSaveAsBtn');
            this.deleteSavedBtn = document.getElementById('formationDeleteSavedBtn');

            this.pitch = document.getElementById('formationPitch');
            this.tokensLayer = document.getElementById('formationTokens');
            this.arrowsSvg = document.getElementById('formationArrows');
            this.arrowModeBtn = document.getElementById('formationArrowModeBtn');
            this.clearArrowsBtn = document.getElementById('formationClearArrowsBtn');
            this.exportBtn = document.getElementById('formationExportBtn');
            this.shareBtn = document.getElementById('formationShareBtn');
            this.mobileExportBtn = document.getElementById('formationMobileExportBtn');
            this.mobileShareBtn = document.getElementById('formationMobileShareBtn');
            this.resetBtn = document.getElementById('formationResetBtn');
            this.exportFrame = document.getElementById('formationExportFrame');
            this.exportTitle = document.getElementById('formationExportTitle');
            this.exportMeta = document.getElementById('formationExportMeta');
            this.exportTactics = document.getElementById('formationExportTactics');
            this.status = document.getElementById('formationStatus');

            this.modal = document.getElementById('formationPlayerModal');
            this.modalName = document.getElementById('playerModalName');
            this.modalNumber = document.getElementById('playerModalNumber');
            this.modalDuty = document.getElementById('playerModalDuty');
            this.modalCaptain = document.getElementById('playerModalCaptain');
            this.modalPhone = document.getElementById('playerModalPhone');
            this.modalSaveBtn = document.getElementById('playerModalSaveBtn');
            this.modalShareBtn = document.getElementById('playerModalShareBtn');
            this.modalRemoveBtn = document.getElementById('playerModalRemoveBtn');
            this.modalCancelBtn = document.getElementById('playerModalCancelBtn');
            this.shareDutiesBtn = document.getElementById('formationShareDutiesBtn');

            if (!this.pitch) return; // formation tab not present on this page

            this.data = window.BASCIFormations;
            this.arrowMode = false;
            this.arrows = [];
            this.benchPlayers = [];
            this.tokens = [];
            this.opponentEnabled = false;
            this.opponentBenchPlayers = [];
            this.opponentTokens = [];
            this.editingToken = null; // { list: 'own'|'opponent', token }

            this.populateFormatOptions();
            this.populateStyleOptions();
            this.bindEvents();
            this.refreshSavedList();
            if (!this.loadFromStorage()) {
                this.applyFormat(this.data.FORMATS[6], this.data.FORMATIONS[this.data.FORMATS[6]][0].id);
            }
        }

        setStatus(msg, isError) {
            if (!this.status) return;
            this.status.textContent = msg || '';
            this.status.classList.toggle('is-error', !!isError);
        }

        populateFormatOptions() {
            this.formatSelect.innerHTML = this.data.FORMATS.map((f) => `<option value="${f}">${f}</option>`).join('');
            this.formatSelect.value = '11v11';
        }

        populateStyleOptions() {
            this.styleSelect.innerHTML = STYLES.map((s) => `<option value="${s.id}">${s.label}</option>`).join('');
        }

        bindEvents() {
            this.formatSelect.addEventListener('change', () => {
                const format = this.formatSelect.value;
                this.applyFormat(format, this.data.FORMATIONS[format][0].id);
            });

            this.presetGrid.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-preset-id]');
                if (!btn) return;
                this.applyFormat(this.formatSelect.value, btn.dataset.presetId);
            });

            this.rosterAddBtn.addEventListener('click', () => this.addRosterPlayer());
            this.rosterNameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.addRosterPlayer();
            });

            this.opponentRosterAddBtn.addEventListener('click', () => this.addOpponentPlayer());
            this.opponentRosterInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.addOpponentPlayer();
            });

            this.opponentToggle.addEventListener('change', () => {
                this.opponentEnabled = this.opponentToggle.checked;
                this.opponentControls.classList.toggle('is-visible', this.opponentEnabled);
                this.opponentBadge.textContent = this.opponentEnabled ? 'On' : 'Off';
                this.opponentBadge.classList.toggle('is-on', this.opponentEnabled);
                if (this.opponentEnabled && !this.opponentTokens.length) {
                    this.applyOpponentPreset(this.opponentPresetSelect.value);
                }
                this.renderOpponentTokens();
                this.persist();
            });

            this.opponentPresetSelect.addEventListener('change', () => {
                this.applyOpponentPreset(this.opponentPresetSelect.value);
            });

            this.autoNumberBtn.addEventListener('click', () => this.autoNumber());
            this.flipBtn.addEventListener('click', () => this.flipDirection());

            this.styleSelect.addEventListener('change', () => this.persist());
            [this.titleInput, this.opponentNameInput, this.matchDateInput, this.venueInput].forEach((el) => {
                el.addEventListener('input', () => { this.updateExportHeader(); this.persist(); });
            });
            [this.attackNotes, this.defendNotes, this.midfieldNotes].forEach((el) => {
                el.addEventListener('input', () => { this.updateExportTactics(); this.persist(); });
            });

            document.querySelectorAll('.admin-suggest-btn').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const key = btn.dataset.suggest;
                    const notes = this.data.STYLE_NOTES[this.styleSelect.value] || this.data.STYLE_NOTES.balanced;
                    const map = { attack: this.attackNotes, defend: this.defendNotes, midfield: this.midfieldNotes };
                    if (map[key]) {
                        map[key].value = notes[key];
                        this.updateExportTactics();
                        this.persist();
                    }
                });
            });

            this.arrowModeBtn.addEventListener('click', () => {
                this.arrowMode = !this.arrowMode;
                this.arrowModeBtn.classList.toggle('is-active', this.arrowMode);
                this.pitch.classList.toggle('is-arrow-mode', this.arrowMode);
            });
            this.clearArrowsBtn.addEventListener('click', () => {
                this.arrows = [];
                this.renderArrows();
                this.persist();
            });
            this.bindArrowDrawing();

            this.exportBtn.addEventListener('click', () => this.exportImage('download'));
            this.shareBtn.addEventListener('click', () => this.exportImage('share'));
            this.mobileExportBtn.addEventListener('click', () => this.exportImage('download'));
            this.mobileShareBtn.addEventListener('click', () => this.exportImage('share'));
            this.shareDutiesBtn.addEventListener('click', () => {
                const assigned = this.tokens.filter((t) => t.playerName);
                if (!assigned.length) {
                    this.setStatus('Add players to the pitch first.', true);
                    return;
                }
                this.openWhatsApp(null, this.buildTeamMessage());
            });

            this.resetBtn.addEventListener('click', () => {
                if (confirm('Clear the current lineup and start a new one?')) {
                    this.benchPlayers = [];
                    this.opponentBenchPlayers = [];
                    this.opponentTokens = [];
                    this.opponentEnabled = false;
                    this.opponentToggle.checked = false;
                    this.opponentControls.classList.remove('is-visible');
                    this.opponentBadge.textContent = 'Off';
                    this.arrows = [];
                    this.titleInput.value = '';
                    this.opponentNameInput.value = '';
                    this.matchDateInput.value = '';
                    this.venueInput.value = '';
                    this.attackNotes.value = '';
                    this.defendNotes.value = '';
                    this.midfieldNotes.value = '';
                    this.applyFormat(this.formatSelect.value, this.presetGrid.querySelector('[data-preset-id]').dataset.presetId);
                }
            });

            this.savedSelect.addEventListener('change', () => {
                this.loadBtn.disabled = !this.savedSelect.value;
                this.deleteSavedBtn.disabled = !this.savedSelect.value;
            });
            this.loadBtn.addEventListener('click', () => this.loadSaved(this.savedSelect.value));
            this.saveAsBtn.addEventListener('click', () => this.saveAsNew());
            this.deleteSavedBtn.addEventListener('click', () => this.deleteSaved(this.savedSelect.value));

            this.modalCancelBtn.addEventListener('click', () => this.closeModal());
            this.modalSaveBtn.addEventListener('click', () => this.saveModal());
            this.modalRemoveBtn.addEventListener('click', () => this.removeFromModal());
            this.modalShareBtn.addEventListener('click', () => {
                if (!this.editingToken) return;
                const { token } = this.editingToken;
                if (!token.playerName) {
                    this.setStatus('Assign a player to this slot first.', true);
                    return;
                }
                token.phone = this.modalPhone.value.trim();
                this.openWhatsApp(token.phone, this.buildPlayerMessage(token));
                this.persist();
            });
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.closeModal();
            });
        }

        bindArrowDrawing() {
            let drawing = null;
            this.pitch.addEventListener('pointerdown', (e) => {
                if (!this.arrowMode || e.target.closest('.pitch-token')) return;
                const rect = this.pitch.getBoundingClientRect();
                drawing = {
                    x1: ((e.clientX - rect.left) / rect.width) * 100,
                    y1: ((e.clientY - rect.top) / rect.height) * 100
                };
            });
            this.pitch.addEventListener('pointermove', (e) => {
                if (!drawing) return;
                const rect = this.pitch.getBoundingClientRect();
                const x2 = ((e.clientX - rect.left) / rect.width) * 100;
                const y2 = ((e.clientY - rect.top) / rect.height) * 100;
                this.renderArrows([...this.arrows, { ...drawing, x2, y2 }]);
            });
            window.addEventListener('pointerup', (e) => {
                if (!drawing) return;
                const rect = this.pitch.getBoundingClientRect();
                const x2 = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
                const y2 = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100);
                const dist = Math.hypot(x2 - drawing.x1, y2 - drawing.y1);
                if (dist > 3) {
                    this.arrows.push({ x1: drawing.x1, y1: drawing.y1, x2, y2 });
                    this.persist();
                }
                drawing = null;
                this.renderArrows();
            });
        }

        makeSlotTokens(preset) {
            return preset.positions.map((pos) => ({
                id: uid(),
                x: pos.x,
                y: pos.y,
                role: pos.role,
                slotLabel: pos.label,
                playerName: null,
                playerNumber: null,
                duty: this.data.DUTY_DEFAULTS[pos.label] || '',
                isCaptain: false,
                phone: ''
            }));
        }

        applyFormat(format, presetId) {
            const presets = this.data.FORMATIONS[format];
            const preset = presets.find((p) => p.id === presetId) || presets[0];
            this.formatSelect.value = format;
            this.presetGrid.innerHTML = presets.map((p) => `
                <button type="button" class="formation-preset-chip${p.id === preset.id ? ' is-selected' : ''}" data-preset-id="${p.id}">${p.name}</button>
            `).join('');

            const previous = this.tokens.filter((t) => t.playerName);
            this.tokens = this.makeSlotTokens(preset);
            previous.forEach((p, i) => {
                if (this.tokens[i]) {
                    this.tokens[i].playerName = p.playerName;
                    this.tokens[i].playerNumber = p.playerNumber;
                    this.tokens[i].duty = p.duty;
                    this.tokens[i].isCaptain = p.isCaptain;
                    this.tokens[i].phone = p.phone;
                }
            });

            this.currentFormat = format;
            this.currentPreset = preset;

            this.opponentPresetSelect.innerHTML = presets.map((p) => `<option value="${p.id}">${p.name}</option>`).join('');
            if (this.opponentEnabled) this.applyOpponentPreset(this.opponentPresetSelect.value);

            this.renderTokens();
            this.renderArrows();
            this.persist();
            this.setStatus(`${format} - ${preset.name} loaded. Drag bench players onto the pitch, or reposition anyone freely.`);
        }

        applyOpponentPreset(presetId) {
            const presets = this.data.FORMATIONS[this.currentFormat];
            const preset = presets.find((p) => p.id === presetId) || presets[0];
            this.opponentPresetSelect.value = preset.id;
            const previous = this.opponentTokens.filter((t) => t.playerName);
            this.opponentTokens = this.makeSlotTokens(preset).map((t) => ({ ...t, y: 100 - t.y }));
            previous.forEach((p, i) => {
                if (this.opponentTokens[i]) {
                    this.opponentTokens[i].playerName = p.playerName;
                    this.opponentTokens[i].playerNumber = p.playerNumber;
                }
            });
            this.renderOpponentTokens();
            this.persist();
        }

        addRosterPlayer() {
            const name = this.rosterNameInput.value.trim();
            if (!name) return;
            const number = this.rosterNumberInput.value.trim();
            this.benchPlayers.push({ id: uid(), name, number });
            this.rosterNameInput.value = '';
            this.rosterNumberInput.value = '';
            this.rosterNameInput.focus();
            this.renderBench();
            this.persist();
        }

        addOpponentPlayer() {
            const name = this.opponentRosterInput.value.trim();
            if (!name) return;
            this.opponentBenchPlayers.push({ id: uid(), name, number: '' });
            this.opponentRosterInput.value = '';
            this.renderOpponentBench();
            this.persist();
        }

        renderBench() {
            this.bench.innerHTML = this.benchPlayers.map((p) => `
                <div class="bench-chip" data-player-id="${p.id}">
                    ${p.number ? `<span class="bench-chip__number">${escapeHtml(p.number)}</span>` : ''}
                    <span class="bench-chip__name">${escapeHtml(p.name)}</span>
                    <button type="button" class="bench-chip__remove" data-remove-id="${p.id}" aria-label="Remove">&times;</button>
                </div>
            `).join('') || '<p class="formation-hint">Add players above, then drag them onto the pitch.</p>';

            this.bench.querySelectorAll('.bench-chip__remove').forEach((btn) => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.benchPlayers = this.benchPlayers.filter((p) => p.id !== btn.dataset.removeId);
                    this.renderBench();
                    this.persist();
                });
            });
            this.bench.querySelectorAll('.bench-chip').forEach((chip) => {
                makeDraggable(chip, this.pitch, {
                    onDrop: (over, x, y) => {
                        if (!over) return;
                        const playerId = chip.dataset.playerId;
                        const player = this.benchPlayers.find((p) => p.id === playerId);
                        if (!player) return;
                        this.assignPlayerToPitch(this.tokens, player, x, y);
                        this.benchPlayers = this.benchPlayers.filter((p) => p.id !== playerId);
                        this.renderBench();
                        this.renderTokens();
                        this.persist();
                    }
                });
            });
        }

        renderOpponentBench() {
            this.opponentBench.innerHTML = this.opponentBenchPlayers.map((p) => `
                <div class="bench-chip bench-chip--opponent" data-player-id="${p.id}">
                    <span class="bench-chip__name">${escapeHtml(p.name)}</span>
                    <button type="button" class="bench-chip__remove" data-remove-id="${p.id}" aria-label="Remove">&times;</button>
                </div>
            `).join('') || '<p class="formation-hint">Optional: name opponent players, or leave the pitch showing role labels only.</p>';

            this.opponentBench.querySelectorAll('.bench-chip__remove').forEach((btn) => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.opponentBenchPlayers = this.opponentBenchPlayers.filter((p) => p.id !== btn.dataset.removeId);
                    this.renderOpponentBench();
                    this.persist();
                });
            });
            this.opponentBench.querySelectorAll('.bench-chip').forEach((chip) => {
                makeDraggable(chip, this.pitch, {
                    onDrop: (over, x, y) => {
                        if (!over) return;
                        const playerId = chip.dataset.playerId;
                        const player = this.opponentBenchPlayers.find((p) => p.id === playerId);
                        if (!player) return;
                        this.assignPlayerToPitch(this.opponentTokens, player, x, y);
                        this.opponentBenchPlayers = this.opponentBenchPlayers.filter((p) => p.id !== playerId);
                        this.renderOpponentBench();
                        this.renderOpponentTokens();
                        this.persist();
                    }
                });
            });
        }

        assignPlayerToPitch(tokenList, player, x, y) {
            const target = tokenList
                .filter((t) => !t.playerName)
                .map((t) => ({ t, d: Math.hypot(t.x - x, t.y - y) }))
                .sort((a, b) => a.d - b.d)[0];

            if (target && target.d < 18) {
                target.t.playerName = player.name;
                target.t.playerNumber = player.number || null;
                target.t.x = x;
                target.t.y = y;
            } else {
                tokenList.push({
                    id: uid(), x, y, role: 'mid', slotLabel: 'SUB',
                    playerName: player.name, playerNumber: player.number || null,
                    duty: this.data.DUTY_DEFAULTS.SUB, isCaptain: false, phone: ''
                });
            }
        }

        renderTokens() {
            this.tokensLayer.innerHTML = this.tokens.map((t) => this.tokenMarkup(t, false)).join('');
            this.wireTokenInteractions(this.tokensLayer, this.tokens, this.pitch, false);
        }

        renderOpponentTokens() {
            if (!this.opponentEnabled) {
                this.opponentTokensLayer.innerHTML = '';
                return;
            }
            this.opponentTokensLayer.innerHTML = this.opponentTokens.map((t) => this.tokenMarkup(t, true)).join('');
            this.wireTokenInteractions(this.opponentTokensLayer, this.opponentTokens, this.pitch, true);
        }

        tokenMarkup(t, isOpponent) {
            const roleClass = isOpponent ? 'opponent' : t.role;
            return `
                <div class="pitch-token pitch-token--${roleClass}" data-token-id="${t.id}" style="left:${t.x}%; top:${t.y}%;" title="${escapeHtml(t.duty || '')}">
                    ${t.isCaptain ? '<span class="pitch-token__captain">C</span>' : ''}
                    <div class="pitch-token__marker">${t.playerNumber ? escapeHtml(t.playerNumber) : ''}</div>
                    <div class="pitch-token__label">${t.playerName ? escapeHtml(t.playerName) : t.slotLabel}</div>
                </div>
            `;
        }

        wireTokenInteractions(layer, tokenList, pitchEl, isOpponent) {
            layer.querySelectorAll('.pitch-token').forEach((el) => {
                const tokenId = el.dataset.tokenId;
                const token = tokenList.find((t) => t.id === tokenId);
                makeDraggable(el, pitchEl, {
                    onDrag: (x, y) => {
                        el.style.left = `${x}%`;
                        el.style.top = `${y}%`;
                    },
                    onDrop: (over, x, y) => {
                        if (over) { token.x = x; token.y = y; }
                        this.persist();
                        isOpponent ? this.renderOpponentTokens() : this.renderTokens();
                    },
                    onTap: () => this.openModal(token, isOpponent)
                });
            });
        }

        openModal(token, isOpponent) {
            this.editingToken = { token, isOpponent };
            this.modalName.value = token.playerName || '';
            this.modalNumber.value = token.playerNumber || '';
            this.modalDuty.value = token.duty || '';
            this.modalPhone.value = token.phone || '';
            this.modalCaptain.checked = !!token.isCaptain;
            this.modalCaptain.closest('label').style.display = isOpponent ? 'none' : '';
            this.modalPhone.closest('label').style.display = isOpponent ? 'none' : '';
            this.modalShareBtn.style.display = isOpponent ? 'none' : '';
            this.modal.classList.add('is-visible');
        }

        closeModal() {
            this.modal.classList.remove('is-visible');
            this.editingToken = null;
        }

        saveModal() {
            if (!this.editingToken) return;
            const { token, isOpponent } = this.editingToken;
            token.playerName = this.modalName.value.trim() || null;
            token.playerNumber = this.modalNumber.value.trim() || null;
            token.duty = this.modalDuty.value.trim();
            if (!isOpponent) {
                token.phone = this.modalPhone.value.trim();
                if (this.modalCaptain.checked) {
                    this.tokens.forEach((t) => { t.isCaptain = t.id === token.id; });
                } else {
                    token.isCaptain = false;
                }
            }
            this.closeModal();
            isOpponent ? this.renderOpponentTokens() : this.renderTokens();
            this.persist();
        }

        removeFromModal() {
            if (!this.editingToken) return;
            const { token, isOpponent } = this.editingToken;
            if (token.playerName) {
                if (isOpponent) this.opponentBenchPlayers.push({ id: uid(), name: token.playerName, number: token.playerNumber });
                else this.benchPlayers.push({ id: uid(), name: token.playerName, number: token.playerNumber });
            }
            token.playerName = null;
            token.playerNumber = null;
            token.isCaptain = false;
            this.closeModal();
            if (isOpponent) { this.renderOpponentBench(); this.renderOpponentTokens(); }
            else { this.renderBench(); this.renderTokens(); }
            this.persist();
        }

        autoNumber() {
            const order = { gk: 0, def: 1, mid: 2, att: 3 };
            const assigned = this.tokens.filter((t) => t.playerName);
            assigned.sort((a, b) => (order[a.role] - order[b.role]) || (a.x - b.x));
            assigned.forEach((t, i) => { t.playerNumber = String(i + 1); });
            this.renderTokens();
            this.persist();
            this.setStatus('Jersey numbers assigned 1-' + assigned.length + '.');
        }

        flipDirection() {
            this.tokens.forEach((t) => { t.y = 100 - t.y; });
            this.opponentTokens.forEach((t) => { t.y = 100 - t.y; });
            this.arrows.forEach((a) => { a.y1 = 100 - a.y1; a.y2 = 100 - a.y2; });
            this.renderTokens();
            this.renderOpponentTokens();
            this.renderArrows();
            this.persist();
        }

        matchMetaLine() {
            const meta = [];
            if (this.opponentNameInput.value.trim()) meta.push(`vs ${this.opponentNameInput.value.trim()}`);
            if (this.matchDateInput.value.trim()) meta.push(this.matchDateInput.value.trim());
            if (this.venueInput.value.trim()) meta.push(this.venueInput.value.trim());
            return meta.join(' | ');
        }

        buildPlayerMessage(token) {
            const lines = ['*BASCI Team News*'];
            const meta = this.matchMetaLine();
            if (meta) lines.push(meta);
            lines.push('');
            const nameLine = `*${token.playerName}*${token.playerNumber ? ` (#${token.playerNumber})` : ''} - ${token.slotLabel}${token.isCaptain ? ' (Captain)' : ''}`;
            lines.push(nameLine);
            lines.push('');
            lines.push('Your Duty:');
            lines.push(token.duty || 'No specific instructions - play your natural game!');
            return lines.join('\n');
        }

        buildTeamMessage() {
            const lines = [`*BASCI Starting XI*${this.currentPreset ? ` - ${this.currentPreset.name}` : ''}`];
            const meta = this.matchMetaLine();
            if (meta) lines.push(meta);
            lines.push('');

            const order = { gk: 0, def: 1, mid: 2, att: 3 };
            const assigned = this.tokens.filter((t) => t.playerName).slice()
                .sort((a, b) => (order[a.role] - order[b.role]) || (a.x - b.x));
            assigned.forEach((t) => {
                lines.push(`*${t.playerName}*${t.playerNumber ? ` (#${t.playerNumber})` : ''} - ${t.slotLabel}${t.isCaptain ? ' (C)' : ''}`);
                if (t.duty) lines.push(`  ${t.duty}`);
            });

            const tactics = [];
            if (this.attackNotes.value.trim()) tactics.push(`Attack: ${this.attackNotes.value.trim()}`);
            if (this.defendNotes.value.trim()) tactics.push(`Defend: ${this.defendNotes.value.trim()}`);
            if (this.midfieldNotes.value.trim()) tactics.push(`Midfield: ${this.midfieldNotes.value.trim()}`);
            if (tactics.length) {
                lines.push('');
                lines.push(...tactics);
            }
            return lines.join('\n');
        }

        openWhatsApp(phone, message) {
            const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
            const url = cleanPhone
                ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
                : `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank', 'noopener');
        }

        renderArrows(preview) {
            // Arrowheads are drawn as explicit polygons rather than an SVG <marker> -
            // html2canvas's SVG support does not reliably render markers/defs on export.
            const arrows = preview || this.arrows;
            const ARROW_COLOR = '#d4a012';
            const HEAD_LEN = 3.2;
            const HEAD_WIDTH = 2.2;

            this.arrowsSvg.innerHTML = arrows.map((a) => {
                const angle = Math.atan2(a.y2 - a.y1, a.x2 - a.x1);
                const backX = a.x2 - HEAD_LEN * Math.cos(angle);
                const backY = a.y2 - HEAD_LEN * Math.sin(angle);
                const leftX = backX + HEAD_WIDTH * Math.cos(angle + Math.PI / 2);
                const leftY = backY + HEAD_WIDTH * Math.sin(angle + Math.PI / 2);
                const rightX = backX + HEAD_WIDTH * Math.cos(angle - Math.PI / 2);
                const rightY = backY + HEAD_WIDTH * Math.sin(angle - Math.PI / 2);
                return `
                    <line x1="${a.x1}" y1="${a.y1}" x2="${backX}" y2="${backY}" stroke="${ARROW_COLOR}" stroke-width="1.4"></line>
                    <polygon points="${a.x2},${a.y2} ${leftX},${leftY} ${rightX},${rightY}" fill="${ARROW_COLOR}"></polygon>
                `;
            }).join('');
        }

        updateExportHeader() {
            this.exportTitle.textContent = this.titleInput.value || 'Team Lineup';
            const bits = [];
            if (this.opponentNameInput.value) bits.push(`vs ${this.opponentNameInput.value}`);
            if (this.matchDateInput.value) bits.push(this.matchDateInput.value);
            if (this.venueInput.value) bits.push(this.venueInput.value);
            this.exportMeta.textContent = bits.join(' • ');
        }

        updateExportTactics() {
            const rows = [
                { label: '⚔️ Attack', value: this.attackNotes.value.trim() },
                { label: '🛡️ Defend', value: this.defendNotes.value.trim() },
                { label: '⚙️ Midfield', value: this.midfieldNotes.value.trim() }
            ].filter((r) => r.value);
            this.exportTactics.innerHTML = rows.map((r) => `
                <div class="formation-export-frame__tactic"><strong>${r.label}:</strong> ${escapeHtml(r.value)}</div>
            `).join('');
        }

        getFullState() {
            return {
                format: this.currentFormat,
                presetId: this.currentPreset && this.currentPreset.id,
                tokens: this.tokens,
                bench: this.benchPlayers,
                arrows: this.arrows,
                style: this.styleSelect.value,
                title: this.titleInput.value,
                opponentName: this.opponentNameInput.value,
                matchDate: this.matchDateInput.value,
                venue: this.venueInput.value,
                opponentEnabled: this.opponentEnabled,
                opponentPresetId: this.opponentPresetSelect.value,
                opponentTokens: this.opponentTokens,
                opponentBench: this.opponentBenchPlayers,
                attackNotes: this.attackNotes.value,
                defendNotes: this.defendNotes.value,
                midfieldNotes: this.midfieldNotes.value
            };
        }

        applyFullState(state) {
            if (!state.format || !this.data.FORMATIONS[state.format]) return false;
            const presets = this.data.FORMATIONS[state.format];
            const preset = presets.find((p) => p.id === state.presetId) || presets[0];
            this.formatSelect.value = state.format;
            this.currentFormat = state.format;
            this.currentPreset = preset;
            this.presetGrid.innerHTML = presets.map((p) => `
                <button type="button" class="formation-preset-chip${p.id === preset.id ? ' is-selected' : ''}" data-preset-id="${p.id}">${p.name}</button>
            `).join('');
            this.opponentPresetSelect.innerHTML = presets.map((p) => `<option value="${p.id}">${p.name}</option>`).join('');

            this.tokens = Array.isArray(state.tokens) && state.tokens.length ? state.tokens : this.makeSlotTokens(preset);
            this.benchPlayers = state.bench || [];
            this.arrows = state.arrows || [];
            this.styleSelect.value = state.style || 'balanced';
            this.titleInput.value = state.title || '';
            this.opponentNameInput.value = state.opponentName || '';
            this.matchDateInput.value = state.matchDate || '';
            this.venueInput.value = state.venue || '';

            this.opponentEnabled = !!state.opponentEnabled;
            this.opponentToggle.checked = this.opponentEnabled;
            this.opponentControls.classList.toggle('is-visible', this.opponentEnabled);
            this.opponentBadge.textContent = this.opponentEnabled ? 'On' : 'Off';
            this.opponentBadge.classList.toggle('is-on', this.opponentEnabled);
            if (state.opponentPresetId) this.opponentPresetSelect.value = state.opponentPresetId;
            this.opponentTokens = state.opponentTokens || [];
            this.opponentBenchPlayers = state.opponentBench || [];

            this.attackNotes.value = state.attackNotes || '';
            this.defendNotes.value = state.defendNotes || '';
            this.midfieldNotes.value = state.midfieldNotes || '';

            this.renderTokens();
            this.renderOpponentTokens();
            this.renderBench();
            this.renderOpponentBench();
            this.renderArrows();
            this.updateExportHeader();
            this.updateExportTactics();
            return true;
        }

        persist() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.getFullState()));
            } catch (e) { /* ignore storage quota errors */ }
        }

        loadFromStorage() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (!raw) return false;
                const ok = this.applyFullState(JSON.parse(raw));
                if (ok) this.setStatus('Restored your last saved lineup.');
                return ok;
            } catch (e) {
                return false;
            }
        }

        getSavedList() {
            try {
                return JSON.parse(localStorage.getItem(SAVED_LIST_KEY) || '[]');
            } catch (e) {
                return [];
            }
        }

        setSavedList(list) {
            localStorage.setItem(SAVED_LIST_KEY, JSON.stringify(list));
        }

        refreshSavedList() {
            const list = this.getSavedList();
            this.savedSelect.innerHTML = '<option value="">Select...</option>' +
                list.map((l) => `<option value="${l.id}">${escapeHtml(l.name)}</option>`).join('');
            this.loadBtn.disabled = true;
            this.deleteSavedBtn.disabled = true;
        }

        saveAsNew() {
            const name = window.prompt('Name this lineup (e.g. "vs NCC - Home"):', this.titleInput.value || 'New Lineup');
            if (!name) return;
            const list = this.getSavedList();
            list.push({ id: uid(), name, savedAt: Date.now(), state: this.getFullState() });
            this.setSavedList(list);
            this.refreshSavedList();
            this.setStatus(`Saved as "${name}".`);
        }

        loadSaved(id) {
            if (!id) return;
            const entry = this.getSavedList().find((l) => l.id === id);
            if (!entry) return;
            this.applyFullState(entry.state);
            this.persist();
            this.setStatus(`Loaded "${entry.name}".`);
        }

        deleteSaved(id) {
            if (!id) return;
            const list = this.getSavedList().filter((l) => l.id !== id);
            this.setSavedList(list);
            this.refreshSavedList();
        }

        async exportImage(mode) {
            if (window.location.protocol === 'file:') {
                this.setStatus('Open this dashboard via a real web server or the published site (not by double-clicking the file) - browsers block image export on file:// pages for security.', true);
                return;
            }
            this.setStatus('Preparing image...');
            try {
                const html2canvas = await loadHtml2Canvas();
                const canvas = await html2canvas(this.exportFrame, { backgroundColor: '#0d3015', scale: 2, useCORS: true });
                canvas.toBlob(async (blob) => {
                    if (!blob) {
                        this.setStatus('Could not create the image.', true);
                        return;
                    }
                    const fileName = `basci-formation-${(this.currentFormat || 'lineup')}-${Date.now()}.png`;
                    const file = new File([blob], fileName, { type: 'image/png' });

                    if (mode === 'share' && navigator.canShare && navigator.canShare({ files: [file] })) {
                        try {
                            await navigator.share({ files: [file], title: 'BASCI Lineup', text: this.titleInput.value || 'BASCI team lineup' });
                            this.setStatus('Shared!');
                            return;
                        } catch (shareErr) {
                            if (shareErr.name === 'AbortError') { this.setStatus(''); return; }
                        }
                    }

                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    this.setStatus(mode === 'share' ? 'Sharing isn\'t supported on this browser - image downloaded instead. Attach it in WhatsApp manually.' : 'Downloaded!');
                }, 'image/png');
            } catch (err) {
                if (/tainted/i.test(err.message)) {
                    this.setStatus('Could not export: an image on the page loaded without cross-origin permission. Make sure logo.png is served from the same site (this works automatically on the published GitHub Pages site).', true);
                } else {
                    this.setStatus(err.message, true);
                }
            }
        }
    }

    document.addEventListener('basci:admin-unlocked', () => {
        if (!window.basciFormationBuilder) window.basciFormationBuilder = new FormationBuilder();
    }, { once: true });
})();
