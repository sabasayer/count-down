if(customElements.get('count-down') === undefined) {

  const styles = `
  :host {
    background: rgba(12, 10, 8, 1);
    display: block;
    color: rgba(252, 252, 252, 1);
    padding: .5rem 1rem;
    display: flex;
    font-family: Radikal;
    gap: .5rem;
    font-size: 15px;
    line-height: 22px;
    align-items: flex-start;
  }
  
  .content-container{
    all: unset;
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    gap:.5rem;
  }

  .content-container.has-link{
    cursor: pointer;
  }

  .content-container *{
    color: rgba(252, 252, 252, 1);
  }

  .content{
    text-align: center;
    flex:1;
  }
  .content a{
    color:rgba(235, 114, 46, 1);
    text-decoration: none;
    text-align: center;
  }
  button{
    background: none;
    border: none;
    color: inherit;
    padding: 0;
    display: none;
    cursor: pointer;
  }

  button:hover{
    opacity:0.7;
  }

  button.visible{
    display:block;
  }

  .time-container{
    display: flex;
    padding: .25rem 0;
    background: rgba(33, 27, 23, 1);
    font-weight: 500;
  }
  .time-container > div{
    padding:0 .25rem
  }
  .time-block{
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .25rem;
    min-width: 40px;
  }

  .time-block .label{
    font-size: 10px;
    line-height: 16px;
    color:rgba(252, 252, 252, 0.64);
    font-weight: 400;
  }

  .time{
    position: relative;
    overflow: hidden;
  }

  .time .placeholder{
    visibility: hidden;
  }

  .time .next,.current,.prev{
    position:absolute;
    left:0;
    transition: all .5s ease-out;
    z-index: 2;
    background-color: rgba(33, 27, 23, 1);
  }

  .time .prev{
    bottom: 100%;
  }

  .time .next{
    bottom: -100%;
  }

  .time .current{
    bottom:0;
  }

  @media screen and (min-width: 768px){
    :host {
      padding: .75rem 1.5rem;
      align-items: center;
    }
    .content-container{
      flex-direction: row;
      justify-content: center;
      gap: 1.5rem;
    }
    .content{
      flex:unset;
    }
  }
  `

  const buttonTemplate = `
  <button>
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Close</title>
      <path fill="currentColor" d="M19 6.414 17.586 5 12 10.586 6.414 5 5 6.414 10.586 12 5 17.586 6.414 19 12 13.414 17.586 19 19 17.586 13.414 12 19 6.414Z" />
    </svg>
    </button>`

  const template = `
  <a class="content-container">
    <div class="content">
      
    </div>
    <div class="time-container">
      <div class="time-block day" data-day>
        <div class="time">
          <span class="placeholder">00</span>
          <span class="current">00</span>
        </div>
        <div class="label">Day</div>
      </div>
      <div>:</div>
      <div class="time-block hour" data-hour>
        <div class="time">
          <span class="placeholder">00</span>
          <span class="current">00</span>
        </div>
        <div class="label">Hour</div>
      </div>
      <div>:</div>
      <div class="time-block min" data-min>
        <div class="time">
          <span class="placeholder">00</span>
          <span class="current">00</span>
        </div>
        <div class="label">Min</div>
      </div>
      <div>:</div>
      <div class="time-block" data-sec>
        <div class="time">
          <span class="placeholder">00</span>
          <span class="current">00</span>
        </div>
        <div class="label">Sec</div>
      </div>
    </div>
  </a>
  ${buttonTemplate}
  `

  customElements.define('count-down', class extends HTMLElement {
    //only change for debugging reasons
    #intervalMs = 1000
    #sessionStorageDidCloseKey = 'count-down-did-close'

    constructor() {
      super()

      if(this.didClose) return;

      this.attachShadow({mode: 'open'})
      this.shadowRoot.innerHTML = template
      this.useSlotContent();
      this.adoptStyleSheet();

      this.initLink(),
      this.initButton();
      this.initTimer();
    }

    get didClose(){
      return !!sessionStorage.getItem(this.#sessionStorageDidCloseKey);
    }

    adoptStyleSheet(){
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(styles);
      this.shadowRoot.adoptedStyleSheets = [sheet];      
    }

    useSlotContent(){
      const content = this.innerHTML;
      const contentElement = this.shadowRoot.querySelector('.content')
      if(content)
        contentElement.innerHTML = content;
      else
        contentElement.remove(); 
    }

    initLink(){
      const link = this.dataset.href;
      if(!link) return;

      const container = this.shadowRoot.querySelector('.content-container')
      container.setAttribute('href',link);
      container.classList.add('has-link');
    }

    initButton(){
      if(!this.hasAttribute('data-has-close-button')) return;

      const button = this.shadowRoot.querySelector('button');

      button.classList.add('visible');
      button.addEventListener('click',() => {
        this.close();
      })
    }

    

    close(){
      this.finish();
      this.remove();  
      sessionStorage.setItem(this.#sessionStorageDidCloseKey,true);
    }

    initTimer(){
      const date = this.dataset.date;
      if(!date) {
        this.hideTimeContainer();
        return;
      }
      
      const diff = this.initTime(date);

      if(diff) this.startCountDown();
    }

    initTime(isoDate){
      const date = new Date(isoDate).getTime();
      const now = new Date().getTime();

      const diff = date - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours =  Math.floor(diff / (1000 * 60 * 60 ) % 24);
      const minutes = Math.floor(diff / (1000 * 60 ) % 60);
      const seconds = Math.floor(diff / (1000) % 60);

      const { secondTime, minuteTime, hourTime, dayTime } = this.getElements();
      secondTime.querySelector('.current').innerHTML = this.formatTime(seconds);
      minuteTime.querySelector('.current').innerHTML = this.formatTime(minutes);
      hourTime.querySelector('.current').innerHTML = this.formatTime(hours);
      dayTime.querySelector('.current').innerHTML = this.formatTime(days);

      return diff;
    }
    
    startCountDown(){
      const { secondTime, minuteTime, hourTime, dayTime } = this.getElements();
      
      this.interval = setInterval(() => {
        const { hasDay, hasHour, hasMinute } = this.getStatus();

       this.animateTimeBlock(secondTime,() => {
          this.animateTimeBlock(minuteTime,() => {
            this.animateTimeBlock(hourTime,() => {
              this.animateTimeBlock(dayTime,() => {
                this.finish();
              },null)
            },hasDay ? 23 : null)
          },hasHour ? 59 : null)
       },hasMinute ? 59 : null);
      }, this.#intervalMs)
    }

    finish(){
      clearInterval(this.interval);
      this.hideTimeContainer();
    }

    hideTimeContainer(){
      this.shadowRoot.querySelector('.time-container').remove();
    }

    getStatus(){
      const { minuteTime, hourTime, dayTime } = this.getElements();
      const { current:currentDay } = this.getTimeElements(dayTime);
      const { current:currentHour } = this.getTimeElements(hourTime);
      const { current:currentMinute } = this.getTimeElements(minuteTime);

      return {
        hasDay: currentDay.innerHTML !== '00',
        hasHour: currentHour.innerHTML !== '00',
        hasMinute: currentMinute.innerHTML !== '00'
      }

    }

    animateTimeBlock(timeElement,onFinished,resetValue = 59){
      let { current, next, prev } = this.getTimeElements(timeElement)

      let currentValue = parseInt(current.innerText);

      if(currentValue === 0){
        if(resetValue) {
          current.innerHTML = this.formatTime(resetValue);
          next.innerHTML = this.formatTime(resetValue - 1);
        }
        onFinished?.();
        return;
      }
      
      if(!next){
        next = this.createNext(currentValue);
        timeElement.appendChild(next);
      }

      current.classList.add('prev')
      current.classList.remove('current')
      next.classList.add('current')
      next.classList.remove('next')
      prev?.remove();

      const newNext = this.createNext(currentValue-1);
      timeElement.appendChild(newNext);
    }

    createNext(currentValue){
      const next = document.createElement('span');

      if(currentValue == 0) currentValue = 60;
      
      next.innerHTML = this.formatTime(currentValue - 1);
      next.className = 'next';
      return next;
    }

    getTimeElements(timeElement){
      const current = timeElement.querySelector('.current');
      const prev = timeElement.querySelector('.prev');
      const next = timeElement.querySelector('.next');

      return {
        current,
        prev,
        next
      }
    }

    formatTime(time){
      return time < 10 ? `0${time}` : time;
    }

    getElements(){
      const second = this.shadowRoot.querySelector('[data-sec]')
      const minute = this.shadowRoot.querySelector('[data-min]')
      const hour = this.shadowRoot.querySelector('[data-hour]')
      const day = this.shadowRoot.querySelector('[data-day]')

      const secondTime = second?.querySelector('.time');
      const minuteTime = minute?.querySelector('.time');
      const hourTime = hour?.querySelector('.time');
      const dayTime = day?.querySelector('.time');

      return {
        second,
        minute,
        hour,
        day,
        secondTime,
        minuteTime,
        hourTime,
        dayTime
      }
    }
  })
}