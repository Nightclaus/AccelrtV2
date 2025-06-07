document.addEventListener('DOMContentLoaded', function () {
    ////---------------------------////
    //// Initialising the Services ////
    ////---------------------------////

    const accordionItems = document.querySelectorAll('.accordion-item');

    function openFirstItem() {
        const firstItem = accordionItems[0];
        if (firstItem) {
            const header = firstItem.querySelector('.accordion-header');
            const content = firstItem.querySelector('.accordion-content');
            const icon = firstItem.querySelector('.accordion-icon');
            
            firstItem.classList.add('active');
            header.style.backgroundColor = "var(--teal-card-bg)"; // This was an AccelRT-specific style
            content.style.maxHeight = content.scrollHeight + "px";
            icon.textContent = '-';
        }
    }
    
    function resetAccordion(item) {
        const header = item.querySelector('.accordion-header');
        const content = item.querySelector('.accordion-content');
        const icon = item.querySelector('.accordion-icon');

        item.classList.remove('active');
        header.style.backgroundColor = "var(--white)"; // This was an AccelRT-specific style
        content.style.backgroundColor = "var(--white)"; // This was an AccelRT-specific style
        content.style.maxHeight = null;
        icon.textContent = '+';
    }
    openFirstItem(); 

    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        const content = item.querySelector('.accordion-content');
        const icon = item.querySelector('.accordion-icon');

        header.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            accordionItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    resetAccordion(otherItem);
                }
            });
            if (isActive) { 
                resetAccordion(item);
            } else { 
                item.classList.add('active');
                header.style.backgroundColor = "var(--teal-card-bg)"; // AccelRT specific
                content.style.backgroundColor = "var(--teal-card-bg)"; // AccelRT specific
                content.style.maxHeight = content.scrollHeight + "px";
                icon.textContent = '-';
            }
        });
    });

    ////---------------------------////
    //// Initialising the Carousel ////
    ////---------------------------////

    const teamSection = document.querySelector('.team-section');
    if (!teamSection) {
        console.warn('Team section not found.');
        return;
    }

    const rowsToProcess = [
        { element: teamSection.querySelector('.team-row.top-row'), isTopRow: true },
        { element: teamSection.querySelector('.team-row.bottom-row'), isTopRow: false }
    ];

    const pageScrollAnimationDistance = 250; 
    const rowAnimationHandlers = [];

    rowsToProcess.forEach(rowConfig => {
        if (!rowConfig.element) {
            console.warn(`Team row element not found for ${rowConfig.isTopRow ? 'top' : 'bottom'} row.`);
            return;
        }
        const rowSpecificScrollHandler = setupInteractiveRow(rowConfig.element, rowConfig.isTopRow, pageScrollAnimationDistance, teamSection);
        if (rowSpecificScrollHandler) {
            rowAnimationHandlers.push(rowSpecificScrollHandler);
        }
    });

    function setupInteractiveRow(rowElement, isTopRow, scrollAnimDist, teamSectionElement) {
        if (!rowElement) {
            console.error(`setupInteractiveRow called with null rowElement for ${isTopRow ? 'top' : 'bottom'} row.`);
            return;
        }
        const rowType = isTopRow ? 'TOP' : 'BOTTOM';
        console.log(`--- Setting up ${rowType} Row ---`, "Element:", rowElement);

        const rowWrapper = rowElement.parentElement;
        let originalCardsBeforeCloning = Array.from(rowElement.children);

        console.log(`[${rowType} Row] Initial originalCardsBeforeCloning.length: ${originalCardsBeforeCloning.length}`);
        originalCardsBeforeCloning.forEach((card, i) => {
            const nameEl = card.querySelector('.member-name');
            console.log(`[${rowType} Row] Original Card ${i} (pre-clone): ${nameEl ? nameEl.textContent.substring(0, 20) : 'NO NAME'}`);
        });

        if (originalCardsBeforeCloning.length === 0) {
            console.warn(`[${rowType} Row] No original cards found. Cloning might not work as expected.`);
        }

        // --- CLONING LOGIC ---
        const clonesStartData = originalCardsBeforeCloning.map(card => card.cloneNode(true));
        const clonesEndData = originalCardsBeforeCloning.map(card => card.cloneNode(true));

        clonesEndData.forEach(clone => rowElement.appendChild(clone));
        clonesStartData.slice().reverse().forEach(clone => rowElement.prepend(clone));
        console.log(`[${rowType} Row] After cloning, rowElement now has ${rowElement.children.length} cards.`);
        // --- END CLONING LOGIC ---

        let originalContentWidth = 0;
        let gapValue = parseFloat(window.getComputedStyle(rowElement).gap || 0);
        originalCardsBeforeCloning.forEach((card, index) => {
            originalContentWidth += card.offsetWidth;
            if (index < originalCardsBeforeCloning.length - 1) {
                originalContentWidth += gapValue;
            }
        });
        console.log(`[${rowType} Row] Calculated originalContentWidth (based on ${originalCardsBeforeCloning.length} initial cards): ${originalContentWidth}`);

        let initialTranslateX = -originalContentWidth;
        let isDragging = false;
        let startPointerX;
        let currentDragOffset = 0;
        let accumulatedDragOffset = 0;
        let pageScrollOffset = 0;

        rowElement.style.transform = `translateX(${initialTranslateX}px)`;
        console.log(`[${rowType} Row] Set initial transform: translateX(${initialTranslateX}px)`);

        // --- DEFINE CORE TRANSFORMATION AND ANIMATION FUNCTIONS ---
        function applyTransformations() {
            let combinedTranslateX = initialTranslateX + pageScrollOffset + accumulatedDragOffset + currentDragOffset;

            // Snap logic
            if (originalContentWidth > 0) { // Avoid division by zero or issues if no cards
                if (combinedTranslateX > initialTranslateX + originalContentWidth / 2) {
                    accumulatedDragOffset -= originalContentWidth;
                    combinedTranslateX -= originalContentWidth;
                    // console.log(`[${rowType} Row] Snapped Left. New accumulatedDragOffset: ${accumulatedDragOffset}`);
                } else if (combinedTranslateX < initialTranslateX - originalContentWidth / 2) {
                    accumulatedDragOffset += originalContentWidth;
                    combinedTranslateX += originalContentWidth;
                    // console.log(`[${rowType} Row] Snapped Right. New accumulatedDragOffset: ${accumulatedDragOffset}`);
                }
            }
            rowElement.style.transform = `translateX(${combinedTranslateX}px)`;
        }

        function specificRowPageScrollAnimation() {
            const teamSectionForRect = teamSectionElement;
            if (!teamSectionForRect) return;

            const rect = teamSectionForRect.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            let progress = 0;

            const animationStartPoint = viewportHeight;
            const animationEndPoint = -rect.height;

            if (rect.top <= animationStartPoint && rect.bottom >= 0) {
                const currentScrollInAnimationRange = animationStartPoint - rect.top;
                const totalAnimationScrollRange = animationStartPoint - animationEndPoint;
                if (totalAnimationScrollRange !== 0) { // Avoid division by zero
                    progress = currentScrollInAnimationRange / totalAnimationScrollRange;
                }
                progress = Math.max(0, Math.min(1, progress));
            } else if (rect.top > animationStartPoint) {
                progress = 0;
            } else {
                progress = 1;
            }

            const direction = isTopRow ? 1 : -1;
            pageScrollOffset = (progress - 0.5) * scrollAnimDist * direction;

            if (!isDragging) {
                applyTransformations();
            }
        }

        // --- DEFINE AND ATTACH DRAG HANDLERS ---
        function onDragStart(e) {
            isDragging = true;
            startPointerX = e.pageX || e.touches[0].pageX;
            currentDragOffset = 0;
            rowWrapper.classList.add('is-dragging');
            rowElement.style.transition = 'none';
            // console.log(`[${rowType} Row] Drag Start`);
        }

        function onDragMove(e) {
            if (!isDragging) return;
            // e.preventDefault() is called by the touchmove listener specifically

            const currentPointerX = e.pageX || (e.touches && e.touches[0].pageX);
            if (currentPointerX === undefined) return;

            currentDragOffset = currentPointerX - startPointerX;
            applyTransformations();
        }

        function onDragEnd() {
            if (!isDragging) return;
            isDragging = false;
            rowWrapper.classList.remove('is-dragging');
            accumulatedDragOffset += currentDragOffset;
            currentDragOffset = 0;
            // No explicit applyTransformations() here, as it was called during the last onDragMove.
            // Or, if you want a final snap check even if mouseup happens outside:
            applyTransformations(); 
            // console.log(`[${rowType} Row] Drag End. Accumulated offset: ${accumulatedDragOffset}`);
        }

        rowWrapper.addEventListener('mousedown', onDragStart);
        rowWrapper.addEventListener('touchstart', (e) => {
            e.preventDefault(); // For touchstart, prevent default if we intend to handle the scroll
            onDragStart(e);
        }, { passive: false });

        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault(); // Prevent page scroll during touch drag
            onDragMove(e);
        }, { passive: false });

        document.addEventListener('mouseup', onDragEnd);
        document.addEventListener('touchend', onDragEnd);
        rowWrapper.addEventListener('mouseleave', () => {
            if (isDragging) onDragEnd();
        });

        // --- DEFINE AND ATTACH WHEEL HANDLER ---
        rowWrapper.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                e.preventDefault();
                accumulatedDragOffset -= e.deltaX * 0.5; // Sensitivity factor
                rowElement.style.transition = 'none';
                applyTransformations();
            }
        }, { passive: false });

        console.log(`Finished setting up ${rowType} Row fully with scrollAnimDist: ${scrollAnimDist}.`);
        return specificRowPageScrollAnimation;
    }

    // Global observer
    if (rowAnimationHandlers.length > 0) { // Only set up observer if there are handlers
        const observerOptions = { rootMargin: '0px', threshold: 0.01 };
        let isSectionCurrentlyIntersecting = false; // Track current state

        const teamSectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.target === teamSection) {
                    if (entry.isIntersecting) {
                        if (!isSectionCurrentlyIntersecting) { // Only attach if not already attached
                            isSectionCurrentlyIntersecting = true;
                            console.log("Team Section is IN VIEW. Attaching master scroll listener.");
                            rowAnimationHandlers.forEach(handler => handler()); // Initial call for all rows
                            window.addEventListener('scroll', masterScrollHandler, { passive: true });
                        }
                    } else {
                        if (isSectionCurrentlyIntersecting) { // Only detach if previously attached
                            isSectionCurrentlyIntersecting = false;
                            console.log("Team Section is OUT OF VIEW. Removing master scroll listener.");
                            window.removeEventListener('scroll', masterScrollHandler);
                        }
                    }
                }
            });
        }, observerOptions);

        teamSectionObserver.observe(teamSection);

        function masterScrollHandler() {
            // This function is called on window scroll if the section is intersecting
            rowAnimationHandlers.forEach(handler => handler());
        }

        // Initial check on page load if the section is already visible
        if (isElementInViewport(teamSection)) {
            isSectionCurrentlyIntersecting = true; // Set flag
            console.log("Team Section initially IN VIEW. Calling handlers and attaching master scroll listener.");
            rowAnimationHandlers.forEach(handler => handler());
            window.addEventListener('scroll', masterScrollHandler, { passive: true });
        }
    } else {
        console.warn("No row animation handlers were set up for the team carousel.");
    }

    function isElementInViewport(el) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return (
            rect.top < window.innerHeight && rect.bottom > 0 
            // Optionally add left/right checks too if needed
            // rect.left < window.innerWidth &&
            // rect.right > 0
        );
    }

    
    ////---------------------------////
    //// Initialising the Contacts ////
    ////---------------------------////

    const contactForm = document.getElementById('contactForm');
    const formStatusDiv = document.getElementById('formSubmissionStatus');

    if (contactForm) {
        contactForm.addEventListener('submit', function(event) {
            event.preventDefault(); 
            formStatusDiv.textContent = 'Sending...';
            formStatusDiv.className = ''; 
            const formData = new FormData(contactForm);
            const data = {};
            formData.forEach((value, key) => { data[key] = value; });
            const postData = {
                userId: 1, 
                title: `Contact Form Submission from ${data.name || 'Anonymous'}`,
                body: `Type: ${data.inquiryType}\nEmail: ${data.email}\nMessage: ${data.message}`,
                formData: data 
            };
            fetch('https://jsonplaceholder.typicode.com/posts', {
                method: 'POST',
                body: JSON.stringify(postData),
                headers: { 'Content-type': 'application/json; charset=UTF-8',},
            })
            .then(response => {
                if (!response.ok) { throw new Error(`Network response was not ok: ${response.status}`); }
                return response.json();
            })
            .then(json => {
                console.log('Success (from placeholder):', json);
                formStatusDiv.textContent = 'Message Sent Successfully! (Placeholder response)';
                formStatusDiv.className = 'success'; 
                contactForm.reset(); 
            })
            .catch(error => {
                console.error('Error:', error);
                formStatusDiv.textContent = `Error sending message: ${error.message}. Please try again.`;
                formStatusDiv.className = 'error'; 
            });
        });
    }
});