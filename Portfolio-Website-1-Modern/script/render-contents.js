import { personalData } from "../data/personal-data.js";
import { aboutData } from "../data/about-data.js";
import { projectsData } from "../data/projects-data.js";
import { skillsToolsData } from "../data/skills-tools-data.js";
import { TechSphere } from "./tech-sphere.js";
import { Project3DDevice } from "./project-3d-device.js";

// background profile picture
const renderProfilePicture = () => {
  document.querySelector('.background-profile-pic').setAttribute('src', `images-and-icons/images/${personalData.profilePicture}`)
}

// header
const headerContents = () => {
  const headerHTML = `
        <div class="header__work-status">
          <div class="header__work-status-dot"></div>
          <div class="header__work-status-label">${personalData.workAvailabilityStatus}</div>
        </div>
        <div class="header__right-group">
          <button id="theme-toggle-btn" class="theme-toggle-btn theme-toggle-dark-inner" type="button" aria-label="Toggle theme" title="Chuyển giao diện sáng/tối">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              aria-hidden="true"
              fill="currentColor"
              class="theme-toggle-dark-inner__svg"
            >
              <path
                class="theme-toggle-dark-inner__inner"
                d="M16 9c3.9 0 7 3.1 7 7s-3.1 7-7 7"
              />
              <path
                class="theme-toggle-dark-inner__outer"
                d="M16 .5C7.4.5.5 7.4.5 16S7.4 31.5 16 31.5 31.5 24.6 31.5 16 24.6.5 16 .5zm0 28.1V23c-3.9 0-7-3.1-7-7s3.1-7 7-7V3.4C23 3.4 28.6 9 28.6 16S23 28.6 16 28.6z"
              />
            </svg>
          </button>
          <a download="${personalData.resume}" href="${personalData.resume}" target="_blank" class="header__download-resume-btn">Download Resume</a>
        </div>

  `;

  document.querySelector('header').innerHTML = headerHTML;
}

// home section
const homeSectionContents = () => {
  const homeHTML = `
       <h2 class="home-section__main-skill">${personalData.mainSkill}</h2>
        <h1 class="home-section__name">${personalData.name}</h1>
        <div class="home-section__other-details-list d-grid">
          <div class="detail-item gmail">
            <i class="ph ph-envelope detail-item__icon"></i>
            <p class="detail-item__label">${personalData.email}</p>
          </div>
          <div class="detail-item number">
            <i class="ph ph-phone detail-item__icon"></i>
            <p class="detail-item__label">${personalData.contactNumber}</p>
          </div>
          <div class="detail-item school">
            <i class="ph ph-graduation-cap detail-item__icon"></i>
            <p class="detail-item__label">${personalData.school}</p>
          </div>
          <div class="detail-item adress">
            <i class="ph ph-map-pin detail-item__icon"></i>
            <p class="detail-item__label">${personalData.address}</p>
          </div>
        </div>
    `;

  document.getElementById('home-section').innerHTML = homeHTML;
}

//about section
const aboutSectionContents = () => {
  const certificatesHTML = aboutData.certificates.map(certificate => 
    `<li class="education-and-certificates-item">
        <p class="education-and-certificates-item__label">${certificate.name}</p>
        <p class="education-and-certificates-item__date">${certificate.year}</p>
      </li>`
  ).join('');

  const aboutHTML = `
     <h1 class="about-section__heading heading">About</h1>
      <p class="about-section__paragraph">${aboutData.aboutMe}</p>
      <h3 class="about-section__education-and-certificates-heading">Education & Certificates</h3>
      <ul class="about-section__education-and-certificates-list">${certificatesHTML}</ul>
  `;

  document.getElementById('about-section').innerHTML = aboutHTML;
}

// project section
let project3DDeviceInstance = null;

