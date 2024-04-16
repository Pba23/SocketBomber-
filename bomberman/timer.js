
const TIME_LIMIT = 10;
let timePassed = 0;
let timeLeft = TIME_LIMIT;
let timerInterval = null;


const createElement = () => {
  const element = document.createElement('div');
  element.classList.add('base-timer');
  const time = document.createElement('span');
  time.id = 'base-timer-label';
  time.classList.add('base-timer__label');
  time.innerHTML = formatTime(timeLeft);
  element.appendChild(time);
  return [element, time];
};

startTimer();

function startTimer() {
  const [timer, time] = createElement();
  const map = document.getElementById('map')
  map.appendChild(timer);
  timerInterval = setInterval(() => {
    timePassed = timePassed += 1;
    timeLeft = TIME_LIMIT - timePassed;
    time.innerHTML = formatTime(timeLeft);

    if (timeLeft === 0) {
      console.log("Time's up!");
      map.removeChild(timer);
      clearTimeout(timerInterval);
    }
  }, 1000);
}

function formatTime(time) {
  const minutes = Math.floor(time / 60);
  let seconds = time % 60;

  if (seconds < 10) {
    seconds = `0${seconds}`;
  }

  return `${minutes}:${seconds}`;
}
