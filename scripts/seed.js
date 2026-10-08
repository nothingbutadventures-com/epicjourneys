const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// Automatically load from .env.local if present
let envUri = process.env.MONGODB_URI;
if (!envUri) {
  try {
    const envContent = fs.readFileSync(path.join(__dirname, "../.env.local"), "utf8");
    const match = envContent.match(/MONGODB_URI=(.*)/);
    if (match) {
      envUri = match[1].trim();
    }
  } catch {}
}

const MONGODB_URI = envUri || "";

async function seedDatabase() {
  if (!MONGODB_URI || MONGODB_URI.includes("<username>") || MONGODB_URI.includes("<password>")) {
    console.error("\n[EpicJourneys Seed] Error: Please set a valid real MONGODB_URI in .env.local before running seed.");
    console.log("Example in .env.local:\nMONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/epicjourneys?retryWrites=true&w=majority\n");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB Atlas for EpicJourneys...");
    await mongoose.connect(MONGODB_URI, { dbName: "epicjourneys" });
    console.log("Connected successfully to database: epicjourneys!");

    const db = mongoose.connection.db;

    // Optional: Clean existing collections in epicjourneys database to ensure fresh clean state
    console.log("Clearing existing collections in epicjourneys...");
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
      await db.collection(col.name).deleteMany({});
      console.log(`Cleaned collection: ${col.name}`);
    }

    // 1. Create Admin
    const adminPassword = await bcrypt.hash("Admin@123", 10);
    const partnerPassword = await bcrypt.hash("Partner@123", 10);

    const adminUser = await db.collection("users").insertOne({
      name: "EpicJourneys Super Admin",
      email: "admin@epicjourneys.in",
      password: adminPassword,
      role: "admin",
      phone: "+91 98765 43210",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("Created Admin:", adminUser.insertedId);

    // 2. Create Destinations & Partners
    const destinationsData = [
      {
        name: "Manali",
        state: "Himachal Pradesh",
        coordinates: { lat: 32.2432, lng: 77.1892 },
        description:
          "Nestled in the Beas River valley, Manali is India's premier mountain paradise offering alpine serenity, adventure sports, and scenic passes.",
        coverImage:
          "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&auto=format&fit=crop&q=80",
        partner: {
          name: "Rajesh Sharma",
          email: "manali.partner@epicjourneys.in",
          phone: "+91 94180 12345",
        },
      },
      {
        name: "Jaipur",
        state: "Rajasthan",
        coordinates: { lat: 26.9124, lng: 75.7873 },
        description:
          "The legendary Pink City with royal palaces, UNESCO World Heritage hill forts, vibrant bazaars, and opulent Rajasthani culinary traditions.",
        coverImage:
          "https://images.unsplash.com/photo-1603288940356-9b044d51381f?w=1200&auto=format&fit=crop&q=80",
        partner: {
          name: "Vikram Singh Rathore",
          email: "jaipur.partner@epicjourneys.in",
          phone: "+91 98290 67890",
        },
      },
      {
        name: "Rishikesh",
        state: "Uttarakhand",
        coordinates: { lat: 30.0869, lng: 78.2676 },
        description:
          "The Yoga Capital of the World along the sacred Ganges, famous for exhilarating white-water rapids, cliff jumping, and evening Ganga Aarti.",
        coverImage:
          "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=1200&auto=format&fit=crop&q=80",
        partner: {
          name: "Amit Rawat",
          email: "rishikesh.partner@epicjourneys.in",
          phone: "+91 97580 43210",
        },
      },
      {
        name: "Munnar",
        state: "Kerala",
        coordinates: { lat: 10.0889, lng: 77.0595 },
        description:
          "Perched at 1,600m in the Western Ghats, Munnar captivates with rolling emerald tea gardens, cascading waterfalls, and misty peaks.",
        coverImage:
          "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=1200&auto=format&fit=crop&q=80",
        partner: {
          name: "Thomas Varghese",
          email: "munnar.partner@epicjourneys.in",
          phone: "+91 94470 98765",
        },
      },
      {
        name: "Goa (North)",
        state: "Goa",
        coordinates: { lat: 15.5494, lng: 73.7535 },
        description:
          "Sun-kissed Arabian shores, Portuguese heritage villas, water sports, beach shacks, and unforgettable sunset cruises.",
        coverImage:
          "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&auto=format&fit=crop&q=80",
        partner: {
          name: "Antonio Fernandes",
          email: "goa.partner@epicjourneys.in",
          phone: "+91 98221 54321",
        },
      },
      {
        name: "Udaipur",
        state: "Rajasthan",
        coordinates: { lat: 24.5854, lng: 73.7125 },
        description:
          "Known as the City of Lakes and Venice of the East, famed for Pichola Lake, heritage havelis, and romantic boat rides.",
        coverImage:
          "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?w=1200&auto=format&fit=crop&q=80",
        partner: {
          name: "Devendra Chouhan",
          email: "udaipur.partner@epicjourneys.in",
          phone: "+91 94141 33445",
        },
      },
    ];

    const destinationMap = {};
    const partnerMap = {};

    for (const d of destinationsData) {
      // Create destination record first
      const destDoc = await db.collection("destinations").insertOne({
        name: d.name,
        state: d.state,
        coordinates: d.coordinates,
        description: d.description,
        coverImage: d.coverImage,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const destId = destDoc.insertedId;
      destinationMap[d.name] = destId;

      // Create assigned partner
      const partnerUser = await db.collection("users").insertOne({
        name: d.partner.name,
        email: d.partner.email,
        password: partnerPassword,
        role: "partner",
        phone: d.partner.phone,
        assignedDestination: destId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      partnerMap[d.name] = partnerUser.insertedId;

      // Link partner back to destination
      await db.collection("destinations").updateOne(
        { _id: destId },
        { $set: { partnerId: partnerUser.insertedId } }
      );

      console.log(`Created Destination ${d.name} with Partner ${d.partner.name}`);
    }

    // 3. Create Tours (Both Starting & Ending points match destination city)
    const toursData = [
      {
        title: "Manali Alpine & Solang Valley Adventure",
        slug: "manali-alpine-solang-valley-adventure",
        shortDescription:
          "4-Day alpine retreat exploring Solang snow valley, Old Manali cafés, and Hadimba pine groves.",
        description:
          "Experience the pure mountain magic of Himachal Pradesh. From the lively pine-covered lanes of Old Manali to paragliding in Solang Valley, this curated journey brings you the premier Himalayan experience with comfortable stays and local mountain guides.",
        state: "Himachal Pradesh",
        destinationName: "Manali",
        durationDays: 4,
        durationNights: 3,
        priceInr: 14999,
        maxGroupSize: 12,
        coverImage:
          "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&auto=format&fit=crop&q=80",
        images: [
          "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1000&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80",
        ],
        highlights: [
          "Solang Valley adventure & panoramic views",
          "Historic 16th century Hadimba Temple in cedar woods",
          "Riverside camping & bonfire evening near Beas",
          "Vashisht natural sulphur hot spring baths",
        ],
        itinerary: [
          {
            day: 1,
            title: "Arrival in Manali & Old Manali Walk",
            description:
              "Arrive in Manali, check into your scenic resort. Afternoon walk through cedar forests to Hadimba Temple and cozy cafés in Old Manali.",
            meals: "Dinner",
            stay: "Alpine View Resort Manali",
          },
          {
            day: 2,
            title: "Solang Valley & Atal Tunnel Excursion",
            description:
              "Full day excursion to Solang Valley for paragliding, ATV rides, and drive through the world-famous Atal Tunnel into Lahaul valley.",
            meals: "Breakfast, Dinner",
            stay: "Alpine View Resort Manali",
          },
          {
            day: 3,
            title: "Naggar Castle Heritage & River Beas Trail",
            description:
              "Visit historic Naggar Castle and Nicholas Roerich Art Gallery. Riverside nature walk with evening bonfire and barbecue.",
            meals: "Breakfast, Dinner",
            stay: "Alpine View Resort Manali",
          },
          {
            day: 4,
            title: "Vashisht Springs & Departure",
            description:
              "Morning soak at Vashisht hot springs, souvenir shopping at Mall Road, and departure from Manali.",
            meals: "Breakfast",
            stay: "Tour concludes",
          },
        ],
        inclusions: [
          "3 Nights accommodation in 4-star mountain view rooms",
          "Daily buffet breakfast & chef-curated dinner",
          "Private local cab transfers for all sightseeing",
          "All state permits, tolls & parking fees",
        ],
        exclusions: [
          "Personal paragliding or adventure activity gear rental",
          "Lunch & personal beverages",
          "Travel insurance",
        ],
      },
      {
        title: "Royal Jaipur Forts & Regal Heritage Trail",
        slug: "royal-jaipur-forts-regal-heritage-trail",
        shortDescription:
          "3-Day immersive royal experience across Amber Fort, Hawa Mahal, and artisan bazaars.",
        description:
          "Discover the majestic capital of Rajasthan. Walk the courtyards of Rajput royalty, gaze upon astronomical wonders at Jantar Mantar, and savor authentic Dal Baati Churma in traditional haveli dining halls.",
        state: "Rajasthan",
        destinationName: "Jaipur",
        durationDays: 3,
        durationNights: 2,
        priceInr: 11499,
        maxGroupSize: 15,
        coverImage:
          "https://images.unsplash.com/photo-1603288940356-9b044d51381f?w=1200&auto=format&fit=crop&q=80",
        images: [
          "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1000&auto=format&fit=crop&q=80",
        ],
        highlights: [
          "Guided tour of UNESCO Amber Fort & Sheesh Mahal",
          "Photo stop at iconic Hawa Mahal & Jal Mahal",
          "Exclusive artisan workshop: Hand-block printing & blue pottery",
          "Authentic Rajasthani royal dinner thali",
        ],
        itinerary: [
          {
            day: 1,
            title: "Welcome to Pink City & City Palace",
            description:
              "Check-in at heritage hotel. Afternoon tour of City Palace and Jantar Mantar. Sunset views from Nahargarh Fort.",
            meals: "Dinner",
            stay: "Heritage Haveli Jaipur",
          },
          {
            day: 2,
            title: "Amber Fort Majesty & Bazaars",
            description:
              "Morning visit to Amber Fort, stop at Jal Mahal. Afternoon exploring Johari Bazaar and Bapu Bazaar with local craft master.",
            meals: "Breakfast, Royal Rajasthani Dinner",
            stay: "Heritage Haveli Jaipur",
          },
          {
            day: 3,
            title: "Albert Hall & Departure",
            description:
              "Morning visit to Albert Hall Museum and Patrika Gate. Tour finishes in Jaipur with sweet souvenir gifts.",
            meals: "Breakfast",
            stay: "Tour concludes",
          },
        ],
        inclusions: [
          "2 Nights luxury heritage stay in central Jaipur",
          "Daily royal breakfast and one gala Rajasthani dinner",
          "Government-approved heritage tour guide",
          "Air-conditioned private transport throughout",
        ],
        exclusions: [
          "Monument entry ticket fees",
          "Camera permits",
          "Personal shopping expenses",
        ],
      },
      {
        title: "Rishikesh Ganges Rafting & Sacred Yoga Retreat",
        slug: "rishikesh-ganges-rafting-sacred-yoga-retreat",
        shortDescription:
          "3-Day adrenaline and mindfulness getaway along the holy rapids of the Ganges.",
        description:
          "Immerse yourself where spirituality meets high thrill. Conquer grade III/IV rapids on the Ganges, meditate at sunrise on white sandy riverbanks, and feel the spiritual vibrations of Parmarth Niketan's Aarti.",
        state: "Uttarakhand",
        destinationName: "Rishikesh",
        durationDays: 3,
        durationNights: 2,
        priceInr: 8999,
        maxGroupSize: 14,
        coverImage:
          "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=1200&auto=format&fit=crop&q=80",
        images: [
          "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80",
        ],
        highlights: [
          "16 KM thrilling white-water rafting through Marine Drive",
          "Cliff jumping & body surfing under certified guides",
          "Morning certified Hatha Yoga & Pranayama sessions",
          "VIP access for Parmarth Niketan Ganga Aarti",
        ],
        itinerary: [
          {
            day: 1,
            title: "Arrival, Riverside Camp & Ganga Aarti",
            description:
              "Arrive in Rishikesh, check in at eco-luxury riverside camp. Sunset Aarti at Triveni Ghat and riverside bonfire dinner.",
            meals: "Dinner",
            stay: "Ganga Riverside Camp",
          },
          {
            day: 2,
            title: "White Water Rafting & Beatles Ashram",
            description:
              "16 km white water rafting with cliff jumping. Afternoon stroll through the historic Beatles Ashram with graffiti art.",
            meals: "Breakfast, Camp Dinner",
            stay: "Ganga Riverside Camp",
          },
          {
            day: 3,
            title: "Sunrise Yoga & Departure",
            description:
              "Guided sunrise meditation by the riverbank. Healthy satvik brunch and departure.",
            meals: "Breakfast",
            stay: "Tour concludes",
          },
        ],
        inclusions: [
          "2 Nights luxury camp stay with modern amenities",
          "16 KM River Rafting with all imported safety gear",
          "All meals as mentioned",
          "Certified Yoga instructor session",
        ],
        exclusions: ["Bungee jumping tickets", "Personal tips"],
      },
      {
        title: "Munnar Misty Hills & Tea Garden Odyssey",
        slug: "munnar-misty-hills-tea-garden-odyssey",
        shortDescription:
          "4-Day Western Ghats escapade with tea tasting, cloud trails, and spice gardens.",
        description:
          "Breathe in the freshest mountain air of Kerala. Discover lush tea plantations, endangered Nilgiri Tahr in Eravikulam National Park, and tranquil boating at Mattupetty dam.",
        state: "Kerala",
        destinationName: "Munnar",
        durationDays: 4,
        durationNights: 3,
        priceInr: 16500,
        maxGroupSize: 10,
        coverImage:
          "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=1200&auto=format&fit=crop&q=80",
        images: [
          "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80",
        ],
        highlights: [
          "Private tea plucking and factory tasting session",
          "Eravikulam National Park & Anamudi view",
          "Eco-spice plantation walk in aromatic gardens",
          "Top Station panoramic viewpoint of Western Ghats",
        ],
        itinerary: [
          {
            day: 1,
            title: "Arrival in Munnar & Spice Plantation Walk",
            description:
              "Check-in at scenic hill resort. Visit Cheeyappara waterfalls and guided tour of aromatic spice plantation.",
            meals: "Dinner",
            stay: "Green Valley Resort Munnar",
          },
          {
            day: 2,
            title: "Eravikulam National Park & Tea Museum",
            description:
              "Morning wildlife safari to spot Nilgiri Tahr. Afternoon tour of Lockhart Tea Museum with professional tea sommelier.",
            meals: "Breakfast, Dinner",
            stay: "Green Valley Resort Munnar",
          },
          {
            day: 3,
            title: "Mattupetty Lake & Top Station View",
            description:
              "Speed boating at Mattupetty Dam, Echo Point nature walk, and clouds floating below you at Top Station.",
            meals: "Breakfast, Dinner",
            stay: "Green Valley Resort Munnar",
          },
          {
            day: 4,
            title: "Attukad Waterfalls & Departure",
            description:
              "Morning visit to cascading Attukad falls and departure with authentic Kerala spices and tea leaves.",
            meals: "Breakfast",
            stay: "Tour concludes",
          },
        ],
        inclusions: [
          "3 Nights accommodation in plantation view cottages",
          "Daily gourmet Kerala & North Indian meals as noted",
          "Sightseeing with dedicated local chauffeur",
          "Tea tasting workshop entrance",
        ],
        exclusions: ["Boat ride ticket at Mattupetty", "Personal expenses"],
      },
      {
        title: "Sun, Sand & Coastal Secrets of North Goa",
        slug: "sun-sand-coastal-secrets-of-north-goa",
        shortDescription:
          "4-Day tropical getaway covering Chapora Fort, secluded beaches, and Goan susegad.",
        description:
          "Unwind in India's coastal crown. From heritage Latin quarters in Fontainhas to sunset drinks at Vagator cliffs, experience the true rhythm of coastal Goa.",
        state: "Goa",
        destinationName: "Goa (North)",
        durationDays: 4,
        durationNights: 3,
        priceInr: 13999,
        maxGroupSize: 12,
        coverImage:
          "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&auto=format&fit=crop&q=80",
        images: [
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80",
        ],
        highlights: [
          "Sunset at Chapora Fort & Vagator Beach cliffside",
          "Mandovi River Catamaran cruise with Goan folk music",
          "Fontainhas colorful Portuguese quarters walking tour",
          "Water sports combo: Parasailing & Jet Ski at Calangute",
        ],
        itinerary: [
          {
            day: 1,
            title: "Arrival in North Goa & Sunset Chill",
            description:
              "Check-in at boutique coastal resort. Evening relaxing at Anjuna beach shack with live music.",
            meals: "Welcome Drink, Dinner",
            stay: "Coastal Palm Resort North Goa",
          },
          {
            day: 2,
            title: "Forts, Water Sports & Vagator Cliff",
            description:
              "Morning water sports at Calangute. Visit Aguada lighthouse and sunset at Chapora Fort.",
            meals: "Breakfast, Dinner",
            stay: "Coastal Palm Resort North Goa",
          },
          {
            day: 3,
            title: "Old Goa Churches & Mandovi Cruise",
            description:
              "Basilica of Bom Jesus heritage tour and Fontainhas walk. Evening sunset river catamaran cruise.",
            meals: "Breakfast, Dinner",
            stay: "Coastal Palm Resort North Goa",
          },
          {
            day: 4,
            title: "Morning Beach Walk & Departure",
            description:
              "Relaxing morning beach walk, flea market shopping and farewell.",
            meals: "Breakfast",
            stay: "Tour concludes",
          },
        ],
        inclusions: [
          "3 Nights stay in premium 4-star beachside resort",
          "Daily lavish breakfast and evening dinner",
          "Mandovi River sunset cruise ticket",
          "All transfers in private vehicle",
        ],
        exclusions: ["Water sports entry", "Alcoholic beverages"],
      },
      {
        title: "Venice of the East: Udaipur Lake Palaces & Culture",
        slug: "venice-of-the-east-udaipur-lake-palaces-culture",
        shortDescription:
          "3-Day romantic journey exploring Lake Pichola, City Palace, and Sajjangarh Monsoon Palace.",
        description:
          "Surround yourself with tranquil lakes, marble palaces, and romantic rooftop evenings. Udaipur is an enchanting fairy-tale city celebrated for lakeside serenity and regal heritage.",
        state: "Rajasthan",
        destinationName: "Udaipur",
        durationDays: 3,
        durationNights: 2,
        priceInr: 12800,
        maxGroupSize: 12,
        coverImage:
          "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?w=1200&auto=format&fit=crop&q=80",
        images: [
          "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1000&auto=format&fit=crop&q=80",
        ],
        highlights: [
          "Scenic boat ride on Lake Pichola past Jag Mandir",
          "Tour of majestic Udaipur City Palace complex",
          "Sunset panoramic view from Sajjangarh Monsoon Palace",
          "Dharohar cultural folk dance show at Bagore Ki Haveli",
        ],
        itinerary: [
          {
            day: 1,
            title: "Welcome to Udaipur & Lake Pichola Boat Cruise",
            description:
              "Check-in at heritage lakeside haveli. Sunset boat ride on Lake Pichola and evening folk dance at Bagore Ki Haveli.",
            meals: "Dinner",
            stay: "Lakeview Heritage Haveli",
          },
          {
            day: 2,
            title: "City Palace & Monsoon Palace Sunset",
            description:
              "Comprehensive tour of City Palace. Drive up to Sajjangarh Monsoon Palace for panoramic sunset over Aravali mountains.",
            meals: "Breakfast, Dinner",
            stay: "Lakeview Heritage Haveli",
          },
          {
            day: 3,
            title: "Saheliyon Ki Bari & Departure",
            description:
              "Morning stroll in beautiful Saheliyon Ki Bari gardens and departure with handcrafted souvenirs.",
            meals: "Breakfast",
            stay: "Tour concludes",
          },
        ],
        inclusions: [
          "2 Nights stay in lakefront heritage haveli",
          "Daily gourmet breakfast and rooftop dinners",
          "Lake Pichola sunset boat ticket",
          "Chauffeured sightseeing",
        ],
        exclusions: ["Entry camera fees", "Personal shopping"],
      },
    ];

    const tourMap = {};

    for (const t of toursData) {
      const destId = destinationMap[t.destinationName];
      const tourDoc = await db.collection("tours").insertOne({
        title: t.title,
        slug: t.slug,
        shortDescription: t.shortDescription,
        description: t.description,
        state: t.state,
        destinationId: destId,
        startingPoint: t.destinationName,
        endingPoint: t.destinationName, // Both starting and ending are same city as requested!
        durationDays: t.durationDays,
        durationNights: t.durationNights,
        priceInr: t.priceInr,
        maxGroupSize: t.maxGroupSize,
        coverImage: t.coverImage,
        images: t.images,
        highlights: t.highlights,
        itinerary: t.itinerary,
        inclusions: t.inclusions,
        exclusions: t.exclusions,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      tourMap[t.title] = tourDoc.insertedId;
      console.log(`Created Tour: ${t.title}`);
    }

    // 4. Create Initial Realistic Bookings
    const bookingsData = [
      {
        bookingRef: `EJ-2026-104921`,
        tourTitle: "Manali Alpine & Solang Valley Adventure",
        destinationName: "Manali",
        customerName: "Aarav Kapoor",
        customerEmail: "aarav.kapoor@example.com",
        customerPhone: "+91 98111 22334",
        travelDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        numberOfTravelers: 2,
        pricePerPerson: 14999,
        totalAmountInr: 29998,
        specialRequests: "Twin bed room preference and vegetarian meals.",
        status: "confirmed",
        bookedByRole: "user",
      },
      {
        bookingRef: `EJ-2026-382910`,
        tourTitle: "Royal Jaipur Forts & Regal Heritage Trail",
        destinationName: "Jaipur",
        customerName: "Sunita Verma",
        customerEmail: "sunita.verma@example.com",
        customerPhone: "+91 98222 33445",
        travelDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        numberOfTravelers: 4,
        pricePerPerson: 11499,
        totalAmountInr: 45996,
        specialRequests: "Senior citizens in group, request ground floor rooms.",
        status: "confirmed",
        bookedByRole: "partner",
      },
      {
        bookingRef: `EJ-2026-559102`,
        tourTitle: "Rishikesh Ganges Rafting & Sacred Yoga Retreat",
        destinationName: "Rishikesh",
        customerName: "Rohan Malhotra",
        customerEmail: "rohan.m@example.com",
        customerPhone: "+91 98333 44556",
        travelDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        numberOfTravelers: 3,
        pricePerPerson: 8999,
        totalAmountInr: 26997,
        specialRequests: "Interested in early morning 6 AM yoga session.",
        status: "confirmed",
        bookedByRole: "user",
      },
    ];

    for (const b of bookingsData) {
      const tourId = tourMap[b.tourTitle];
      const destId = destinationMap[b.destinationName];
      const partnerId = partnerMap[b.destinationName];

      await db.collection("bookings").insertOne({
        bookingRef: b.bookingRef,
        tourId,
        tourTitle: b.tourTitle,
        destinationId: destId,
        customerName: b.customerName,
        customerEmail: b.customerEmail,
        customerPhone: b.customerPhone,
        travelDate: b.travelDate,
        numberOfTravelers: b.numberOfTravelers,
        pricePerPerson: b.pricePerPerson,
        totalAmountInr: b.totalAmountInr,
        specialRequests: b.specialRequests,
        status: b.status,
        bookedByRole: b.bookedByRole,
        partnerId: b.bookedByRole === "partner" ? partnerId : partnerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`Created Booking: ${b.bookingRef}`);
    }

    console.log("\n==========================================");
    console.log(" EPICJOURNEYS SEEDING COMPLETED!");
    console.log(" Admin Login: admin@epicjourneys.in / Admin@123");
    console.log(" Partner Logins:");
    console.log("   - Manali: manali.partner@epicjourneys.in / Partner@123");
    console.log("   - Jaipur: jaipur.partner@epicjourneys.in / Partner@123");
    console.log("   - Rishikesh: rishikesh.partner@epicjourneys.in / Partner@123");
    console.log("   - Munnar: munnar.partner@epicjourneys.in / Partner@123");
    console.log("   - Goa: goa.partner@epicjourneys.in / Partner@123");
    console.log("   - Udaipur: udaipur.partner@epicjourneys.in / Partner@123");
    console.log("==========================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed with error:", error);
    process.exit(1);
  }
}

seedDatabase();
