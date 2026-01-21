/**
 * ==========================================================================
 * BASCI Website - Main JavaScript
 * ==========================================================================
 *
 * Core functionality for the BASCI sports club website.
 * Includes: Navigation, Scroll Animations, Mobile Menu, and utilities.
 */

'use strict';

// ==========================================================================
// CONFIGURATION
// ==========================================================================

const CONFIG = {
    scrollThreshold: 100,
    animationThreshold: 0.15,
    counterDuration: 2000,
    debounceDelay: 100,
};

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================

/**
 * Debounce function to limit rate of function calls
 */
function debounce(func, wait = CONFIG.debounceDelay) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function for scroll events
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Query selector shortcuts
 */
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

// ==========================================================================
// HEADER & NAVIGATION
// ==========================================================================

class Navigation {
    constructor() {
        this.header = $('.header');
        this.toggle = $('.nav__toggle');
        this.menu = $('.nav__menu');
        this.links = $$('.nav__link');
        this.isOpen = false;

        this.init();
    }

    init() {
        if (!this.header) return;

        // Handle scroll
        this.handleScroll();
        window.addEventListener('scroll', throttle(() => this.handleScroll(), 100));

        // Mobile menu toggle
        if (this.toggle) {
            this.toggle.addEventListener('click', () => this.toggleMenu());
        }

        // Close menu on link click
        this.links.forEach(link => {
            link.addEventListener('click', () => {
                if (this.isOpen) this.closeMenu();
            });
        });

        // Close menu on outside click
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.menu.contains(e.target) && !this.toggle.contains(e.target)) {
                this.closeMenu();
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
            }
        });

        // Handle resize
        window.addEventListener('resize', debounce(() => {
            if (window.innerWidth > 1023 && this.isOpen) {
                this.closeMenu();
            }
        }));

        // Set active link
        this.setActiveLink();
    }

    handleScroll() {
        const scrolled = window.scrollY > CONFIG.scrollThreshold;
        this.header.classList.toggle('header--scrolled', scrolled);
    }

    toggleMenu() {
        this.isOpen ? this.closeMenu() : this.openMenu();
    }

    openMenu() {
        this.isOpen = true;
        this.toggle.classList.add('nav__toggle--active');
        this.menu.classList.add('nav__menu--open');
        document.body.style.overflow = 'hidden';
        this.toggle.setAttribute('aria-expanded', 'true');
    }

    closeMenu() {
        this.isOpen = false;
        this.toggle.classList.remove('nav__toggle--active');
        this.menu.classList.remove('nav__menu--open');
        document.body.style.overflow = '';
        this.toggle.setAttribute('aria-expanded', 'false');
    }

    setActiveLink() {
        const currentPath = window.location.pathname;
        this.links.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath || (href === 'index.html' && currentPath === '/')) {
                link.classList.add('nav__link--active');
            }
        });
    }
}

// ==========================================================================
// SCROLL ANIMATIONS (Intersection Observer)
// ==========================================================================

class ScrollAnimations {
    constructor() {
        this.animatedElements = $$('[data-animate]');

        if ('IntersectionObserver' in window) {
            this.init();
        } else {
            // Fallback: show all elements
            this.animatedElements.forEach(el => el.classList.add('is-visible'));
        }
    }

    init() {
        const options = {
            root: null,
            rootMargin: '0px 0px -50px 0px',
            threshold: CONFIG.animationThreshold
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // Optionally stop observing after animation
                    // this.observer.unobserve(entry.target);
                }
            });
        }, options);

        this.animatedElements.forEach(el => this.observer.observe(el));
    }
}

// ==========================================================================
// SMOOTH SCROLL
// ==========================================================================

class SmoothScroll {
    constructor() {
        this.links = $$('a[href^="#"]');
        this.init();
    }

    init() {
        this.links.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === '#') return;

                const target = $(href);
                if (target) {
                    e.preventDefault();
                    this.scrollTo(target);
                }
            });
        });
    }

    scrollTo(target) {
        const headerHeight = $('.header')?.offsetHeight || 0;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// ==========================================================================
// COUNTER ANIMATION (For Statistics)
// ==========================================================================

class CounterAnimation {
    constructor() {
        this.counters = $$('[data-counter]');

        if (this.counters.length && 'IntersectionObserver' in window) {
            this.init();
        }
    }

    init() {
        const options = {
            threshold: 0.5
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        this.counters.forEach(counter => observer.observe(counter));
    }

    animateCounter(element) {
        const target = parseInt(element.getAttribute('data-counter'));
        const duration = CONFIG.counterDuration;
        const startTime = performance.now();

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out-quart)
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(easeProgress * target);

            element.textContent = currentValue.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target.toLocaleString();
            }
        };

        requestAnimationFrame(updateCounter);
    }
}

