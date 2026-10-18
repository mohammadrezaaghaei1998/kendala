// navigation bar
const navOpenBtn = document.querySelector("[data-btn-open]");
const navCloseBtn = document.querySelector("[data-btn-close]");
const nav = document.querySelector(".nav--opened"); 
let isNavOpened = true; 

navOpenBtn.onclick = () => {
    toggleNav();
};

navCloseBtn.onclick = () => {
    toggleNav();
};

function toggleNav() {
    if (isNavOpened) nav.classList.remove("nav--opened");
    else nav.classList.add("nav--opened");
    isNavOpened = !isNavOpened;
}




// Main slider right side of the page
document.addEventListener('DOMContentLoaded', function () {
    const sections = document.querySelectorAll('section'); 
    const sliderItems = document.querySelectorAll('.slider-item');
  
    function updateSlider() {
      const scrollPosition = window.scrollY;
  
      sections.forEach((section, index) => {
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;
  
        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
          sliderItems.forEach(item => item.classList.remove('active'));
          sliderItems[index].classList.add('active');
        }
      });
    }
  
    sliderItems.forEach((item, index) => {
      item.addEventListener('click', function () {
        const targetSection = document.getElementById(`section${index + 1}`);
        window.scrollTo({
          top: targetSection.offsetTop,
          behavior: 'smooth'
        });
      });
    });
  
    window.addEventListener('scroll', updateSlider);
  });




// fixed header
  document.addEventListener("DOMContentLoaded", function() {
    window.addEventListener("scroll", function() {
      var header = document.getElementById("mainHeader");
  
      if (window.pageYOffset > 100) { 
        header.classList.add("fixed-header");
      } else {
        header.classList.remove("fixed-header");
      }
    });
  });




// scrollspy with animated scroll and focus
  document.addEventListener("DOMContentLoaded", function () {
    const navLinks = document.querySelectorAll("nav ul li");
  
    function setActiveLink(currentIndex) {
      navLinks.forEach((link, index) => {
        link.classList.toggle("active", index === currentIndex);
      });
    }
  
    function scrollToSection(targetId) {
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        window.scrollTo({
          top: targetSection.offsetTop - 50, 
          behavior: "smooth",
        });
      }
    }
  
    navLinks.forEach((link, index) => {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        const targetId = this.dataset.target;
        scrollToSection(targetId);
        setActiveLink(index);
      });
    });
  
    window.addEventListener("scroll", function () {
      const scrollPosition = window.scrollY;
  
      const sectionOffsets = [
        document.getElementById("section1").offsetTop - 50,
        document.getElementById("section2").offsetTop - 50,
        document.getElementById("section3").offsetTop - 50,
      ];
  
      let activeIndex = 0;
      for (let i = sectionOffsets.length - 1; i >= 0; i--) {
        if (scrollPosition >= sectionOffsets[i]) {
          activeIndex = i;
          break;
        }
      }
  
      setActiveLink(activeIndex);
    });
  });





//step Carousel
//step 1: get DOM
let nextDom = document.getElementById('next');
let prevDom = document.getElementById('prev');

let carouselDom = document.querySelector('.carousel');
let SliderDom = carouselDom.querySelector('.carousel .list');
let thumbnailBorderDom = document.querySelector('.carousel .thumbnail');
let thumbnailItemsDom = thumbnailBorderDom.querySelectorAll('.item');
let timeDom = document.querySelector('.carousel .time');

thumbnailBorderDom.appendChild(thumbnailItemsDom[0]);
let timeRunning = 500;
let timeAutoNext = 7000;

nextDom.onclick = function(){
    showSlider('next');    
}

prevDom.onclick = function(){
    showSlider('prev');    
}
let runTimeOut;
let runNextAuto = setTimeout(() => {
    next.click();
}, timeAutoNext)
function showSlider(type){
    let  SliderItemsDom = SliderDom.querySelectorAll('.carousel .list .item');
    let thumbnailItemsDom = document.querySelectorAll('.carousel .thumbnail .item');
    
    if(type === 'next'){
        SliderDom.appendChild(SliderItemsDom[0]);
        thumbnailBorderDom.appendChild(thumbnailItemsDom[0]);
        carouselDom.classList.add('next');
    }else{
        SliderDom.prepend(SliderItemsDom[SliderItemsDom.length - 1]);
        thumbnailBorderDom.prepend(thumbnailItemsDom[thumbnailItemsDom.length - 1]);
        carouselDom.classList.add('prev');
    }
    clearTimeout(runTimeOut);
    runTimeOut = setTimeout(() => {
        carouselDom.classList.remove('next');
        carouselDom.classList.remove('prev');
    }, timeRunning);

    clearTimeout(runNextAuto);
    runNextAuto = setTimeout(() => {
        next.click();
    }, timeAutoNext)
}












