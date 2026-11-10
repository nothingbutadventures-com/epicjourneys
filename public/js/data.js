// Homepage content, based on the tours listed on epicjourneys.in.
// Departure dates and reviews are samples: the live site doesn't list them yet.
window.EJ = {
  home: "Meerut, Uttar Pradesh",

  tours: [
    { name: "Rishikesh Ganges Rafting & Yoga Retreat", img: "rishikesh", loc: "Rishikesh, Uttarakhand", state: "Uttarakhand", city: "Haridwar", km: 134, dur: "3D / 2N", price: 8999,
      themes: ["Adventure & Thrill", "Spiritual & Wellness"], blurb: "Three days of white-water rapids and quiet riverside yoga on the Ganges." },
    { name: "Royal Jaipur Forts & Heritage Trail", img: "rajasthan", loc: "Jaipur, Rajasthan", state: "Rajasthan", city: "Jaipur", km: 297, dur: "3D / 2N", price: 11499,
      themes: ["Heritage & Culture"], blurb: "Amber Fort, Hawa Mahal and the artisan bazaars of the Pink City." },
    { name: "Udaipur Lake Palaces & Culture", img: "udaipur", loc: "Udaipur, Rajasthan", state: "Rajasthan", city: "Mussoorie", km: 168, dur: "3D / 2N", price: 11700, was: 13000, off: 10,
      themes: ["Heritage & Culture"], blurb: "Lake Pichola, the City Palace and the hilltop Monsoon Palace at sunset." },
    { name: "North Goa Sun, Sand & Coastal Secrets", img: "goa", loc: "North Goa, Goa", state: "Goa", city: "Goa (North)", km: 1548, dur: "4D / 3N", price: 13999,
      themes: ["Coastal & Beach Leisure"], blurb: "Chapora Fort, quiet beaches and slow Goan afternoons." },
    { name: "Manali Alpine & Solang Valley Adventure", img: "solang", loc: "Manali, Himachal Pradesh", state: "Himachal Pradesh", city: "Manali", km: 366, dur: "4D / 3N", price: 14999,
      themes: ["Adventure & Thrill"], blurb: "Solang's snow valley, Old Manali cafés and the pine groves around Hadimba." },
    { name: "Pushkar Brahma Temple Journey", img: "pushkar", loc: "Pushkar, Rajasthan", state: "Rajasthan", city: "Haridwar", km: 116, dur: "10D / 10N", price: 16000, was: 20000, off: 20,
      themes: ["Heritage & Culture", "Adventure & Thrill"], blurb: "A slow journey to Pushkar's lake ghats and the rare Brahma Temple." },
    { name: "Haridwar & the Ganges", img: "haridwar", loc: "Haridwar, Uttarakhand", state: "Uttarakhand", city: "Haridwar", km: 116, dur: "8D / 8N", price: 16000, was: 20000, off: 20,
      themes: ["Spiritual & Wellness", "Heritage & Culture"], blurb: "Evening aarti at Har Ki Pauri and the holy towns along the Ganges." },
    { name: "Manali Mountain Escape", img: "himachal", loc: "Manali, Himachal Pradesh", state: "Himachal Pradesh", city: "Manali", km: 366, dur: "10D / 10N", price: 16000, was: 20000, off: 20,
      themes: ["Adventure & Thrill"], blurb: "Ten unhurried days in the Kullu valley and the high roads above Manali." },
    { name: "Munnar Misty Hills & Tea Gardens", img: "munnar", loc: "Munnar, Kerala", state: "Kerala", city: "Munnar", km: 2102, dur: "4D / 3N", price: 16500,
      themes: ["Spiritual & Wellness"], blurb: "Tea tasting, cloud-covered trails and spice gardens in the Western Ghats." },
  ],

  regions: {
    states: [
      { name: "Uttarakhand", img: "rishikesh", tours: 2, from: 8999, note: "Haridwar · Rishikesh" },
      { name: "Rajasthan", img: "rajasthan", tours: 3, from: 11499, note: "Jaipur · Udaipur · Pushkar" },
      { name: "Himachal Pradesh", img: "solang", tours: 2, from: 14999, note: "Manali · Solang" },
      { name: "Goa", img: "goa", tours: 1, from: 13999, note: "North Goa" },
      { name: "Kerala", img: "munnar", tours: 1, from: 16500, note: "Munnar" },
    ],
    themes: [
      { name: "Adventure & Thrill", img: "rishikesh", tours: 4, from: 8999, note: "Rafting · snow · mountain roads" },
      { name: "Heritage & Culture", img: "udaipur", tours: 4, from: 11499, note: "Forts · palaces · temple towns" },
      { name: "Spiritual & Wellness", img: "haridwar", tours: 3, from: 8999, note: "Ganga aarti · yoga · tea hills" },
      { name: "Coastal & Beach Leisure", img: "goa", tours: 1, from: 13999, note: "Beaches · forts · slow days" },
    ],
  },

  quick: [
    { name: "Haridwar", img: "haridwar", tours: 2 }, { name: "Rishikesh", img: "rishikesh", tours: 1 },
    { name: "Mussoorie", img: "mussoorie", tours: 1 }, { name: "Jaipur", img: "rajasthan", tours: 1 },
    { name: "Pushkar", img: "pushkar", tours: 1 }, { name: "Udaipur", img: "udaipur", tours: 1 },
    { name: "Manali", img: "solang", tours: 2 }, { name: "Munnar", img: "munnar", tours: 1 },
  ],

  // Departure cities and their distance from Meerut. Tour counts and
  // starting prices are worked out from the tours above.
  cities: [
    { name: "Haridwar", km: 116, lat: 29.9457, lng: 78.1642 }, { name: "Mussoorie", km: 168, lat: 30.4598, lng: 78.0644 },
    { name: "Jaipur", km: 297, lat: 26.9124, lng: 75.7873 }, { name: "Manali", km: 366, lat: 32.2432, lng: 77.1892 },
    { name: "Goa (North)", km: 1548, lat: 15.5937, lng: 73.8142 }, { name: "Munnar", km: 2102, lat: 10.0889, lng: 77.0595 },
  ],

  speciality: [
    { name: "Adventure & Thrill", img: "rishikesh", title: "Rapids, snow and high mountain roads",
      text: "White-water on the Ganges at Rishikesh, snow days at Solang and long drives above Manali." },
    { name: "Heritage & Culture", img: "rajasthan", title: "Forts, lake palaces and temple towns",
      text: "Amber Fort and the Pink City, Udaipur's lakes and the ghats of Pushkar, with time to wander." },
    { name: "Spiritual & Wellness", img: "haridwar", title: "Slow mornings by sacred rivers",
      text: "Evening Ganga Aarti at Har Ki Pauri, riverside yoga in Rishikesh and quiet tea-garden walks in Munnar." },
    { name: "Coastal & Beach Leisure", img: "goa", title: "Quiet beaches and unhurried days",
      text: "North Goa's old forts, sunsets and slow afternoons by the sea." },
  ],

  live: [
    { name: "Rajasthan", count: 3 }, { name: "Uttarakhand", count: 2 }, { name: "Himachal Pradesh", count: 2 },
    { name: "Goa", count: 1 }, { name: "Kerala", count: 1 },
  ],

  // Sample departure dates
  departing: [
    { date: "08 Nov", name: "Rishikesh Ganges Rafting & Yoga Retreat", days: 3, city: "Haridwar", seats: 6, guaranteed: true },
    { date: "12 Nov", name: "Royal Jaipur Forts & Heritage Trail", days: 3, city: "Jaipur", seats: 4, guaranteed: true },
    { date: "15 Nov", name: "Manali Alpine & Solang Valley Adventure", days: 4, city: "Manali", seats: 3, guaranteed: true },
    { date: "21 Nov", name: "Udaipur Lake Palaces & Culture", days: 3, city: "Mussoorie", seats: 8, guaranteed: true },
    { date: "28 Nov", name: "Munnar Misty Hills & Tea Gardens", days: 4, city: "Munnar", seats: 5, guaranteed: false },
  ],

  deals: ["Pushkar Brahma Temple Journey", "Haridwar & the Ganges", "Manali Mountain Escape", "Udaipur Lake Palaces & Culture", "Rishikesh Ganges Rafting & Yoga Retreat", "Munnar Misty Hills & Tea Gardens"],

  inclusions: [
    ["✓", "Verified tours", "Every itinerary is checked by our team before it's listed."],
    ["⌂", "Local operators", "Trips are run by partners who live and work in the destination."],
    ["₹", "Clear pricing", "Per-person prices in rupees. Reserve many tours with a small deposit."],
    ["✆", "Help when you need it", "Questions before or during your trip? Our team is a message away."],
  ],

  // Sample reviews, shown with a "Sample" label until real ones are collected
  reviews: [
    { stars: 5, trip: "Adventure · Rishikesh Rafting & Yoga", text: "The rafting was the highlight, and the morning yoga by the river was the perfect reset after.", name: "Sample traveller", month: "Oct 2026", manager: "Local partner" },
    { stars: 5, trip: "Heritage · Royal Jaipur", text: "Short, well paced and easy to book. We saw everything we wanted to without rushing.", name: "Sample traveller", month: "Oct 2026", manager: "Local partner" },
    { stars: 4, trip: "Spiritual · Haridwar & the Ganges", text: "शाम की गंगा आरती का अनुभव शब्दों में बताना मुश्किल है।", name: "Sample traveller", month: "Sep 2026", manager: "Local partner", lang: "Hindi" },
    { stars: 5, trip: "Adventure · Manali & Solang", text: "Clear prices, a friendly local team and snow at Solang. Exactly what we wanted.", name: "Sample traveller", month: "Sep 2026", manager: "Local partner" },
  ],

  // Travel guides for the blog section, written around the tours above
  blog: [
    { tag: "Heritage", img: "udaipur", read: 4, tour: "Udaipur Lake Palaces & Culture",
      title: "A slow weekend in Udaipur: lakes, palaces and sunset points",
      excerpt: "How to spend three unhurried days around Lake Pichola, from the City Palace to sunset at the Monsoon Palace.",
      body: [
        "Udaipur is built around its lakes, and the easiest way to see it is slowly. Start at the City Palace on the banks of Lake Pichola, then take a boat out on the water in the late afternoon, when the light turns the palace walls gold.",
        "For sunset, head up to the Monsoon Palace (Sajjangarh) on the hills west of the city. The views reach across the lakes and the Aravalli hills.",
        "October to March is the most comfortable time to visit, with cool mornings and clear evenings.",
      ] },
    { tag: "Adventure", img: "rishikesh", read: 5, tour: "Rishikesh Ganges Rafting & Yoga Retreat",
      title: "First time rafting in Rishikesh? Here's what to expect",
      excerpt: "Seasons, what to wear and how a day on the Ganges rapids actually goes, for first-timers.",
      body: [
        "Rafting in Rishikesh runs for most of the year, but stops during the monsoon months when the river is too high. The cooler months are the most comfortable for beginners.",
        "Wear quick-drying clothes and shoes that strap on; life jackets and helmets are provided. Your guide gives a safety briefing before you get in, and teaches the paddle calls you'll use on the rapids.",
        "Operators set their own minimum age and rules, so check them when you book, especially if you're travelling with children.",
      ] },
    { tag: "Spiritual", img: "haridwar", read: 3, tour: "Haridwar & the Ganges",
      title: "Watching the evening Ganga Aarti at Har Ki Pauri",
      excerpt: "When to arrive, where to stand and what happens during Haridwar's best-known evening ritual.",
      body: [
        "Every evening around sunset, priests at Har Ki Pauri in Haridwar perform the Ganga Aarti: large brass lamps are raised to the river while bells ring and hymns are sung.",
        "The ghats fill up quickly, so arrive well before sunset for a good spot. Visitors leave their shoes before stepping onto the ghat.",
        "Afterwards, many people float small leaf-boat lamps (diyas) on the river, which is one of the most memorable sights of the evening.",
      ] },
  ],

  faq: {
    "General": [
      ["Who runs the tours?", "Each trip is run by a local partner who lives and works in the destination. Our team checks every itinerary before it's listed."],
      ["How does 'starting near you' work?", "We show departure cities nearest to your location first. Change your city or the distance at any time to see more tours."],
    ],
    "Pricing": [
      ["Are prices per person?", "Yes. All prices are per person, in Indian rupees."],
      ["Do I pay the full amount upfront?", "Many tours can be reserved with a small deposit, with the balance paid before departure."],
    ],
    "Booking": [
      ["How do I book?", "Pick your departure city and destination, compare dates, prices and seats left, then book online."],
      ["Can I see how many seats are left?", "Yes. Each departure shows the number of seats still available."],
    ],
    "Cancellations": [
      ["What if I need to cancel?", "Cancellation terms are listed in our Cancellation Policy and on each tour before you pay."],
    ],
    "Partners": [
      ["Can I list my tours on EpicJourneys?", "Yes. Local operators can apply through Become a Partner and manage their tours in the Partner Portal."],
    ],
  },
};

