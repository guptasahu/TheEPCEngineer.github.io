
const menu=document.querySelector('.menu-btn');const nav=document.querySelector('.main-nav');if(menu){menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});}
document.getElementById('year').textContent=new Date().getFullYear();
const search=document.querySelector('#article-search');const category=document.querySelector('#article-category');function filterArticles(){if(!search)return;const q=search.value.toLowerCase();const c=category.value;document.querySelectorAll('[data-article]').forEach(el=>{el.hidden=!((c==='All'||el.dataset.category===c)&&el.dataset.title.includes(q));});}if(search){search.addEventListener('input',filterArticles);category.addEventListener('change',filterArticles);}
document.querySelectorAll('form[data-demo]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();form.querySelector('.success').style.display='block';form.reset();}));
