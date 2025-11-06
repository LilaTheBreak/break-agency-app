// src/data/listings.js
// Schema notes (all optional except id, title, price, beds, baths, hero):
// id, title, area, postcode, address, price, beds, baths, type,
// hero, photos[], video, floorplans[], internal_m2|internal_sqft, external_m2|external_sqft,
// tenure, leaseYearsRemaining, brochure, epc_link,
// council_tax_band, parking, accessibility (string or string[]), garden,
// utility_supply, rights_restrictions, broadband_mbps,
// nearest_stations[], nearest_schools[], sold_nearby[],
// lat, lng, featured, description, features[]

export const LISTINGS = [
  // --- LONDON (Kensington) ---
  {
    id: "w8-123",
    title: "Elegant 3-bed in Kensington",
    area: "Kensington",
    postcode: "W8 5TT",
    address: "123 Kensington High St, London W8",
    price: 1850000,
    beds: 3,
    baths: 2,
    type: "Apartment",
    hero: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1400&auto=format&fit=crop",
    photos: [
      "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1493666438817-866a91353ca9?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1400&auto=format&fit=crop"
    ],
    video: null,
    floorplans: [
      "https://images.unsplash.com/photo-1520881363902-a0ff4e722963?q=80&w=1200&auto=format&fit=crop"
    ],
    internal_m2: 112,
    external_m2: 18,
    tenure: "Leasehold",
    leaseYearsRemaining: 121,
    brochure: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    epc_link: "https://find-energy-certificate.service.gov.uk/energy-certificate/0000-0000-0000-0000-0000",
    council_tax_band: "G",
    parking: "Resident permit",
    accessibility: ["Lift", "Step-free entrance"],
    garden: "Private terrace",
    utility_supply: "Mains water, electricity, gas; gas central heating; mains drainage.",
    rights_restrictions: "No short-lets under the lease.",
    broadband_mbps: 1000,
    nearest_stations: ["High St Kensington — 6 min walk", "Earl’s Court — 12 min"],
    nearest_schools: ["Fox Primary — Outstanding"],
    sold_nearby: ["Flat 4, 9 Example Mews W8 sold £1.725m (May 2024)"],
    lat: 51.501,
    lng: -0.193,
    featured: true,
    description:
      "A beautifully presented third-floor apartment with lift access, bespoke joinery and a south-facing terrace.",
    features: ["Lift", "Concierge", "Underfloor heating", "South-facing terrace"]
  },

  {
    id: "w8-999",
    title: "Penthouse with Roof Terrace, Kensington",
    area: "Kensington",
    postcode: "W8 5TT",
    address: "Phillimore Gardens, London W8",
    price: 3250000,
    beds: 3,
    baths: 3,
    type: "Penthouse",
    tenure: "Leasehold",
    hero: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1400&auto=format&fit=crop",
    photos: [
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1444418776041-9c7e33cc5a9c?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1400&auto=format&fit=crop"
    ],
    video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    description:
      "A light-filled duplex penthouse with bespoke kitchen, oak herringbone floors and a private roof terrace with skyline views.",
    brochure: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    floorplans: [
      "https://images.unsplash.com/photo-1520881363902-a0ff4e722963?q=80&w=1200&auto=format&fit=crop"
    ],
    council_tax_band: "G",
    parking: "Off-street residents’ parking (permit available)",
    accessibility: "Lift, step-free access from street to lift",
    garden: "Private roof terrace",
    internal_m2: 168,
    internal_sqft: 1808,
    external_m2: 38,
    external_sqft: 409,
    utility_supply: "Mains gas, electricity, water.",
    rights_restrictions: "No short-term lets under 90 days",
    broadband_mbps: 1000,
    epc_link: "https://find-energy-certificate.service.gov.uk/energy-certificate/0000-0000-0000-0000-0000",
    lat: 51.5009,
    lng: -0.1923,
    nearest_stations: [
      "High Street Kensington (Circle & District) — 4 min",
      "Kensington Olympia (Overground) — 12 min"
    ],
    nearest_schools: ["Fox Primary — Outstanding", "Holland Park School — Good"],
    sold_nearby: [
      "3-bed flat on Phillimore Gardens sold £3.1m (Aug 2025)",
      "2-bed mews on Abingdon Villas sold £2.25m (Jun 2025)"
    ],
    featured: true
  },

  // --- LONDON (various) ---
  {
    id: "sw3-200",
    title: "Chelsea mews house",
    area: "Chelsea",
    postcode: "SW3 4SS",
    address: "Example Mews, London SW3",
    price: 2450000,
    beds: 3,
    baths: 2,
    type: "Mews",
    hero: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1400&auto=format&fit=crop",
    photos: [],
    internal_sqft: 1450,
    garden: "Small courtyard",
    council_tax_band: "F",
    lat: 51.4901,
    lng: -0.166,
    featured: false,
    description: "Quintessential cobbled mews with bright living space and garage."
  },

  {
    id: "w14-310",
    title: "Holland Park garden flat",
    area: "Holland Park",
    postcode: "W14 8AB",
    address: "Addison Gardens, London W14",
    price: 995000,
    beds: 1,
    baths: 1,
    type: "Apartment",
    hero: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=1400&auto=format&fit=crop",
    garden: "Shared gardens",
    council_tax_band: "E",
    lat: 51.5028,
    lng: -0.2106,
    featured: false,
    description: "Raised-ground floor period conversion with access to communal gardens."
  },

  {
    id: "w11-405",
    title: "Notting Hill top-floor period",
    area: "Notting Hill",
    postcode: "W11 2BQ",
    address: "Ladbroke Rd, London W11",
    price: 1750000,
    beds: 2,
    baths: 1,
    type: "Apartment",
    hero: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=1400&auto=format&fit=crop",
    council_tax_band: "F",
    lat: 51.5136,
    lng: -0.2055,
    featured: false,
    description: "Top-floor with vaulted ceilings and far-reaching roofscape views."
  },

  // --- MANCHESTER ---
  {
    id: "m1-101",
    title: "Canal-side loft with beams",
    area: "Manchester City Centre",
    postcode: "M1 2HG",
    address: "Canal St, Manchester M1",
    price: 425000,
    beds: 2,
    baths: 2,
    type: "Loft",
    hero: "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?q=80&w=1400&auto=format&fit=crop",
    photos: [
      "https://images.unsplash.com/photo-1505691723518-36a5ac3b2f63?q=80&w=1400&auto=format&fit=crop"
    ],
    internal_sqft: 980,
    tenure: "Leasehold",
    council_tax_band: "D",
    broadband_mbps: 1000,
    nearest_stations: ["Piccadilly — 8 min walk"],
    lat: 53.4779,
    lng: -2.2325,
    featured: true,
    description: "Exposed brick, timber beams and Juliet balconies over the canal.",
    features: ["Exposed brick", "Juliet balcony", "Dual aspect"]
  },

  // --- BIRMINGHAM ---
  {
    id: "b15-220",
    title: "Edgbaston townhouse with parking",
    area: "Edgbaston",
    postcode: "B15 3TR",
    address: "Calthorpe Estate, Birmingham B15",
    price: 695000,
    beds: 4,
    baths: 3,
    type: "Townhouse",
    hero: "https://images.unsplash.com/photo-1582582621959-48d3d0d5a1b8?q=80&w=1400&auto=format&fit=crop",
    internal_m2: 152,
    garden: "Rear garden",
    parking: "Driveway + garage",
    council_tax_band: "G",
    nearest_stations: ["Five Ways — 10 min walk"],
    lat: 52.4681,
    lng: -1.9205,
    featured: false,
    description: "Modern townhouse on tree-lined avenue close to the city core."
  },

  // --- BRISTOL ---
  {
    id: "bs8-045",
    title: "Clifton terrace with views",
    area: "Clifton",
    postcode: "BS8 3AA",
    address: "Royal York Crescent, Bristol BS8",
    price: 895000,
    beds: 3,
    baths: 2,
    type: "Apartment",
    hero: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1400&auto=format&fit=crop",
    photos: [],
    internal_sqft: 1305,
    garden: "Communal gardens",
    council_tax_band: "E",
    nearest_stations: ["Clifton Down — 12 min walk"],
    lat: 51.4545,
    lng: -2.6208,
    featured: true,
    description: "First-floor Georgian with tall sash windows and harbour views."
  },

  // --- LEEDS ---
  {
    id: "ls1-330",
    title: "Victoria Quarter penthouse",
    area: "Leeds City Centre",
    postcode: "LS1 6AZ",
    address: "Vicar Ln, Leeds LS1",
    price: 575000,
    beds: 2,
    baths: 2,
    type: "Penthouse",
    hero: "https://images.unsplash.com/photo-1460317442991-0ec209397118?q=80&w=1400&auto=format&fit=crop",
    internal_m2: 105,
    terrace: true,
    council_tax_band: "F",
    broadband_mbps: 900,
    nearest_stations: ["Leeds — 8 min walk"],
    lat: 53.7997,
    lng: -1.5433,
    featured: false,
    description: "Glass-wrapped living with wrap-around terrace over the arcades."
  },

  // --- EDINBURGH ---
  {
    id: "eh3-410",
    title: "New Town garden apartment",
    area: "Edinburgh New Town",
    postcode: "EH3 6QQ",
    address: "Heriot Row, Edinburgh EH3",
    price: 725000,
    beds: 2,
    baths: 2,
    type: "Apartment",
    hero: "https://images.unsplash.com/photo-1503596476-1c12a8ba09aa?q=80&w=1400&auto=format&fit=crop",
    photos: [],
    internal_m2: 98,
    external_m2: 30,
    tenure: "Freehold",
    council_tax_band: "F",
    garden: "Private rear patio",
    nearest_stations: ["Waverley — 15 min walk"],
    lat: 55.955,
    lng: -3.199,
    featured: true,
    description: "Elegant Georgian with original cornicing and private garden access."
  },

  // --- GLASGOW ---
  {
    id: "g12-510",
    title: "West End tenement with bay windows",
    area: "Glasgow West End",
    postcode: "G12 8QQ",
    address: "Great Western Rd, Glasgow G12",
    price: 365000,
    beds: 2,
    baths: 1,
    type: "Apartment",
    hero: "https://images.unsplash.com/photo-1505692794403-34f4980af668?q=80&w=1400&auto=format&fit=crop",
    internal_sqft: 980,
    council_tax_band: "D",
    nearest_stations: ["Hillhead — 3 min walk"],
    lat: 55.875,
    lng: -4.292,
    featured: false,
    description: "High ceilings, original fireplace and dining kitchen in prime G12."
  },

  // --- OXFORD ---
  {
    id: "ox2-120",
    title: "North Oxford semi with studio",
    area: "Summertown",
    postcode: "OX2 7BP",
    address: "Banbury Rd, Oxford OX2",
    price: 1195000,
    beds: 4,
    baths: 3,
    type: "Semi-detached",
    hero: "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1400&auto=format&fit=crop",
    internal_m2: 160,
    external_m2: 45,
    garden: "Landscaped garden + studio",
    parking: "Driveway",
    council_tax_band: "G",
    nearest_stations: ["Oxford Parkway — 8 min drive"],
    lat: 51.778,
    lng: -1.264,
    featured: false,
    description: "Edwardian semi with rear studio and open-plan family space."
  },

  // --- CAMBRIDGE ---
  {
    id: "cb1-044",
    title: "Riverside apartment with balcony",
    area: "Cambridge",
    postcode: "CB1 1PT",
    address: "Mill Park, Cambridge CB1",
    price: 525000,
    beds: 2,
    baths: 2,
    type: "Apartment",
    hero: "https://images.unsplash.com/photo-1505691723518-36a5ac3b2f63?q=80&w=1400&auto=format&fit=crop",
    internal_m2: 82,
    balcony: true,
    council_tax_band: "E",
    nearest_stations: ["Cambridge — 5 min walk"],
    lat: 52.194,
    lng: 0.138,
    featured: true,
    description: "Bright dual-aspect apartment moments from the station."
  },

  // --- BRIGHTON ---
  {
    id: "bn1-260",
    title: "Regency seafront apartment",
    area: "Brighton",
    postcode: "BN1 1AA",
    address: "Kings Rd, Brighton BN1",
    price: 675000,
    beds: 2,
    baths: 2,
    type: "Apartment",
    hero: "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1400&auto=format&fit=crop",
    internal_sqft: 1040,
    council_tax_band: "E",
    nearest_stations: ["Brighton — 14 min walk"],
    lat: 50.822,
    lng: -0.143,
    featured: false,
    description: "Bow-fronted reception with direct sea views over the promenade."
  },

  // --- YORK ---
  {
    id: "yo1-090",
    title: "City walls townhouse",
    area: "York",
    postcode: "YO1 7HZ",
    address: "Skeldergate, York YO1",
    price: 595000,
    beds: 3,
    baths: 2,
    type: "Townhouse",
    hero: "https://images.unsplash.com/photo-1464146072230-91cabc968266?q=80&w=1400&auto=format&fit=crop",
    internal_m2: 120,
    parking: "Allocated space",
    council_tax_band: "E",
    nearest_stations: ["York — 10 min walk"],
    lat: 53.957,
    lng: -1.084,
    featured: false,
    description: "Modern townhouse tucked behind the historic city walls."
  },

  // --- BATH ---
  {
    id: "ba2-310",
    title: "Bath stone maisonette",
    area: "Bath",
    postcode: "BA2 4QX",
    address: "Widcombe, Bath BA2",
    price: 525000,
    beds: 2,
    baths: 2,
    type: "Maisonette",
    hero: "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1400&auto=format&fit=crop",
    internal_m2: 95,
    garden: "Terrace",
    council_tax_band: "D",
    nearest_stations: ["Bath Spa — 6 min walk"],
    lat: 51.377,
    lng: -2.357,
    featured: true,
    description: "Handsome Bath stone with terrace overlooking the canal."
  },

  // --- CARDIFF ---
  {
    id: "cf11-204",
    title: "Pontcanna period apartment",
    area: "Cardiff",
    postcode: "CF11 9DF",
    address: "Cathedral Rd, Cardiff CF11",
    price: 325000,
    beds: 2,
    baths: 1,
    type: "Apartment",
    hero: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1400&auto=format&fit=crop",
    internal_sqft: 860,
    council_tax_band: "D",
    nearest_stations: ["Ninian Park — 15 min walk"],
    lat: 51.485,
    lng: -3.203,
    featured: false,
    description: "High-ceiling reception with original cornicing in leafy Pontcanna."
  },

  // --- NEWCASTLE ---
  {
    id: "ne1-118",
    title: "Quayside duplex with river views",
    area: "Newcastle",
    postcode: "NE1 3DE",
    address: "Quayside, Newcastle NE1",
    price: 415000,
    beds: 2,
    baths: 2,
    type: "Duplex",
    hero: "https://images.unsplash.com/photo-1480072721557-6a44c07afb1e?q=80&w=1400&auto=format&fit=crop",
    internal_m2: 92,
    balcony: true,
    council_tax_band: "E",
    nearest_stations: ["Central — 12 min walk"],
    lat: 54.969,
    lng: -1.607,
    featured: true,
    description: "Duplex living with balcony overlooking the Tyne bridges."
  }
];