// LocalStart Lounges: certified partner offices where a tour group boards in
// the traveller's own town. Partner names are samples for this preview.
EJ.lounges = [
  { city: "Meerut", state: "Uttar Pradesh", partner: "Shree Ganga Travels", lat: 28.9845, lng: 77.7064 },
  { city: "Bareilly", state: "Uttar Pradesh", partner: "Ram Ganga Holidays", lat: 28.3670, lng: 79.4304 },
  { city: "Moradabad", state: "Uttar Pradesh", partner: "Pital Nagri Tours", lat: 28.8386, lng: 78.7733 },
  { city: "Agra", state: "Uttar Pradesh", partner: "Yamuna Tour Point", lat: 27.1767, lng: 78.0081 },
  { city: "Jhansi", state: "Uttar Pradesh", partner: "Bundelkhand Yatra", lat: 25.4484, lng: 78.5685 },
  { city: "Lucknow", state: "Uttar Pradesh", partner: "Awadh Journeys", lat: 26.8467, lng: 80.9462 },
  { city: "Dehradun", state: "Uttarakhand", partner: "Doon Valley Travels", lat: 30.3165, lng: 78.0322 },
  { city: "Haldwani", state: "Uttarakhand", partner: "Kumaon Gateway", lat: 29.2183, lng: 79.5130 },
  { city: "Ludhiana", state: "Punjab", partner: "Satluj Tours", lat: 30.9010, lng: 75.8573 },
  { city: "Jalandhar", state: "Punjab", partner: "Doaba Holidays", lat: 31.3260, lng: 75.5762 },
  { city: "Kota", state: "Rajasthan", partner: "Chambal Travels", lat: 25.2138, lng: 75.8648 },
  { city: "Ajmer", state: "Rajasthan", partner: "Aravalli Yatra", lat: 26.4499, lng: 74.6399 },
  { city: "Indore", state: "Madhya Pradesh", partner: "Malwa Tour House", lat: 22.7196, lng: 75.8577 },
  { city: "Gwalior", state: "Madhya Pradesh", partner: "Fort City Travels", lat: 26.2183, lng: 78.1828 },
  { city: "Guntur", state: "Andhra Pradesh", partner: "Krishna Holidays", lat: 16.3067, lng: 80.4365 },
  { city: "Vijayawada", state: "Andhra Pradesh", partner: "Bezawada Tours", lat: 16.5062, lng: 80.6480 },
  { city: "Siliguri", state: "West Bengal", partner: "Teesta Travel Desk", lat: 26.7271, lng: 88.3953 },
];
// Towns without a lounge yet: travellers there join from the nearest one,
// with a free feeder shuttle.
EJ.towns = [
  { city: "Hapur", state: "Uttar Pradesh", lat: 28.7306, lng: 77.7759 },
  { city: "Muzaffarnagar", state: "Uttar Pradesh", lat: 29.4727, lng: 77.7085 },
  { city: "Rampur", state: "Uttar Pradesh", lat: 28.8155, lng: 79.0256 },
  { city: "Shahjahanpur", state: "Uttar Pradesh", lat: 27.8826, lng: 79.9090 },
  { city: "Aligarh", state: "Uttar Pradesh", lat: 27.8974, lng: 78.0880 },
  { city: "Mathura", state: "Uttar Pradesh", lat: 27.4924, lng: 77.6737 },
  { city: "Roorkee", state: "Uttarakhand", lat: 29.8543, lng: 77.8880 },
  { city: "Rudrapur", state: "Uttarakhand", lat: 28.9875, lng: 79.4141 },
  { city: "Bundi", state: "Rajasthan", lat: 25.4305, lng: 75.6499 },
  { city: "Ujjain", state: "Madhya Pradesh", lat: 23.1765, lng: 75.7885 },
  { city: "Tenali", state: "Andhra Pradesh", lat: 16.2430, lng: 80.6400 },
  { city: "Jalpaiguri", state: "West Bengal", lat: 26.5167, lng: 88.7167 },
];
// Sample departure months and who each tour suits, for the hero search.
const TOUR_PLAN = {
  "Rishikesh Ganges Rafting & Yoga Retreat": { months: ["2026-11", "2027-02", "2027-03", "2027-04"], for: ["Women's Special"] },
  "Royal Jaipur Forts & Heritage Trail": { months: ["2026-11", "2026-12", "2027-01", "2027-02"], for: ["Family"] },
  "Udaipur Lake Palaces & Culture": { months: ["2026-11", "2026-12", "2027-01"], for: ["Family", "Women's Special"] },
  "North Goa Sun, Sand & Coastal Secrets": { months: ["2026-12", "2027-01", "2027-02", "2027-03"], for: ["Family"] },
  "Manali Alpine & Solang Valley Adventure": { months: ["2026-12", "2027-01", "2027-02"], for: ["Family"] },
  "Pushkar Brahma Temple Journey": { months: ["2026-11", "2027-02", "2027-03"], for: [] },
  "Haridwar & the Ganges": { months: ["2026-11", "2026-12", "2027-01", "2027-03", "2027-04"], for: ["Family", "Women's Special"] },
  "Manali Mountain Escape": { months: ["2027-03", "2027-04"], for: [] },
  "Munnar Misty Hills & Tea Gardens": { months: ["2026-12", "2027-01", "2027-02"], for: ["Family", "Women's Special"] },
};
EJ.tours.forEach((t) => Object.assign(t, TOUR_PLAN[t.name]));

