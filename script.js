// Initialize AOS (Animate On Scroll)
AOS.init({ duration:700, once:true, easing:'ease-out-cubic' });

// Create floating particles inside hero
(function createParticles(){
  const container = document.getElementById('particles');
  if(!container) return;
  const count = 40;
  for(let i=0;i<count;i++){
    const el = document.createElement('div');
    el.className = 'particle';
    const size = Math.random() * 5 + 3;
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.position = 'absolute';
    el.style.left = (Math.random()*100) + '%';
    el.style.top = (Math.random()*100) + '%';
    el.style.opacity = (Math.random()*0.6 + 0.15);
    el.style.background = 'rgba(255,255,255,'+ (Math.random()*0.5 + 0.05) +')';
    el.style.borderRadius = '50%';
    el.style.transform = 'translateY(0)';
    el.style.transition = 'transform 6s linear';
    container.appendChild(el);

    // simple motion
    (function animate(el){
      const delay = Math.random()*8000;
      setTimeout(function loop(){
        const dy = (Math.random()*120 + 40) * -1;
        el.style.transform = 'translateY('+dy+'px) rotate('+ (Math.random()*250) +'deg)';
        setTimeout(()=> {
          el.style.transform = 'translateY(0) rotate(0deg)';
        }, 6000);
        setTimeout(loop, 12000 + Math.random()*8000);
      }, delay);
    })(el);
  }
})();

// Active nav item on scroll
(function setupActiveNav(){
  const links = document.querySelectorAll('.nav-link');
  const sections = Array.from(links).map(a => {
    const target = document.querySelector(a.getAttribute('href'));
    return target;
  });

  function setActive() {
    const scroll = window.scrollY + (window.innerHeight/3);
    let activeIndex = 0;
    sections.forEach((sec, i) => {
      if(!sec) return;
      if(scroll >= sec.offsetTop) activeIndex = i;
    });
    links.forEach((a,i)=> a.classList.toggle('active', i===activeIndex));
  }

  window.addEventListener('scroll', setActive);
  window.addEventListener('resize', setActive);
  setActive();

  // smooth scroll for nav links
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', function(e){
      const target = document.querySelector(this.getAttribute('href'));
      if(target){
        e.preventDefault();
        window.scrollTo({ top: target.offsetTop - 70, behavior: 'smooth' });
      }
    });
  });
})();