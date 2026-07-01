/**
 * BASCI Admin - dashboard shell: tab switching + settings (Gemini API key/model) form.
 */
(function () {
    'use strict';

    class AdminApp {
        constructor() {
            this.tabButtons = Array.from(document.querySelectorAll('.admin-tabs__btn'));
            this.panels = Array.from(document.querySelectorAll('.admin-tab-panel'));
            this.apiKeyInput = document.getElementById('settingsApiKeyInput');
            this.textModelInput = document.getElementById('settingsTextModelInput');
            this.imageModelInput = document.getElementById('settingsImageModelInput');
            this.showKeyBtn = document.getElementById('settingsShowKeyBtn');
            this.saveBtn = document.getElementById('settingsSaveBtn');
            this.status = document.getElementById('settingsStatus');
            this.init();
        }

        init() {
            this.tabButtons.forEach((btn) => {
                btn.addEventListener('click', () => this.selectTab(btn.dataset.tab));
            });

            const settings = window.BASCIGemini.getSettings();
            if (this.apiKeyInput) this.apiKeyInput.value = settings.apiKey || '';
            if (this.textModelInput) this.textModelInput.value = settings.textModel;
            if (this.imageModelInput) this.imageModelInput.value = settings.imageModel;

            if (this.showKeyBtn) {
                this.showKeyBtn.addEventListener('click', () => {
                    const isPassword = this.apiKeyInput.type === 'password';
                    this.apiKeyInput.type = isPassword ? 'text' : 'password';
                    this.showKeyBtn.textContent = isPassword ? 'Hide' : 'Show';
                });
            }

            if (this.saveBtn) {
                this.saveBtn.addEventListener('click', () => {
                    window.BASCIGemini.saveSettings({
                        apiKey: this.apiKeyInput.value.trim(),
                        textModel: this.textModelInput.value.trim() || 'gemini-2.5-flash',
                        imageModel: this.imageModelInput.value.trim() || 'gemini-2.5-flash-image'
                    });
                    if (this.status) {
                        this.status.textContent = 'Saved to this browser only.';
                        this.status.classList.add('is-visible');
                        setTimeout(() => this.status.classList.remove('is-visible'), 2500);
                    }
                });
            }
        }

        selectTab(tab) {
            this.tabButtons.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.tab === tab));
            this.panels.forEach((panel) => panel.classList.toggle('is-active', panel.dataset.tabPanel === tab));
        }
    }

    document.addEventListener('basci:admin-unlocked', () => {
        window.basciAdminApp = new AdminApp();
    }, { once: true });
})();
