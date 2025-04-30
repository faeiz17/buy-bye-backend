// utils/geocode.js
const axios = require("axios");

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!GOOGLE_API_KEY) {
  throw new Error("Missing GOOGLE_MAPS_API_KEY in env");
}

/**
 * Forward-geocode an address into full location object
 * including GeoJSON Point + parsed address components.
 */
async function geocodeAddress(address) {
  const url = "https://maps.googleapis.com/maps/api/geocode/json";
  const { data } = await axios.get(url, {
    params: {
      address,
      key: GOOGLE_API_KEY,
      components: "country:PK", // restrict to Pakistan
    },
  });
  if (data.status !== "OK" || !data.results.length) {
    throw new Error(data.error_message || data.status);
  }
  const r = data.results[0];
  const { lat, lng } = r.geometry.location;

  // build the full location object
  const location = {
    type: "Point",
    coordinates: [lng, lat],
    formattedAddress: r.formatted_address,
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
  };

  // parse components
  for (const comp of r.address_components) {
    const name = comp.long_name;
    if (comp.types.includes("street_number"))
      location.street = name + (location.street ? " " + location.street : "");
    if (comp.types.includes("route"))
      location.street = (location.street ? location.street + " " : "") + name;
    if (comp.types.includes("locality")) location.city = name;
    if (comp.types.includes("administrative_area_level_1"))
      location.state = name;
    if (comp.types.includes("postal_code")) location.zipcode = name;
    if (comp.types.includes("country")) location.country = name;
  }

  return location;
}

/**
 * Reverse-geocode lat/lng into a readable address string.
 */
async function reverseGeocode(lat, lon) {
  const url = "https://maps.googleapis.com/maps/api/geocode/json";
  const { data } = await axios.get(url, {
    params: {
      latlng: `${lat},${lon}`,
      key: GOOGLE_API_KEY,
    },
  });
  if (data.status !== "OK" || !data.results.length) {
    throw new Error(data.error_message || data.status);
  }
  return data.results[0].formatted_address;
}

/**
 * Autocomplete suggestions: calls Place Autocomplete + Place Details to get coords.
 */
const LAHORE_CENTER = { lat: 31.5204, lng: 74.3587 };
const LAHORE_RADIUS = 20000; // 20 km

async function suggestAddresses(query) {
  if (!query) return [];

  // 1) Place Autocomplete, biased to Lahore
  const { data: autoData } = await axios.get(
    "https://maps.googleapis.com/maps/api/place/autocomplete/json",
    {
      params: {
        input: query,
        key: GOOGLE_API_KEY,
        types: "address",
        components: "country:pk",
        location: `${LAHORE_CENTER.lat},${LAHORE_CENTER.lng}`,
        radius: LAHORE_RADIUS,
        strictbounds: true,
      },
    }
  );
  if (autoData.status !== "OK" || !autoData.predictions.length) {
    return [];
  }

  // 2) Fetch details for top 10 predictions
  const preds = autoData.predictions.slice(0, 10);
  const results = await Promise.all(
    preds.map(async (p) => {
      const { data: detData } = await axios.get(
        "https://maps.googleapis.com/maps/api/place/details/json",
        {
          params: {
            place_id: p.place_id,
            fields: "formatted_address,geometry",
            key: GOOGLE_API_KEY,
          },
        }
      );
      if (detData.status !== "OK" || !detData.result) return null;
      const { formatted_address, geometry } = detData.result;
      return {
        label: formatted_address,
        coords: [geometry.location.lng, geometry.location.lat],
      };
    })
  );

  return results.filter(Boolean);
}

module.exports = {
  geocodeAddress,
  reverseGeocode,
  suggestAddresses,
};