// ==========================================================================
// VIDEO PLAYER
// ==========================================================================

class VideoPlayer {
    constructor() {
        this.playButtons = $$('[data-video-play]');
        this.init();
    }

    init() {
        this.playButtons.forEach(button => {
            button.addEventListener('click', () => {
                const videoId = button.getAttribute('data-video-play');
                const video = $(`#${videoId}`);

                if (video) {
                    if (video.paused) {
                        video.play();
                        button.classList.add('is-playing');
                    } else {
                        video.pause();
                        button.classList.remove('is-playing');
                    }
                }
            });
        });
    }
}

// ==========================================================================
// HERO VIDEO BACKGROUND
// ==========================================================================

class HeroVideo {
    constructor() {
        this.video = $('.hero__video');
        this.init();
    }

    init() {
        if (!this.video) return;

        // Pause video when not visible (performance)
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.video.play().catch(() => {});
                } else {
                    this.video.pause();
                }
            });
        }, { threshold: 0.25 });

        observer.observe(this.video);

        // Mute video by default (for autoplay)
        this.video.muted = true;
    }
}

// ==========================================================================
// PARALLAX EFFECT (Simple)
// ==========================================================================

class Parallax {
    constructor() {
        this.elements = $$('[data-parallax]');

        if (this.elements.length) {
            this.init();
        }
    }

    init() {
        window.addEventListener('scroll', throttle(() => this.update(), 16));
    }

    update() {
        const scrollY = window.pageYOffset;

        this.elements.forEach(element => {
            const speed = parseFloat(element.getAttribute('data-parallax')) || 0.5;
            const offset = scrollY * speed;
            element.style.transform = `translateY(${offset}px)`;
        });
    }
}

// ==========================================================================
// BACK TO TOP BUTTON
// ==========================================================================

class BackToTop {
    constructor() {
        this.button = $('.back-to-top');

        if (this.button) {
            this.init();
        }
    }

    init() {
        // Show/hide button based on scroll
        window.addEventListener('scroll', throttle(() => {
            const scrolled = window.scrollY > 500;
            this.button.classList.toggle('is-visible', scrolled);
        }, 100));

        // Scroll to top on click
        this.button.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// ==========================================================================
// FORM VALIDATION
// ==========================================================================

class FormValidation {
    constructor() {
        this.forms = $$('form[data-validate]');
        this.init();
    }

    init() {
        this.forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            });

            // Real-time validation
            const inputs = $$('input, textarea', form);
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.clearError(input));
            });
        });
    }

    validateForm(form) {
        const inputs = $$('input[required], textarea[required]', form);
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(input) {
        const value = input.value.trim();
        const type = input.type;
        let isValid = true;
        let errorMessage = '';

        // Required check
        if (input.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }
        // Email validation
        else if (type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }
        // Phone validation
        else if (type === 'tel' && value) {
            const phoneRegex = /^[\d\s+\-()]+$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
        }

        if (!isValid) {
            this.showError(input, errorMessage);
        } else {
            this.clearError(input);
        }

        return isValid;
    }

    showError(input, message) {
        input.classList.add('is-invalid');

        let errorEl = input.parentElement.querySelector('.form-error');
        if (!errorEl) {
            errorEl = document.createElement('span');
            errorEl.className = 'form-error';
            input.parentElement.appendChild(errorEl);
        }
        errorEl.textContent = message;
    }

    clearError(input) {
        input.classList.remove('is-invalid');
        const errorEl = input.parentElement.querySelector('.form-error');
        if (errorEl) {
            errorEl.remove();
        }
    }
}

// ==========================================================================
// PAGE LOADER
// ==========================================================================

class PageLoader {
    constructor() {
        this.loader = $('.page-loader');

        if (this.loader) {
            this.init();
        }
    }

