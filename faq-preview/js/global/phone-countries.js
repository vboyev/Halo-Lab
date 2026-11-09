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

// Countries where a landline, or a less common mobile number, is longer than a regular mobile
// number. They keep the library's own limit, which already fits those numbers.
const PHONE_LONGER_THAN_MOBILE = ['de', 'ie', 'il', 'it', 'lu', 'mn', 'nl', 'rs', 'va', 'vn', 'xk', 'zw'];

// intl-tel-input 20.3.0 stops a typed number at the longest number of any type the country has.
// For Ukraine that is a 10-digit toll-free number, so a 9-digit mobile number took a tenth digit
// and lost its spacing; 42 countries behaved the same way. Newer versions of the library stop at
// the longest mobile or landline number. The utils bundled with 20.3.0 can only measure mobile
// numbers, so the limit is the longest mobile number, apart from the countries listed above.
function limitPhoneToMobileLength(iti) {
  const updateMaxLength = iti._updateMaxLength;

  iti._updateMaxLength = function () {
    updateMaxLength.call(this);

    const utils = window.intlTelInputUtils;
    const { iso2 } = this.getSelectedCountryData();
    if (!utils || !iso2 || PHONE_LONGER_THAN_MOBILE.includes(iso2)) return;

    let number = utils.getExampleNumber(iso2, false, utils.numberType.MOBILE, true);
    let longestNumber = number;
    while (utils.isPossibleNumber(number, iso2, true)) {
      longestNumber = number;
      number += '0';
    }

    const mobileLength = utils.getCoreNumber(longestNumber, iso2).length;
    if (mobileLength) this.maxCoreNumberLength = mobileLength;
  };

  iti._updateMaxLength();
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
        utilsScript: "/js/vendor/intl-tel-input-20.3.0/js/utils.min.js",
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

      limitPhoneToMobileLength(iti);

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
  loadScript(
      '/js/vendor/jquery-inputmask-3.3.4/jquery.inputmask.bundle.js')
    .then(() => loadScript(
      '/js/vendor/intl-tel-input-20.3.0/js/intlTelInput.min.js'))
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