// Regions for the "Where we go" map. Best months are general guidance;
// regions marked soon have no tours listed yet.
EJ.atlas = [
  { name: "Uttarakhand", q: "Uttarakhand", places: "Haridwar · Rishikesh", months: "Sep – Nov, Feb – May", lat: 30.0, lng: 78.2 },
  { name: "Himachal Pradesh", q: "Himachal", places: "Manali · Solang Valley", months: "Oct – Jun", lat: 32.2, lng: 77.2 },
  { name: "Rajasthan", q: "Rajasthan", places: "Jaipur · Udaipur · Pushkar", months: "Oct – Mar", lat: 26.3, lng: 74.6 },
  { name: "Goa", q: "Goa", places: "North Goa", months: "Nov – Feb", lat: 15.5, lng: 73.9 },
  { name: "Kerala", q: "Kerala", places: "Munnar", months: "Sep – Mar", lat: 10.1, lng: 77.1 },
  { name: "Nepal", soon: true, places: "Kathmandu · Pokhara", months: "Oct – Nov, Mar – Apr", lat: 27.9, lng: 84.6 },
  { name: "Bhutan", soon: true, places: "Paro · Thimphu", months: "Mar – May, Sep – Nov", lat: 27.4, lng: 89.8 },
  { name: "Sri Lanka", soon: true, places: "Kandy · Galle", months: "Dec – Mar", lat: 7.3, lng: 80.6 },
];