    init() {
        // Hide loader when page is fully loaded
        window.addEventListener('load', () => {
            this.hideLoader();
        });

        // Fallback: Hide loader after 3 seconds even if not fully loaded
        // This prevents the loader from being stuck if large videos are still loading
        setTimeout(() => {
            this.hideLoader();
        }, 3000);
    }

    hideLoader() {
        if (this.loader && !this.loader.classList.contains('is-hidden')) {
            this.loader.classList.add('is-hidden');
            document.body.classList.add('is-loaded');
        }
    }
}

// ==========================================================================
// LAZY LOADING IMAGES
// ==========================================================================

class LazyLoad {
    constructor() {
        this.images = $$('img[data-src]');

        if (this.images.length && 'IntersectionObserver' in window) {
            this.init();
        } else {
            // Fallback: load all images
            this.images.forEach(img => this.loadImage(img));
        }
    }

    init() {
        const options = {
            rootMargin: '50px 0px',
            threshold: 0.01
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        this.images.forEach(img => observer.observe(img));
    }

    loadImage(img) {
        const src = img.getAttribute('data-src');
        if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            img.classList.add('is-loaded');
        }
    }
}

// ==========================================================================
// FLOATING SOCIAL BUTTONS
// ==========================================================================

class SocialFloatingButtons {
    constructor() {
        this.facebookUrl = 'https://www.facebook.com/people/Basci-Sport/61572576583991/';
        this.instagramUrl = 'https://www.instagram.com/basci012025/';

        this.init();
    }

    init() {
        if (document.querySelector('.social-float')) return;

        const container = document.createElement('div');
        container.className = 'social-float social-links';

        const facebookLink = document.createElement('a');
        facebookLink.className = 'social-link social-link--facebook';
        facebookLink.href = this.facebookUrl;
        facebookLink.target = '_blank';
        facebookLink.rel = 'noopener noreferrer';
        facebookLink.setAttribute('aria-label', 'Visit BASCI on Facebook');
        facebookLink.title = 'Facebook';
        facebookLink.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
                <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/>
            </svg>
        `;

        const instagramLink = document.createElement('a');
        instagramLink.className = 'social-link social-link--instagram';
        instagramLink.href = this.instagramUrl;
        instagramLink.target = '_blank';
        instagramLink.rel = 'noopener noreferrer';
        instagramLink.setAttribute('aria-label', 'Visit BASCI on Instagram');
        instagramLink.title = 'Instagram';
        instagramLink.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" ry="5"></rect>
                <circle cx="12" cy="12" r="4"></circle>
                <circle cx="17.5" cy="6.5" r="1"></circle>
            </svg>
        `;

        container.appendChild(facebookLink);
        container.appendChild(instagramLink);
        document.body.appendChild(container);
    }
}

// ==========================================================================
// BACKGROUND AUDIO (SITEWIDE)
// ==========================================================================

class BackgroundAudio {
    constructor() {
        this.storageKey = 'basci_bg_audio_v1';
        this.audioId = 'basciBackgroundAudio';
        this.audio = null;
        this.saveTimer = null;
        this.init();
    }

    getAudioSrc() {
        const cssLink = document.querySelector('link[rel="stylesheet"][href*="css/main.css"]');
        const cssHref = cssLink?.getAttribute('href') || '';
        const prefix = cssHref.startsWith('../') ? '../' : '';
        return `${prefix}assets/audio/Baskey%20Anthem.mp3`;
    }

