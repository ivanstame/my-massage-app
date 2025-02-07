// export const DEFAULT_TZ = 'America/Los_Angeles';
// export const UTC_TZ = 'UTC';

// export const TIME_FORMATS = {
//   ISO_DATE: 'yyyy-MM-dd',
//   ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
//   TIME_12H: 'h:mm a',
//   TIME_24H: 'HH:mm',
//   HUMAN_DATE: 'MMMM d, yyyy'
// };

// export const DST_TRANSITIONS = {
//   SPRING_2023: '2023-03-12',
//   FALL_2023: '2023-11-05'
// };

// src/utils/timeConstants.js

const DEFAULT_TZ = 'America/Los_Angeles';
const UTC_TZ = 'UTC';

const TIME_FORMATS = {
  ISO_DATE: 'yyyy-MM-dd',
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  TIME_12H: 'h:mm a',
  TIME_24H: 'HH:mm',
  HUMAN_DATE: 'MMMM d, yyyy'
};

module.exports = {
  DEFAULT_TZ,
  UTC_TZ,
  TIME_FORMATS
};