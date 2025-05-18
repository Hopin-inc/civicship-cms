/**
 * Migration script for converting existing place data to work with @amicaldo/strapi-google-maps
 * 
 * This script:
 * 1. Fetches all existing places from the database
 * 2. Updates their location data format to be compatible with the new plugin
 * 3. Preserves existing latitude/longitude values
 * 
 * Usage:
 * NODE_ENV=development node scripts/migrate-location-data.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

async function migrateLocationData() {
  try {
    const strapi = await require('@strapi/strapi').Strapi().load();
    console.log('Strapi instance loaded');

    const places = await strapi.db.query('api::place.place').findMany({});
    console.log(`Found ${places.length} places to migrate`);

    let updated = 0;
    for (const place of places) {
      try {
        if (place.mapLocation && typeof place.mapLocation === 'object') {
          console.log(`Place ${place.id} (${place.name}) already has mapLocation data, skipping`);
          continue;
        }

        const newLocationData = {
          lat: parseFloat(place.latitude),
          lng: parseFloat(place.longitude),
          address: place.address,
        };

        await strapi.db.query('api::place.place').update({
          where: { id: place.id },
          data: {
            mapLocation: newLocationData,
          },
        });

        console.log(`Updated place ${place.id} (${place.name})`);
        updated++;
      } catch (placeError) {
        console.error(`Error updating place ${place.id} (${place.name}):`, placeError);
      }
    }

    console.log(`Migration completed. Updated ${updated} out of ${places.length} places.`);
    
    await strapi.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateLocationData();
