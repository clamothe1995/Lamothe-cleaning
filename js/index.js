function formatCurrency(amount) {
  return '$' + Number(amount).toFixed(2);
}

function parseStoredQuote(rawQuote) {
  if (!rawQuote) {
    return null;
  }

  try {
    return JSON.parse(rawQuote);
  } catch (error) {
    return null;
  }
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

function saveAndRenderQuote(quote) {
  if (!quote) {
    return;
  }

  setContactQuoteFields(quote);
  localStorage.setItem('lamotheQuote', JSON.stringify(quote));
}

function loadSavedQuote() {
  return parseStoredQuote(localStorage.getItem('lamotheQuote'));
}

function syncQuoteFromMessage(event) {
  if (!event || !event.data) {
    return;
  }

  if (event.origin && event.origin !== window.location.origin) {
    return;
  }

  if (event.data.type === 'lamothe-quote-updated') {
    saveAndRenderQuote(event.data.quote);
  }

  if (event.data.type === 'lamothe-quote-height') {
    var quoteFrame = document.getElementById('quoteFrame');
    if (!quoteFrame || !event.data.height) {
      return;
    }

    quoteFrame.style.height = String(event.data.height) + 'px';
  }
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
  window.addEventListener('message', syncQuoteFromMessage);

  window.addEventListener('storage', function (event) {
    if (event.key !== 'lamotheQuote') {
      return;
    }

    var quote = parseStoredQuote(event.newValue);
    if (quote) {
      saveAndRenderQuote(quote);
    }
  });

  var quoteFrame = document.getElementById('quoteFrame');
  if (quoteFrame) {
    quoteFrame.addEventListener('load', function () {
      if (quoteFrame.contentWindow) {
        quoteFrame.contentWindow.postMessage({ type: 'lamothe-quote-request' }, window.location.origin);
      }
    });
  }

  var savedQuote = loadSavedQuote();
  if (savedQuote) {
    saveAndRenderQuote(savedQuote);
  } else {
    setContactQuoteFields(null);
  }

  bindContactFormSubmit();
});
