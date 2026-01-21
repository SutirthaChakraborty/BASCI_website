# BASCI - Bengal Amateur Sports Club of Ireland

A modern, responsive website for the Bengal Amateur Sports Club of Ireland (BASCI), featuring soccer-themed design with smooth animations, video sections, and mobile-first responsive layout.

![BASCI Logo](assets/images/logo.png)

## 🌟 Features

- **Modern Design**: Clean, professional look with soccer-themed aesthetics
- **Fully Responsive**: Mobile-first approach with breakpoints at 640px, 768px, 1024px, and 1280px
- **Smooth Animations**: CSS animations with IntersectionObserver for scroll-triggered effects
- **Video Backgrounds**: Hero sections with looping video backgrounds
- **Interactive Components**: Sliders, modals, FAQ accordions, and form validation
- **Optimized Performance**: Lazy loading, efficient animations, and minimal dependencies

## 📁 Project Structure

```
lottery/
├── index.html                 # Homepage
├── README.md                  # Documentation
├── assets/
│   ├── images/
│   │   ├── logo.png          # Club logo
│   │   ├── Indrajit-president.png
│   │   ├── Joy General Secretary.png
│   │   ├── Malay-chairman.png
│   │   └── Niladri Treasurer.png
│   └── videos/
│       ├── 12500592_3840_2160_30fps.mp4
│       ├── 5363620_Soccer_Sports_3840x2160.mp4
│       ├── 3252906_Field_Football_1280x720.mp4
│       ├── 5548215_Soccer Field_Football Field_1920x1080.mp4
│       └── 4682579_Soccer_Sports_1920x1080.mp4
├── css/
│   ├── main.css              # Master stylesheet (imports all others)
│   ├── variables.css         # CSS custom properties (colors, fonts, spacing)
│   ├── base.css              # CSS reset and typography
│   ├── components.css        # Reusable components (buttons, cards, etc.)
│   ├── layout.css            # Header, footer, grid systems
│   └── animations.css        # Keyframe animations and transitions
├── js/
│   ├── main.js               # Core JavaScript modules
│   └── slider.js             # Carousel/slider component
├── pages/
│   ├── about.html            # About page
│   ├── team.html             # Team members page
│   ├── events.html           # Events and tournaments
│   ├── gallery.html          # Photo and video gallery
│   └── contact.html          # Contact form and info
├── components/               # Reusable HTML components (future use)
└── old-website-content/      # Original content for reference
```

## 🎨 Design System

### Colors

| Name | Value | Usage |
|------|-------|-------|
| Primary (Green) | `#1a5f2a` | Main brand color, headers, buttons |
| Primary Dark | `#0d3015` | Hover states, gradients |
| Primary Light | `#2d8f42` | Accents, highlights |
| Secondary (Gold) | `#d4a012` | Badges, accents, CTAs |
| Accent (Red) | `#e74c3c` | Alerts, important elements |
| Success | `#27ae60` | Success messages |

### Typography

- **Headings**: Oswald (bold, condensed)
- **Body**: Poppins (clean, readable)
- **Accent**: Montserrat (modern, versatile)

### Breakpoints

```css
--breakpoint-sm: 640px;   /* Small phones */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Laptops */
--breakpoint-xl: 1280px;  /* Desktops */
```

## 🚀 Getting Started

### Prerequisites

No build tools required! This is a pure HTML/CSS/JavaScript project.

### Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/lottery.git
   cd lottery
   ```

2. Open in a browser:
   - Simply open `index.html` in your browser
   - Or use a local server for best results:
   
   **Using Python:**
   ```bash
   python -m http.server 8000
   ```
   
   **Using Node.js:**
   ```bash
   npx serve
   ```
   
   **Using VS Code:**
   - Install "Live Server" extension
   - Right-click `index.html` → "Open with Live Server"

3. Navigate to `http://localhost:8000` (or the port shown)

## 📝 Adding New Pages

### Step 1: Create the HTML file

Create a new file in the `pages/` directory:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Your page description">
    <title>Page Title - BASCI</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Oswald:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- CSS -->
    <link rel="stylesheet" href="../css/main.css">
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="../assets/images/logo.png">
</head>
<body>
    <!-- Page Loader -->
    <div class="page-loader" id="pageLoader">
        <div class="loader-content">
            <div class="loader-spinner"></div>
            <p>Loading BASCI...</p>
        </div>
    </div>

    <!-- Header (copy from existing page) -->
    
    <!-- Page Header -->
    <section class="page-header">
        <div class="page-header-bg">
            <video autoplay muted loop playsinline>
                <source src="../assets/videos/your-video.mp4" type="video/mp4">
            </video>
            <div class="page-header-overlay"></div>
        </div>
        <div class="container">
            <div class="page-header-content" data-animate="fade-up">
                <span class="page-badge">Badge Text</span>
                <h1>Page Title</h1>
                <p>Page description goes here.</p>
            </div>
        </div>
    </section>

    <!-- Your Content Here -->

    <!-- Footer (copy from existing page) -->

    <!-- JavaScript -->
    <script src="../js/main.js"></script>
