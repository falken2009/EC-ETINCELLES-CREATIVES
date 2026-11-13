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
function getCart(){try{var c=JSON.parse(localStorage.getItem(KEY));return Array.isArray(c)?c:[]}catch(e){return[]}}
function setCart(c){try{localStorage.setItem(KEY,JSON.stringify(c))}catch(e){}updateBadge()}
function updateBadge(){var c=getCart(),n=c.reduce(function(s,i){return s+(i.qty||0)},0),b=document.getElementById("navCartCount");
  if(b){b.textContent=n;b.classList.toggle("hide",n===0)}}
function addItem(id,name,price,weight,photo){var c=getCart(),found=null,i;
  for(i=0;i<c.length;i++)if(c[i].id===id){found=c[i];break}
  if(found){found.qty=(found.qty||0)+1;if(photo&&!found.photo)found.photo=photo}
  else c.push({id:id,name:name,price:price,weight:weight,qty:1,photo:photo||""});
  setCart(c)}
document.addEventListener("click",function(e){var b=e.target.closest(".cart-add");if(!b)return;
  addItem(b.dataset.id,b.dataset.name,parseFloat(b.dataset.price)||0,parseInt(b.dataset.weight,10)||0,b.dataset.photo||"");
  var old=b.textContent;b.textContent="Ajouté ✓";b.disabled=true;setTimeout(function(){if(b.isConnected){b.textContent=old;b.disabled=false}},1200)});
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
      '<div class="row"><input type="number" min="1" max="99" value="'+it.qty+'" data-qty="'+i+'" aria-label="Quantité"><button type="button" class="btn danger sm" data-rm="'+i+'">Retirer</button></div></div>'
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
  if(e.target.dataset&&e.target.dataset.qty!==undefined){var cart=getCart(),i=+e.target.dataset.qty,v=Math.max(1,Math.min(99,parseInt(e.target.value,10)||1));
    if(cart[i]){cart[i].qty=v;setCart(cart);render()}}
});
holder.addEventListener("click",function(e){var b=e.target.closest("[data-rm]");if(!b)return;var cart=getCart();cart.splice(+b.dataset.rm,1);setCart(cart);render()});

function renderPaypal(total){
  var box=document.getElementById("paypal-button-container"),msg=document.getElementById("payMsg");
  if(!box||!msg)return;
  if(!window.paypal){msg.textContent=total>0?"Le paiement en ligne n'est pas configuré pour ce site.":"";box.innerHTML="";return}
  box.innerHTML="";msg.textContent="";
  if(total<=0)return;
  window.paypal.Buttons({
    style:{layout:"vertical"},
    createOrder:function(data,actions){return actions.order.create({purchase_units:[{amount:{value:total.toFixed(2),currency_code:"EUR"}}]})},
    onApprove:function(data,actions){return actions.order.capture().then(function(){
      msg.className="msg ok";msg.textContent="Paiement reçu, merci ! Vous allez recevoir une confirmation de PayPal.";
      setCart([]);render()})},
    onError:function(){msg.className="msg err";msg.textContent="Le paiement n'a pas pu être traité. Réessayez ou contactez-moi."}
  }).render("#paypal-button-container");
}
render();
})();
