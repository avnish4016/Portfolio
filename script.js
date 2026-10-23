// Mobile menu toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
        hamburger.setAttribute('aria-expanded', String(!isOpen));
        hamburger.setAttribute('aria-label', isOpen ? 'Open navigation menu' : 'Close navigation menu');
        navLinks.classList.toggle('is-open', !isOpen);
    });

    const closeMenu = () => {
        navLinks.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Open navigation menu');
    };

    navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeMenu();
    });
}

// Prepare a message in the visitor's email app; the site has no form backend.
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', event => {
        event.preventDefault();
        const formData = new FormData(contactForm);
        const name = formData.get('name').trim();
        const email = formData.get('email').trim();
        const subject = formData.get('subject').trim();
        const message = formData.get('message').trim();
        const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
        const mailto = `mailto:rana.avnish.1234@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailto;
    });
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background change on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(26, 26, 26, 0.98)';
    } else {
        navbar.style.background = 'rgba(26, 26, 26, 0.95)';
    }
});

// Progressive enhancement: content stays visible if animation APIs are unavailable.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const runningAnimations = new Set();
const revealTargets = document.querySelectorAll(
    'section:not(.hero) h2, .section-subtitle, .portfolio-item, .service-card, .about-text > p, .about-image, .skills, .info-item, .contact-form'
);

if ('IntersectionObserver' in window && typeof Element.prototype.animate === 'function') {
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            revealObserver.unobserve(entry.target);
            if (motionPreference.matches) return;

            const isCard = entry.target.matches('.portfolio-item, .service-card');
            const siblings = isCard ? Array.from(entry.target.parentElement.children) : [];
            const delay = isCard ? (siblings.indexOf(entry.target) % 3) * 90 : 0;
            const animation = entry.target.animate([
                { opacity: 0, transform: 'translateY(24px)' },
                { opacity: 1, transform: 'translateY(0)' }
            ], {
                duration: 650,
                delay,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                fill: 'backwards'
            });
            runningAnimations.add(animation);
            animation.onfinish = animation.oncancel = () => runningAnimations.delete(animation);

            if (entry.target.matches('.skills')) {
                entry.target.querySelectorAll('.skill-progress').forEach(bar => {
                    const fill = bar.animate([
                        { transform: 'scaleX(0)' },
                        { transform: 'scaleX(1)' }
                    ], { duration: 900, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
                    runningAnimations.add(fill);
                    fill.onfinish = fill.oncancel = () => runningAnimations.delete(fill);
                });
            }
        });
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });

    revealTargets.forEach(target => revealObserver.observe(target));
    // Keyboard navigation should never land inside an ongoing reveal.
    document.addEventListener('focusin', () => {
        runningAnimations.forEach(animation => animation.finish());
    });
    motionPreference.addEventListener('change', event => {
        if (event.matches) runningAnimations.forEach(animation => animation.finish());
    });
}
