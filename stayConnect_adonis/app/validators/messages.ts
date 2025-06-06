/**
 * Custom validation error messages
 */
export const messages = {
  // General validation messages
  required: 'The {{ field }} field is required',
  string: 'The {{ field }} must be a string',
  number: 'The {{ field }} must be a number',
  boolean: 'The {{ field }} must be a boolean',
  array: 'The {{ field }} must be an array',
  object: 'The {{ field }} must be an object',
  email: 'The {{ field }} must be a valid email address',
  url: 'The {{ field }} must be a valid URL',
  date: 'The {{ field }} must be a valid date',
  enum: 'The {{ field }} must be one of {{ options }}',
  uuid: 'The {{ field }} must be a valid UUID',

  // Length validation messages
  minLength: 'The {{ field }} must be at least {{ min }} characters',
  maxLength: 'The {{ field }} must not exceed {{ max }} characters',
  min: 'The {{ field }} must be at least {{ min }}',
  max: 'The {{ field }} must not exceed {{ max }}',
  range: 'The {{ field }} must be between {{ min }} and {{ max }}',

  // Comparison validation messages
  confirmed: 'The {{ field }} confirmation does not match',
  unique: 'The {{ field }} has already been taken',
  exists: 'The selected {{ field }} is invalid',
  after: 'The {{ field }} must be after {{ after }}',
  before: 'The {{ field }} must be before {{ before }}',
  future: 'The {{ field }} must be a date in the future',
  past: 'The {{ field }} must be a date in the past',

  // Format validation messages
  alpha: 'The {{ field }} may only contain letters',
  alphaNum: 'The {{ field }} may only contain letters and numbers',
  alphaDash: 'The {{ field }} may only contain letters, numbers, dashes and underscores',
  regex: 'The {{ field }} format is invalid',
  json: 'The {{ field }} must be a valid JSON string',

  // File validation messages
  file: 'The {{ field }} must be a file',
  image: 'The {{ field }} must be an image',
  mimes: 'The {{ field }} must be a file of type: {{ types }}',
  size: 'The {{ field }} must not be larger than {{ size }}',

  // Custom validation messages
  username: 'The username can only contain letters, numbers, underscores and hyphens',
  password: 'The password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  trackDuration: 'The track duration must be in MM:SS format',
  socialMedia: {
    facebook: 'The Facebook URL is invalid',
    twitter: 'The Twitter URL is invalid',
    instagram: 'The Instagram URL is invalid',
    soundcloud: 'The SoundCloud URL is invalid',
    spotify: 'The Spotify URL is invalid',
    youtube: 'The YouTube URL is invalid'
  },
  releaseType: 'The release type must be album, single, or ep',
  voteValue: 'The vote value must be between 1 and 5'
}