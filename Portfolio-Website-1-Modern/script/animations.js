import { personalData } from "../data/personal-data.js";
gsap.registerPlugin(ScrollTrigger);

/**
 * Updates the active navigation link and toggles the blur background
 * when scrolling to different sections.
**/
const updateActiveLinkAndBlurBg = () => {
  const sections = document.querySelectorAll('section'); // All sections on the page
  const navList = document.querySelectorAll('.section-nav a'); // Navigation links
  const activeLinkBg = document.querySelector('.nav-list__active-background');  // Active link background
  const blurBackground = document.querySelector('.blur-background'); // Blur background element

  // Loop through each section and create a ScrollTrigger instance
  sections.forEach(section => {
    const sectionId = section.id;

    ScrollTrigger.create({
      trigger: section, 
      start: "top 72%", // Start when the section is 72% from the top
      end: "bottom 72%", // End when the section is 72% from the bottom
      onEnter: () => {
        updateActiveLink(sectionId);
        toggleBlurBackground(sectionId);
      },
      onEnterBack: () => {
        updateActiveLink(sectionId)
        toggleBlurBackground(sectionId);
      },
      onLeave: () => clearActiveLink(),
      onLeaveBack: () => clearActiveLink()
    });

    /**
     * Updates the active navigation link based on the current section.
     * @param {string} sectionId - The ID of the current section.
    **/
    function updateActiveLink(sectionId){
      activeLinkBg.style.backgroundColor = 'white';
      navList.forEach(nav => nav.classList.remove('active')); // Remove 'active' class from all links
      const activeLink = Array.from(navList).find(nav => nav.getAttribute('data-value') === sectionId);

      if (activeLink) {
        activeLink.classList.add('active'); // Add 'active' class to the current link
        activeLinkBg.style.backgroundColor = 'white';
        let linkPosition = activeLink.offsetLeft; // Get the position of the active link
        activeLinkBg.style.display = 'block';
        activeLinkBg.style.left = `${linkPosition}px`; // Position the link background
        
        // Update Lanyard profile image dynamically based on section
        if (window.updateLanyardProfile) {
          if (sectionId === 'about-section') {
            window.updateLanyardProfile('about-profile.png');
          } else {
            // Revert to original profile picture for other sections
            window.updateLanyardProfile(personalData.profilePicture || 'my-profile.png');
          }
        }
      }
    }

    /**
     * Clears the active navigation link and resets the background.
    **/
    function clearActiveLink(){
      activeLinkBg.style.backgroundColor = 'transparent';
      navList.forEach(link => {
        link.classList.remove('active');
      })      
    }

    /**
     * Toggles the blur background based on the current section.
     * Blur is disabled so About, Projects, Skills, and all tabs stay sharp and unblurred.
    **/
    function toggleBlurBackground(sectionId, body){
      if (blurBackground) {
        blurBackground.classList.add('hide');
        blurBackground.classList.remove('show');
      }
    }
  });
}


/**
 * Animates elements with a fade-in effect when they enter the viewport.
**/
const elementsFadeIn = () => {
  const elements = Array.from(document.body.querySelectorAll(".main-wrapper *")).filter(el =>
    !el.closest('.section-nav') &&
    !el.classList.contains('background-profile-pic') &&
    !el.classList.contains('blur-background') &&
    !el.closest('footer')
  );

  elements.forEach(el => {
    gsap.from(el, {
      scrollTrigger: {
        trigger: el,
        start: "top 93%", // Start animation when the element is 93% in the viewport
        toggleActions: "play none none reset", 
      },
      opacity: 0,
      duration: 0.8,
      ease: "power2.out"
    });
  });
}


/**
 * Handles all animations on the page, including navigation updates,
 * blur background and fade-in effects for elements.
 */
function handleAllAnimations() {
  updateActiveLinkAndBlurBg();
  elementsFadeIn();
}


export default handleAllAnimations;