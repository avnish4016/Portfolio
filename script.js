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

    document.addEventListener('click', event => {
        if (!event.target.closest('.navbar')) closeMenu();
    });
    window.matchMedia('(min-width: 1101px)').addEventListener('change', closeMenu);
    navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && navLinks.classList.contains('is-open')) {
            closeMenu(); hamburger.focus();
        }
    });
}

// Validate, then let the browser submit to the enquiry email service.
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('input', event => event.target.setCustomValidity?.(''));
    contactForm.addEventListener('submit', event => {
        for (const field of contactForm.querySelectorAll('[required]')) {
            field.setCustomValidity(field.value.trim() ? '' : 'Please fill in this field.');
        }
        if (!contactForm.reportValidity()) event.preventDefault();
    });
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        if (this.hasAttribute('data-work-gallery') && typeof document.getElementById('work-gallery')?.showModal === 'function') return;
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

// Populate the popup from the portfolio so thumbnails and titles have one source.
const workGallery = document.getElementById('work-gallery');
const workTrigger = document.querySelector('[data-work-gallery]');
if (workGallery && workTrigger && typeof workGallery.showModal === 'function') {
    const track = workGallery.querySelector('.gallery-track');
    const count = workGallery.querySelector('.gallery-count');
    const previous = workGallery.querySelector('.gallery-prev');
    const next = workGallery.querySelector('.gallery-next');
    const player = workGallery.querySelector('.gallery-player');
    const videoContainer = workGallery.querySelector('.gallery-video');
    const stopPlayback = () => {
        videoContainer.replaceChildren();
        player.hidden = true;
    };
    const playProject = (project, moveFocus = true) => {
        const id = project.dataset.reelId;
        if (!id) return;
        const frame = document.createElement('iframe');
        frame.src = 'https://drive.google.com/file/d/' + encodeURIComponent(id) + '/preview';
        frame.title = project.querySelector('h3').textContent + ' — reel player';
        frame.allow = 'fullscreen';
        frame.allowFullscreen = true;
        videoContainer.replaceChildren(frame);
        player.querySelector('.gallery-drive-link').href = project.href;
        player.hidden = false;
        if (moveFocus) player.querySelector('.gallery-back').focus({ preventScroll: true });
        player.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    };
    player.querySelector('.gallery-back').addEventListener('click', () => {
        stopPlayback();
        goTo(activeSlide);
        track.querySelectorAll('.gallery-thumbnail')[activeSlide]?.focus({ preventScroll: true });
    });
    let activeSlide = 0;
    let returnFocus;
    const projects = Array.from(document.querySelectorAll('.portfolio-item'));
    projects.forEach((project, index) => {
        const slide = document.createElement('article');
        slide.className = 'gallery-slide';
        slide.style.setProperty('--slide-delay', Math.min(index, 3) * 85 + 'ms');
        slide.setAttribute('aria-label', 'Project ' + (index + 1) + ' of ' + projects.length);
        const art = document.createElement('button');
        art.type = 'button';
        art.setAttribute('aria-label', 'Play ' + project.querySelector('h3').textContent);
        art.addEventListener('click', () => { activeSlide = index; updateControls(); playProject(project); });
        art.className = 'gallery-art gallery-thumbnail';
        art.dataset.number = String(index + 1).padStart(2, '0');
        const source = project.querySelector('img');
        if (source) {
            const image = document.createElement('img');
            image.alt = source.alt;
            image.loading = 'lazy';
            image.addEventListener('error', () => { image.hidden = true; });
            image.src = source.currentSrc || source.src;
            art.append(image);
        }
        const playIcon = document.createElement('span');
        playIcon.className = 'reel-play';
        playIcon.setAttribute('aria-hidden', 'true');
        playIcon.textContent = '▶';
        art.append(playIcon);
        const caption = document.createElement('div');
        caption.className = 'gallery-caption';
        const title = document.createElement('h3');
        title.textContent = project.querySelector('h3')?.textContent || 'Untitled project';
        const category = document.createElement('p');
        category.textContent = project.querySelector('.overlay p')?.textContent || '';
        caption.append(title, category);
        slide.append(art, caption);
        track.append(slide);
    });
    const slides = Array.from(track.children);
    const updateControls = () => {
        count.textContent = slides.length ? String(activeSlide + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0') : 'New work coming soon';
        previous.disabled = activeSlide === 0;
        next.disabled = activeSlide >= slides.length - 1;
    };
    const goTo = index => {
        stopPlayback();
        activeSlide = Math.max(0, Math.min(index, slides.length - 1));
        const slide = slides[activeSlide];
        if (!slide) return;
        track.scrollTo({
            left: slide.offsetLeft - slides[0].offsetLeft,
            behavior: motionPreference.matches ? 'instant' : 'smooth'
        });
        updateControls();
    };
    workTrigger.addEventListener('click', event => {
        event.preventDefault();
        returnFocus = document.activeElement;
        stopPlayback();
        workGallery.showModal();
        document.body.classList.add('gallery-open');
        activeSlide = 0;
        track.scrollTo({ left: 0, behavior: 'instant' });
        updateControls();
    });
    projects.forEach((project, index) => {
        project.addEventListener('click', event => {
            if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            returnFocus = project;
            workGallery.showModal();
            document.body.classList.add('gallery-open');
            activeSlide = index;
            updateControls();
            playProject(project);
        });
    });
    workGallery.querySelector('.gallery-close').addEventListener('click', () => workGallery.close());
    workGallery.addEventListener('click', event => {
        if (event.target !== workGallery) return;
        const bounds = workGallery.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom) workGallery.close();
    });
    workGallery.addEventListener('close', () => {
        stopPlayback();
        document.body.classList.remove('gallery-open');
        returnFocus?.focus({ preventScroll: true });
    });
    previous.addEventListener('click', () => goTo(activeSlide - 1));
    next.addEventListener('click', () => goTo(activeSlide + 1));
    workGallery.addEventListener('keydown', event => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            goTo(activeSlide + (event.key === 'ArrowRight' ? 1 : -1));
        }
    });
    track.addEventListener('scroll', () => {
        let closest = 0;
        let distance = Infinity;
        slides.forEach((slide, index) => {
            const delta = Math.abs(slide.offsetLeft - slides[0].offsetLeft - track.scrollLeft);
            if (delta < distance) { closest = index; distance = delta; }
        });
        if (!player.hidden) return;
        activeSlide = closest;
        updateControls();
    }, { passive: true });
    updateControls();
}