// Traveller stories for the testimonials. These are SAMPLES written to show the
// format (pickup ease from smaller towns); replace with real reviews and real
// group photos once the first tours have run.
EJ.stories = [
  { name: "Sunita R.", town: "Jhansi", trip: "Haridwar & the Ganges", img: "haridwar", pickup: "15 min from home", type: "seniors", who: "With her sister", when: "Sep 2026", rating: 5,
    title: "Picked up 15 minutes from my house",
    text: "As a woman in my 60s living in a smaller town, travelling to Delhi to catch a tour was always terrifying. This time I was picked up 15 minutes from my house, at a local café point. The tour was affordable and incredibly respectful." },
  { name: "Rakesh M.", town: "Bareilly", trip: "Manali Alpine & Solang Valley", img: "solang", pickup: "10 min from home", type: "families", who: "Family of 6", when: "Oct 2026", rating: 5,
    title: "Not one overnight train to Delhi",
    text: "Two kids and my parents, and not one overnight train to Delhi. We boarded at the lounge in Bareilly, handed over our bags, and the coach was waiting." },
  { name: "Priya S.", town: "Meerut", trip: "Udaipur Lake Palaces · Women's Special", img: "udaipur", pickup: "12 min from home", type: "women", who: "Solo, in a women's group", when: "Sep 2026", rating: 5,
    title: "A coordinator who knew my name",
    text: "My first trip with a women's group. Waiting at a clean partner office in my own city, with a coordinator who knew my name, made it easy to say yes." },
  { name: "Mohan & Kamla G.", town: "Kota", trip: "Pushkar Brahma Temple Journey", img: "pushkar", pickup: "A short auto ride", type: "seniors", who: "Couple, in their 70s", when: "Aug 2026", rating: 5,
    title: "A short auto ride and a cup of tea",
    text: "At our age, reaching the starting point is the hardest part. Here it was a short auto ride to the lounge and a cup of tea, and we were on our way." },
  { name: "Arjun T.", town: "Guntur", trip: "Munnar Misty Hills & Tea Gardens", img: "munnar", pickup: "20 min from home", type: "friends", who: "4 friends", when: "Oct 2026", rating: 4,
    title: "Saved a day and an extra ticket",
    text: "We started from Guntur instead of going to Hyderabad first. That saved a day and an extra ticket, and the price we were quoted was the price we paid. The Munnar hotel was a little far from town, but the coach made it easy." },
  { name: "Neha K.", town: "Lucknow", trip: "Manali Mountain Escape · Women's group", img: "himachal", pickup: "10 min from home", type: "women", who: "Solo, in a women's group", when: "Oct 2026", rating: 5,
    title: "Nine other women and a coordinator on call",
    text: "I was nervous about going alone. There were nine other women in the group and the coordinator checked on us at every stop. My parents tracked the coach the whole way and finally stopped calling every hour." },
  { name: "Rahul & Sneha D.", town: "Indore", trip: "North Goa Sun, Sand & Coastal Secrets", img: "goa", pickup: "15 min from home", type: "friends", who: "Couple", when: "Sep 2026", rating: 4,
    title: "Easy start, wished for one more beach day",
    text: "Boarding in Indore was effortless and the hotels were spotless. The itinerary was packed, so we wished for one more free day on the beach, but for the price it was excellent value." },
];

// Ongoing tours schedule: SAMPLE departures (dates and seats) until the live
// schedule is connected. "seats" is seats left out of "of"; "guaranteed" means
// the departure will run whatever the final group size.
EJ.schedule = [
  { date: "2026-11-08", name: "Rishikesh Ganges Rafting & Yoga Retreat", seats: 6, of: 20, guaranteed: true },
  { date: "2026-11-12", name: "Royal Jaipur Forts & Heritage Trail", seats: 4, of: 20, guaranteed: true },
  { date: "2026-11-15", name: "Manali Alpine & Solang Valley Adventure", seats: 3, of: 20, guaranteed: true },
  { date: "2026-11-21", name: "Udaipur Lake Palaces & Culture", seats: 8, of: 20, guaranteed: true },
  { date: "2026-11-28", name: "Munnar Misty Hills & Tea Gardens", seats: 5, of: 18, guaranteed: false },
  { date: "2026-12-02", name: "Pushkar Brahma Temple Journey", seats: 7, of: 20, guaranteed: true },
  { date: "2026-12-05", name: "Haridwar & the Ganges", seats: 9, of: 24, guaranteed: true },
  { date: "2026-12-09", name: "Manali Mountain Escape", seats: 2, of: 20, guaranteed: true },
  { date: "2026-12-12", name: "North Goa Sun, Sand & Coastal Secrets", seats: 10, of: 22, guaranteed: false },
];

