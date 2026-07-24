import * as banquetDefault from './banquet-default.js';
import * as megaChurch from './mega-church.js';
import * as wedding from './wedding.js';
import * as conferenceTheatre from './conference-theatre.js';

const presets = {
  'banquet-default': banquetDefault,
  'mega-church': megaChurch,
  'wedding': wedding,
  'conference-theatre': conferenceTheatre,
};

export function getPreset(presetKey) {
  return presets[presetKey] || presets['banquet-default'];
}