// Service content remains available as native details without modal support.
const serviceDialog = document.getElementById('service-dialog');
if (serviceDialog && typeof serviceDialog.showModal === 'function') {
    const serviceContent = serviceDialog.querySelector('.service-dialog-content');
    let serviceReturnFocus;
    document.querySelectorAll('details.service-card').forEach(card => {
        const summary = card.querySelector('summary');
        summary.addEventListener('click', event => {
            event.preventDefault();
            serviceReturnFocus = summary;
            serviceDialog.querySelector('#service-dialog-title').textContent = card.querySelector('.service-title').textContent;
            serviceContent.replaceChildren(card.querySelector('.service-detail').cloneNode(true));
            const workLink = serviceContent.querySelector('[data-service-reel]');
            workLink.addEventListener('click', event => {
                if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                const frame = document.createElement('iframe');
                frame.src = 'https://drive.google.com/file/d/' + encodeURIComponent(workLink.dataset.serviceReel) + '/preview';
                frame.title = workLink.getAttribute('aria-label');
                frame.allow = 'fullscreen';
                frame.allowFullscreen = true;
                serviceContent.querySelector('.service-video').replaceChildren(frame);
                frame.tabIndex = 0;
                frame.focus({ preventScroll: true });
                frame.scrollIntoView({ block: 'nearest', behavior: 'instant' });
            });
            serviceContent.querySelector('.service-enquire').addEventListener('click', event => {
                event.preventDefault();
                serviceReturnFocus = null;
                serviceDialog.close();
                const subject = document.getElementById('contact-subject');
                if (subject) subject.value = card.querySelector('.service-title').textContent + ' enquiry';
                const contact = document.getElementById('contact');
                contact.scrollIntoView({ behavior: motionPreference.matches ? 'instant' : 'smooth', block: 'start' });
                document.getElementById('contact-name')?.focus({ preventScroll: true });
            });
            serviceDialog.showModal();
            document.body.classList.add('service-open');
            serviceDialog.scrollTop = 0;
        });
    });
    serviceDialog.querySelector('.service-close').addEventListener('click', () => serviceDialog.close());
    serviceDialog.addEventListener('click', event => {
        if (event.target !== serviceDialog) return;
        const bounds = serviceDialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom) serviceDialog.close();
    });
    serviceDialog.addEventListener('close', () => {
        serviceContent.replaceChildren();
        document.body.classList.remove('service-open');
        serviceReturnFocus?.focus({ preventScroll: true });
    });
}

