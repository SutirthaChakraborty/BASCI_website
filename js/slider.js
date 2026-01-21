/**
 * ==========================================================================
 * BASCI Website - Slider/Carousel Component
 * ==========================================================================
 * 
 * A lightweight, touch-friendly slider/carousel component.
 * Supports autoplay, dots, arrows, and responsive breakpoints.
 */

'use strict';

class Slider {
    constructor(element, options = {}) {
        this.slider = typeof element === 'string' ? document.querySelector(element) : element;
        
        if (!this.slider) {
            console.warn('Slider: Element not found');
            return;
        }

        // Default options
        this.options = {
            slidesToShow: 1,
            slidesToScroll: 1,
            autoplay: false,
            autoplaySpeed: 5000,
            dots: true,
            arrows: true,
            infinite: true,
            speed: 300,
            pauseOnHover: true,
            touchEnabled: true,
            gap: 20,
            responsive: [],
            ...options
        };

        // State
        this.currentSlide = 0;
        this.isAnimating = false;
        this.autoplayTimer = null;
        this.touchStartX = 0;
        this.touchEndX = 0;

        // Elements
        this.track = this.slider.querySelector('.slider__track');
        this.slides = [...this.slider.querySelectorAll('.slider__slide')];
        this.totalSlides = this.slides.length;

        this.init();
    }

    init() {
        if (this.totalSlides === 0) return;

        this.setupSlider();
        this.createControls();
        this.bindEvents();
        this.updateResponsive();

        if (this.options.autoplay) {
            this.startAutoplay();
        }
    }

    setupSlider() {
        // Set initial positions
        this.updateSliderDimensions();
        this.goToSlide(0, false);
    }

    updateSliderDimensions() {
        const slidesToShow = this.getCurrentSlidesToShow();
        const gap = this.options.gap;
        const slideWidth = (this.slider.offsetWidth - (gap * (slidesToShow - 1))) / slidesToShow;

        this.slides.forEach((slide, index) => {
            slide.style.width = `${slideWidth}px`;
            slide.style.marginRight = index < this.totalSlides - 1 ? `${gap}px` : '0';
        });

        const totalWidth = (slideWidth + gap) * this.totalSlides - gap;
        this.track.style.width = `${totalWidth}px`;
    }

    createControls() {
        // Create arrows
        if (this.options.arrows) {
            this.createArrows();
        }

        // Create dots
        if (this.options.dots) {
            this.createDots();
        }
    }

    createArrows() {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'slider__arrow slider__arrow--prev';
        prevBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
        `;
        prevBtn.setAttribute('aria-label', 'Previous slide');

        const nextBtn = document.createElement('button');
        nextBtn.className = 'slider__arrow slider__arrow--next';
        nextBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
        `;
        nextBtn.setAttribute('aria-label', 'Next slide');

        this.slider.appendChild(prevBtn);
        this.slider.appendChild(nextBtn);

        this.prevBtn = prevBtn;
        this.nextBtn = nextBtn;
    }

    createDots() {
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'slider__dots';

        const slidesToShow = this.getCurrentSlidesToShow();
        const numDots = Math.ceil(this.totalSlides / slidesToShow);

        for (let i = 0; i < numDots; i++) {
            const dot = document.createElement('button');
            dot.className = 'slider__dot';
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.dataset.index = i;
            dotsContainer.appendChild(dot);
        }

        this.slider.appendChild(dotsContainer);
        this.dotsContainer = dotsContainer;
        this.dots = [...dotsContainer.querySelectorAll('.slider__dot')];
        this.updateDots();
    }

