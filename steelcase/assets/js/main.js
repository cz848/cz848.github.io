//Open the Mobile Front-end Codebase JS
$(document).mobile();

(function() {

  var nrColors = 6;
  var nrAngels = 8;
  var currentColor = 1;
  var currentAngle = 1;

  /**
   * Wait for Document Load
   */
  // Init Event Handlers
  $('.arrow').click(changeColor);
  $('#angleSlider').on('input', changeAngle);

  // var margin = ((window.innerWidth - 189) / 2);
  // $('.color section').css('left', margin + 'px');
  // $('#shadow').css('left', margin - 74 + 'px');


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
        if (currentColor === nrColors) return false;

        // increase color count
        currentColor++;

        // show new colour
        $('#color' + currentColor).addClass('show');
        break;

      case 'prev':
        // check if beginning of color range is reached        
        if (currentColor === 1) return false;

        // remove current colour
        $('#color' + currentColor).removeClass('show');

        // decrease colour count;
        currentColor--;
        break;
    }

    if (currentColor === nrColors || currentColor === 1) {
      this.disabled = true;
    }
    else if (currentColor === nrColors - 1 || currentColor === 2) {
      $(this).siblings('.arrow')[0].disabled = false;
    }
  }

})();