// SAMPLE popularity scores (bookings in the last 90 days) for "Most popular" sorting.
EJ.popularity = {
  "Haridwar & the Ganges": 182, "Rishikesh Ganges Rafting & Yoga Retreat": 164, "Udaipur Lake Palaces & Culture": 141,
  "Manali Alpine & Solang Valley Adventure": 133, "Royal Jaipur Forts & Heritage Trail": 118, "North Goa Sun, Sand & Coastal Secrets": 97,
  "Pushkar Brahma Temple Journey": 88, "Manali Mountain Escape": 76, "Munnar Misty Hills & Tea Gardens": 64,
};

// SAMPLE festive offer for the banner under the hero (dates in IST).
EJ.promo = {
  tag: "Diwali Special",
  title: "Flat ₹3,000 off per family",
  detail: "on every spiritual & pilgrimage tour",
  note: "For 2 or more travellers booking together. Applied at checkout.",
  ends: "2026-11-10T23:59:00+05:30",
  cat: "spiritual",
  perFamily: 3000,
};

// Hero slides. {city} is replaced with the visitor's chosen starting city.
EJ.heroSlides = [
  { img: "jaipur-hawa-mahal-hero", place: "Hawa Mahal, Jaipur", label: "Rajasthan", line: "From {city} to the Pink City, direct." },
  { img: "bhutan", place: "Tiger's Nest, Bhutan", label: "Bhutan", line: "Direct departures from {city} to Bhutan." },
  { img: "srilanka-mirissa-hero", place: "Mirissa, Sri Lanka", label: "Sri Lanka", line: "Your journey from {city} to Colombo starts here." },
  { img: "kathmandu-stupa-hero", place: "Kathmandu, Nepal", label: "Nepal", line: "{city} to Kathmandu, with no 200 km detour." },
  { img: "solang", place: "Solang Valley, Himachal", label: "Himachal", line: "Snow at Solang. Boarding in {city}." },
];

// SAMPLE pricing rules for the all-inclusive calculator, until live pricing is connected.
EJ.pricing = {
  childShare: 0.75,          // children 5–11 pay this share of the adult price
  infantsFree: true,         // under 5 travel free (no seat, no bed)
  included: [
    ["Pickup from your LocalStart Lounge", "Coach from your own town and back"],
    ["Hotels", "Twin sharing, checked by our team"],
    ["Breakfast & dinner", "Every day of the tour"],
    ["Sightseeing, entry tickets & guide", "Everything on the itinerary"],
    ["Taxes", "5% GST already in the price"],
  ],
};

// SAMPLE traveller stories for the family-voice section, written in the way
// people actually message and post. Shown with a "sample" note until real
// traveller posts (with their permission) replace them. {city} = visitor's city.
EJ.ugc = [
  { type: "chat", title: "Ghar 🏠", msgs: [
    ["them", "Maa", "Bus kitne baje hai?", "9:41"],
    ["me", "", "8 baje, yahin {city} wale lounge se. Ghar se 10 min.", "9:42"],
    ["them", "Maa", "Papa ki dawai wala bag kaun uthayega?", "9:42"],
    ["me", "", "Coordinator hai Maa, saara saman woh bus mein rakhwa denge 😄", "9:43"],
  ] },
  { type: "reel", video: "video/snippets/ganga-boat.mp4", text: "Mummy-Papa ki pehli group trip. Ghar ke paas se boarding, aur shaam ko Ganga pe naav 🙏", who: "Ritika", city: "Moradabad", trip: "Haridwar & the Ganges · 8D / 8N", likes: "2,184" },
  { type: "voice", who: "Papa", length: "0:24", text: "Bus mein AC tha, seat aage wali mili. Is baar ghutno ka dard bhi nahi hua.", city: "Jhansi" },
  { type: "post", text: "Akeli jaane ka darr tha. Group mein 9 aur ladkiyan thi, coordinator ne sabko naam se bulaya. Next trip already booked.", who: "Neha", city: "Lucknow", trip: "Women's group · Manali" },
  { type: "note", stars: 5, text: "₹11,700 bola tha, ₹11,700 hi laga. Na pickup ka extra, na hotel ka.", who: "Rakesh", city: "Dehradun", trip: "Udaipur · 3D / 2N" },
];

