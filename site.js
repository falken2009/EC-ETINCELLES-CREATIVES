(function(){
var grid=document.getElementById("grid"),chips=document.getElementById("chips");
if(!grid||!chips)return;
var subchips=document.getElementById("subchips");
var SUBCATS=window.SUBCATS||{};
var SUBIMG=window.SUBIMG||{};
var cards=[].slice.call(grid.querySelectorAll(".card")),cat="all",sub="",q="",input=document.getElementById("q");
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function show(){var n=0,q2=q;
var match=cards.filter(function(c){return (cat==="all"||c.dataset.cat===cat)&&(!sub||c.dataset.sub===sub)&&(!q2||c.dataset.name.indexOf(q2)>=0)});
var recent=!sub&&cat!=="all"&&SUBCATS[cat]&&SUBCATS[cat].length>0&&!q2;
var keep=match;
if(recent){keep=match.slice().sort(function(a,b){return b.dataset.n-a.dataset.n}).slice(0,5)}
cards.forEach(function(c){var ok=keep.indexOf(c)>=0;c.hidden=!ok;if(ok)n++});
var none=document.getElementById("none");none.hidden=n>0;
none.textContent="Aucun article ne correspond à votre recherche.";
document.getElementById("count").textContent=n+" résultat"+(n>1?"s":"")}
function buildSubchips(){
  var list=cat!=="all"?(SUBCATS[cat]||[]):[];
  if(!subchips)return;
  if(!list.length){subchips.hidden=true;subchips.innerHTML="";return}
  var img=cat!=="all"?(SUBIMG[cat]||{}):{};
  var html='<button type="button" class="chip on" data-sub="" aria-pressed="true">Récent</button>';
  html+=list.map(function(s){
    var pic=img[s]?'<img src="'+esc(img[s])+'" alt="" loading="lazy">':"";
    return '<button type="button" class="chip" data-sub="'+esc(s)+'" aria-pressed="false">'+pic+esc(s)+'</button>'
  }).join("");
  subchips.innerHTML=html;
  subchips.hidden=false;
}
function setSub(s){sub=s;if(subchips)[].forEach.call(subchips.querySelectorAll("button"),function(b){var on=b.dataset.sub===s;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on)});show()}
function setCat(c){cat=c;sub="";[].forEach.call(chips.querySelectorAll("button"),function(b){var on=b.dataset.cat===c;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on)});buildSubchips();show()}
chips.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;var c=cat===b.dataset.cat?"all":b.dataset.cat;setCat(c);
try{history.replaceState(null,"",c==="all"?location.pathname+location.search:"#rayon-"+c)}catch(x){}});
if(subchips)subchips.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;setSub(sub===b.dataset.sub?"":b.dataset.sub)});
function fromHash(){var m=/^#rayon-(\d+)$/.exec(location.hash);setCat(m&&chips.querySelector('[data-cat="'+m[1]+'"]')?m[1]:"all")}
window.addEventListener("hashchange",fromHash);
try{q=(new URLSearchParams(location.search).get("q")||"").trim().toLowerCase();if(input)input.value=q}catch(x){}
if(input){input.addEventListener("input",function(){q=this.value.trim().toLowerCase();show()});
input.form.addEventListener("submit",function(e){e.preventDefault();input.blur()})}
document.getElementById("sort").addEventListener("change",function(){var v=this.value;
cards.sort(function(a,b){return v==="n"?a.dataset.n-b.dataset.n:(v==="up"?1:-1)*(a.dataset.price-b.dataset.price)||a.dataset.n-b.dataset.n});
cards.forEach(function(c){grid.appendChild(c)})});
fromHash();
})();

