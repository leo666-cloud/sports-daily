(function(){
  function currentKey(){
    var m = location.pathname.match(/(\d{4}-\d{2}-\d{2})\.html$/);
    if(m) return m[1];
    return 'LATEST';
  }
  function isArchive(){ return location.pathname.indexOf('/archive/') >= 0; }
  function target(dateKey){
    var base = isArchive() ? '../' : './';
    if(dateKey === 'LATEST') return base;
    if(isArchive()) return dateKey + '.html';
    return 'archive/' + dateKey + '.html';
  }
  var btns = document.querySelectorAll('.dbtn');
  var cur = currentKey();
  btns.forEach(function(b){
    var dEl = b.querySelector('.d');
    if(!dEl) return;
    var date = dEl.textContent.trim();
    var isLatest = !!b.querySelector('.badge-new');
    var key = isLatest ? 'LATEST' : date;
    b.style.cursor = 'pointer';
    b.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      location.href = target(key) + location.search;
    });
    if(cur === key){
      b.setAttribute('aria-current','true');
      b.classList.add('active');
    } else {
      b.removeAttribute('aria-current');
      b.classList.remove('active');
    }
  });
})();
