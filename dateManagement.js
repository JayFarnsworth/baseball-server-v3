var moment = require('moment');
moment().format();

var year = '2018';
var month = moment().month() + 1;
var day = moment().date()
var dayOfYear = moment().dayOfYear();

function getToday(){
  if (month < 10) month = '0' + month;
  if (day < 10) day = '0' + day;
  var fullDate = `${year}-${month}-${day}`
  return fullDate;
}
function getTodayMSF() {
  if (month < 10) month = '0' + month;
  if (day < 10) day = '0' + day;
  var fullDate = `${year}${month}${day}`
  return fullDate;
}
function getTomo() {
  let newMonth = moment().add((1), 'd').month() + 1;
  let newDay = moment().add((1), 'd').date()
  if (newMonth < 10) newMonth = '0' + newMonth;
  if (newDay < 10) newDay = '0' + newDay;
  let newDate = `${year}-${newMonth}-${newDay}`
  return newDate;
}
function getTomoMSF() {
  let newMonth = moment().add((1), 'd').month() + 1;
  let newDay = moment().add((1), 'd').date()
  if (newMonth < 10) newMonth = '0' + newMonth;
  if (newDay < 10) newDay = '0' + newDay;
  let newDate = `${year}${newMonth}${newDay}`
  return newDate;
}
function getDayAfterTomo() {
  let newMonth = moment().add((2), 'd').month() + 1;
  let newDay = moment().add((2), 'd').date()
  let newDate = `${year}-${newMonth}-${newDay}`
  return newDate;
}

function getFutureDates(days){
  var dates = [];
  for (let i=0;i<days;i++){
    let newMonth = moment().add((i + 1), 'd').month() + 1;
    let newDay = moment().add((i + 1), 'd').date()
    if (newMonth < 10) newMonth = '0' + newMonth;
    if (newDay < 10) newDay = '0' + newDay;
    let newDate = `${year}-${newMonth}-${newDay}`
    dates.push(newDate)
  }
  return dates
}
function getFutureDatesMSF(days) {
  var dates = [];
  for (let i = 0; i < days; i++) {
    let newMonth = moment().add((i + 1), 'd').month() + 1;
    let newDay = moment().add((i + 1), 'd').date()
    if (newMonth < 10) newMonth = '0' + newMonth;
    if (newDay < 10) newDay = '0' + newDay;
    let newDate = `${year}${newMonth}${newDay}`
    dates.push(newDate)
  }
  return dates
}
module.exports = { getToday, getTodayMSF, getTomo, getTomoMSF, getDayAfterTomo, getFutureDates, getFutureDatesMSF }