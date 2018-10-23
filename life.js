var genNum = 0;
var running = true;
var dots = ['.'];
	
function randomNum() {
  var r = Math.random();
  return r;
}

function toggleRunning() {
  running = !running;
  const p = document.getElementById('pauseButton');
  if (p.innerHTML == 'Pause')
    p.innerHTML = 'Resume';
  else
    p.innerHTML = 'Pause';
}

function lifeModel() {
  document.getElementById('gen').innerHTML = genNum;
  document.getElementById('model').innerHTML = dots;
  setInterval(nextGen, 500);
}

function reset() {
  dots = ['.'];
  genNum = 0;
  document.getElementById('gen').innerHTML = genNum;
  document.getElementById('model').innerHTML = dots;
}

function nextGen() {
  var newDots = [''];
  if (dots[0] == dots[1] || genNum > 999)
    reset();
  if (running) {
    dots[dots.length] = '';
    for (var i = 0; i < dots.length; i++) {
      newDots[i + 1] = '';
      for (var j = 0; j < dots[i].length; j++) {
        if (dots[i][j] == '.') {
          var ra = randomNum();
          if (ra < 0.05)
            break;
          else
            newDots[i] += 'o';
        }
        else if (dots[i][j] == 'o') { 
          var rb = randomNum();
          if (rb < 0.05)
            break;
          else if (rb >= 0.05 && rb < 0.5)
            newDots[i] += 'O';
          else {
            newDots[i] += 'O';
            newDots[i + 1] += '. ';
          } 
        }
        else if (dots[i][j] == 'O') {
          var rc = randomNum();
          if (rc < 0.05)
            break;
          else if (rc >= 0.05 && rc < 0.3) {
            newDots[i] += '@';
            newDots[i + 1] += '. '
          }
          else if (rc >= 0.3 && rc < 0.7) {
            newDots[i] += '@';
            newDots[i + 1] += '. . '
          }
          else {
            newDots[i] += '@';
            newDots[i + 1] += '. . . '
          }
        }
        else if (dots[i][j] == '@') {
          var rd = randomNum();
          if (rd < 0.1)
            break;
          else if (rd >= 0.1 && rd < 0.5) {
            newDots[i] += '0';
            newDots[i + 1] += '. ';
          }
          else
            newDots[i] += '0';
        }
        else if (dots[i][j] == '0') {
          var re = randomNum();
          if (re < 0.2)
            break;
          else
            newDots[i] += '-';
        }
        else
          newDots[i] += ' ';
      }
    }

  dots = newDots;

  for (var i = 0; i < dots.length - 1; i++) {
    if (dots[i].trim() == '') {
      dots[i] = dots[i + 1];
      dots[i + 1] = ' ';
    }
  }

  dots = dots.filter(Boolean);

  writtenDots = '';
  for (var i = 0; i < dots.length; i++) {
    writtenDots += dots[i] + '<br>';
  }

  genNum++;
  document.getElementById('gen').innerHTML = genNum;
  document.getElementById('model').innerHTML = writtenDots;
  }
}
