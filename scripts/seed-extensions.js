const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

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

const MONGODB_URI = envUri;

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGODB_URI, { dbName: "epicjourneys" });
  console.log("Connected to MongoDB Atlas: epicjourneys");

  const db = mongoose.connection.db;

  // 1. Travel Styles
  const travelStylesColl = db.collection("travelstyles");
  const existingStyles = await travelStylesColl.countDocuments();
  if (existingStyles === 0) {
    await travelStylesColl.insertMany([
      {
        name: "Heritage & Culture",
        slug: "heritage-culture",
        description: "Explore centuries-old palaces, forts, temple architecture and timeless traditions.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Mountain Trekking & Hiking",
        slug: "mountain-trekking",
        description: "High-altitude trails, pine forests, pristine valleys and panoramic Himalayan views.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Wildlife & Nature Safari",
        slug: "wildlife-nature",
        description: "National parks, exotic bird watching, tiger reserves and undisturbed biodiversity.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Spiritual & Pilgrimage",
        slug: "spiritual-pilgrimage",
        description: "Ganga Aarti ceremonies, meditation retreats, ashrams and revered sacred ghats.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Coastal & Beach Leisure",
        slug: "coastal-beach",
        description: "Sun-kissed coastlines, seafood delicacies, ocean sunsets and water activities.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Adventure & Thrill",
        slug: "adventure-thrill",
        description: "River rafting, paragliding, zip-lining, cliff jumping and off-road expeditions.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log("Seeded 6 Travel Styles");
  }

  // 2. Physical Ratings
  const physicalRatingsColl = db.collection("physicalratings");
  const existingRatings = await physicalRatingsColl.countDocuments();
  if (existingRatings === 0) {
    await physicalRatingsColl.insertMany([
      {
        name: "1 - Relaxed / Easy",
        level: 1,
        description: "Leisurely pace, paved walkways, suitable for all ages and fitness levels.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "2 - Light / Moderate",
        level: 2,
        description: "Gentle walking 2-3 hours daily, occasional uneven ground and stairs.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "3 - Active",
        level: 3,
        description: "Regular hiking 4-6 hours daily, moderate elevation gains, active endurance required.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "4 - Demanding",
        level: 4,
        description: "Steep ascents, high altitude (above 3000m), rugged terrain, good stamina needed.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "5 - Extreme / Expedition",
        level: 5,
        description: "Challenging wilderness, sub-zero conditions, rigorous multi-day alpine trekking.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log("Seeded 5 Physical Ratings");
  }

  // 3. Journey Types
  const journeyTypesColl = db.collection("journeytypes");
  const existingJourneyTypes = await journeyTypesColl.countDocuments();
  if (existingJourneyTypes === 0) {
    await journeyTypesColl.insertMany([
      {
        name: "Guided Group Tour",
        slug: "guided-group-tour",
        description: "Small intimate groups of travelers with a dedicated local tour director.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Private Customized Journey",
        slug: "private-journey",
        description: "Exclusive travel for couples, families or private groups at your own rhythm.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Weekend Road Getaway",
        slug: "weekend-getaway",
        description: "Short 2 to 3-day escapes tailored for working professionals and weekenders.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Wilderness Expedition",
        slug: "wilderness-expedition",
        description: "Deep exploration of offbeat Himalayan passes and untouched landscapes.",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log("Seeded 4 Journey Types");
  }

  // 4. Discounts
  const discountsColl = db.collection("discounts");
  const existingDiscounts = await discountsColl.countDocuments();
  if (existingDiscounts === 0) {
    await discountsColl.insertMany([
      {
        name: "Early Bird Advance 10%",
        discountType: "percentage",
        value: 10,
        description: "10% off for reservations confirmed 30 days in advance.",
        validUntil: new Date(Date.now() + 90 * 86400000),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Monsoon Serenity 15%",
        discountType: "percentage",
        value: 15,
        description: "Special seasonal reduction for lush monsoon escapes.",
        validUntil: new Date(Date.now() + 60 * 86400000),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Group Booking Voucher ₹2500",
        discountType: "fixed",
        value: 2500,
        description: "Flat ₹2500 reduction for groups of 4 or more passengers.",
        validUntil: new Date(Date.now() + 120 * 86400000),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log("Seeded 3 Discounts");
  }

  // 5. Promo Codes
  const promoCodesColl = db.collection("promocodes");
  const existingPromos = await promoCodesColl.countDocuments();
  if (existingPromos === 0) {
    await promoCodesColl.insertMany([
      {
        code: "EPIC10",
        discountType: "percentage",
        value: 10,
        minBookingAmount: 5000,
        maxDiscountInr: 2500,
        usageLimit: 200,
        usageCount: 14,
        validUntil: new Date(Date.now() + 90 * 86400000),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        code: "WELCOME500",
        discountType: "fixed",
        value: 500,
        minBookingAmount: 4000,
        maxDiscountInr: 500,
        usageLimit: 500,
        usageCount: 42,
        validUntil: new Date(Date.now() + 180 * 86400000),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        code: "HIMALAYA15",
        discountType: "percentage",
        value: 15,
        minBookingAmount: 8000,
        maxDiscountInr: 3000,
        usageLimit: 100,
        usageCount: 8,
        validUntil: new Date(Date.now() + 60 * 86400000),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log("Seeded 3 Promo Codes");
  }

  // 6. Queries (Help & Support feedback)
  const queriesColl = db.collection("queries");
  const existingQueries = await queriesColl.countDocuments();
  if (existingQueries === 0) {
    await queriesColl.insertMany([
      {
        name: "Rohit Sharma",
        email: "rohit.s@gmail.com",
        phone: "+91 98765 43210",
        subject: "Luggage storage and pickup in Manali",
        category: "Tour Booking",
        message: "Can we store excess luggage at the base resort during the 3-day high altitude trek?",
        status: "open",
        adminNotes: "",
        createdAt: new Date(Date.now() - 3600000 * 4),
        updatedAt: new Date(Date.now() - 3600000 * 4),
      },
      {
        name: "Pooja Verma",
        email: "pooja.v@outlook.com",
        phone: "+91 98111 22334",
        subject: "Vegetarian / Jain food availability in Jaipur tour",
        category: "General Inquiry",
        message: "Hi team, are Jain meal options available for dinner during the Jaipur heritage itinerary?",
        status: "in_progress",
        adminNotes: "Partner confirmed pure vegetarian/Jain kitchen available.",
        createdAt: new Date(Date.now() - 3600000 * 18),
        updatedAt: new Date(Date.now() - 3600000 * 18),
      },
      {
        name: "Arjun Nair",
        email: "arjun.nair@techcorp.in",
        phone: "+91 97400 55667",
        subject: "Corporate group retreat in Rishikesh",
        category: "Partnership",
        message: "We have a group of 18 colleagues planning a team rafting and camping retreat in Rishikesh next month.",
        status: "resolved",
        adminNotes: "Shared custom group quotation via email.",
        createdAt: new Date(Date.now() - 3600000 * 48),
        updatedAt: new Date(Date.now() - 3600000 * 48),
      },
    ]);
    console.log("Seeded 3 Support Queries");
  }

  // 7. Reviews
  const reviewsColl = db.collection("reviews");
  const existingReviews = await reviewsColl.countDocuments();
  if (existingReviews === 0) {
    await reviewsColl.insertMany([
      {
        tourTitle: "Manali Alpine Escape & Solang Valley Adventure",
        customerName: "Vikram Malhotra",
        customerEmail: "vikram.m@gmail.com",
        rating: 5,
        comment: "Flawless experience! The local partner in Manali took care of every transfer and the riverside camp was unforgettable.",
        location: "Delhi",
        status: "published",
        createdAt: new Date(Date.now() - 86400000 * 2),
        updatedAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        tourTitle: "Royal Jaipur Heritage & Amber Fort Sunset",
        customerName: "Sneha Reddy",
        customerEmail: "sneha.r@gmail.com",
        rating: 5,
        comment: "The cultural heritage walk in Jaipur was enlightening. Authentic Rajasthani dinner was the highlight.",
        location: "Bengaluru",
        status: "published",
        createdAt: new Date(Date.now() - 86400000 * 5),
        updatedAt: new Date(Date.now() - 86400000 * 5),
      },
      {
        tourTitle: "Rishikesh White Water Rapids & River Camping",
        customerName: "Aditya Roy",
        customerEmail: "aditya.roy@yahoo.com",
        rating: 4,
        comment: "Thrilling rapids and excellent certified river guides. Camping by the Ganges under the stars was magical.",
        location: "Chandigarh",
        status: "published",
        createdAt: new Date(Date.now() - 86400000 * 8),
        updatedAt: new Date(Date.now() - 86400000 * 8),
      },
    ]);
    console.log("Seeded 3 Reviews");
  }

  // 8. Cancellations
  const cancellationsColl = db.collection("cancellations");
  const existingCancellations = await cancellationsColl.countDocuments();
  if (existingCancellations === 0) {
    await cancellationsColl.insertMany([
      {
        bookingRef: "EJ-2026-981422",
        customerName: "Gaurav Sen",
        customerEmail: "gaurav.sen@gmail.com",
        customerPhone: "+91 99887 66554",
        tourTitle: "Munnar Misty Hills & Tea Plantation Trail",
        reason: "Unforeseen medical emergency in the family",
        refundAmountInr: 10400,
        status: "pending",
        adminNotes: "Medical certificate provided. Eligibility check in progress.",
        requestedAt: new Date(Date.now() - 3600000 * 6),
        createdAt: new Date(Date.now() - 3600000 * 6),
        updatedAt: new Date(Date.now() - 3600000 * 6),
      },
      {
        bookingRef: "EJ-2026-512093",
        customerName: "Neha Kapoor",
        customerEmail: "neha.k@hotmail.com",
        customerPhone: "+91 98192 83746",
        tourTitle: "Goa Coastal Cruise & Old Heritage Churches",
        reason: "Change in office travel leave dates",
        refundAmountInr: 7200,
        status: "approved",
        adminNotes: "Approved under 7-day cancellation window with standard policy.",
        requestedAt: new Date(Date.now() - 86400000 * 1),
        processedAt: new Date(Date.now() - 3600000 * 2),
        createdAt: new Date(Date.now() - 86400000 * 1),
        updatedAt: new Date(Date.now() - 3600000 * 2),
      },
    ]);
    console.log("Seeded 2 Cancellations");
  }

  await mongoose.disconnect();
  console.log("Seed completed successfully!");
}

run().catch((err) => {
  console.error("Error seeding extensions:", err);
  process.exit(1);
});
