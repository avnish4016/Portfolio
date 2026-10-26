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
        track.querySelectorAll('.gallery-thumbnail')[activeSlide]?.focus({ preventScroll: true });
    });
    let activeSlide = 0;
    let returnFocus;
    const projects = Array.from(document.querySelectorAll('.portfolio-item'));
    projects.forEach((project, index) => {
        const slide = document.createElement('article');
        slide.className = 'gallery-slide';
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
