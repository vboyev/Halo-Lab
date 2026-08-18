(function () {
  var GTM_ID = 'GTM-NVFQVKC';
  window.dataLayer = window.dataLayer || [];

  function pushCountry(name, code) {
    window.clientCountry = name;
    window.clientCountryCode = code;
    dataLayer.push({
      event: 'country_detected',
      country_name: name,
      country_code: code,
    });
  }

  var cachedName = sessionStorage.getItem('client-country');
  var cachedCode = sessionStorage.getItem('client-country-code');

  if (cachedName && cachedCode) {
    pushCountry(cachedName, cachedCode);
  } else {
    fetch('https://ipapi.co/json/')
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        var name = data.country_name || 'Unknown';
        var code = data.country || '';
        sessionStorage.setItem('client-country', name);
        sessionStorage.setItem('client-country-code', code);
        pushCountry(name, code);
      })
      .catch(function () {
        pushCountry('Unknown', '');
      });
  }

  (function (windowRef, documentRef, scriptTag, dataLayerName, containerId) {
    windowRef[dataLayerName] = windowRef[dataLayerName] || [];
    windowRef[dataLayerName].push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js',
    });
    var firstScript = documentRef.getElementsByTagName(scriptTag)[0];
    var gtmScript = documentRef.createElement(scriptTag);
    var layerParam = dataLayerName !== 'dataLayer' ? '&l=' + dataLayerName : '';
    gtmScript.async = true;
    gtmScript.src = 'https://www.googletagmanager.com/gtm.js?id=' + containerId + layerParam;
    firstScript.parentNode.insertBefore(gtmScript, firstScript);
  })(window, document, 'script', 'dataLayer', GTM_ID);
})();