const projectSectionContents = () => {
  let projectCardHTML = '';

  projectsData.forEach((data, idx) => {
    projectCardHTML += `
        <a href="${data.link || '#'}" target="_blank" rel="noopener" class="project-card ${idx === 0 ? 'is-featured-active' : ''}" data-index="${idx}">
          <img class="project-card__arrow-icon" src="images-and-icons/icons/up-right-arrow.png" loading="lazy" alt="arrow-icon">
          <img class="project-card__img" src="images-and-icons/images/${data.image}" loading="lazy" alt="project-img">
          <div class="project-card__info">
            <h4 class="project-card__info-title">${data.title}</h4>
            <p class="project-card__info-detail">${data.detail}</p>
          </div>        
        </a>
    `;
  });

  const listEl = document.querySelector('.project-section__project-card-list');
  if (listEl) {
    listEl.innerHTML = projectCardHTML;
  }

  // Initialize 3D Device Showcase
  if (project3DDeviceInstance) {
    project3DDeviceInstance.destroy();
  }

  setTimeout(() => {
    project3DDeviceInstance = new Project3DDevice({
      containerId: 'project-3d-container',
      projects: projectsData,
    });
    window.project3DDevice = project3DDeviceInstance;

    // Synchronize hover / click on project cards with the 3D device screen
    const cards = document.querySelectorAll('.project-card');
    cards.forEach((card, idx) => {
      card.addEventListener('mouseenter', () => {
        if (window.project3DDevice) {
          window.project3DDevice.setProject(idx);
        }
      });
    });
  }, 60);
}


// skill and tools section
let techSphereInstance = null;

const skillToolsSectionContents = () => {
  // Roles pills
  const skillsHTML = skillsToolsData.skills.map(skill => `
    <div class="skill-pill">
      <span class="skill-pill__dot"></span>
      <span class="skill-pill__text">${skill.name}</span>
    </div>
  `).join('');

  // Fallback / Grid tools HTML
  const toolsHTML = skillsToolsData.tools.map(tool => `
    <div class="tools-list__tool" data-category="${(tool.category || '').toLowerCase()}" data-name="${tool.name}">
      <img class="tools-list__tool-icon" src="images-and-icons/icons/${tool.icon}" loading="lazy" alt="${tool.name}">
      <p class="tools-list__tool-label">${tool.name}</p>
    </div>`
  ).join('');

  const skillToolsHTML = `
    <h1 class="skills-tools-section__heading heading">Skills & Tech Stack</h1>
    
    <!-- Professional Roles & Specialization -->
    <div class="skills-roles-container">
      <h3 class="skills-subtitle"><i class="ph ph-briefcase"></i> Chuyên Môn & Định Hướng</h3>
      <div class="skills-badges">
        ${skillsHTML}
      </div>
    </div>

    <!-- Tech Stack Sphere & Grid -->
    <div class="tech-stack-container">
      <div class="tech-stack-header">
        <div class="tech-stack-title-wrap">
          <h3 class="skills-subtitle"><i class="ph ph-cpu"></i> Công Nghệ & Kỹ Năng (3D Sphere)</h3>
          <p class="skills-subtitle-desc">Tương tác và khám phá hệ sinh thái công nghệ qua khối cầu không gian 3D</p>
        </div>
        <div class="view-switch-tabs">
          <button class="view-tab-btn active" data-view="sphere" id="view-sphere-btn" title="Xem dạng khối cầu 3D">
            <i class="ph ph-globe"></i> <span>3D Sphere</span>
          </button>
          <button class="view-tab-btn" data-view="grid" id="view-grid-btn" title="Xem dạng lưới phẳng">
            <i class="ph ph-squares-four"></i> <span>Grid</span>
          </button>
        </div>
      </div>

      <!-- Category Filter Pills -->
      <div class="tech-category-filters" id="tech-filters">
        <button class="category-filter-btn active" data-cat="all">Tất cả</button>
        <button class="category-filter-btn" data-cat="frontend">Frontend</button>
        <button class="category-filter-btn" data-cat="backend">Backend</button>
        <button class="category-filter-btn" data-cat="database">Database</button>
        <button class="category-filter-btn" data-cat="tools">Tools & DevOps</button>
        <button class="category-filter-btn" data-cat="design">Design</button>
      </div>

      <!-- 3D Tech Sphere View -->
      <div id="tech-sphere-container" class="tech-sphere-container"></div>

      <!-- Alternative Grid View -->
      <div id="tech-grid-container" class="tools-list d-grid" style="display: none;">
        ${toolsHTML}
      </div>
    </div>
  `;

  const sectionEl = document.getElementById('skills-tools-section');
  if (!sectionEl) return;
  sectionEl.innerHTML = skillToolsHTML;

  // Initialize 3D Tech Sphere
  if (techSphereInstance) {
    techSphereInstance.destroy();
  }

  // Small delay to ensure layout dimensions are calculated
  setTimeout(() => {
    techSphereInstance = new TechSphere({
      containerId: 'tech-sphere-container',
      tools: skillsToolsData.tools,
    });
    window.techSphere = techSphereInstance;
  }, 60);

  // Setup View Switch Tabs
  const sphereBtn = document.getElementById('view-sphere-btn');
  const gridBtn = document.getElementById('view-grid-btn');
  const sphereContainer = document.getElementById('tech-sphere-container');
  const gridContainer = document.getElementById('tech-grid-container');

  if (sphereBtn && gridBtn && sphereContainer && gridContainer) {
    sphereBtn.addEventListener('click', () => {
      sphereBtn.classList.add('active');
      gridBtn.classList.remove('active');
      sphereContainer.style.display = 'block';
      gridContainer.style.display = 'none';
      if (techSphereInstance) {
        techSphereInstance.calculatePositions();
      }
    });

    gridBtn.addEventListener('click', () => {
      gridBtn.classList.add('active');
      sphereBtn.classList.remove('active');
      sphereContainer.style.display = 'none';
      gridContainer.style.display = 'grid';
    });
  }

  // Setup Category Filters
  const filterBtns = document.querySelectorAll('.category-filter-btn');
  const gridTools = document.querySelectorAll('.tools-list__tool');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cat = btn.dataset.cat;
      if (techSphereInstance) {
        techSphereInstance.setCategoryFilter(cat);
      }

      // Filter grid items too
      gridTools.forEach(tool => {
        const toolCat = tool.dataset.category || '';
        if (cat === 'all' || toolCat === cat) {
          tool.classList.remove('is-dimmed');
          tool.style.display = 'flex';
        } else {
          tool.classList.add('is-dimmed');
          tool.style.display = 'none';
        }
      });
    });
  });
}


