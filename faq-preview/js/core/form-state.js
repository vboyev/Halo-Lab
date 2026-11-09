/* Provides shared staging and form-submission state used by site forms. */

const isStaging = window.location.origin.includes('webflow.io');
  let formSubmitted = false;