(function(){
"use strict";
var KEY="panier_v1";
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function euro(n){return n.toFixed(2).replace(".",",")+" €"}
var TTL=3600000; // un article reste 1 heure dans le panier, puis il est retiré
function getCart(){try{var c=JSON.parse(localStorage.getItem(KEY));if(!Array.isArray(c))return[];
  var now=Date.now(),k=c.filter(function(i){return !i.t||now-i.t<TTL});
  if(k.length!==c.length){try{localStorage.setItem(KEY,JSON.stringify(k))}catch(e){}}
  return k}catch(e){return[]}}
function setCart(c){try{localStorage.setItem(KEY,JSON.stringify(c))}catch(e){}updateBadge()}
function updateBadge(){var c=getCart(),n=c.reduce(function(s,i){return s+(i.qty||0)},0),b=document.getElementById("navCartCount");
  if(b){b.textContent=n;b.classList.toggle("hide",n===0)}}
function addItem(id,name,price,weight,photo,max,tot){var c=getCart(),found=null,i;max=max>0?max:99;tot=tot>0?tot:max;
  for(i=0;i<c.length;i++)if(c[i].id===id){found=c[i];break}
  if(found){found.max=max;found.tot=tot;found.t=Date.now();found.qty=Math.min(max,(found.qty||0)+1);if(photo&&!found.photo)found.photo=photo}
  else c.push({id:id,name:name,price:price,weight:weight,qty:1,max:max,tot:tot,t:Date.now(),photo:photo||""});
  setCart(c)}
document.addEventListener("click",function(e){var b=e.target.closest(".cart-add");if(!b)return;
  addItem(b.dataset.id,b.dataset.name,parseFloat(b.dataset.price)||0,parseInt(b.dataset.weight,10)||0,b.dataset.photo||"",parseInt(b.dataset.max,10)||99,parseInt(b.dataset.tot,10)||0);
  var old=b.textContent;b.textContent="Ajouté ✓";b.disabled=true;setTimeout(function(){if(b.isConnected){b.textContent=old;b.disabled=false;refreshAdd()}},1200)});
// Quand tous les exemplaires disponibles d'un objet sont déjà dans le panier du visiteur, le bouton passe en « Épuisé ».
function refreshAdd(){var c=getCart();[].slice.call(document.querySelectorAll(".cart-add")).forEach(function(b){
  var id=b.dataset.id,mx=parseInt(b.dataset.max,10)||99,n=0;c.forEach(function(i){if(i.id===id)n+=i.qty||0});
  if(!b.dataset.label)b.dataset.label=b.textContent;
  if(n>=mx){b.disabled=true;b.textContent="Épuisé";b.title="Tous les exemplaires disponibles sont dans votre panier"}
  else if(b.textContent==="Épuisé"){b.disabled=false;b.textContent=b.dataset.label;b.title=""}})}
window.refreshAdd=refreshAdd;refreshAdd();setInterval(refreshAdd,30000);
updateBadge();

var holder=document.getElementById("cartItems");
if(!holder)return; // le reste ne s'applique qu'à la page panier

function shipFor(weight,tiers){if(weight<=0||!tiers||!tiers.length)return null;
  var sorted=tiers.slice().sort(function(a,b){return a.maxG-b.maxG}),i;
  for(i=0;i<sorted.length;i++)if(sorted[i].maxG>0&&weight<=sorted[i].maxG)return parseFloat((sorted[i].price+"").replace(",","."));
  return parseFloat((sorted[sorted.length-1].price+"").replace(",","."))}
var SD=window.SHIP_DATA||{mode:"auto",mondialRelay:[],colissimo:[],custom:[],shipNote:""};
var cartEmpty=document.getElementById("cartEmpty"),cartTotals=document.getElementById("cartTotals"),shipHolder=document.getElementById("shipChoices"),totalEl=document.getElementById("cartTotal");

function render(){
  var cart=getCart();
  if(!cart.length){holder.innerHTML="";cartEmpty.classList.remove("hide");cartTotals.classList.add("hide");return}
  cartEmpty.classList.add("hide");cartTotals.classList.remove("hide");
  var weight=0;
  holder.innerHTML=cart.map(function(it,i){
    weight+=(it.weight||0)*it.qty;
    var pic=it.photo?'<img src="'+esc(it.photo)+'" alt="" class="thumb">':'<div class="thumb ph" aria-hidden="true"></div>';
    return '<div class="cart-item">'+pic+'<div><div class="nm">'+esc(it.name)+'</div><div class="sub">'+euro(it.price)+' × '+it.qty+' = '+euro(it.price*it.qty)+'</div></div>'+
      '<div class="row"><input type="number" min="1" max="'+(it.max||99)+'" value="'+it.qty+'" data-qty="'+i+'" aria-label="Quantité"><button type="button" class="btn danger sm" data-rm="'+i+'">Retirer</button></div></div>'
  }).join("");
  var opts=[];
  if(SD.mode==="custom"){var cp=shipFor(weight,SD.custom);if(cp!=null)opts.push({id:"custom",label:"Livraison",price:cp})}
  else{
    var mr=shipFor(weight,SD.mondialRelay);if(mr!=null)opts.push({id:"mr",label:"Mondial Relay (point relais)",price:mr});
    var co=shipFor(weight,SD.colissimo);if(co!=null)opts.push({id:"co",label:"Colissimo (point retrait)",price:co});
  }
  if(!opts.length){shipHolder.innerHTML='<p class="msg">Indiquez le poids de vos objets pour calculer la livraison.</p>'}
  else{
    shipHolder.innerHTML='<label style="display:block;font-weight:700;margin-bottom:6px">Livraison</label>'+opts.map(function(o,i){
      return '<label class="ship-opt"><input type="radio" name="ship" value="'+o.id+'" data-price="'+o.price+'"'+(i===0?" checked":"")+'> '+esc(o.label)+' — '+euro(o.price)+'</label>'
    }).join("")+(SD.shipNote?'<p class="help" style="color:var(--muted);font-size:.85rem">'+esc(SD.shipNote)+'</p>':"");
  }
  updateTotal();
}
function currentShipPrice(){var r=document.querySelector('input[name="ship"]:checked');return r?parseFloat(r.dataset.price)||0:0}
function updateTotal(){
  var cart=getCart(),subtotal=cart.reduce(function(s,i){return s+i.price*i.qty},0),ship=currentShipPrice(),total=subtotal+ship;
  totalEl.textContent="Total : "+euro(total)+(ship?" (dont "+euro(ship)+" de livraison)":"");
  renderPaypal(total);
}
document.addEventListener("change",function(e){
  if(e.target.name==="ship"){updateTotal();return}
  if(e.target.dataset&&e.target.dataset.qty!==undefined){var cart=getCart(),i=+e.target.dataset.qty,v=Math.max(1,Math.min(cart[i]&&cart[i].max?cart[i].max:99,parseInt(e.target.value,10)||1));
    if(cart[i]){cart[i].qty=v;setCart(cart);render()}}
});
holder.addEventListener("click",function(e){var b=e.target.closest("[data-rm]");if(!b)return;var cart=getCart();cart.splice(+b.dataset.rm,1);setCart(cart);render()});

function notifyOrder(d,cart,total){var h=window.ORDER_HOOK;if(!h)return;
  try{var p=new URLSearchParams();p.set("orderId",(d&&d.id)||"");p.set("total",total.toFixed(2));
    p.set("payer",(d&&d.payer&&d.payer.email_address)||"");
    p.set("items",cart.map(function(i){return i.id+"__"+i.qty}).join(","));
    p.set("names",cart.map(function(i){return i.qty+" x "+i.name}).join(" ; "));
    fetch(h,{method:"POST",mode:"no-cors",keepalive:true,body:p})}catch(e){}}
function renderPaypal(total){
  var box=document.getElementById("paypal-button-container"),msg=document.getElementById("payMsg");
  if(!box||!msg)return;
  if(!window.paypal){msg.textContent=total>0?"Le paiement en ligne n'est pas configuré pour ce site.":"";box.innerHTML="";return}
  box.innerHTML="";msg.textContent="";
  if(total<=0)return;
  window.paypal.Buttons({
    style:{layout:"vertical"},
    createOrder:function(data,actions){
      var go=function(){return actions.order.create({purchase_units:[{amount:{value:total.toFixed(2),currency_code:"EUR"}}]})};
      if(!window.checkStock)return go();
      return window.checkStock().then(function(r){
        if(r.removed.length){render();msg.className="msg err";msg.textContent="Désolé, « "+r.removed.join(" », « ")+" » vient d'être vendu et a été retiré de votre panier.";throw new Error("stock")}
        return go()})},
    onApprove:function(data,actions){return actions.order.capture().then(function(d){
      notifyOrder(d,getCart(),total);
      msg.className="msg ok";msg.textContent="Paiement reçu, merci ! Vous allez recevoir une confirmation de PayPal.";
      setCart([]);render()})},
    onError:function(err){if(err&&err.message==="stock")return;msg.className="msg err";msg.textContent="Le paiement n'a pas pu être traité. Réessayez ou contactez-moi."}
  }).render("#paypal-button-container");
}
render();
var lastN=getCart().length;
setInterval(function(){var n=getCart().length;updateBadge();if(n!==lastN){lastN=n;render()}},30000);
})();

