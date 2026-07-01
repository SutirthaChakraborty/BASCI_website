/**
 * BASCI Admin - simple client-side password gate.
 * NOTE: this is a casual deterrent, not real security - the site is 100%
 * static with no backend, so the password check happens in the browser and
 * is visible to anyone who reads the source. Do not put sensitive data
 * behind this gate; it only keeps casual visitors off the admin tools.
 */
(function () {
    'use strict';

    const PASSWORD = 'david';
    const SESSION_KEY = 'basci_admin_authed';

    class AdminAuth {
        constructor() {
            this.loginScreen = document.getElementById('adminLoginScreen');
            this.dashboard = document.getElementById('adminDashboard');
            this.form = document.getElementById('adminLoginForm');
            this.input = document.getElementById('adminPasswordInput');
            this.error = document.getElementById('adminLoginError');
            this.logoutBtn = document.getElementById('adminLogoutBtn');
            this.init();
        }

        init() {
            if (sessionStorage.getItem(SESSION_KEY) === 'true') {
                this.unlock();
            }

            if (this.form) {
                this.form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.tryLogin();
                });
            }

            if (this.logoutBtn) {
                this.logoutBtn.addEventListener('click', () => {
                    sessionStorage.removeItem(SESSION_KEY);
                    window.location.reload();
                });
            }
        }

        tryLogin() {
            const value = (this.input && this.input.value || '').trim();
            if (value === PASSWORD) {
                sessionStorage.setItem(SESSION_KEY, 'true');
                this.unlock();
            } else {
                if (this.error) {
                    this.error.textContent = 'Incorrect password. Try again.';
                    this.error.classList.add('is-visible');
                }
                if (this.input) {
                    this.input.value = '';
                    this.input.focus();
                    this.input.classList.add('shake');
                    setTimeout(() => this.input.classList.remove('shake'), 400);
                }
            }
        }

        unlock() {
            if (this.loginScreen) this.loginScreen.classList.add('is-hidden');
            if (this.dashboard) this.dashboard.classList.add('is-visible');
            document.dispatchEvent(new CustomEvent('basci:admin-unlocked'));
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        window.basciAdminAuth = new AdminAuth();
    });
})();
