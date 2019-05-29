import {detectLocale, loadTranslationsFor} from './utils.mjs';
import {LocaleProvider} from './localeProvider.mjs';

(function($) {
  $.when(
    $.get( 'js/vendor/cldr/en/ca-gregorian.json' ),
    $.get( 'js/vendor/cldr/en/currencies.json' ),
    $.get( 'js/vendor/cldr/en/numbers.json' ),
    $.get( 'js/vendor/cldr/en/units.json' ),
    $.get( 'js/vendor/cldr/supplemental/plurals.json' ),
    $.get( 'js/vendor/cldr/supplemental/timeData.json' ),
    $.get( 'js/vendor/cldr/supplemental/weekData.json' ),
    $.get( 'js/vendor/cldr/supplemental/likelySubtags.json' )
  ).then(function() {
    // Normalize $.get results, we only need the JSON, not the request statuses.
    return [].slice.apply( arguments, [ 0 ] ).map(function( result ) {
      return result[ 0 ];
    });
  }).then(Globalize.load).then(function() {
    const locale = new LocaleProvider(detectLocale());
    locale.onChangeLocale((tag)=> {
      console.log('Locale Changed to', tag);
      loadTranslationsFor(tag).then(() => {
        const current = Globalize(tag);
        console.log(current.messageFormatter( 'like' )(10));
      });
    });

    console.log('Detected user locale is', detectLocale());
    locale.setCurrent('el');
    console.log('Current user locale is', locale.getCurrent());
  });

// eslint-disable-next-line no-undef
}(jQuery));
