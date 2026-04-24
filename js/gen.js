function getSelectItems() {
  return [
    { id: 'interval', label: 'Cleaning interval' },
    { id: 'packageTier', label: 'Package tier' },
    { id: 'homeSize', label: 'Home size' },
    { id: 'homeCondition', label: 'Current condition' },
    { id: 'pets', label: 'Pets in home' },
    { id: 'urgency', label: 'Turnaround' },
    { id: 'extraKitchen', label: 'Extra kitchens' },
    { id: 'doubleSinks', label: 'Double sinks' },
    { id: 'extraShowers', label: 'Extra showers' },
    { id: 'extraTubs', label: 'Extra tubs' },
    { id: 'fullBaths', label: 'Extra full bathrooms' },
    { id: 'halfBaths', label: 'Half bathrooms' },
    { id: 'dusting', label: 'Extra dusting time' },
    { id: 'basement', label: 'Basement' }
  ];
}

function isEmbedded() {
  return window.self !== window.top || new URLSearchParams(window.location.search).get('embed') === '1';
}

function notifyParent(message) {
  if (!isEmbedded()) {
    return;
  }

  window.parent.postMessage(message, window.location.origin);
}

function getCurrentQuote() {
  var stored = localStorage.getItem('lamotheQuote');
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    return null;
  }
}

function calculate() {
  var total = 0;

  var items = getSelectItems().map(function (item) {
    var select = document.getElementById(item.id);
    var price = parseFloat(select.value);
    var optionText = select.options[select.selectedIndex].text;

    total += price;

    return {
      label: item.label,
      price: price,
      valueText: optionText
    };
  });

  var addOnBoxes = document.querySelectorAll('.addon');
  addOnBoxes.forEach(function (box) {
    var price = box.checked ? parseFloat(box.dataset.price || '0') : 0;

    items.push({
      label: box.dataset.label || 'Add-on',
      price: price,
      valueText: box.checked ? 'Selected' : 'Not selected'
    });

    total += price;
  });

  document.getElementById('totalPrice').textContent = '$' + total.toFixed(2);

  var quote = {
    total: total,
    items: items
  };

  localStorage.setItem('lamotheQuote', JSON.stringify(quote));
  notifyParent({ type: 'lamothe-quote-updated', quote: quote });
  notifyParent({ type: 'lamothe-quote-height', height: document.body.scrollHeight });
}

document.addEventListener('DOMContentLoaded', function () {
  if (isEmbedded()) {
    document.body.classList.add('embedded-body');
  }

  var selects = document.querySelectorAll('select');
  selects.forEach(function (select) {
    select.addEventListener('change', calculate);
  });

  var addOnBoxes = document.querySelectorAll('.addon');
  addOnBoxes.forEach(function (box) {
    box.addEventListener('change', calculate);
  });

  window.addEventListener('message', function (event) {
    if (event.origin && event.origin !== window.location.origin) {
      return;
    }

    if (!event.data || event.data.type !== 'lamothe-quote-request') {
      return;
    }

    var quote = getCurrentQuote();
    if (quote) {
      notifyParent({ type: 'lamothe-quote-updated', quote: quote });
    }

    notifyParent({ type: 'lamothe-quote-height', height: document.body.scrollHeight });
  });

  calculate();
});