    getState() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    setState(partial) {
        const current = this.getState();
        const next = { ...current, ...partial, updatedAt: Date.now() };
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(next));
        } catch {
            // ignore storage failures (private mode, quota, etc.)
        }
        return next;
    }

    async tryPlay() {
        if (!this.audio) return false;
        try {
            await this.audio.play();
            this.setState({ playing: true });
            return true;
        } catch {
            this.setState({ playing: false });
            return false;
        }
    }

    scheduleSaves() {
        if (!this.audio) return;

        const saveNow = () => {
            if (!this.audio) return;
            this.setState({
                muted: this.audio.muted,
                volume: this.audio.volume,
                currentTime: Number.isFinite(this.audio.currentTime) ? this.audio.currentTime : 0,
                playing: !this.audio.paused,
            });
        };

        // Save periodically while playing
        this.saveTimer = window.setInterval(saveNow, 1000);

        // Save when the page is being hidden/unloaded
        window.addEventListener('pagehide', saveNow);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') saveNow();
        });
    }

    init() {
        if (document.getElementById(this.audioId)) {
            this.audio = document.getElementById(this.audioId);
            return;
        }

        const state = this.getState();

        const audio = document.createElement('audio');
        audio.id = this.audioId;
        audio.src = this.getAudioSrc();
        audio.preload = 'auto';
        audio.loop = true;
        audio.playsInline = true;
        audio.setAttribute('playsinline', '');

        // Restore user preferences
        audio.muted = Boolean(state.muted);
        if (typeof state.volume === 'number' && state.volume >= 0 && state.volume <= 1) {
            audio.volume = state.volume;
        }

        // Restore playback position when metadata is ready
        audio.addEventListener('loadedmetadata', () => {
            if (typeof state.currentTime === 'number' && state.currentTime > 0 && state.currentTime < audio.duration) {
                try {
                    audio.currentTime = state.currentTime;
                } catch {
                    // ignore
                }
            }
        }, { once: true });

        document.body.appendChild(audio);
        this.audio = audio;
        window.__BASCI_BG_AUDIO__ = this;

        this.scheduleSaves();

        // Try to autoplay. If blocked, retry muted (muted autoplay is often allowed).
        (async () => {
            const played = await this.tryPlay();
            if (played) return;

            if (!audio.muted) {
                audio.muted = true;
                this.setState({ muted: true });
                await this.tryPlay();
            }
        })();
    }

    toggleMute() {
        if (!this.audio) return;

        this.audio.muted = !this.audio.muted;
        this.setState({ muted: this.audio.muted });
    }

    async ensurePlayingFromUserGesture() {
        if (!this.audio) return;
        if (!this.audio.paused) return;
        await this.tryPlay();
    }
}

class BackgroundAudioToggle {
    constructor() {
        this.button = null;
        this.init();
    }

    getIcon(isMuted) {
        if (isMuted) {
            return `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <path d="M23 9l-6 6" />
                    <path d="M17 9l6 6" />
                </svg>
            `;
        }

        return `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
        `;
    }

    sync() {
        const controller = window.__BASCI_BG_AUDIO__;
        const audio = controller?.audio;
        if (!this.button || !audio) return;

        const isMuted = audio.muted;
        this.button.innerHTML = this.getIcon(isMuted);
        this.button.setAttribute('aria-label', isMuted ? 'Unmute background music' : 'Mute background music');
        this.button.title = isMuted ? 'Unmute' : 'Mute';
    }

    init() {
        if (document.querySelector('.audio-float')) return;

        const container = document.createElement('div');
        container.className = 'audio-float';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'social-link audio-toggle';
        btn.setAttribute('aria-label', 'Mute background music');
        btn.title = 'Mute';

        btn.addEventListener('click', async () => {
            const controller = window.__BASCI_BG_AUDIO__;
            if (!controller) return;

            controller.toggleMute();
            await controller.ensurePlayingFromUserGesture();
            this.sync();
        });

        container.appendChild(btn);
        document.body.appendChild(container);
        this.button = btn;

        // Sync now and whenever audio state changes
        const controller = window.__BASCI_BG_AUDIO__;
        if (controller?.audio) {
            controller.audio.addEventListener('volumechange', () => this.sync());
            controller.audio.addEventListener('play', () => this.sync());
            controller.audio.addEventListener('pause', () => this.sync());
        }

        this.sync();
    }
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Core functionality
    new Navigation();
    new SmoothScroll();
    new ScrollAnimations();

    // Enhanced features
    new CounterAnimation();
    new VideoPlayer();
    new HeroVideo();
    new BackToTop();
    new FormValidation();
    new PageLoader();
    new LazyLoad();
    new Parallax();
    new SocialFloatingButtons();
    new BackgroundAudio();
    new BackgroundAudioToggle();

    console.log('🏆 BASCI Website initialized successfully!');
});

// ==========================================================================
// EXPORTS (For module usage - commented out for regular script usage)
// ==========================================================================

// Uncomment below if using as ES module:
// export {
//     Navigation,
//     ScrollAnimations,
//     SmoothScroll,
//     CounterAnimation,
//     VideoPlayer,
//     HeroVideo,
//     Parallax,
//     BackToTop,
//     FormValidation,
//     PageLoader,
//     LazyLoad
// };