const footerContents = () => {
  const currentYear = new Date().getFullYear();

  const footerHTML = `
    <div class="footer__container">
      <div class="footer__brand">
        <h3 class="footer__name">${personalData.name}</h3>
        <p class="footer__role">${personalData.mainSkill}</p>
        <p class="footer__school"><i class="ph ph-graduation-cap"></i> ${personalData.school}</p>
      </div>

      <div class="footer__contact-info">
        <h4 class="footer__section-title">Thông tin liên hệ</h4>
        <div class="footer__contact-item">
          <i class="ph ph-envelope"></i>
          <a href="mailto:${personalData.email}">${personalData.email}</a>
        </div>
        <div class="footer__contact-item">
          <i class="ph ph-phone"></i>
          <a href="tel:${personalData.contactNumber}">${personalData.contactNumber}</a>
        </div>
        <div class="footer__contact-item">
          <i class="ph ph-map-pin"></i>
          <span>${personalData.address}</span>
        </div>
      </div>

      <div class="footer__socials">
        <h4 class="footer__section-title">Mạng xã hội & Kênh liên kết</h4>
        <ul class="socmed-list">
          <li>
            <a href="${personalData.facebookLink}" target="_blank" rel="noopener" class="socmed-list__social" title="Facebook">
              <i class="ph ph-facebook-logo"></i>
            </a>
          </li>
          <li>
            <a href="${personalData.githubLink || 'https://github.com'}" target="_blank" rel="noopener" class="socmed-list__social" title="GitHub">
              <i class="ph ph-github-logo"></i>
            </a>
          </li>
          <li>
            <a href="mailto:${personalData.email}" class="socmed-list__social" title="Email">
              <i class="ph ph-envelope-simple"></i>
            </a>
          </li>
          <li>
            <a href="tel:${personalData.contactNumber}" class="socmed-list__social" title="Phone">
              <i class="ph ph-phone-call"></i>
            </a>
          </li>
        </ul>
      </div>
    </div>

    <div class="footer__bottom">
      <p class="footer__copy-right-txt">&copy; ${currentYear} ${personalData.name}. All rights reserved.</p>
      <p class="footer__built-with">Designed & Built with <i class="ph ph-heart-fill heart-icon"></i></p>
    </div>
  `;

  document.querySelector('footer').innerHTML = footerHTML;
}

// main function where can render all contents
function renderAllContents(){
  renderProfilePicture();
  headerContents();
  homeSectionContents();
  aboutSectionContents();
  projectSectionContents();
  skillToolsSectionContents();
  footerContents();
}

export default renderAllContents;