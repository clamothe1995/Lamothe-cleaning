function calculate() {
  var base = parseFloat(document.getElementById('interval').value);
  var kitchen = parseFloat(document.getElementById('extraKitchen').value);
  var sinks = parseFloat(document.getElementById('doubleSinks').value);
  var showers = parseFloat(document.getElementById('extraShowers').value);
  var tubs = parseFloat(document.getElementById('extraTubs').value);
  var fullBaths = parseFloat(document.getElementById('fullBaths').value);
  var halfBaths = parseFloat(document.getElementById('halfBaths').value);
  var dusting = parseFloat(document.getElementById('dusting').value);
  var basement = parseFloat(document.getElementById('basement').value);

  var grandTotal = base + kitchen + sinks + showers + tubs + fullBaths + halfBaths + dusting + basement;

  document.getElementById('totalPrice').textContent = '$' + grandTotal.toFixed(2);

  var quoteData = {
    total: grandTotal,
    items: [
      { id: 'interval', label: 'Cleaning interval', price: base },
      { id: 'extraKitchen', label: 'Extra kitchens', price: kitchen },
      { id: 'doubleSinks', label: 'Double sinks', price: sinks },
      { id: 'extraShowers', label: 'Extra showers', price: showers },
      { id: 'extraTubs', label: 'Extra tubs', price: tubs },
      { id: 'fullBaths', label: 'Extra full bathrooms', price: fullBaths },
      { id: 'halfBaths', label: 'Half bathrooms', price: halfBaths },
      { id: 'dusting', label: 'Extra dusting time', price: dusting },
      { id: 'basement', label: 'Basement', price: basement }
    ].map(function (item) {
      var select = document.getElementById(item.id);
      var optionText = select.options[select.selectedIndex].text;
      return {
        label: item.label,
        price: item.price,
        valueText: optionText
      };
    })
  };

  localStorage.setItem('lamotheQuote', JSON.stringify(quoteData));
}

document.addEventListener('DOMContentLoaded', function () {
  var selects = document.querySelectorAll('select');
  selects.forEach(function (select) {
    select.addEventListener('change', calculate);
  });

  calculate();
});
