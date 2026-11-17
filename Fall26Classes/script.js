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

function renderCounts() {
  document.getElementById('MT5003').textContent = moralLeft;
  document.getElementById('SS5003').textContent = prophetsLeft;
  document.getElementById('BEL6201').textContent = greekLeft;
  document.getElementById('SL5003').textContent = baptismLeft;
  document.getElementById('EH5003').textContent = medievalLeft;
  document.getElementById('DT5003').textContent = christologyLeft;
  document.getElementById('PT5003').textContent = counselingLeft;
}

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

function saveChanges() {
  moralLeft = Number(document.getElementById('editMT5003').value);
  prophetsLeft = Number(document.getElementById('editSS5003').value);
  greekLeft = Number(document.getElementById('editGreek').value);
  baptismLeft = Number(document.getElementById('editBaptism').value);
  medievalLeft = Number(document.getElementById('editMedieval').value);
  christologyLeft = Number(document.getElementById('editChristology').value);
  counselingLeft = Number(document.getElementById('editCounseling').value);

  localStorage.setItem('savedClasses', JSON.stringify({
    moralLeft, prophetsLeft, greekLeft, baptismLeft,
    medievalLeft, christologyLeft, counselingLeft,
  }));

  renderCounts();
  document.getElementById('changeDialog').close();
}

renderCounts();
document.getElementById('changeButton').addEventListener('click', changeNumbers);
document.getElementById('saveChanges').addEventListener('click', saveChanges);
document.getElementById('cancelChanges').addEventListener('click', function () {
  document.getElementById('changeDialog').close();
});
