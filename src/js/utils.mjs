// utils.mjs
export function detectLocale() {
  const languageString = navigator.language || '';
  const language = languageString.split(/[_-]/)[0].toLowerCase();

  switch (language) {
  case 'en':
    return 'en';
  case 'el':
    return 'en';
  default:
    return 'en';
  }
}

function loadCldrData(languageTag = 'en', $ = jQuery) {
  return $.when(
    $.get( `js/vendor/cldr/${languageTag}/ca-gregorian.json` ),
    $.get( `js/vendor/cldr/${languageTag}/currencies.json` ),
    $.get( `js/vendor/cldr/${languageTag}/numbers.json`),
    $.get( `js/vendor/cldr/${languageTag}/units.json` ),
  ).then(function() {
    // Normalize $.get results, we only need the JSON, not the request statuses.
    return [].slice.apply( arguments, [ 0 ] ).map(function( result ) {
      return result[ 0 ];
    });
  }).then(Globalize.load)
}

export function loadTranslationsFor(languageTag = 'en', $ = jQuery) {
  return loadCldrData(languageTag).then(function () {
    return $.get( `locale/${languageTag}/messages.json` ).then(function (data) {
      return Globalize.loadMessages(data);
    })
  })
}