// Service assignments live on each portfolio card so future work is easy to classify.
const workFilters = document.querySelector('.work-filters');
if (workFilters) {
    const cards = Array.from(document.querySelectorAll('.portfolio-grid .portfolio-item'));
    const status = document.querySelector('.work-filter-status');
    const empty = document.querySelector('.work-empty');
    const filterWork = key => {
        let visible = 0;
        cards.forEach(card => {
            const matches = key === 'all' || (card.dataset.services || '').split(' ').includes(key);
            card.hidden = !matches;
            if (matches) visible++;
        });
        const buttons = Array.from(workFilters.querySelectorAll('[data-work-filter]'));
        buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.workFilter === key)));
        const label = buttons.find(button => button.dataset.workFilter === key)?.textContent || 'All Work';
        status.textContent = label + ' · ' + visible + (visible === 1 ? ' project' : ' projects');
        empty.hidden = visible > 0;
    };
    workFilters.addEventListener('click', event => {
        const button = event.target.closest('[data-work-filter]');
        if (button) filterWork(button.dataset.workFilter);
    });
    document.querySelector('[data-reset-work]').addEventListener('click', () => {
        filterWork('all');
        workFilters.querySelector('[data-work-filter="all"]').focus({ preventScroll: true });
    });
    filterWork('all');
}

// Keep anchor offsets and the hero aligned with the actual navigation height.
const measuredNavbar = document.querySelector('.navbar');
if (measuredNavbar && 'ResizeObserver' in window) {
    new ResizeObserver(() => {
        document.documentElement.style.setProperty('--nav-height', measuredNavbar.offsetHeight + 'px');
    }).observe(measuredNavbar);
}


// A brief welcome, once per tab session. The page remains immediately usable.
const cinematicHero = document.querySelector('.hero');
if (cinematicHero) {
    let intro;
    let introTimer;
    let pointerFrame = 0;
    const dismissIntro = () => {
        intro?.remove();
        clearTimeout(introTimer);
        cinematicHero.style.setProperty('--welcome-delay', '0ms');
        document.removeEventListener('pointerdown', dismissIntro);
        document.removeEventListener('keydown', dismissIntro);
        window.removeEventListener('scroll', dismissIntro);
    };
    let welcomed = false;
    try { welcomed = sessionStorage.getItem('avnish-welcomed') === '1'; } catch { /* Storage may be blocked. */ }
    if (!motionPreference.matches && !welcomed && !location.hash && window.scrollY < 10) {
        intro = document.createElement('div');
        intro.className = 'welcome-intro';
        intro.setAttribute('aria-hidden', 'true');
        intro.innerHTML = '<span>AVNISH FILMS</span><strong>Welcome to my frame.</strong>';
        document.body.append(intro);
        cinematicHero.style.setProperty('--welcome-delay', '1150ms');
        try { sessionStorage.setItem('avnish-welcomed', '1'); } catch { /* Animation does not depend on storage. */ }
        introTimer = setTimeout(dismissIntro, 1750);
        document.addEventListener('pointerdown', dismissIntro, { once: true });
        document.addEventListener('keydown', dismissIntro, { once: true });
        window.addEventListener('scroll', dismissIntro, { once: true, passive: true });
    }
    cinematicHero.classList.add('is-entering');
    // Stop entrance animation immediately when a visitor starts using the page.
    cinematicHero.addEventListener('focusin', () => cinematicHero.classList.remove('is-entering'));
    setTimeout(() => cinematicHero.classList.remove('is-entering'), 3000);
    const resetLens = () => {
        cancelAnimationFrame(pointerFrame);
        cinematicHero.style.setProperty('--lens-x', '0px');
        cinematicHero.style.setProperty('--lens-y', '0px');
    };
    cinematicHero.addEventListener('pointermove', event => {
        if (motionPreference.matches || event.pointerType !== 'mouse') return;
        cancelAnimationFrame(pointerFrame);
        pointerFrame = requestAnimationFrame(() => {
            const bounds = cinematicHero.getBoundingClientRect();
            cinematicHero.style.setProperty('--lens-x', ((event.clientX - bounds.left) / bounds.width - .5) * 42 + 'px');
            cinematicHero.style.setProperty('--lens-y', ((event.clientY - bounds.top) / bounds.height - .5) * 32 + 'px');
        });
    }, { passive: true });
    cinematicHero.addEventListener('pointerleave', resetLens);
    cinematicHero.addEventListener('pointerdown', event => {
        if (motionPreference.matches || event.target.closest('a, button')) return;
        const bounds = cinematicHero.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'hero-ripple';
        ripple.setAttribute('aria-hidden', 'true');
        ripple.style.left = event.clientX - bounds.left + 'px';
        ripple.style.top = event.clientY - bounds.top + 'px';
        // Bound decorative work even during rapid tapping.
        if (cinematicHero.querySelectorAll('.hero-ripple').length >= 4) cinematicHero.querySelector('.hero-ripple').remove();
        cinematicHero.append(ripple);
        setTimeout(() => ripple.remove(), 900);
    }, { passive: true });
    motionPreference.addEventListener('change', event => {
        if (!event.matches) return;
        dismissIntro();
        resetLens();
        cinematicHero.classList.remove('is-entering');
        cinematicHero.querySelectorAll('.hero-ripple').forEach(ripple => ripple.remove());
    });
}
