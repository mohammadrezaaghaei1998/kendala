document.addEventListener('DOMContentLoaded',()=>{
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

  // Header state
  const header=$('#header');
  addEventListener('scroll',()=>header.classList.toggle('compact',scrollY>20));

  // Hero: the reference keeps one campaign's text on screen while its background behaves like a video.
  // const heroSlides=[
  //   {title:'Gulf Cup 27 in Jeddah',text:'Catch every moment of the tournament from September 23 to October 6, follow every match, and back your team alongside fans from across the Gulf.',cta:'Plan Your Visit',images:['https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=2400&q=90','https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=2400&q=90']},
  //   {title:'AFC Asian Cup Saudi 2027™',text:'Get ready for the AFC Asian Cup with exclusive packages combining match access and exciting journeys across Saudi.',cta:'Book Now',images:['https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=2400&q=90']},
  //   {title:'Water fun awaits!',text:'Largest water theme park in the region, bringing world-breaking aquatic experiences at the heart of Qiddiya City.',cta:'Explore Now',images:['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2400&q=90']},
  //   {title:'Join and Enjoy Saudi Rewards',text:'Enjoy tailored offers and earn more points!',cta:'Earn rewards',images:['https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=2400&q=90']}
  // ];
  // let heroIndex=0, heroFrame=0, heroTimer=null, heroPlaying=true;
  // const media=$('#heroMedia'), title=$('#heroTitle'), text=$('#heroText'), cta=$('#heroCta');
  // function renderHeroText(i){
  //   heroIndex=i; heroFrame=0;
  //   const s=heroSlides[i];
  //   title.textContent=s.title;text.textContent=s.text;cta.textContent=s.cta;
  //   media.style.backgroundImage=`url("${s.images[0]}")`;
  //   $$('.hero-tab').forEach((b,j)=>b.classList.toggle('active',j===i));
  // }
  // function startHero(){
  //   clearInterval(heroTimer);
  //   heroTimer=setInterval(()=>{
  //     const imgs=heroSlides[heroIndex].images;
  //     if(imgs.length>1){heroFrame=(heroFrame+1)%imgs.length;media.style.backgroundImage=`url("${imgs[heroFrame]}")`;}
  //   },3200);
  // }
  // $$('.hero-tab').forEach(b=>b.onclick=()=>{renderHeroText(+b.dataset.index);if(heroPlaying)startHero()});
  // $('#heroPause').onclick=()=>{
  //   heroPlaying=!heroPlaying;
  //   $('#heroPause i').className=heroPlaying?'fa-solid fa-pause':'fa-solid fa-play';
  //   heroPlaying?startHero():clearInterval(heroTimer);
  // };
  // renderHeroText(0);startHero();








  // HERO - DYNAMIC CONTENT FROM DJANGO ADMIN

  const heroDataElement = document.getElementById(
      "homepage-hero-data"
  );

  const heroSlides = heroDataElement
      ? JSON.parse(heroDataElement.textContent)
      : [];

  const media = document.querySelector("#heroMedia");
  const title = document.querySelector("#heroTitle");
  const heroText = document.querySelector("#heroText");
  const cta = document.querySelector("#heroCta");
  const heroTabs = document.querySelectorAll(".hero-tab");

  let heroIndex = 0;
  let heroFrame = 0;
  let heroTimer = null;
  let heroPlaying = true;

  function renderHeroText(index) {
      if (!heroSlides.length) return;

      heroIndex = index;
      heroFrame = 0;

      const slide = heroSlides[index];

      title.textContent = slide.title;
      heroText.textContent = slide.text;
      cta.textContent = slide.cta;
      cta.href = slide.url;

      if (slide.images.length) {
          media.style.backgroundImage =
              `url("${slide.images[0]}")`;
      } else {
          media.style.backgroundImage = "none";
      }

      heroTabs.forEach((tab, i) => {
          tab.classList.toggle("active", i === index);
      });
  }

  function startHero() {
      clearInterval(heroTimer);

      if (!heroSlides.length) return;

      heroTimer = setInterval(() => {
          const images = heroSlides[heroIndex].images;

          if (images.length > 1) {
              heroFrame = (heroFrame + 1) % images.length;

              media.style.backgroundImage =
                  `url("${images[heroFrame]}")`;
          }
      }, 3200);
  }

  heroTabs.forEach(tab => {
      tab.addEventListener("click", () => {
          const index = Number(tab.dataset.index);

          renderHeroText(index);

          if (heroPlaying) {
              startHero();
          }
      });
  });

  const heroPause = document.querySelector("#heroPause");

  if (heroPause) {
      heroPause.addEventListener("click", () => {
          heroPlaying = !heroPlaying;

          const icon = heroPause.querySelector("i");

          if (icon) {
              icon.className = heroPlaying
                  ? "fa-solid fa-pause"
                  : "fa-solid fa-play";
          }

          if (heroPlaying) {
              startHero();
          } else {
              clearInterval(heroTimer);
          }
      });
  }

  if (heroSlides.length) {
      renderHeroText(0);
      startHero();
  }








  // Generic horizontal carousels
  $$('.carousel-arrow').forEach(btn=>btn.onclick=()=>{
    const el=$('#'+btn.dataset.target);
    const amount=el.clientWidth*.78;
    el.scrollBy({left:btn.classList.contains('next')?amount:-amount,behavior:'smooth'});
  });

  // Things category filter
  $$('.category').forEach(btn=>btn.onclick=()=>{
    $$('.category').forEach(x=>x.classList.remove('active'));btn.classList.add('active');
    const f=btn.dataset.filter;
    $$('.thing-card').forEach(card=>card.style.display=(f==='all'||card.dataset.category===f)?'block':'none');
  });










  

  // Map interaction
  const tooltip=$('#mapTooltip');
  $$('.map-marker,.map-place').forEach(el=>el.onclick=()=>{
    const place=el.dataset.place;
    tooltip.innerHTML=`<b>${place}</b><span>${place==='Aseer'?'Nature, Culture & History, Adventure':'Explore this destination'}</span>`;
    const rect=el.getBoundingClientRect(), box=$('.map-box').getBoundingClientRect();
    if(el.classList.contains('map-marker')){
      tooltip.style.left=Math.max(15,Math.min(box.width-190,rect.left-box.left+20))+'px';
      tooltip.style.top=Math.max(15,rect.top-box.top-5)+'px';
    }
    $$('.map-place').forEach(x=>x.classList.toggle('active',x.dataset.place===place));
  });

  // Search / language / visa / login / accessibility
  const modal=$('#modal'), modalTitle=$('#modalTitle'), modalBody=$('#modalBody');
  function openModal(t,body){modalTitle.textContent=t;modalBody.innerHTML=body;modal.classList.add('open')}
  $('#modalClose').onclick=()=>modal.classList.remove('open');
  modal.onclick=e=>{if(e.target===modal)modal.classList.remove('open')};
  $('#searchBtn').onclick=()=>openModal('Search','<input autofocus placeholder="Search destinations, experiences, events...">');
  $('#langBtn').onclick=()=>openModal('Language','<p><b>English (EN)</b></p><p>العربية (AR)</p>');
  $('#visaBtn').onclick=()=>openModal('Get Your Visa','<p>Visa information and application guidance.</p><button class="purple-btn" onclick="location.href=\'https://www.visitsaudi.com/en/travel-regulations\';">Continue</button>');
  $('#loginBtn').onclick=()=>openModal('Log In / Sign Up','<input placeholder="Email address"><br><br><button class="purple-btn">Continue</button>');
  $('#accessibilityBtn').onclick=()=>openModal('Accessibility','<p>Accessibility controls</p><label><input type="checkbox" onchange="document.body.classList.toggle(\'large-text\')"> Larger text</label>');
  $('#menuBtn').onclick=()=>openModal('Menu','<p><a href="#destinations">Destinations</a></p><p><a href="#plan">Plan Your Trip</a></p><p><a href="#things">Things To Do</a></p><p><a href="#offers">Saudi Offers</a></p><p><a href="#calendar">Saudi Calendar</a></p><p><a href="#map">Interactive Map</a></p>');

  // Feedback
  $('#feedbackBtn').onclick=()=>openModal('Feedback','<textarea style="width:100%;height:120px;border:1px solid #ddd;border-radius:7px;padding:10px" placeholder="Tell us what you think"></textarea><br><br><button class="purple-btn">Submit</button>');

  // Newsletter validation
  $('#joinBtn').onclick=()=>{
    const email=$('#email').value.trim(), msg=$('#emailMsg');
    if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)){msg.textContent='Please enter a valid email address.';return}
    msg.textContent='Thanks — you are subscribed.';
  };

  if(window.AOS)AOS.init({offset:70,duration:700,once:true});
  if(window.Splitting)Splitting();
});











const toursSwiper = new Swiper(".toursSwiper", {
    slidesPerView: 1.2,
    spaceBetween: 20,

    navigation: {
        nextEl: ".tour-next",
        prevEl: ".tour-prev",
    },

    scrollbar: {
        el: ".toursSwiper .swiper-scrollbar",
        draggable: true,
    },

    breakpoints: {
        640: {
            slidesPerView: 2,
            spaceBetween: 20,
        },
        1024: {
            slidesPerView: 3,
            spaceBetween: 24,
        },
        1400: {
            slidesPerView: 4,
            spaceBetween: 24,
        },
    },
});










document.addEventListener("DOMContentLoaded", function () {

    const cards = document.querySelectorAll(".before-grid article");

    cards.forEach(card => {

        const video = card.querySelector("video");

        if (!video) return;

        card.addEventListener("mouseenter", () => {
            video.play().catch(() => {});
        });

        card.addEventListener("mouseleave", () => {
            video.pause();
            video.currentTime = 0;
        });

    });

});