// Stock partagé : chaque vente payée crée un fichier vendus/<objet>__<quantité>__<commande>.txt dans le dépôt GitHub
// (par Make). Le site lit ce dossier pour griser les objets vendus et limiter les quantités.
(function(){
"use strict";
var repo=window.SHOP_REPO;if(!repo)return;
var KEY="panier_v1",CK="vendus_v1";
function readCart(){try{var c=JSON.parse(localStorage.getItem(KEY));return Array.isArray(c)?c:[]}catch(e){return[]}}
function parse(list){var m={};(list||[]).forEach(function(f){var n=String(f.name||"").replace(/\.txt$/,"").split("__");
  if(n.length>=2){var q=parseInt(n[1],10)||1;m[n[0]]=(m[n[0]]||0)+q}});return m}
function fetchSold(force){return new Promise(function(res){
  if(!force){try{var c=JSON.parse(sessionStorage.getItem(CK));if(c&&Date.now()-c.t<60000)return res(c.m)}catch(e){}}
  fetch("https://api.github.com/repos/"+repo+"/contents/vendus",{cache:"no-store"}).then(function(r){return r.ok?r.json():[]}).then(function(l){
    var m=parse(Array.isArray(l)?l:[]);try{sessionStorage.setItem(CK,JSON.stringify({t:Date.now(),m:m}))}catch(e){}res(m)}).catch(function(){res({})})})}
function fixCart(sold){var c=readCart(),removed=[],k=[],changed=false;
  c.forEach(function(it){var tot=it.tot||it.max||99,rem=tot-(sold[it.id]||0);
    if(rem<=0){removed.push(it.name);changed=true;return}
    if(it.max!==rem||it.qty>rem){changed=true}
    it.max=rem;if(it.qty>rem)it.qty=rem;k.push(it)});
  if(changed){try{localStorage.setItem(KEY,JSON.stringify(k))}catch(e){}}
  return removed}
window.checkStock=function(){return fetchSold(true).then(function(sold){return{removed:fixCart(sold),sold:sold}})};
fetchSold(false).then(function(sold){
  [].slice.call(document.querySelectorAll(".cart-add")).forEach(function(b){
    var tot=parseInt(b.dataset.max,10)||1;b.dataset.tot=tot;var rem=tot-(sold[b.dataset.id]||0);
    if(rem<=0){var s=document.createElement("span");s.className="badge";s.textContent="Épuisé";b.parentNode.replaceChild(s,b)}
    else b.dataset.max=rem});
  if(window.refreshAdd)window.refreshAdd();
  if(fixCart(sold).length&&document.getElementById("cartItems")){location.reload()}
  var cb=document.getElementById("navCartCount");if(cb){var n=readCart().reduce(function(a,i){return a+(i.qty||0)},0);cb.textContent=n;cb.classList.toggle("hide",n===0)}});
})();