// SAMPLE product-page content (tour.html?t=<slug>). Not used by the homepage.
// Everything here is placeholder until the owner confirms dates, prices,
// captain, hotels and policies. {city} = the visitor's LocalStart city.
EJ.tourPages = {
  "bhutan-7-days": {
    name: "Bhutan Valleys & Monasteries", short: "Bhutan", img: "bhutan", loc: "Thimphu · Punakha · Paro, Bhutan", state: "Bhutan",
    nights: 6, days: 7, pace: "Leisurely pace", meals: "All meals included", pickup: "5:30 am", rating: 4.8, ratingCount: 126,
    price: 39500, was: 44000, deposit: 5000,
    summary: "Pristine valleys, cliffside monasteries and old fortresses in the world's happiest country. Short driving days, late starts and one sightseeing stop at a time, planned for families and senior citizens.",
    highlights: ["Tiger's Nest viewpoint, with a pony option for knees", "Punakha Dzong where two rivers meet", "Dochula Pass and its 108 stupas", "Buddha Dordenma over Thimphu", "Evening in a Bhutanese farmhouse"],
    // Departures. Direct = picked up at the visitor's own lounge. Feeder = a short AC drive from a lounge within 100 km.
    departures: [
      { date: "2026-11-14", seats: 7, of: 24, guaranteed: true, price: 39500, was: 44000 },
      { date: "2026-11-28", seats: 3, of: 24, guaranteed: true, price: 39500, was: 44000 },
      { date: "2026-12-12", seats: 14, of: 24, guaranteed: false, price: 41500 },
      { date: "2027-03-06", seats: 20, of: 24, guaranteed: false, price: 42500 },
    ],
    // How the visitor reaches the main group (Delhi), then the tour
    journey: [
      { title: "LocalStart Lounge, {city}", text: "Tea and check-in at {lounge}. Your coordinator weighs bags and hands over the trip kit.", time: "5:30 am" },
      { title: "AC feeder coach", text: "Pushback seats, a washroom stop every 90 minutes and breakfast on the way. Live location shared with family.", time: "6:00 am" },
      { title: "Meet the main group, Delhi T3", text: "Captain Amit meets you at the gate and handles check-in for the whole group.", time: "11:30 am" },
      { title: "Fly to Bagdogra, drive into Bhutan", text: "One short flight, then the group coach to Phuentsholing. No platform changes, no metro hotel nights.", time: "Evening" },
    ],
    itinerary: [
      { title: "{city} to Phuentsholing", text: "Pickup at your LocalStart Lounge, AC feeder coach to Delhi airport, group flight to Bagdogra and a 4-hour drive to the Bhutan border town.", stay: "Phuentsholing · 3★", meals: "Breakfast, dinner" },
      { title: "Up into the hills to Thimphu", text: "Permit check at the border (our team files it), then a slow climb with tea stops. Evening free to rest and adjust to the height.", stay: "Thimphu · 3★", meals: "Breakfast, lunch, dinner" },
      { title: "Thimphu at an easy pace", text: "Buddha Dordenma, the Memorial Chorten where locals walk at dawn, the folk heritage museum and the weekend market.", stay: "Thimphu · 3★", meals: "Breakfast, lunch, dinner" },
      { title: "Dochula Pass to Punakha", text: "108 stupas on the pass with a view of the Himalaya on clear days, then down to warm Punakha valley and the river-side dzong.", stay: "Punakha · 3★", meals: "Breakfast, lunch, dinner" },
      { title: "Punakha to Paro", text: "Morning at leisure by the river, then the scenic drive to Paro. Evening walk on Paro's main street.", stay: "Paro · 3★", meals: "Breakfast, lunch, dinner" },
      { title: "Tiger's Nest, your way", text: "Walk to the cafeteria viewpoint, take a pony, or stay below at Kyichu Lhakhang. Farmhouse dinner and hot-stone bath option.", stay: "Paro · 3★", meals: "Breakfast, lunch, dinner" },
      { title: "Home to {city}", text: "Drive to Bagdogra, group flight to Delhi and the AC feeder coach back to your lounge. Your coordinator stays until the last bag is collected.", stay: "Home", meals: "Breakfast, lunch" },
    ],
    includes: [
      ["Pickup and drop at your LocalStart Lounge", "AC feeder coach to Delhi and back"],
      ["Delhi – Bagdogra flights", "Economy, 15 kg check-in bag"],
      ["6 nights in 3★ hotels", "Twin sharing, lift or ground-floor rooms on request"],
      ["All meals from Day 1 dinner", "Veg and Jain kitchens confirmed in advance"],
      ["Bhutan permit and Sustainable Development Fee", "₹1,200 per night, paid by us"],
      ["Tour captain, local guide and all driver tips", "No one asks for a tip on the trip"],
      ["Entry tickets on the itinerary", "Dzongs, museums, Buddha Dordenma"],
      ["Taxes", "5% GST already in the price"],
    ],
    excludes: [
      "Personal shopping and souvenirs",
      "Pony at Tiger's Nest (about ₹1,000, paid locally if you choose it)",
      "Hot-stone bath at the farmhouse (optional)",
      "Travel insurance (we can add it for ₹650 per person)",
      "Extra baggage above the airline allowance",
    ],
    hotels: [
      { name: "Hotel Druk, Phuentsholing", nights: 1, stars: 3 },
      { name: "Hotel Norbuling, Thimphu", nights: 2, stars: 3 },
      { name: "Punakha River Lodge", nights: 1, stars: 3 },
      { name: "Paro Valley Resort", nights: 2, stars: 3 },
    ],
    safety: [
      ["Senior citizen pace", "Washroom stop every 90 minutes on the road, late starts, and no more than one climb a day."],
      ["Live GPS for women's groups", "Families get a live location link for the coach and the captain's number before you leave home."],
      ["Medicine timings respected", "Tell us your schedule once. Meals and stops are planned around it, and a first-aid kit with oxygen travels with the group."],
      ["One coordinator, start to finish", "The same person from your lounge to Bhutan and back, reachable on WhatsApp all day."],
    ],
    captain: { name: "Amit Sharma", role: "Tour captain", years: 11, trips: 64, langs: ["Hindi", "English", "Punjabi", "Nepali"],
      quote: "My priority is making sure medicine timings are respected and the food tastes like home." },
    food: [
      ["Pure veg", "Separate veg kitchen at every hotel. Eggs on request only."],
      ["Strict Jain", "No onion, garlic or root vegetables, confirmed with each kitchen before the trip."],
      ["Home comfort", "Dal, roti and rice every day, plus North and South Indian breakfasts. Try ema datshi when you're ready."],
    ],
    reviews: [
      { name: "Sushma Agarwal", town: "Bareilly", who: "With her husband", when: "Oct 2026", rating: 5, pickup: "10 min from home", title: "We didn't have to go to Delhi on our own", text: "Bus picked us from Civil Lines at 6 am. At the airport Amit ji was already waiting with our boarding passes." },
      { name: "Rajendra Saxena", town: "Moradabad", who: "Retired couple", when: "Oct 2026", rating: 5, pickup: "1 hr feeder", title: "Pace was right for my knees", text: "I took the pony at Tiger's Nest. Nobody rushed us and there was always a washroom when needed." },
      { name: "Nidhi Gupta", town: "Rampur", who: "Women's group of 6", when: "Sep 2026", rating: 4, pickup: "45 min feeder", title: "Jain food every single day", text: "We were worried about food in Bhutan. The cook knew our list before we arrived. One hotel lift was slow, that's all." },
      { name: "Vikas Khandelwal", town: "Shahjahanpur", who: "With parents", when: "Sep 2026", rating: 5, pickup: "1 hr feeder", title: "Price we paid was the price", text: "₹39,500 each and nothing more. Permit, tips, flights, all inside it." },
    ],
    faq: [
      ["Do we need a passport for Bhutan?", "Indian citizens can travel with a passport or a voter ID card. Children under 18 can use a birth certificate or school ID. We file the permit for you."],
      ["Is the altitude a problem for seniors?", "The highest point you sleep at is Thimphu (about 2,300 m). We go up slowly over two days and carry oxygen. Tell us about heart or breathing conditions when you book."],
      ["How do I book on WhatsApp?", "Pick your date and travellers in 'Plan your trip', then tap 'Book on WhatsApp'. A coordinator replies within 15 minutes (8 am – 9 pm) with a UPI link for the deposit."],
      ["What if I have to cancel?", "Full refund up to 30 days before departure, 50% up to 15 days, and the deposit is kept after that. You can move to a later date once for free."],
    ],
    similar: [
      { name: "Sacred Nepal Spiritual Yatra", img: "kathmandu-stupa-hero", dur: "6D / 5N", loc: "Kathmandu · Pokhara", price: 34500, sample: true },
      { name: "Haridwar & the Ganges" }, { name: "Rishikesh Ganges Rafting & Yoga Retreat" }, { name: "Udaipur Lake Palaces & Culture" },
    ],
  },
};

