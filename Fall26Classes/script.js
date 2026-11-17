var moralLeft = 4;
var prophetsLeft = 5;
var greekLeft = 0;
var baptismLeft = 0;
var medievalLeft = 4;
var christologyLeft = 7;
var counselingLeft = 1;

var savedClasses = JSON.parse(localStorage.getItem('savedClasses'));

if (savedClasses) {
  moralLeft = savedClasses.moralLeft;
  prophetsLeft = savedClasses.prophetsLeft;
  greekLeft = savedClasses.greekLeft;
  baptismLeft = savedClasses.baptismLeft;
  medievalLeft = savedClasses.medievalLeft;
  christologyLeft = savedClasses.christologyLeft;
  counselingLeft = savedClasses.counselingLeft;
}

document.getElementById('MT5003').innerHTML = moralLeft;
document.getElementById('SS5003').innerHTML = prophetsLeft;
document.getElementById('EH5003').innerHTML = medievalLeft;
document.getElementById('DT5003').innerHTML = christologyLeft;
document.getElementById('PT5003').innerHTML = counselingLeft;

function changeNumbers() {
  document.getElementById('editMT5003').value = moralLeft;
  document.getElementById('editSS5003').value = prophetsLeft;
  document.getElementById('editGreek').value = greekLeft;
  document.getElementById('editBaptism').value = baptismLeft;
  document.getElementById('editMedieval').value = medievalLeft;
  document.getElementById('editChristology').value = christologyLeft;
  document.getElementById('editCounseling').value = counselingLeft;

  document.getElementById('changeDialog').showModal();
}

document.getElementById('changeButton').onclick = changeNumbers;

function saveChanges() {
  moralLeft = Number(document.getElementById('editMT5003').value);
  prophetsLeft = Number(document.getElementById('editSS5003').value);
  greekLeft = Number(document.getElementById('editGreek').value);
  baptismLeft = Number(document.getElementById('editBaptism').value);
  medievalLeft = Number(document.getElementById('editMedieval').value);
  christologyLeft = Number(document.getElementById('editChristology').value);
  counselingLeft = Number(document.getElementById('editCounseling').value);

  localStorage.setItem(
    'savedClasses',
    JSON.stringify({
      moralLeft,
      prophetsLeft,
      greekLeft,
      baptismLeft,
      medievalLeft,
      christologyLeft,
      counselingLeft,
    }),
  );

  document.getElementById('MT5003').innerHTML = moralLeft;
  document.getElementById('SS5003').innerHTML = prophetsLeft;
  document.getElementById('EH5003').innerHTML = medievalLeft;
  document.getElementById('DT5003').innerHTML = christologyLeft;
  document.getElementById('PT5003').innerHTML = counselingLeft;

  document.getElementById('changeDialog').close();
}

document.getElementById('saveChanges').onclick = saveChanges;

document.getElementById('cancelChanges').onclick = function () {
  document.getElementById('changeDialog').close();
};
