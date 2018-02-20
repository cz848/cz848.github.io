//Open the Mobile Front-end Codebase JS
$(document).mobile();

(function() {

  var nrColors = 6;
  var nrAngels = 8;
  var nrPatterns = 5;
  var nrRanges = 3;
  var currentColor = 1;
  var currentPattern = 1;
  var currentRange = 1;
  var currentAngle = 4;

  /**
   * Wait for Document Load
   */
  // Init Event Handlers
  $('#panel1 .arrow').click(changeColor);
  $('#panel2 .arrow').click(changePattern);
  $('#panel3 .arrow').click(changeRange);
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

    $('#controls').attr('class', 'controls' + $('#color' + currentColor).attr('class').replace('color', ''));

    if (currentColor === nrColors || currentColor === 1) {
      this.disabled = true;
    }
    else if (currentColor === nrColors - 1 || currentColor === 2) {
      $(this).siblings('.arrow')[0].disabled = false;
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
      this.disabled = true;
    }
    else if (currentPattern === nrPatterns - 1 || currentPattern === 2) {
      $(this).siblings('.arrow')[0].disabled = false;
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
      this.disabled = true;
    }
    else if (currentRange === nrRanges - 1 || currentRange === 2) {
      $(this).siblings('.arrow')[0].disabled = false;
    }
  }

})();
