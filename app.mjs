import fetch from "node-fetch";

// Har brukeren brukt programmet riktig?
if (process.argv.length < 3) {

  process.exit();
}


const place = process.argv[2].trim();
const specificPlace = process.argv[3]?.trim();
const resultPlace = `${place}${specificPlace ? ` ${specificPlace}` : ""}`;
const isFull = process.argv[4] === "--full";


const baseURL = "https://www.yr.no/api/v0/";
const searchLocationUrl = `${baseURL}locations/Search?q=${resultPlace}&accuracy=1000&language=nn`;


const locationData = await fetchData(searchLocationUrl);

function getWindScale(wind){
  if(wind < 0.3){
    return "stille"
  }else if(wind < 1.5){
    return "flau vind"
  }else if(wind < 3.3){
    return "svak vind"
  }else if(wind < 5.4){
    return "lett bris"
  }else if(wind < 7.9){
    return "laber bris"
  }else if(wind < 10.7){
    return "frisk bris"
  }else if(wind < 13.8){
    return "liten kuling"
  }else if(wind < 17.1){
    return "stiv kuling"
  }else if(wind < 20.7){
    return "sterk kuling"
  }else if(wind < 24.4){
    return "liten storm"
  }else if(wind < 28.4){
    return "full storm"
  }else if(wind < 32.6){
    return "sterk storm"
  }else if(wind < 100){
    return "orkan"
  }
}

function getVaerOneLiner(vaerSymbol){
 const vaerSymbolMap = {
    "clearsky": "🌞\tHusk Solkrem",
    "rain": "🌧️\tDet regner, husk paraply..\t",
    "cloudy": "🌥️\tPerfekt innevær\t",
    "clearsky_day": "☀️Husk Solkrem\t",
    "fair_day": "☀️\tDet er fin nok",
    "lightrain": "🌦️\tLitt regn, lurt med paraply",
    "partlycloudy_day": "⛅️\tKanskje sol, kanskje regn",
  }
  return vaerSymbolMap[vaerSymbol] ?? "Gjorde ikke disse her";  
}


if (locationData && locationData.totalResults > 0) {
  const location = locationData._embedded.location[0]; 
  const townID = location.id; 

 
  const foreCastUrl = `${baseURL}locations/${townID}/forecast`,
    celestialeventsUrl = `${baseURL}locations/${townID}/celestialevents`;
  const vaerData = await fetchData(foreCastUrl);
  const celestialEventsData = await fetchData(celestialeventsUrl);
  const events = celestialEventsData.events;

  const resultVaerDataLength = isFull ? vaerData.dayIntervals.length : 1;

  for (let index = 0; index < resultVaerDataLength; index++) {
    let weatherOutput = "🌞\tclearsky";
    let result = "";
    let {
      twentyFourHourSymbol,
      start,
      precipitation: { value: precipationValue },
      temperature: { min: temperatureMin, max: temperatureMax },
      wind: { min: windMin, max: windMax },
    } = vaerData.dayIntervals[index];
    const weekday = new Date(start).toLocaleDateString("nb-NO", {
      weekday: "long",
    });
    const day = new Date(start).toLocaleDateString("nb-NO", {
      month: "long",
      day: "numeric",
    });
    if (twentyFourHourSymbol === "rain") {
      weatherOutput = "🌧️\train\t";
    } else if (twentyFourHourSymbol === "cloudy") {
      weatherOutput = "🌥️\tcloudy\t";
    } else if (
      twentyFourHourSymbol === "clearsky_day" ||
      twentyFourHourSymbol === "fair_day"
    ) {
      weatherOutput = "☀️\tclearsky";
    } else if (twentyFourHourSymbol === "lightrain") {
      weatherOutput = "🌦️\tlightrain";
    } else if (twentyFourHourSymbol === "partlycloudy_day") {
      weatherOutput = "⛅️\tpartlycloudy";
    }
    const precipitationOutput = `💧${precipationValue}mm\t\t`;
    const temperatureOutput = `🌡️ ${temperatureMin}/${temperatureMax} C\t\t`;
    const windOutput = `💨 ${windMin}/${windMax}`;
  
  
    const sunRiseDate = new Date(
      events.find((event) => {
        if (event.type === "Rise" && event.body === "Sun") {
          const timeDate = new Date(event.time);
          const timeDay = timeDate.getDate();
          if (timeDay === new Date(start).getDate()) {
            return true;
          }
          return false;
        }
        return false;
      }).time
    );

    const sunSetDate = new Date(
      events.find((event) => {
        if (event.type === "Set" && event.body === "Sun") {
          const timeDate = new Date(event.time);
          const timeDay = timeDate.getDate();
          if (timeDay === new Date(start).getDate()) {
            return true;
          }
          return false;
        }
        return false;
      }).time
    );
  
    result = isFull ? `${weekday}\t${day}\t${weatherOutput}\t${precipitationOutput}\t\t${temperatureOutput}${windOutput}\t${getWindScale(windMin)}\t☀️ ⬆️  ${sunRiseDate
      .getHours()
      .toString()
      .padStart(2, "0")}:${sunRiseDate
      .getMinutes()
      .toString()
      .padStart(2, "0")} \t☀️ ⬇️  ${sunSetDate
      .getHours()
      .toString()
      .padStart(2, "0")}:${sunSetDate
      .getMinutes()
      .toString()
      .padStart(2, "0")}` : getVaerOneLiner(twentyFourHourSymbol);

    console.log(result);
  }
}

async function fetchData(url) {
  const rawData = await fetch(url);
  return await rawData.json();
}