// Product-page slugs for the homepage tours (tour.html?t=<slug>)
EJ.tours.forEach((t) => { t.slug = t.slug || t.name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); });

// SAMPLE brand-wide product-page content, used for any tour whose own page
// (EJ.tourPages) doesn't set it. Needs owner sign-off like the rest.
EJ.tourDefaults = {
  excludes: ["Personal shopping and souvenirs", "Lunch on travel days (a clean dhaba stop is planned)", "Optional activities you choose on the spot", "Travel insurance (we can add it for ₹250 per person)"],
  safety: [
    ["Senior citizen pace", "Washroom stop every 90 minutes on the road, late starts, and no more than one climb a day."],
    ["Live GPS for women's groups", "Families get a live location link for the coach and the coordinator's number before you leave home."],
    ["Medicine timings respected", "Tell us your schedule once. Meals and stops are planned around it, and a first-aid kit travels with the group."],
    ["One coordinator, start to finish", "The same person from your lounge to the destination and back, reachable on WhatsApp all day."],
  ],
  food: [
    ["Pure veg", "Veg kitchens at every hotel on the route. Eggs on request only."],
    ["Strict Jain", "No onion, garlic or root vegetables, confirmed with each kitchen before the trip."],
    ["Home comfort", "Dal, roti and rice every day, with North and South Indian breakfasts."],
  ],
};

// Airports the group flies between when a tour is too far to reach by coach
// (product page). Travellers reach the nearest one on an AC feeder coach.
EJ.hubs = [
  { name: "Delhi", code: "DEL", lat: 28.5562, lng: 77.1000 }, { name: "Lucknow", code: "LKO", lat: 26.7606, lng: 80.8893 },
  { name: "Jaipur", code: "JAI", lat: 26.8242, lng: 75.8122 }, { name: "Indore", code: "IDR", lat: 22.7218, lng: 75.8011 },
  { name: "Chandigarh", code: "IXC", lat: 30.6735, lng: 76.7885 }, { name: "Hyderabad", code: "HYD", lat: 17.2403, lng: 78.4294 },
  { name: "Vijayawada", code: "VGA", lat: 16.5304, lng: 80.7968 }, { name: "Bagdogra", code: "IXB", lat: 26.6812, lng: 88.3286 },
  { name: "Goa", code: "GOI", lat: 15.3808, lng: 73.8314 }, { name: "Kochi", code: "COK", lat: 10.1520, lng: 76.4019 },
];

// Product-page gallery: photos (img/<name>.jpg) and clips per tour slug. Only
// media of the tour's own places; credits from img/credits.json.
EJ.galleries = {
  "bhutan-7-days": [{ img: "bhutan", cap: "Tiger's Nest monastery, Paro", by: "Aswin" }],
  "rishikesh-ganges-rafting-and-yoga-retreat": [
    { img: "rishikesh", cap: "Temple towers on the Ganga, Rishikesh", by: "Saurabh Kumar" },
    { video: "video/snippets/rishikesh-rafting.mp4", cap: "Rafting on the Ganga" },
    { img: "seniors", cap: "Ganga aarti at Triveni Ghat", by: "Bhuvi Uniyal" },
    { video: "video/rishikesh.mp4", cap: "Ram Jhula", by: "Subhashish Panigrahi" },
  ],
  "royal-jaipur-forts-and-heritage-trail": [
    { img: "jaipur-hawa-mahal-hero", cap: "Hawa Mahal at dusk", by: "Tony Sebastian" },
    { img: "rajasthan", cap: "Decorated horses past Hawa Mahal", by: "Aditya Siva" },
    { video: "video/jaipur.mp4", cap: "Hawa Mahal from above", by: "Baap8969" },
    { img: "women", cap: "Hawa Mahal from the street", by: "Chainwit." },
  ],
  "udaipur-lake-palaces-and-culture": [
    { img: "udaipur-lake-palace-hero", cap: "Lake Palace on Lake Pichola" },
    { img: "udaipur", cap: "City Palace complex", by: "Aditya Parikh" },
    { img: "udaipur-lake-palace", cap: "Evening on the lake" },
  ],
  "haridwar-and-the-ganges": [
    { img: "haridwar", cap: "Har Ki Pauri on the Ganga", by: "Jyotirmoy Gupta" },
    { video: "video/haridwar.mp4", cap: "Ganga aarti, Haridwar", by: "Bhaiyaji Smile 123" },
    { video: "video/snippets/ganga-boat.mp4", cap: "An evening boat on the Ganga" },
  ],
  "munnar-misty-hills-and-tea-gardens": [
    { img: "munnar", cap: "Tea hills around Munnar", by: "gaurav kumar" },
    { video: "video/munnar.mp4", cap: "The road through the tea gardens", by: "Vinayaraj" },
  ],
  "manali-alpine-and-solang-valley-adventure": [
    { img: "solang", cap: "Snow slopes at Solang Valley", by: "Aditya Chache" },
    { img: "himachal", cap: "A snow day in the Himachal hills", by: "Iftekhar Nibir" },
  ],
  "pushkar-brahma-temple-journey": [
    { img: "pushkar", cap: "Pushkar, Rajasthan" },
    { img: "tour/pushkar-ghats", cap: "Pushkar Lake and its ghats at twilight", by: "Vyacheslav Argenberg" },
    { img: "tour/pushkar-temple", cap: "Brahma Temple, Pushkar", by: "Adityavijayavargia" },
    { img: "tour/pushkar-view", cap: "Pushkar from the Savitri Temple hill", by: "Jakub Hałun" },
    { img: "tour/pushkar-fair", cap: "Camels at the Pushkar Fair", by: "Sudipta Dutta Chowdhury" },
  ],
  "manali-mountain-escape": [
    { img: "himachal", cap: "A snow day in the Himachal hills", by: "Iftekhar Nibir" },
    { img: "solang", cap: "Solang Valley near Manali", by: "Aditya Chache" },
  ],
};

