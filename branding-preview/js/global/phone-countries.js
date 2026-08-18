///<script src="https://assets.slater.app/slater/826/24828.js"></script>
///<script src="https://slater.app/826/24828.js"></script>


// Функция для динамической загрузки JS файла
function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Функция инициализации маски и intlTelInput
function initializeTelInput() {

  // MASK AND CODE OF COUNTRY FOR TEL
  {
    function changeMask(elemMask, elemInput) {
      Inputmask({
        mask: elemMask,
        placeholder: '_',
        clearIncomplete: true,
        showMaskOnHover: false,
        clearMaskOnLostFocus: true,
      }).mask(elemInput);
    }

    const input = $('input[type=tel]');

    if (!window.clientCountryCode || window.clientCountryCode.length === 0) {
      clientCountryCode = 'us';
    }

    input.each((index, element) => {
      const iti = window.intlTelInput(element, {
        utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/20.3.0/js/utils.min.js",
        initialCountry: clientCountryCode,
        showSelectedDialCode: true,
        useFullscreenPopup: false,
        nationalMode: false,
        strictMode: true,
        countrySearch: true,
        autoPlaceholder: 'polite',
        i18n: {
          searchPlaceholder: "Type country name",
          zeroSearchResults: "No results found",
        },
        hiddenInput: function (telInputName) {
          return {
            phone: "phone_full",
            country: "country_code"
          };
        }
      });

      const arrCountryList = $(element).parent().find('.iti__country-list').children(
        '[data-dial-code]');

      iti.promise.then(() => {
        // $(element).trigger('countrychange');

        // let placeholder = $(element).attr('placeholder');
        // let maskPattern = placeholder.replace(/\d/g, '9');
        // changeMask(maskPattern, element);

        $('input.iti__search-input').each(function () {
          $(this).attr('autocomplete', 'new-password');
        });

      }).catch(error => {
        console.error('An error occurred while initializing intlTelInput:', error);
      });

      $(element).on('countrychange', function (e) {
        const countryData = iti.getSelectedCountryData();
        const countryCode = countryData.iso2;
        highlightCountry(countryCode);

        // let placeholder = $(e.target).attr('placeholder');
        // let maskPattern = placeholder.replace(/\d/g, '9');
        // changeMask(maskPattern, $(e.target));
      });

      function highlightCountry(countryCode) {
        arrCountryList.each((index, thisElem) => {
          const thisCode = $(thisElem).data('country-code');
          if (thisCode === countryCode) {
            $(thisElem).addClass('is--active');
          } else {
            $(thisElem).removeClass('is--active');
          }
        });
      }
    });

    // scroll list and style scrollbar
    $('.iti__country-list').attr({ 'data-lenis-prevent': '', 'scroll-style-grey': '' });
  }

}

// Функция загрузки скриптов и инициализации
let isTelInputInitialized = false;

function loadAndInitializeTelInput() {
  if (isTelInputInitialized) return;
  console.log('loadAndInitializeTelInput');
  loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/jquery.inputmask/3.3.4/jquery.inputmask.bundle.js')
    .then(() => loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/20.3.0/js/intlTelInput.min.js'))
    .then(() => {
      initializeTelInput();
      isTelInputInitialized = true; // Устанавливаем флаг после инициализации
    })
    .catch(error => console.error('Ошибка при загрузке скриптов:', error));
}

// Целевой элемент вне модалки
const targetElement = document.querySelector('input[type=tel]');

// Настройка Intersection Observer
const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      observer.disconnect();
      loadAndInitializeTelInput();
    }
  });
}, { threshold: 0.1 });

// Запуск наблюдателя для целевого элемента, если он присутствует на странице
if (targetElement) {
  observer.observe(targetElement);
}

// Проверка и инициализация при открытии модалки
$(document).on('opening', '.remodal', function () {
  const modalTelInput = $(this).find('input[type=tel]');
  if (modalTelInput.length > 0) {
    // Отключение наблюдателя, если он еще активен
    if (observer) observer.disconnect();
    loadAndInitializeTelInput();
  }
});