    bindEvents() {
        // Arrow clicks
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.prev());
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.next());
        }

        // Dot clicks
        if (this.dots) {
            this.dots.forEach(dot => {
                dot.addEventListener('click', () => {
                    const index = parseInt(dot.dataset.index);
                    this.goToSlide(index * this.options.slidesToScroll);
                });
            });
        }

        // Touch events
        if (this.options.touchEnabled) {
            this.slider.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
            this.slider.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
            this.slider.addEventListener('touchend', () => this.handleTouchEnd());
        }

        // Pause on hover
        if (this.options.pauseOnHover && this.options.autoplay) {
            this.slider.addEventListener('mouseenter', () => this.stopAutoplay());
            this.slider.addEventListener('mouseleave', () => this.startAutoplay());
        }

        // Resize
        window.addEventListener('resize', this.debounce(() => {
            this.updateResponsive();
            this.updateSliderDimensions();
            this.goToSlide(this.currentSlide, false);
        }, 200));
    }

    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
    }

    handleTouchMove(e) {
        this.touchEndX = e.touches[0].clientX;
    }

    handleTouchEnd() {
        const diff = this.touchStartX - this.touchEndX;
        const threshold = 50;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.next();
            } else {
                this.prev();
            }
        }

        this.touchStartX = 0;
        this.touchEndX = 0;
    }

    prev() {
        if (this.isAnimating) return;

        const slidesToScroll = this.options.slidesToScroll;
        let newIndex = this.currentSlide - slidesToScroll;

        if (newIndex < 0) {
            if (this.options.infinite) {
                newIndex = this.getMaxSlide();
            } else {
                return;
            }
        }

        this.goToSlide(newIndex);
    }

    next() {
        if (this.isAnimating) return;

        const slidesToScroll = this.options.slidesToScroll;
        let newIndex = this.currentSlide + slidesToScroll;

        if (newIndex > this.getMaxSlide()) {
            if (this.options.infinite) {
                newIndex = 0;
            } else {
                return;
            }
        }

        this.goToSlide(newIndex);
    }

    goToSlide(index, animate = true) {
        if (index < 0) index = 0;
        if (index > this.getMaxSlide()) index = this.getMaxSlide();

        this.isAnimating = animate;
        this.currentSlide = index;

        const slidesToShow = this.getCurrentSlidesToShow();
        const gap = this.options.gap;
        const slideWidth = (this.slider.offsetWidth - (gap * (slidesToShow - 1))) / slidesToShow;
        const offset = index * (slideWidth + gap);

        this.track.style.transition = animate ? `transform ${this.options.speed}ms ease` : 'none';
        this.track.style.transform = `translateX(-${offset}px)`;

        this.updateDots();
        this.updateArrows();

        if (animate) {
            setTimeout(() => {
                this.isAnimating = false;
            }, this.options.speed);
        }

        // Dispatch custom event
        this.slider.dispatchEvent(new CustomEvent('slideChange', {
            detail: { currentSlide: this.currentSlide }
        }));
    }

    getMaxSlide() {
        const slidesToShow = this.getCurrentSlidesToShow();
        return Math.max(0, this.totalSlides - slidesToShow);
    }

    getCurrentSlidesToShow() {
        let slidesToShow = this.options.slidesToShow;

        // Check responsive breakpoints
        const width = window.innerWidth;
        const breakpoints = [...this.options.responsive].sort((a, b) => b.breakpoint - a.breakpoint);

        for (const bp of breakpoints) {
            if (width <= bp.breakpoint) {
                slidesToShow = bp.settings.slidesToShow || slidesToShow;
            }
        }

        return slidesToShow;
    }

    updateDots() {
        if (!this.dots) return;

        const slidesToShow = this.getCurrentSlidesToShow();
        const activeDot = Math.floor(this.currentSlide / this.options.slidesToScroll);

        this.dots.forEach((dot, index) => {
            dot.classList.toggle('is-active', index === activeDot);
        });
    }

    updateArrows() {
        if (!this.options.infinite) {
            if (this.prevBtn) {
                this.prevBtn.disabled = this.currentSlide === 0;
            }
            if (this.nextBtn) {
                this.nextBtn.disabled = this.currentSlide >= this.getMaxSlide();
            }
        }
    }

    updateResponsive() {
        const slidesToShow = this.getCurrentSlidesToShow();
        
        // Recreate dots if needed
        if (this.dotsContainer) {
            this.dotsContainer.remove();
            this.createDots();
        }
    }

    startAutoplay() {
        if (this.autoplayTimer) return;

        this.autoplayTimer = setInterval(() => {
            this.next();
        }, this.options.autoplaySpeed);
    }

    stopAutoplay() {
        if (this.autoplayTimer) {
            clearInterval(this.autoplayTimer);
            this.autoplayTimer = null;
        }
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    destroy() {
        this.stopAutoplay();
        
        if (this.prevBtn) this.prevBtn.remove();
        if (this.nextBtn) this.nextBtn.remove();
        if (this.dotsContainer) this.dotsContainer.remove();

        this.slides.forEach(slide => {
            slide.style.width = '';
            slide.style.marginRight = '';
        });

        this.track.style.width = '';
        this.track.style.transform = '';
        this.track.style.transition = '';
    }
}

// Add slider CSS
const sliderStyles = document.createElement('style');
sliderStyles.textContent = `
    .slider {
        position: relative;
        overflow: hidden;
    }

    .slider__track {
        display: flex;
        will-change: transform;
    }

    .slider__slide {
        flex-shrink: 0;
    }

    .slider__arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 48px;
        height: 48px;
        background: var(--color-white, #fff);
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        z-index: 10;
        transition: all 0.3s ease;
    }

    .slider__arrow:hover {
        background: var(--color-primary, #1a5f2a);
        color: var(--color-white, #fff);
        transform: translateY(-50%) scale(1.1);
    }

    .slider__arrow:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .slider__arrow--prev {
        left: 10px;
    }

    .slider__arrow--next {
        right: 10px;
    }

    .slider__dots {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 24px;
    }

    .slider__dot {
        width: 12px;
        height: 12px;
        background: var(--color-gray-300, #ccc);
        border: none;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .slider__dot:hover,
    .slider__dot.is-active {
        background: var(--color-primary, #1a5f2a);
        transform: scale(1.2);
    }

    @media (max-width: 768px) {
        .slider__arrow {
            width: 40px;
            height: 40px;
        }
    }
`;
document.head.appendChild(sliderStyles);

// Auto-initialize sliders
document.addEventListener('DOMContentLoaded', () => {
    const sliders = document.querySelectorAll('[data-slider]');
    
    sliders.forEach(slider => {
        const options = slider.dataset.slider ? JSON.parse(slider.dataset.slider) : {};
        new Slider(slider, options);
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Slider;
}

window.Slider = Slider;
