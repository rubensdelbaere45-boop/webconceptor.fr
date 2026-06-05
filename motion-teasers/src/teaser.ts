import { makeProject } from '@motion-canvas/core';
import teaserOffer from './scenes/teaser-offer?scene';

// Variables injectées au build pour personnaliser chaque vidéo prospect
export const PROSPECT_NAME = process.env.PROSPECT_NAME || 'Votre commerce';
export const PROSPECT_CITY = process.env.PROSPECT_CITY || 'France';
export const PROSPECT_TYPE = process.env.PROSPECT_TYPE || 'restaurant';

export default makeProject({
  scenes: [teaserOffer],
  variables: { name: PROSPECT_NAME, city: PROSPECT_CITY, type: PROSPECT_TYPE },
  experimentalFeatures: true,
});
