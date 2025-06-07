document.addEventListener('DOMContentLoaded', function() {
    // --- Create and Show Loading Screen ---
    const loader = document.createElement('div');
    loader.id = 'pageLoader';
    loader.style.position = 'fixed';
    loader.style.left = '0';
    loader.style.top = '0';
    loader.style.width = '100%';
    loader.style.height = '100%';
    loader.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    loader.style.zIndex = '9999';
    loader.style.display = 'flex';
    loader.style.justifyContent = 'center';
    loader.style.alignItems = 'center';
    loader.style.fontSize = '24px';
    loader.style.fontFamily = 'Inter, sans-serif';
    loader.style.color = '#1E1E2F';

    const funFacts = [
        "Did you know? A group of flamingos is called a 'flamboyance'.",
        "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible!",
        "The national animal of Scotland is the unicorn.",
        "A jiffy is an actual unit of time: 1/100th of a second.",
        "Bananas are berries, but strawberries aren't!",
        "Octopuses have three hearts and blue blood.",
        "The inventor of the Pringles can is now buried in one.",
        "Brewing some awesomeness...",
        "Fetching the good stuff...",
        "Just a moment, polishing the pixels...",
        "Warming up the hamsters...",
        "Our servers are working hard (or hardly working?)...",
        "Loading... because good things take time (and API calls).",
        "Hang tight, almost there!",
        "Counting to infinity... twice.",
        "Remember to blink!",
        "Why did the scarecrow win an award? Because he was outstanding in his field!",
        "What do you call a fish with no eyes? Fsh!",
        "Chuck Norris can compile C++ on a TI-83 calculator.",
        "There are 10 types of people in the world: those who understand binary, and those who don't."
    ];

    function getRandomFact() {
        const randomIndex = Math.floor(Math.random() * funFacts.length);
        return funFacts[randomIndex];
    }

    // Set initial random fact
    loader.textContent = getRandomFact();

    let factInterval = setInterval(() => {
        if (document.body.contains(loader)) { // Only update if loader is still visible
             loadingTextElement.textContent = getRandomFact();
        } else {
            clearInterval(factInterval);
        }
    }, 4000); // Change fact every 4 seconds

    document.body.appendChild(loader);
    document.body.style.overflow = 'hidden'; // Prevent scrolling while loader is active

    // Helper to safely update text content
    function updateText(selector, text, parent = document) {
        try {
            const element = parent.querySelector(selector);
            if (element) {
                element.textContent = text;
            } else {
                console.warn(`Element not found for selector: ${selector}`);
            }
        } catch (e) {
            console.error(`Error updating text for selector: ${selector}`, e);
        }
    }
    // --- Helper function to update an attribute (add this alongside your updateText) ---
    function updateAttribute(selector, attributeName, value, parent = document) {
        try {
            const element = parent.querySelector(selector);
            if (element) {
                element.setAttribute(attributeName, value);
            } else {
                console.warn(`[updateAttribute] Element not found for selector: '${selector}' in parent:`, parent);
            }
        } catch (e) {
            console.error(`[updateAttribute] Error updating attribute '${attributeName}' for selector: '${selector}'`, e);
        }
    }
    function updateMeta(name, content) {
        try {
            const element = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
            if (element) {
                element.setAttribute('content', content);
            } else {
                 console.warn(`Meta tag not found for: ${name}`);
            }
        } catch (e) {
            console.error(`Error updating meta for: ${name}`, e);
        }
    }

    const headers = {'X-API-KEY': "read"};

    fetch('https://accelrt-v2.vercel.app/api/get-data', { headers })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // --- Populate Meta Tags ---
            if (data.meta) {
                if (data.meta.title) document.title = data.meta.title;
                updateMeta('description', data.meta.description);
                updateMeta('og:title', data.meta.ogTitle);
                updateMeta('og:description', data.meta.ogDescription);
                updateMeta('twitter:title', data.meta.twitterTitle);
                updateMeta('twitter:description', data.meta.twitterDescription);
            }

            // --- Populate Hero Section ---
            if (data.hero) {
                updateText('.hero-section .hero-content h1', data.hero.title);
                updateText('.hero-section .hero-content .description', data.hero.description);
                updateText('.hero-section .hero-content .hero-button', data.hero.buttonText);
            }

            // --- Populate Services Intro ---
            if (data.servicesIntro) {
                updateText('.services-intro .big-button-heading', data.servicesIntro.heading);
                updateText('.services-intro .services-intro-description', data.servicesIntro.description);
            }

            // --- Populate Service Cards ---
            if (data.services && Array.isArray(data.services)) {
                const serviceCards = document.querySelectorAll('.services-grid .service-card');
                serviceCards.forEach((card, index) => {
                    if (data.services[index]) {
                        updateText('.card-title .title-tag:nth-of-type(1)', data.services[index].titleTag1, card);
                        updateText('.card-title .title-tag:nth-of-type(2)', data.services[index].titleTag2, card);
                        // The "Learn more" text is inside a span that's the last child of the <a>
                        const learnMoreLink = card.querySelector('.learn-more-card-button');
                        if (learnMoreLink && learnMoreLink.lastChild && learnMoreLink.lastChild.nodeType === Node.ELEMENT_NODE && learnMoreLink.lastChild.tagName === 'SPAN') {
                            learnMoreLink.lastChild.textContent = data.services[index].learnMoreText;
                        } else if (learnMoreLink && learnMoreLink.childNodes.length > 1 && learnMoreLink.childNodes[learnMoreLink.childNodes.length-1].nodeType === Node.TEXT_NODE) {
                             learnMoreLink.childNodes[learnMoreLink.childNodes.length-1].textContent = ` ${data.services[index].learnMoreText}`; // Add space if it's a direct text node
                        }
                    }
                });
            }

            // --- Populate CTA Section ---
            if (data.cta) {
                updateText('.cta-section .cta-content h2', data.cta.heading);
                updateText('.cta-section .cta-content p', data.cta.description);
                updateText('.cta-section .cta-content .cta-button', data.cta.buttonText);
            }
            
            // --- Populate Team Section Header ---
            // The team header uses .contact-header class, and it's the first one with this class in team-section
            if (data.teamMembers && Array.isArray(data.teamMembers)) {
                const topRowCards = document.querySelectorAll('.team-section .top-row > .team-card');
                const bottomRowCards = document.querySelectorAll('.team-section .bottom-row > .team-card');
                const originalTeamCards = [...topRowCards, ...bottomRowCards]; // Combine into one array

                console.log(`Found ${originalTeamCards.length} original team cards to populate.`);

                originalTeamCards.forEach((card, index) => {
                    if (data.teamMembers[index]) {
                        // updateText function is correctly scoped with `card` as parent
                        updateText('.member-name', data.teamMembers[index].name, card);
                        updateText('.member-title', data.teamMembers[index].title, card);
                        updateText('.member-description', data.teamMembers[index].description, card);

                        if (data.teamMembers[index].linkedinUrl) {
                            updateAttribute('.linkedin-icon', 'href', data.teamMembers[index].linkedinUrl, card);
                            console.log(`Updated LinkedIn URL for ${data.teamMembers[index].name} to: ${data.teamMembers[index].linkedinUrl}`);
                        } else {
                            updateAttribute('.linkedin-icon', 'href', '#', card); // Set to a placeholder if missing
                            console.warn(`LinkedIn URL missing for team member: ${data.teamMembers[index].name}`);
                        }
                        
                        console.log("Updated team member:", data.teamMembers[index].name, "in card:", card);
                    } else {
                        console.warn(`No data found for team card at index ${index}`);
                    }
                });
            }

            // --- Populate FAQ Section Header ---
            const faqHeaderElement = document.querySelector('.faq-section .process-header .process-title-tag');
            if (data.faqHeader && faqHeaderElement) {
                faqHeaderElement.textContent = data.faqHeader.heading;
            }

            // --- Populate FAQ Items ---
            if (data.faqItems && Array.isArray(data.faqItems)) {
                const faqItems = document.querySelectorAll('.faq-section .accordion-item');
                faqItems.forEach((item, index) => {
                    if (data.faqItems[index]) {
                        updateText('.accordion-number', data.faqItems[index].number, item);
                        updateText('.accordion-title', data.faqItems[index].title, item);
                        updateText('.accordion-content p', data.faqItems[index].description, item);
                    }
                });
            }
            
            // --- Populate Contact Us Section Header ---
            // This is the second .contact-header on the page, or the one within .contact-us-section
            const contactUsHeaders = document.querySelectorAll('.contact-us-section .contact-header');
            if (data.contactUsHeader && contactUsHeaders.length > 0) {
                // Assuming the specific contact section has only one .contact-header
                const contactHeaderInSection = document.querySelector('.contact-us-section:not(.team-section) .contact-header'); // More specific
                if(contactHeaderInSection) {
                    updateText('.contact-title-tag', data.contactUsHeader.heading, contactHeaderInSection);
                    updateText('.contact-subtitle', data.contactUsHeader.subheading, contactHeaderInSection);
                } else if (contactUsHeaders.length > 0) { // Fallback if above selector fails
                     // This might pick the team section header if it's also .contact-us-section. Be careful.
                     // Let's assume there's a distinct .contact-us-section that is NOT the team section.
                     // The provided HTML has a specific one for the form.
                    const formContactHeader = Array.from(document.querySelectorAll('.contact-header')).find(h => h.closest('.contact-us-section') && !h.closest('.team-section'));
                    if(formContactHeader){
                        updateText('.contact-title-tag', data.contactUsHeader.heading, formContactHeader);
                        updateText('.contact-subtitle', data.contactUsHeader.subheading, formContactHeader);
                    } else { // Last resort: if only one .contact-us-section on the whole page
                        const mainContactSection = document.querySelector('.contact-us-section');
                        if(mainContactSection){
                             const header = mainContactSection.querySelector('.contact-header');
                             if(header){
                                updateText('.contact-title-tag', data.contactUsHeader.heading, header);
                                updateText('.contact-subtitle', data.contactUsHeader.subheading, header);
                             }
                        }
                    }
                }
            }

            // --- Populate Contact Form Text ---
            if (data.contactForm) {
                // Radio button labels are tricky as they are text nodes after a span.
                // We target the label, then find its last text node.
                const radioLabels = document.querySelectorAll('.contact-form-area .form-options .radio-option');
                if (radioLabels[0]) {
                    // Find the text node (usually the last child node of the label)
                    for(let i = radioLabels[0].childNodes.length - 1; i >= 0; i--) {
                        if(radioLabels[0].childNodes[i].nodeType === Node.TEXT_NODE && radioLabels[0].childNodes[i].textContent.trim() !== "") {
                            radioLabels[0].childNodes[i].textContent = ` ${data.contactForm.radioSayHi}`; break;
                        }
                    }
                }
                if (radioLabels[1]) {
                     for(let i = radioLabels[1].childNodes.length - 1; i >= 0; i--) {
                        if(radioLabels[1].childNodes[i].nodeType === Node.TEXT_NODE && radioLabels[1].childNodes[i].textContent.trim() !== "") {
                            radioLabels[1].childNodes[i].textContent = ` ${data.contactForm.radioGetQuote}`; break;
                        }
                    }
                }

                updateText('label[for="contactName"]', data.contactForm.labelName);
                updateText('label[for="contactEmail"]', data.contactForm.labelEmail);
                updateText('label[for="contactMessage"]', data.contactForm.labelMessage);
                updateText('#contactForm .submit-button', data.contactForm.buttonText);
            }

            // --- Populate Footer ---
            if (data.footer) {
                updateText('.site-footer p', data.footer.copyrightText);
            }

            console.log('Content loaded from JSON successfully.');
        })
        .catch(error => {
            console.error('Failed to load or parse content.json:', error);
            if(loader) loader.textContent = 'Error loading content.';
            // Keep loader on error or provide an error message
        })
        .finally(() => {
            // --- Hide Loading Screen ---
            if (loader) {
                // Optional: Add a slight delay or fade out
                setTimeout(() => {
                    loader.style.opacity = '0';
                    loader.style.transition = 'opacity 0.5s ease-out';
                    setTimeout(() => {
                        if (document.body.contains(loader)) {
                             document.body.removeChild(loader);
                        }
                        document.body.style.overflow = ''; // Restore scrolling
                    }, 500); // Match transition duration
                }, 200); // Small delay to ensure content is rendered
            } else {
                 document.body.style.overflow = ''; // Restore scrolling if loader wasn't found
            }
        });
});