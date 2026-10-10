(function(){
  var css = document.createElement('style');
  css.textContent = [
    `.hist-banner{background:#1F6F4A;color:#fff;padding:10px 18px;border-radius:10px;margin:0 0 14px;display:flex;justify-content:space-between;align-items:center;font-size:13px;flex-wrap:wrap;gap:8px;position:sticky;top:54px;z-index:20;box-shadow:0 6px 18px rgba(0,0,0,.12)}`,
    `.hist-banner .back{background:rgba(255,255,255,.18);color:#fff;padding:5px 12px;border-radius:999px;cursor:pointer;border:none;font-size:12px}`,
    `.hist-banner .back:hover{background:rgba(255,255,255,.3)}`,
    `.hist-list{list-style:none;padding:0;margin:10px 0 0}`,
    `.hist-list li{padding:11px 0;border-bottom:1px solid rgba(128,128,128,.18);font-size:14px;line-height:1.6}`,
    `.hist-list li:before{content:'·';color:#1F6F4A;font-weight:bold;margin-right:10px;font-size:18px}`,
    `.hist-note{margin-top:24px;padding:14px 16px;background:rgba(224,163,46,.12);border-left:3px solid #E0A32E;font-size:12.5px;border-radius:4px;color:inherit}`,
    `.hist-loading{padding:40px;text-align:center;opacity:.6;font-size:14px}`
  ].join('\n');
  document.head.appendChild(css);

  var btns = document.querySelectorAll('.dbtn');
  var mainEl = document.querySelector('main');
  var mastInner = document.querySelector('.mast-inner');
  var tickerTrack = document.querySelector('.ticker-track');
  var origMain = mainEl ? mainEl.innerHTML : '';
  var origMast = mastInner ? mastInner.innerHTML : '';
  var origTicker = tickerTrack ? tickerTrack.innerHTML : '';

  function detectDateFromUrl(){
    var m = location.search.match(/[?&]date=(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : null;
  }
  function setActive(key){
    btns.forEach(function(b){
      var isLatest = !!b.querySelector('.badge-new');
      var dEl = b.querySelector('.d');
      var k = isLatest ? 'LATEST' : (dEl ? dEl.textContent.trim() : '');
      if(k === key){ b.classList.add('active'); b.setAttribute('aria-current','true'); }
      else { b.classList.remove('active'); b.removeAttribute('aria-current'); }
    });
  }

  function rebindFilters(){
    var fbtns = document.querySelectorAll('#sb-filt .f');
    fbtns.forEach(function(b){
      b.onclick = function(){
        fbtns.forEach(function(x){x.classList.remove('active')});
        b.classList.add('active');
        var f = b.getAttribute('data-f');
        document.querySelectorAll('.sb li').forEach(function(li){
          if(f === 'all'){ li.style.display=''; return; }
          li.style.display = (li.getAttribute('data-g') === f) ? '' : 'none';
        });
      };
    });
  }
  rebindFilters();

  function bannerHTML(dateKey){
    return `<div class='hist-banner'><span>📅 ${dateKey} · 历史期次（完整快照）</span><button class='back' id='hist-back-btn'>← 返回最新一期</button></div>`;
  }
  function bindBack(){
    var backBtn = document.getElementById('hist-back-btn');
    if(backBtn) backBtn.addEventListener('click', function(e){ e.preventDefault(); restoreLatest(true); });
  }

  function renderFullSnapshot(dateKey, html){
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var newMain = doc.querySelector('main');
    var newMast = doc.querySelector('.mast-inner');
    var newTicker = doc.querySelector('.ticker-track');
    if(!newMain) throw new Error('snapshot missing main');
    var inner = newMain.innerHTML;
    mainEl.innerHTML = bannerHTML(dateKey) + inner;
    if(newMast && mastInner) mastInner.innerHTML = newMast.innerHTML;
    if(newTicker && tickerTrack) tickerTrack.innerHTML = newTicker.innerHTML;
    rebindFilters();
    bindBack();
    setActive(dateKey);
    window.scrollTo({top:0, behavior:'instant'});
  }

  function renderIndexSnapshot(dateKey, html){
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var tickerSpans = Array.prototype.map.call(doc.querySelectorAll('.arch-ticker span'), function(s){ return s.textContent.trim(); });
    var lis = Array.prototype.map.call(doc.querySelectorAll('.arch-list li'), function(li){ return li.textContent.trim(); });
    var sub = doc.querySelector('.arch-mast .sub');
    var subText = sub ? sub.textContent.trim() : '';
    if(tickerTrack){
      tickerTrack.innerHTML = tickerSpans.map(function(t){
        return `<div class='ticker-set'><span class='tk'>${t}</span></div>`;
      }).join('');
    }
    if(mastInner){
      var brandLine = mastInner.querySelector('.brandline');
      mastInner.innerHTML =
        (brandLine ? brandLine.outerHTML : '') +
        `<h1 style='font-size:30px;margin:6px 0 4px'>体育与运动品牌动态</h1>` +
        `<p style='opacity:.75;font-size:13px;margin:0'>📅 ${subText}</p>`;
    }
    var out = bannerHTML(dateKey);
    out += `<h2 style='font-size:19px;margin:14px 0 6px'>条目索引 <span class='mono' style='opacity:.5;font-size:13px'>(${lis.length} 条)</span></h2>`;
    out += `<ul class='hist-list'>`;
    lis.forEach(function(li){ out += `<li>${li}</li>`; });
    out += `</ul>`;
    out += `<div class='hist-note'>本期为早期索引快照（完整赛果看板与新闻详情未随归档保存）。2026-10-10 起的历史期次已升级为完整页面快照。</div>`;
    mainEl.innerHTML = out;
    bindBack();
    setActive(dateKey);
  }

  function renderHistory(dateKey){
    if(!mainEl) return;
    mainEl.innerHTML = `<div class='hist-loading'>正在加载 ${dateKey} 历史期次…</div>`;
    fetch('archive/' + dateKey + '.html')
      .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function(html){
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var isFull = doc.querySelector('.dash') || doc.querySelector('.prose .item');
        if(isFull){ renderFullSnapshot(dateKey, html); }
        else { renderIndexSnapshot(dateKey, html); }
      })
      .catch(function(err){
        mainEl.innerHTML = `<div class='hist-loading'>加载失败：${err.message} · <a href='archive/${dateKey}.html' style='color:#1F6F4A'>直接打开归档页</a></div>`;
      });
  }

  function restoreLatest(push){
    if(push){ history.pushState({}, '', location.pathname); }
    if(mainEl) mainEl.innerHTML = origMain;
    if(mastInner) mastInner.innerHTML = origMast;
    if(tickerTrack) tickerTrack.innerHTML = origTicker;
    rebindFilters();
    setActive('LATEST');
    window.scrollTo({top:0, behavior:'smooth'});
  }

  btns.forEach(function(b){
    var isLatest = !!b.querySelector('.badge-new');
    var dEl = b.querySelector('.d');
    var date = dEl ? dEl.textContent.trim() : '';
    var key = isLatest ? 'LATEST' : date;
    b.style.cursor = 'pointer';
    b.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      if(key === 'LATEST'){ restoreLatest(true); }
      else { history.pushState({}, '', '?date=' + key); renderHistory(key); }
    });
  });

  window.addEventListener('popstate', function(){
    var d = detectDateFromUrl();
    if(d) renderHistory(d); else restoreLatest(false);
  });

  var initDate = detectDateFromUrl();
  if(initDate){ setActive(initDate); renderHistory(initDate); }
  else { setActive('LATEST'); }
})();
