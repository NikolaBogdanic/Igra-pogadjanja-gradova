// JSON Http Request
function loadJSON(callback) {  
  var request = new XMLHttpRequest();
  request.open("GET","data/podaci.json");
  request.onreadystatechange = function() {
    if ((request.readyState == 4) && (request.status == "200")) {
      callback(request.responseText);
    }
  }
  request.send();
}

// JSON Http Response - vraća niz ponuđenih gradova koji koristi autoComplete objekat
function init() {
  loadJSON(function(response) {
    var ponudjene_array = JSON.parse(response).ponudjene; // Niz ponuđenih gradova
    // JavaScript autoComplete
    var my_autoComplete = new autoComplete({
      selector: 'input[name="q"]',
      minChars: 0, // Minimalan broj unetih karaktera nakon kojih se prikazuju rezultati pretrage
      source: function(term, suggest){
        term = term.toLowerCase();
        var choices = ponudjene_array;
        var suggestions = [];
        for (i=0;i<choices.length;i++)
          if (~(choices[i]).toLowerCase().indexOf(term)) suggestions.push(choices[i]);
        suggest(suggestions);
      },
    });
  });
}

init();

var cities_container = document.getElementById("cities-container"); // ID div-a koji sadrži dodate gradove

var added_cities_array = []; // Niz dodatih gradova
var hits_counter = 0; // Brojač pogođenih gradova
var new_city_id = 0; // ID koji se koristi prilikom dodavanja selektovanog grada
var success_rate = 0; // Procenat tačnih gradova
sessionStorage.success_rate = success_rate; // Smeštanje procenta tačnih gradova u sessionStorage

// Inkrementiranje i dekrementiranje brojača tačnih odgovora
function isCityCorrect(city,add_or_remove) {
  loadJSON(function(response) {
    var tacno_array = JSON.parse(response).tacno; // Niz tačnih gradova
    for (var key in tacno_array) {
      if (city == tacno_array[key]) { // Da li grad pripada nizu tačnih odgovora
        if (add_or_remove == "add") { // Da li je grad predviđen za dodavanje
          hits_counter++; // Inkrementiranje brojača pogođenih gradova
        } else if (add_or_remove == "remove") { // Da li je grad predviđen za dodavanje
          hits_counter--; // Dekrementiranje brojača pogođenih gradova
        }
        add_or_remove = ""; // Resetovanje promenljive "add_or_remove"
      }
    }
    success_rate = Math.round(hits_counter / added_cities_array.length * 100); // Procenat tačnih gradova
    sessionStorage.success_rate = success_rate; // Smeštanje procenta tačnih gradova u sessionStorage  
  });
}

// Provera da li se grad ne nalazi u nizu dodatih gradova
function isUnique(city) {
  if (added_cities_array.indexOf(city) > -1) {
    return false;
  } else {
    return true;
  }
}

// Brisanje grada iz niza dodatih gradova
function removeFromArray(city) {
  var i = added_cities_array.indexOf(city);
  if(i != -1) {
    added_cities_array.splice(i, 1);
  }
}

// Dodavanje grada
function addCity() {
  var city = document.getElementById("autocomplete-select-box").value; // Grad koji je odabran u Autocomplete select box-u
  if ((city!="") && (isUnique(city))) { // Provera da li je unet naziv grada i da li grad nije duplikat
    new_city_id++; // Dodati elementi u DOM-u će u nazivu svojih id-eva sadržati broj "new_city_id"
    var add_or_remove = "add"; // Promenljiva koja govori da li dodajemo ili brišemo grad
    isCityCorrect(city,add_or_remove); // Inkrementiranje brojača tačnih odgovora, u slučaju da je grad pripada nizu tačnih odgovora
    added_cities_array.push(city); // Dodavanje grada nizu dodatih gradova
    // Dodavanje U DOM div-a, unutar koga će se nalaziti div koji sadrži naziv grada i div koji sadrži ikonicu za brisanje
    var row_div = document.createElement("div");
    row_div.className = "row";
    row_div.id = "row"+new_city_id;
    cities_container.appendChild(row_div);
    // Dodavanje U DOM div-a koji sadrži naziv grada
    var city_div = document.createElement("div");
    city_div.className = "city";
    city_div.id = "city"+new_city_id;
    city_div.innerHTML = city;
    row_div.appendChild(city_div);
    // Dodavanje U DOM div-a koji sadrži ikonicu za brisanje
    var x_div = document.createElement("div");
    x_div.className = "x";
    x_div.id = new_city_id;
    x_div.innerHTML = "X";
    var att = document.createAttribute("onclick");
    att.value = "removeCity()"; // 
    x_div.setAttributeNode(att);  
    row_div.appendChild(x_div);    
  }
}

// Brisanje grada
function removeCity() {
  var target = event.target || event.srcElement; // Kliknuti DOM element
  var id = target.id // ID kliknutog DOM elementa
  var city = document.getElementById("city"+id).innerHTML; // Naziv grada koji treba izbrisati
  var add_or_remove = "remove"; // Promenljiva koja govori da li dodajemo ili brišemo grad
  isCityCorrect(city,add_or_remove); // Dekrementiranje brojača tačnih odgovora, u slučaju da je grad pripada nizu tačnih odgovora
  removeFromArray(city); // Brisanje grada iz niza dodatih gradova
  // Brisanje iz DOM-a div-a, unutar koga se nalazi div koji sadrži naziv grada i div koji sadrži ikonicu za brisanje
  var row_div = document.getElementById("row"+id);
  row_div.parentNode.removeChild(row_div);
}

// Tajmer
function initTimer() {
  loadJSON(function(response) {
    var seconds_limit = JSON.parse(response).vreme; // Definisano vreme u sekundama, za završetak igre
    var end_time = new Date().getTime() + seconds_limit*1000; // Vremenski trenutak završetka igre
    // Ažuriranje vremena
    function updateTime() {
      var now = new Date().getTime(); // Trenutno vreme
      var milliseconds_left =  end_time  - now; // Preostalo milisekundi
      var formatted = timeLeft(milliseconds_left/1000); // Promena formata u minute i sekunde
      var div = document.getElementById("timer");
      if (milliseconds_left < 0) {
          window.location.href = "rezultat.html";
      }
      else{
        div.innerHTML =  formatted.m + "m " + formatted.s +"s";
        setTimeout(updateTime, 1000);
      }
    }
    // Presotalo vreme u minutama i sekundama
    function timeLeft(secs) {
      var divisor_for_minutes = secs % (60 * 60);
      var minutes = Math.floor(divisor_for_minutes / 60); // Preostalo minuta
      var divisor_for_seconds = divisor_for_minutes % 60;
      var seconds = Math.ceil(divisor_for_seconds); // Preostalo sekundi
      var obj = {
        "m": minutes,
        "s": seconds
      };
      return obj;
    }
    updateTime();
  });
}

initTimer();

// Oblast
function initRegion() {
  loadJSON(function(response) {
    var country_region = JSON.parse(response).oblast; // Definisana oblast
    var div = document.getElementById("country-region");
    div.innerHTML =  div.innerHTML + country_region;
  });
}

initRegion();