// Galerie, zoom plein écran et bouton « haut de page »
(function(){
"use strict";
var main=document.getElementById("mainPic"),thumbs=[].slice.call(document.querySelectorAll(".thumb"));
var list=thumbs.length?thumbs.map(function(t){return t.dataset.src}):(main?[main.getAttribute("src")]:[]),cur=0;
function show(i){cur=(i+list.length)%list.length;if(main){main.src=list[cur]}thumbs.forEach(function(t,k){t.classList.toggle("on",k===cur)})}
thumbs.forEach(function(t,k){t.addEventListener("click",function(){show(k)})});
var lb=null,lbImg,lbC;
function build(){lb=document.createElement("div");lb.className="lb";lb.hidden=true;lb.setAttribute("role","dialog");lb.setAttribute("aria-modal","true");lb.setAttribute("aria-label","Photo agrandie");
 lb.innerHTML='<img alt=""><button type="button" class="lb-x" aria-label="Fermer">✕</button>'+(list.length>1?'<button type="button" class="lb-p" aria-label="Photo précédente">‹</button><button type="button" class="lb-n" aria-label="Photo suivante">›</button>':'')+'<div class="lb-c"></div>';
 document.body.appendChild(lb);lbImg=lb.querySelector("img");lbC=lb.querySelector(".lb-c");
 lb.addEventListener("click",function(e){var b=e.target.closest("button");if(b){if(b.className==="lb-x")close();else if(b.className==="lb-p")go(-1);else go(1);return}
  if(e.target===lbImg){lbImg.classList.toggle("big");return}close()});
 var x0=null;lb.addEventListener("touchstart",function(e){if(e.touches.length===1)x0=e.touches[0].clientX},{passive:true});
 lb.addEventListener("touchend",function(e){if(x0===null||lbImg.classList.contains("big"))return;var dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>50)go(dx<0?1:-1)});
 document.addEventListener("keydown",function(e){if(lb.hidden)return;if(e.key==="Escape")close();else if(e.key==="ArrowLeft")go(-1);else if(e.key==="ArrowRight")go(1)})}
function paint(){lbImg.classList.remove("big");lbImg.src=list[cur];lbImg.alt=main?main.alt:"";lbC.textContent=list.length>1?(cur+1)+" / "+list.length:"Touchez la photo pour zoomer"}
function open(){if(!list.length)return;if(!lb)build();paint();lb.hidden=false;document.body.style.overflow="hidden";lb.querySelector(".lb-x").focus()}
function close(){lb.hidden=true;document.body.style.overflow="";var z=document.querySelector(".zoom-btn");if(z)z.focus()}
function go(d){show(cur+d);paint()}
if(main){main.addEventListener("click",open);var zb=document.querySelector(".zoom-btn");if(zb)zb.addEventListener("click",open)}
var up=document.createElement("button");up.type="button";up.className="totop";up.setAttribute("aria-label","Revenir en haut de la page");up.textContent="↑";
up.addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"})});document.body.appendChild(up);
var tick=false;window.addEventListener("scroll",function(){if(tick)return;tick=true;requestAnimationFrame(function(){up.classList.toggle("show",window.scrollY>700);tick=false})},{passive:true});
})();


