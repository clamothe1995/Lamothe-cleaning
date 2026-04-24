function formatCurrency(amount) {
  return '$' + Number(amount).toFixed(2);
}

function getQuoteConfig() {
  return [
    { id: 'interval', label: 'Cleaning interval' },
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

function readQuoteFromPage() {
  var config = getQuoteConfig();
  var items = [];
  var total = 0;

  for (var i = 0; i < config.length; i += 1) {
    var itemConfig = config[i];
    var select = document.getElementById(itemConfig.id);

    if (!select) {
      return null;
    }

    var selectedOption = select.options[select.selectedIndex];
    var price = parseFloat(select.value);

    items.push({
      label: itemConfig.label,
      price: price,
      valueText: selectedOption ? selectedOption.text : ''
    });

    total += price;
  }

  return {
    total: total,
    items: items
  };
}

function buildQuoteSummary(quote) {
  if (!quote || !quote.items || !quote.items.length) {
    return 'No quote data is available yet.';
  }

  var lines = ['Estimated Total: ' + formatCurrency(quote.total), ''];
  quote.items.forEach(function (item) {
    lines.push(item.label + ': ' + item.valueText + ' (' + formatCurrency(item.price) + ')');
  });

  return lines.join('\n');
}

function setContactQuoteFields(quote) {
  var summaryField = document.getElementById('quoteSummary');
  var totalField = document.getElementById('quoteTotal');
  var dataField = document.getElementById('quoteDataJson');

  if (!summaryField || !totalField || !dataField) {
    return;
  }

  summaryField.value = buildQuoteSummary(quote);
  totalField.value = quote ? String(quote.total || 0) : '0';
  dataField.value = quote ? JSON.stringify(quote) : '';
}

function renderQuoteTotal(total) {
  var totalDisplay = document.getElementById('totalPrice');
  if (!totalDisplay) {
    return;
  }

  totalDisplay.textContent = formatCurrency(total);
}

function saveAndRenderQuote(quote) {
  if (!quote) {
    return;
  }

  renderQuoteTotal(quote.total);
  setContactQuoteFields(quote);
  localStorage.setItem('lamotheQuote', JSON.stringify(quote));
}

function setFormStatus(message, type) {
  var formStatus = document.getElementById('formStatus');
  if (!formStatus) {
    return;
  }

  formStatus.textContent = message || '';
  formStatus.classList.remove('is-error', 'is-success');

  if (type === 'error') {
    formStatus.classList.add('is-error');
  }

  if (type === 'success') {
    formStatus.classList.add('is-success');
  }
}

function bindContactFormSubmit() {
  var form = document.getElementById('contactForm');
  if (!form) {
    return;
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    setFormStatus('Sending your request...', null);

    var submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
    }

    var formData = new FormData(form);
    var payload = Object.fromEntries(formData.entries());

    try {
      var response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload)
      });

      var result = null;
      var rawBody = await response.text();

      if (rawBody) {
        try {
          result = JSON.parse(rawBody);
        } catch (parseError) {
          result = null;
        }
      }

      if (!response.ok || !result.ok) {
        if (!result && rawBody) {
          throw new Error('Server returned a non-JSON response. Check IIS routing for /api/contact.');
        }

        throw new Error((result && result.message) || 'Could not send request.');
      }

      setFormStatus('Thanks. Your request was sent successfully.', 'success');
      form.reset();

      var quote = readQuoteFromPage();
      saveAndRenderQuote(quote);
    } catch (error) {
      setFormStatus(error.message || 'Could not send request right now.', 'error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  var quoteSelects = document.querySelectorAll(
    '#interval, #extraKitchen, #doubleSinks, #extraShowers, #extraTubs, #fullBaths, #halfBaths, #dusting, #basement'
  );

  if (quoteSelects.length) {
    quoteSelects.forEach(function (select) {
      select.addEventListener('change', function () {
        saveAndRenderQuote(readQuoteFromPage());
      });
    });

    saveAndRenderQuote(readQuoteFromPage());
  } else {
    var stored = localStorage.getItem('lamotheQuote');
    if (!stored) {
      setContactQuoteFields(null);
    } else {
      try {
        var savedQuote = JSON.parse(stored);
        setContactQuoteFields(savedQuote);
        renderQuoteTotal(savedQuote.total || 0);
      } catch (error) {
        setContactQuoteFields(null);
      }
    }
  }

  bindContactFormSubmit();
});
