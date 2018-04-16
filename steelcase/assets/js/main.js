//Open the Mobile Front-end Codebase JS

(function(win, doc) {

  $(doc).mobile();

  var nrColors = 6;
  var nrAngles = 9;
  var nrPatterns = 5;
  var nrRanges = 3;
  var currentColor = 1;
  var currentAngle = 4;
  var currentPattern = 1;
  var currentRange = 1;

  // Init Event Handlers
  // $('#panel1 .arrow').click(changeColor);
  // $('#panel2 .arrow').click(changePattern);
  // $('#panel3 .arrow').click(changeRange);
  $('#angleSlider').on('input', changeAngle);

  var margin = (window.innerWidth - $('.chair').width()) / 2;
  $('.color section, .pattern section').css('left', margin);
  $('.range section').css('left', margin - 69);
  $('.shadow').css('left', margin - $('.shadow').width() + $('.chair').width() + 1);


  /**
   * Handle Angle change
   * @param {*} e - jQuery event passed from slider
   */
  function changeAngle(e) {
    // Hide current position
    $('.angle' + currentAngle).removeClass('show');

    // Set new angle based on slider position
    currentAngle = this.value;

    // Show the new angle
    $('.angle' + currentAngle).addClass('show');
  }

  /**
   * Handle Color Change based on CTA id 
   */
  function changeColor(e) {
    switch (this.dataset.direction) {
      case 'next':
        // check if end of colours are reached
        if (currentColor === nrColors) {
          $('#color' + currentColor).addClass('hidden');
          currentColor = 0;
        } else {
          $('[id^=color].hidden').removeClass('hidden');
        }

        $('#bgcolor').attr('class', $('#color' + (currentColor === 0 ? nrColors : currentColor)).attr('class').replace(/\s?hidden/, '').replace(/\s?show/, function(match) {
          console.log(match);
          return ' show';
        }));
        // increase color count
        currentColor++;

        break;

      case 'prev':
        // check if beginning of color range is reached        
        console.log(currentColor);
        if (currentColor === 1) {
          // $('#color' + currentColor).addClass('hidden');
          currentColor = nrColors + 1;
        } else $('#color' + currentColor).removeClass('hidden');

        $('#bgcolor').attr('class', $('#color' + (currentColor === nrColors + 1 ? nrColors : currentColor - 1)).attr('class').replace(/\s?hidden/, '') + ' show');
        // decrease colour count;
        currentColor--;

        break;
    }
    // remove current colour
    $('[id^=color].show').removeClass('show');
    $('#color' + currentColor).addClass('show');
    $('#controls').attr('class', 'controls' + $('#color' + currentColor).attr('class').replace('color', ''));


    if (currentColor === nrColors || currentColor === 1) {
      // this.disabled = true;
    } else if (currentColor === nrColors - 1 || currentColor === 2) {
      // $(this).siblings('.arrow')[0].disabled = false;
    }
  }

  /**
   * Handle Pattern Change based on CTA id 
   */
  function changePattern(e) {
    switch (this.dataset.direction) {
      case 'next':
        // check if end of colours are reached
        if (currentPattern === nrPatterns) return false;

        // increase pattern count
        currentPattern++;

        // show new colour
        $('#pattern' + currentPattern).addClass('show');
        break;

      case 'prev':
        // check if beginning of pattern range is reached        
        if (currentPattern === 1) return false;

        // remove current colour
        $('#pattern' + currentPattern).removeClass('show');

        // decrease colour count;
        currentPattern--;
        break;
    }

    if (currentPattern === nrPatterns || currentPattern === 1) {
      // this.disabled = true;
    } else if (currentPattern === nrPatterns - 1 || currentPattern === 2) {
      // $(this).siblings('.arrow')[0].disabled = false;
    }
  }

  /**
   * Handle Range Change based on CTA id 
   */
  function changeRange(e) {
    switch (this.dataset.direction) {
      case 'next':
        // check if end of colours are reached
        if (currentRange === nrRanges) return false;

        // increase range count
        currentRange++;

        // show new colour
        $('#range' + currentRange).addClass('show');
        // .find('h1').each(function() {
        //   $(this).css('left', (window.innerWidth - $(this).width()) / 2);
        // });

        break;

      case 'prev':
        // check if beginning of range range is reached        
        if (currentRange === 1) return false;

        // remove current colour
        $('#range' + currentRange).removeClass('show');

        // decrease colour count;
        currentRange--;
        break;
    }

    if (currentRange === nrRanges || currentRange === 1) {
      // this.disabled = true;
    } else if (currentRange === nrRanges - 1 || currentRange === 2) {
      // $(this).siblings('.arrow')[0].disabled = false;
    }
  }


  // Index loading and first screen ads.
  win.onload = function() {
    doc.body.className = '';
    if (location.hash === '#next') {
      // var y = 70 - window.innerHeight;
      // $('#nav .swiper-btn-next').parent().addClass('active')
      swiper.slideTo(1, 0);
      // .parent()
      // .css({
      //   '-webkit-transition': 'none',
      //   'transition': 'none',
      //   '-webkit-transform': 'translate(0, ' + y + 'px)',
      //   'transform': 'translate(0, ' + y + 'px)',
      // });
      // swiper.detachEvents();
    }
  };

  var ps1 = new pageSwitch('#slice1', {
    duration: 500,
    start: 0,
    direction: 0,
    loop: true,
    ease: 'ease-in-out',
    transition: 'sliceX',
    freeze: false
  });

  $('#panel1 .arrow').on('click', function(e) {
    ps1.slide(ps1.current + 1 * (this.dataset.direction === 'next' ? 1 : -1));
  });
  ps1.on('before', function(m, n) {
    $('#controls').attr('class', 'controls' + $('#color' + (n + 1)).attr('class').replace('color', ''));
  });

  var ps2 = new pageSwitch('#slice2', {
    duration: 500,
    start: 0,
    direction: 0,
    loop: true,
    ease: 'ease-in-out',
    transition: 'sliceX',
    freeze: false
  });

  $('#panel2 .arrow').on('click', function(e) {
    ps2.slide(ps2.current + 1 * (this.dataset.direction === 'next' ? 1 : -1));
  });

  var ps3 = new pageSwitch('#slice3', {
    duration: 500,
    start: 0,
    direction: 0,
    loop: true,
    ease: 'ease-in-out',
    transition: 'sliceX',
    freeze: false
  });

  $('#panel3 .arrow').on('click', function(e) {
    ps3.slide(ps3.current + 1 * (this.dataset.direction === 'next' ? 1 : -1));
  });

  // the first screen ads slider
  var slider = new pageSwitch('#slider .swiper-wrapper', {
      duration: 1000,
      start: 0,
      direction: 0,
      loop: true,
      ease: 'ease',
      transition: 'scrollCoverX',
      mouse: false,
      mousewheel: false,
      arrowkey: false
    }),
    text = $('#slider .swiper-slide .text');

  $('#slider .slide-nav a').on('click', function(e) {
    slider.slide(slider.current + 1 * (this.rel === 'next' ? 1 : -1));
  });
  text[0].classList.add('active');
  slider.on('before', function(m, n) {
    text[m].classList.remove('active');
  }).on('after', function(m, n) {
    text[m].classList.add('active');
  });

  // first fullscreen swiper
  var swiper = new Swiper('#fullpage', {
    direction: 'vertical',
    effect: 'slide',
    slidesPerView: 'auto',
    initialSlide: 0,
    nextButton: '.swiper-btn-next',
    // freeMode: true,
    // hashnav: true,
    // hashnavWatchState: true,
    history: false,
  });

  var nav = $('#nav');
  nav.on('touchmove', function() {
    return false;
  });
  // duplicate nav to nav1
  // nav
  //   .clone(true)
  //   .attr('id', 'nav1')
  //   .hide()
  //   .css('position', 'relative')
  //   .appendTo('.placeholder:eq(1)');

  // disable the first screen scroll up and down.
  var startY = 0;
  var currentY = 0;

  // swiper.slides.eq(0)
  //   .on('touchstart', function(e) {
  //     startY = currentY = e.originalEvent.targetTouches[0].pageY;
  //   })
  //   .on('touchmove', function(e) {
  //     currentY = e.originalEvent.targetTouches[0].pageY;

  //     if (startY != currentY) {
  //       return false;
  //     }
  //   });

  swiper
    .on('touchStart', function(e) {
      // disable first ads screen drop down
      swiper.params.allowSwipeToPrev = swiper.activeIndex !== 0;
      // swiper.params.allowSwipeToNext = swiper.activeIndex !== 0;
    })
    .on('slideNextStart', function(e) {
      // add 'active' class when transition to next slide
      $('#nav .swiper-btn-next').parent().addClass('active');
    })
    .on('slidePrevStart', function(e) {
      // swiper.slides[0].querySelector('.slide-nav').style.opacity = 0.95;
    })
    .on('slidePrevEnd', function(e) {
      if (swiper.activeIndex === 0) {
        subs.slideTo(0, 0);
      }
      swiper.slides.find('.slide-nav').each(function() {
        this.style.transition = this.style.transition === 'none' ? '' : 'none';
      });
      // slider.slide(slider.current);
    })
  /*.on('sliderMove', function(e) {
    if (swiper.touches.startY < swiper.touches.currentY) {
      if (swiper.activeIndex === 1) {
        nav
          .hide()
          .css({
            'transform': '',
            '-webkit-transform': ''
          });
        $('#nav1').show();
      }
    }
  })*/
  /*.on('transitionEnd', function(e) {
    if (swiper.activeIndex === 0) {
      $('#nav1')
        .css({
          'transform': 'translate(0, -70px)',
          'webkitTransform': 'translate(0, -70px)',
          'transition-duration': '.1s',
        })
        .on('transitionend webkitTransitonEnd', function(e) {
          $(this)
            .hide()
            .css({
              'transform': '',
              'transition-duration': '',
            });
          nav.show();
        });
    }
  });*/

  /*$(window).on('hashchange', function(e) {
      if (swiper.activeIndex === 0) {
        subs.slideTo(0, 0);
        $('#nav1')
          .show()
          .css({
            'transform': 'translate(0, -70px)',
            'webkitTransform': 'translate(0, -70px)',
            'transition-duration': '.1s',
          })
          .on('transitionend webkitTransitonEnd', function(e) {
            $(this)
              .hide()
              .css({
                'transform': '',
                'transition-duration': '',
              });
            nav
              .show()
              .css({
                'transform': '',
                '-webkit-transform': ''
              });
          });
      }
      // else if (swiper.activeIndex === 1) {
        // var y = 70 - window.innerHeight;
        // $('#nav .swiper-btn-next').parent()
        //   .addClass('active')
          // .parent()
          // .show()
          // .css({
          //   '-webkit-transition': 'none',
          //   'transition': 'none',
          //   '-webkit-transform': 'translate(0, ' + y + 'px)',
          //   'transform': 'translate(0, ' + y + 'px)',
          // });
      // }
  });*/

  // nav's first button
  // $('#nav .swiper-btn-next')
  //   // .on('touchend', function(e) {
  //   //   swiper.params.allowSwipeToNext = true;
  //   // })
  //   .on('click', function(e) {
  //     // var y = 70 - window.innerHeight;
  //     $(this).parent()
  //       .addClass('active')
  //       // .parent()
  //       // .css({
  //       //   'transform': 'translate(0, ' + y + 'px)',
  //       //   '-webkit-transform': 'translate(0, ' + y + 'px)'
  //       // });
  //       // $('#nav1 .swiper-btn-next').parent().addClass('active');
  //     // swiper.detachEvents();
  //   });


  // second screen swiper
  var subs = new Swiper('#subSlider', {
    direction: 'vertical',
    effect: 'slide',
    autoHeight: true,
    nested: true,
    slidesPerView: 'auto',
    observer: true,
    // freeMode: true,
    freeModeMomentumBounce: false,
  });

  // the second & third & fourth screen has difference height
  subs
    .on('touchStart', function(e) {
      subs.params.allowSwipeToPrev = subs.activeIndex !== 0;
      subs.snapGrid[4] = subs.snapGrid[3] + subs.slides[3].offsetHeight - win.innerHeight + 70;
    })
  //   .on('touchMove', function(e) {
  //     if (subs.activeIndex === 3 && (subs.swipeDirection === 'next' || (subs.swipeDirection === 'prev' && subs.translate < -1238))) {
  //       subs.params.freeMode = true;
  //     }
  //     else {
  //       subs.params.freeMode = false;
  //     }
  //   })
  //   .on('touchEnd', function(e) {
  //     if (subs.translate > -1238) {
  //       subs.params.freeMode = false;
  //     }
  //   })
  //   .on('transitionEnd', function(e) {
  //     if (subs.translate > -1238) {
  //       subs.slideReset();
  //       // var arr = [];
  //       // for(var i = 0; i < subs.slidesGrid.length; i++) {
  //       //   arr.push(Math.abs(subs.translate + subs.slidesGrid[i]));
  //       // }
  //       // subs.slideTo(smallest(arr));
  //       // subs.params.freeMode = false;
  //     }
  // });

  // function smallest(a) {
  //   var lowest = 0;
  //   for (var i = 1; i < a.length; i++) {
  //     if (a[i] < a[lowest]) lowest = i;
  //   }
  //   return lowest;
  // }


  // the tabs switch
  $('#chair .tab li a').on('click', function(e) {
    e.preventDefault();
    $(this).parent().addClass('active').siblings('.active').removeClass('active');
    $(this.getAttribute('href'))
      .css('z-index', 2)
      .addClass('fade-in')
      .on('animationend', function() {
        $(this).siblings('.fade-in').removeClass('fade-in').off('animationend');
      })
      // .find('h1')
      //   .css('left', (window.innerWidth - $('#range1 h1').width()) / 2)
      // .end()
      .siblings('.fade-in').css('z-index', '');
    // .removeClass('fast')
    // .addClass('fade-out')
  });

  // the more colors frame's switch
  $('.switcher .btn-group button').click(function(e) {
    if ($(this).hasClass('active')) return;
    $(this).addClass('active').siblings('.active').removeClass('active');
    $(this).parents('.content').find('.black').toggleClass('show');
  });

  $('.switcher input[type=checkbox]').change(function(e) {
    $(this).parents('.content').find('.chrome').toggleClass('show');
  });


  // the curved angle slider
  var currentX = 0;
  var startY = 0;
  var currentY = 0;
  var start = 8.5;
  var end = 274 - start * 2 - 22;
  var angNum = 4;
  var distance = Math.floor(end / (nrAngles - 1) * 10) / 10;
  var iteration = 0;
  var offsetX = (win.innerWidth - 274) / 2;
  var grid = [];
  for (var i = 0; i < nrAngles; i++) {
    grid[i] = distance * i + start;
  }
  $('#controls')
    .on('touchstart', function(e) {
      // startX = currentX = e.originalEvent.targetTouches[0].pageX - offsetX;
      startY = currentY = e.originalEvent.targetTouches[0].pageY;
    })
    .on('touchmove', function(e) {
      currentX = e.originalEvent.targetTouches[0].pageX - offsetX;
      currentY = e.originalEvent.targetTouches[0].pageY;
      if (Math.abs(currentY - startY)) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (currentX < start || currentX > end + start + 11) {
        return false;
      }

      var diff = currentX;
      // for (var i = 0; i < 8; i++) {
      // if (diff > 0 && diff > distance / 2) {
      //   $('#angleSlider').val(++currentAngle).trigger('input');
      //   // startX = grid[currentAngle - 1];
      // }
      // else if (diff < 0 && diff < -distance / 2) {
      //   $('#angleSlider').val(--currentAngle).trigger('input');
      //   // startX = grid[currentAngle - 1];
      // }
      if (diff > grid[angNum] + distance / 2 + 11) {
        $('#angleSlider').val(++angNum).trigger('input');
      } else if (diff < grid[angNum] - distance / 2 + 11) {
        $('#angleSlider').val(--angNum).trigger('input');
      }
      // }
    })
  // .on('touchend', function(e) {
  // });

  $('video').hide();
  $('.cover').click(function() {
    var self = $(this);
    self.animate({opacity: 0}, 200, function() {
      self.css('visibility', 'hidden');
    });
    // $('#nav').css('z-index', 0);
    $('video').show()
      // .css({
      //   'transform': 'rotate(90deg)',
      //   top: (window.innerWidth * 1.777778 - window.innerHeight),
      //   height: window.innerWidth,
      // })
      .on('ended', function () {
        // $('#nav').css('z-index', '');
        $(this).hide()
          // .css({
          //   'position': '',
          //   'z-index': '',
          // })
        $('.cover')
          .css('visibility', '')
          .animate({opacity: 1}, 200);
      })[0].play();
  });
})(window, document);