(function(){
  if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var G=window.__fxGlyphs||null;
  var c=document.createElement("canvas");c.setAttribute("aria-hidden","true");
  c.style.cssText="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  document.body.appendChild(c);var x=c.getContext("2d"),W,H,f=[],N=G?34:70;
  function size(){W=c.width=window.innerWidth;H=c.height=window.innerHeight}
  size();window.addEventListener("resize",size);
  for(var i=0;i<N;i++)f.push({x:Math.random()*W,y:Math.random()*H,r:1+Math.random()*3,v:.4+Math.random()*1.1,d:Math.random()*Math.PI*2,g:G?G[i%G.length]:""});
  function tick(){
    x.clearRect(0,0,W,H);x.fillStyle="rgba(255,255,255,.9)";x.shadowColor="rgba(0,0,0,.25)";x.shadowBlur=3;x.textAlign="center";x.textBaseline="middle";
    for(var i=0;i<N;i++){var s=f[i];s.y+=s.v;s.d+=.01;s.x+=Math.sin(s.d)*.6;
      if(s.y>H+20){s.y=-20;s.x=Math.random()*W}
      if(G){x.font=(14+s.r*4)+"px sans-serif";x.fillText(s.g,s.x,s.y)}
      else{x.beginPath();x.arc(s.x,s.y,s.r,0,Math.PI*2);x.fill()}}
    requestAnimationFrame(tick)}
  tick();
})();
