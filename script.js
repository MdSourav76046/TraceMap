'use strict';

// prettier-ignore



let map;
let mapEvent;

class Workout{
    date = new Date();
    id = (Date.now() + " ").slice(-10);
    clicks = 0;
    constructor(coords, distance, duration) {
        this.coords = coords;  // [lat,lng]
        this.distance = distance; //km
        this.duration = duration; //min

        // console.log(this.id);
    }
    _setDescription() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
    click() {
        this.clicks++;
    }
}

class Running extends Workout{
    type = 'running';
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.caclPace();
        this._setDescription();
    }
    caclPace() {
        //min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout{
    type = 'cycling';
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }
    calcSpeed() {
        //km/h
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

// const run = new Running([39, -12], 5.2, 24, 178);
// const cycling = new Cycling([39, -12], 27, 95, 573);
// console.log(run, cycling);

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const clrAll = document.querySelector('.delete-All');
const task = document.querySelector('.task');
const sidebar = document.querySelector('.sidebar');
// const del = document.querySelector('.delete');
////////////////////////////
//APPICATION
class App{
    #map;
    #mapZoomLevel = 9;
    #mapEvent;
    #workouts = [];
    constructor() {
        //Attach event handler
        this._getLocaleStorage();
        //get user location
        this._getPosition();
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
        // del.addEventListener('click', this._deleteWorkout);
        clrAll.addEventListener('click', this._clearAll.bind(this));
        this._activeAndDeactive();
        sidebar.addEventListener('click', this._sideCheck.bind(this));
        this._showTask();
    }
    _sideCheck(e) {
        const tar = e.target;
        // console.log(tar);
        // console.log(tar.parentElement.classList.value);
        if (tar.parentElement.classList.value === "form__row"
            || tar.parentElement.classList.value === 'workouts'
            || tar.parentElement.classList.value=== "form") {
           
        }
        else {
            this._hideForm();
            this._showTask();
        }
    }
    _activeAndDeactive() {
        if (this.#workouts.length === 0) {
            clrAll.classList.remove('active');
        }
        else {
            clrAll.classList.add('active');
        }
    }
    _clearAll(e) {
        this.#workouts.splice(0, this.#workouts.length);
        const allLi = document.querySelectorAll('.workout');
        allLi.forEach(work => work.remove());
        this._activeAndDeactive();
        this._deleteMarker();
        this._setLocaleStorage();
        this._showTask();
    }
    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),
            function () {
                alert('could not get your position')
            })
        };
    }
    _loadMap(position) {
    //    console.log(position);
        const { latitude } = position.coords;
        const { longitude } = position.coords;
        // console.log(latitude, longitude);
        // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

        const cords = [latitude, longitude];

        this.#map = L.map('map').setView(cords, this.#mapZoomLevel);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        L.marker(cords).addTo(this.#map)
            .bindPopup('You are in this location!')
            .openPopup();
        // handling clicks on map
        this.#map.on('click', this._hideTask2.bind(this));
        this.#map.on('click', this._showForm.bind(this));
        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work);
        });
    }
    _hideTask2() {
        task.classList.remove('task_active');
    }
    _showForm(mapE) {
        this._gotoTop();
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }
    _gotoTop() {
        const top = document.querySelector('.sidebar');
        top.scrollIntoView({ behavior: "smooth" });
    }
    _hideForm() {
        // clear input fields
        inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';
        form.style.display = "none";
        form.classList.add('hidden');
        setTimeout(() => {
            form.style.display = 'grid';
        },1000)
    }
    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }
    _newWorkout(e) {
        const validInputs = (...inputs) => {
            return inputs.every(inp => Number.isFinite(inp))
        }
        const allPositive = (...inputs) => {
            return inputs.every(inp => inp > 0);
        }
        e.preventDefault();

        //get data from input
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;

        //check if data is valid

        //if workout running,create a running object
        if (type === 'running') {
            const cadence = +inputCadence.value;
            if (!validInputs(distance, duration, cadence) || !allPositive(distance,duration,cadence)) {
                return alert("Input have to be positive number");
            }
            workout = new Running([lat, lng], distance, duration, cadence);

        }
        //if workout cycling,create a cycling oject
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            if (!validInputs(distance, duration, elevation) || !allPositive(distance,duration)) {
               return alert("Input have to be positive number");
            }
            workout = new Cycling([lat, lng], distance, duration, elevation);
        }
        //Add new  Object to workout Array
        this.#workouts.push(workout);
        // console.log(workout);


        //Render workout on map as marker
        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work);
        })

        //Render workout on list
        this._renderWorkout(workout);

        //hide form

        this._hideForm();

        //set locale storage to all workout
        this._setLocaleStorage();

        this._activeAndDeactive();
        this._showTask();
        
    }
    _showTask() {
        if (this.#workouts.length === 0) {
            task.classList.add('task_active');
        }
        else {
            task.classList.remove('task_active');
        }
    }

    _renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 300,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`,
            }))
            .setPopupContent(`${workout.type === 'running'?'🏃‍♂️': '🚴‍♀️'} ${workout.description}`)
            .openPopup();
    }
    _renderWorkout(workout) {
        // console.log(workout.id);
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}" onClick = "gotoMap()">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running'?'🏃‍♂️': '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>  
        `;
        if (workout.type === 'running') {
            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
            </div>
            <a href="#" class="delete"><i class="fas fa-trash"></i></a>
            </li>
            `
        }
        if (workout.type === 'cycling') {
            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
            </div>
            <a href="#" class="delete"><i class="fas fa-trash"></i></a>
            </li>
            `;
        }
        form.insertAdjacentHTML('afterend', html);
    }
    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');
        const del = e.target.classList;
        if (del.value === 'fas fa-trash') {
            this._deleteWorkout(workoutEl.dataset.id);
            return;
        }
        // console.log(del);
        // console.log(workoutEl);
        if (!workoutEl) return;

        // for (let a of this.#workouts) {
        //     console.log(a.id);
        // }
        const workout = this.#workouts.find(
            work => work.id === workoutEl.dataset.id
        );
        console.log(workout);
        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pen: {
                duration: 1,
            }
        });
        

        //Using the Public interface
        // workout.click();
    }
    _setLocaleStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }
    _getLocaleStorage() {
        const data =JSON.parse(localStorage.getItem('workouts'));
        // console.log(data);

        if (!data) return;
        this.#workouts = data;
        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        });
    }
    _deleteWorkout(work) {
        // console.log(this.#workouts.length);
        // console.log(work);
        let removeCords;
        for (let i = 0; i < this.#workouts.length; i++){
            if (this.#workouts[i].id === work) {
                removeCords = this.#workouts[i];
                this.#workouts.splice(i, 1);
                break;
            }
        }
        console.log(removeCords);
        const allChild = containerWorkouts.children;
        for (let i = 0; i < allChild.length; i++){
            if (work === allChild[i].dataset.id) {
                allChild[i].remove();
            }
        }
        this._activeAndDeactive();
        this._setLocaleStorage();
        this._deleteMarker(removeCords);
        this._showTask();
    }
    _deleteMarker(workout) {
        // location.reload();
        this.#map.off();
        this.#map.remove();
        this._getPosition();
    }
    reset() {
        localStorage.removeItem('workouts');
        location.reload();
    }
}

const app = new App();


function gotoMap() {
    const map = document.querySelector('#map');
    map.scrollIntoView({ behavior: "smooth" });
}