$(document).mobile(),function(){function a(a){$(".angle"+k).removeClass("show"),k=this.value,$(".angle"+k).addClass("show")}function b(a){switch(this.dataset.direction){case"next":if(h===e)return!1;h++,$("#color"+h).addClass("show");break;case"prev":if(1===h)return!1;$("#color"+h).removeClass("show"),h--}$("#controls").attr("class","controls"+$("#color"+h).attr("class").replace("color","")),h===e||1===h?this.disabled=!0:h!==e-1&&2!==h||($(this).siblings(".arrow")[0].disabled=!1)}function c(a){switch(this.dataset.direction){case"next":if(i===f)return!1;i++,$("#pattern"+i).addClass("show");break;case"prev":if(1===i)return!1;$("#pattern"+i).removeClass("show"),i--}i===f||1===i?this.disabled=!0:i!==f-1&&2!==i||($(this).siblings(".arrow")[0].disabled=!1)}function d(a){switch(this.dataset.direction){case"next":if(j===g)return!1;j++,$("#range"+j).addClass("show");break;case"prev":if(1===j)return!1;$("#range"+j).removeClass("show"),j--}j===g||1===j?this.disabled=!0:j!==g-1&&2!==j||($(this).siblings(".arrow")[0].disabled=!1)}var e=6,f=5,g=3,h=1,i=1,j=1,k=4;$("#panel1 .arrow").click(b),$("#panel2 .arrow").click(c),$("#panel3 .arrow").click(d),$("#angleSlider").on("input",a),window.onload=function(){document.body.className="","#next"===location.hash&&n.slideTo(1,0)};var l=new pageSwitch("#slider .swiper-wrapper",{duration:1e3,start:0,direction:0,loop:!0,ease:"ease",transition:"scrollCoverX",mouse:!1,mousewheel:!1,arrowkey:!1}),m=$("#slider .swiper-slide .text");$("#slider .slide-nav a").on("click",function(a){l.slide(l.current+1*("next"===this.rel?1:-1))}),m[0].classList.add("active"),l.on("before",function(a,b){m[a].classList.remove("active")}).on("after",function(a,b){m[a].classList.add("active")});var n=new Swiper("#fullpage",{direction:"vertical",effect:"slide",slidesPerView:"auto",initialSlide:0,nextButton:".swiper-btn-next",history:!1}),o=$("#nav");o.on("touchmove",function(){return!1});var p=0,q=0;n.on("touchStart",function(a){n.params.allowSwipeToPrev=0!==n.activeIndex}).on("slideNextStart",function(a){$("#nav .swiper-btn-next").parent().addClass("active")}).on("slidePrevEnd",function(a){n.slides[0].querySelector(".slide-nav").offsetHeight}),$(window).on("hashchange",function(a){0===n.activeIndex&&(r.activeIndex=0,r.slideReset())}),$("#nav .swiper-btn-next").on("click",function(a){$(this).parent().addClass("active")});var r=new Swiper("#subSlider",{direction:"vertical",effect:"slide",autoHeight:!0,nested:!0,slidesPerView:"auto",observer:!0,freeModeMomentumBounce:!1});r.on("touchStart",function(a){r.params.allowSwipeToPrev=0!==r.activeIndex,r.snapGrid[4]=r.snapGrid[3]+r.slides[3].offsetHeight-window.innerHeight+70}),$("#chair .tab li a").on("click",function(a){a.preventDefault(),$(this).parent().addClass("active").siblings(".active").removeClass("active"),$(this.getAttribute("href")).css("z-index",2).addClass("fade-in").on("animationend",function(){$(this).siblings(".fade-in").removeClass("fade-in").off("animationend")}).siblings(".fade-in").css("z-index","")}),$(".switcher .btn-group button").click(function(a){$(this).hasClass("active")||($(this).addClass("active").siblings(".active").removeClass("active"),$(this).parents(".content").find(".black").toggleClass("show"))}),$(".switcher input[type=checkbox]").change(function(a){$(this).parents(".content").find(".chrome").toggleClass("show")});for(var s=0,p=0,q=0,t=8.5,u=274-2*t-22,v=4,w=Math.floor(u/7*10)/10,x=(window.innerWidth-274)/2,y=[],z=0;z<8;z++)y[z]=w*z+t;$("#controls").on("touchstart",function(a){p=q=a.originalEvent.targetTouches[0].pageY}).on("touchmove",function(a){if(s=a.originalEvent.targetTouches[0].pageX-x,q=a.originalEvent.targetTouches[0].pageY,Math.abs(q-p)&&(a.preventDefault(),a.stopPropagation()),s<t||s>u+t+11)return!1;var b=s;b>y[v-1]+w/2+11?$("#angleSlider").val(++v).trigger("input"):b<y[v-1]-w/2+11&&$("#angleSlider").val(--v).trigger("input")}).on("touchend",function(a){})}();