// "Where you'll stay, ride and eat" cards on every tour page. SAMPLE stock photos (Wikimedia Commons)
// until partners send photos of their own rooms, coaches, meals and lounges.
EJ.tourStay = [
  { key: "room", img: "tour/tour-room", cap: "Sample photo: a hotel room", by: "Sahil Dhiman" },
  { key: "coach", img: "tour/tour-coach", cap: "Sample photo: an AC Volvo coach", by: "Nikkul" },
  { key: "meal", img: "tour/tour-meal", cap: "Sample photo: a veg thali", by: "Rajeeb Dutta" },
  { key: "lounge", img: "tour/tour-lounge", cap: "Sample photo: a partner lounge", by: "Biswarup Ganguly" },
];

// SAMPLE company details for the product page's trust block. Placeholders the
// owner must fill before launch are written "to be added".
EJ.company = {
  name: "EpicJourneys Travel Pvt. Ltd.", reg: "CIN to be added", gst: "GSTIN to be added",
  phone: "+91 00000 00000", tel: "+910000000000", whatsapp: "910000000000",
  loungeHours: "10 am – 7 pm, Monday to Saturday",
};
// SAMPLE booking rules used by every product page (a tour's own page can override them)
Object.assign(EJ.tourDefaults, {
  singleShare: 0.4,                          // single room: 40% more than the per-person price
  cancel: [[30, 0], [15, 0.5], [0, 1]],      // [days before departure or more, share of the total charged]
  replyMins: 15,
  seniorNote: "No separate senior fare. Travellers over 60 get front seats, lift or ground-floor rooms, and a slower plan at no extra cost.",
  infantNote: "Under 5s travel free on your lap. Want a seat for them on the coach? Add them as a child (75%).",
  access: "Wheelchair users: tell us when you book. Hotels on our routes have lifts or ground-floor rooms.",
});
// Bhutan page: who it suits, and how much walking and driving each day asks for
Object.assign(EJ.tourPages["bhutan-7-days"], { for: ["Family", "Seniors friendly"] });
[
  { drive: "About 12 hrs door to hotel: 5 hrs coach, 2 hr flight, 4 hrs road", walk: "Very little", long: true },
  { drive: "About 6 hrs on the road, with tea stops", walk: "Very little" },
  { drive: "Short city drives", walk: "Easy, about 2 km. A few steps at Buddha Dordenma" },
  { drive: "About 3 hrs", walk: "Easy, about 1.5 km. Steep wooden stairs inside Punakha Dzong" },
  { drive: "About 4 hrs", walk: "Easy, about 1 km" },
  { drive: "20 min to the trail", walk: "Your choice: 4–5 hr uphill hike, a pony, or stay at the base with no walking" },
  { drive: "About 12 hrs home: 4 hrs road, 2 hr flight, 5 hrs coach", walk: "Very little", long: true },
].forEach((x, i) => Object.assign(EJ.tourPages["bhutan-7-days"].itinerary[i], x));
EJ.tourPages["bhutan-7-days"].faq[3][1] = "Cancel 30 or more days before departure for a full refund. Between 29 and 15 days, half the trip price is charged. Within 14 days there is no refund. You can move to a later date once for free.";

// Standard departures (product page, third tab): metro cities where travellers
// make their own way to the group's meeting point. SAMPLE meeting points and saving.
EJ.metros = [
  { city: "Delhi", meet: "Delhi airport (T3)", lat: 28.5562, lng: 77.1000 },
  { city: "Mumbai", meet: "Mumbai airport (T2)", lat: 19.0896, lng: 72.8656 },
  { city: "Bengaluru", meet: "Bengaluru airport (T1)", lat: 13.1986, lng: 77.7066 },
  { city: "Kolkata", meet: "Kolkata airport", lat: 22.6547, lng: 88.4467 },
  { city: "Chennai", meet: "Chennai airport (T1)", lat: 12.9941, lng: 80.1709 },
  { city: "Hyderabad", meet: "Hyderabad airport", lat: 17.2403, lng: 78.4294 },
  { city: "Ahmedabad", meet: "Ahmedabad airport (T2)", lat: 23.0734, lng: 72.6266 },
  { city: "Pune", meet: "Pune airport", lat: 18.5821, lng: 73.9197 },
];
EJ.tourDefaults.metroSaving = 1500; // per person: no lounge pickup or feeder on a standard departure

// Live data from the server replaces the sample content (set by window.EJ_LIVE)
if (window.EJ_LIVE) {
  const L = window.EJ_LIVE;
  if (L.lounges) EJ.lounges = L.lounges;
  if (L.towns) EJ.towns = L.towns;
  if (L.home) {
    // Homepage: live tours, departures and places replace the sample ones
    EJ.tours = L.home.tours;
    EJ.schedule = L.home.schedule;
    EJ.cities = L.home.cities;
    EJ.regions = L.home.regions;
    EJ.live = L.home.live;
    EJ.departing = L.home.schedule.slice(0, 5).map((d) => ({ date: d.date, name: d.name, days: (L.home.tours.find((t) => t.name === d.name) || {}).days || 0, city: (L.home.tours.find((t) => t.name === d.name) || {}).city, seats: d.seats, guaranteed: d.guaranteed }));
    EJ.deals = L.home.tours.filter((t) => t.off).map((t) => t.name);
  }
}