</body>
</html>
```

### Step 2: Add navigation link

Update the navigation in all pages to include your new page:

```html
<li><a href="your-page.html" class="nav-link">Your Page</a></li>
```

## 🧩 Using Components

### Buttons

```html
<!-- Primary Button -->
<a href="#" class="btn btn-primary">Button Text</a>

<!-- Secondary Button -->
<a href="#" class="btn btn-secondary">Button Text</a>

<!-- Outline Button -->
<a href="#" class="btn btn-outline">Button Text</a>

<!-- Large Button -->
<a href="#" class="btn btn-primary btn-lg">Large Button</a>
```

### Cards

```html
<!-- Team Card -->
<div class="team-card">
    <div class="team-card-image">
        <img src="path/to/image.jpg" alt="Name">
    </div>
    <div class="team-card-content">
        <h3>Member Name</h3>
        <span class="position">Position</span>
    </div>
</div>

<!-- Event Card -->
<div class="event-card">
    <div class="event-date">
        <span class="day">15</span>
        <span class="month">Aug</span>
    </div>
    <div class="event-content">
        <h3>Event Title</h3>
        <p>Event description</p>
    </div>
</div>
```

### Scroll Animations

Add the `data-animate` attribute to any element:

```html
<!-- Fade up animation -->
<div data-animate="fade-up">Content</div>

<!-- Fade with delay -->
<div data-animate="fade-up" data-delay="200">Content</div>

<!-- Available animations -->
<!-- fade-up, fade-down, fade-left, fade-right, zoom-in, zoom-out -->
```

### Section Headers

```html
<div class="section-header text-center" data-animate="fade-up">
    <span class="section-badge">Badge Text</span>
    <h2 class="section-title">Section Title</h2>
    <p class="section-subtitle">Optional subtitle text here.</p>
</div>
```

## ⚡ JavaScript Modules

The site uses ES6 class-based modules for functionality:

| Module | Purpose |
|--------|---------|
| `Navigation` | Mobile menu, scroll effects |
| `ScrollAnimations` | IntersectionObserver-based animations |
| `SmoothScroll` | Smooth anchor link scrolling |
| `CounterAnimation` | Animated number counters |
| `VideoPlayer` | Video modal player |
| `HeroVideo` | Hero section video handling |
| `Parallax` | Subtle parallax effects |
| `BackToTop` | Scroll-to-top button |
| `FormValidation` | Form input validation |
| `PageLoader` | Page loading animation |
| `LazyLoad` | Image lazy loading |
| `Slider` | Carousel/slider (separate file) |

## 📱 Responsive Design

The site is built mobile-first with these breakpoints:

- **Mobile**: 0-639px (base styles)
- **Tablet**: 640px-767px
- **Small Laptop**: 768px-1023px
- **Desktop**: 1024px-1279px
- **Large Desktop**: 1280px+

## 🔧 Customization

### Changing Colors

Edit `css/variables.css`:

```css
:root {
    --color-primary: #1a5f2a;      /* Change main color */
    --color-secondary: #d4a012;    /* Change accent color */
    --color-accent: #e74c3c;       /* Change highlight color */
}
```

### Changing Fonts

1. Update Google Fonts link in HTML `<head>`
2. Update font families in `css/variables.css`:

```css
:root {
    --font-heading: 'Your Font', sans-serif;
    --font-body: 'Your Font', sans-serif;
}
```

### Adding New Animations

Add to `css/animations.css`:

```css
@keyframes your-animation {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

[data-animate="your-animation"].animate {
    animation: your-animation 0.6s ease-out forwards;
}
```

## 📞 Contact Information

- **Email**: bengalsportsireland@gmail.com
- **Phone**: +353-087-9912745
- **Facebook**: [BASCI Dublin](https://www.facebook.com/groups/BASCI.Dublin/)
- **YouTube**: [Bengal Sports Ireland](https://www.youtube.com/@bengalsportsireland)

## 📄 License

This project is created for the Bengal Amateur Sports Club of Ireland. All rights reserved.

---

Built with ❤️ for the Bengali community in Ireland
