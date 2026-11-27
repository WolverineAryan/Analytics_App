import { Event } from "./models/Event";
import { Site } from "./models/Site";

const DEMO_URL = process.env.DEMO_URL || "http://localhost:3001/demo";
const DEMO_ORIGIN = new URL(DEMO_URL).origin;
const DEMO_SITE_ID = "site_demo_kinetic";

/**
 * Seeds a default registered site and realistic e-commerce user journeys
 * if the database is empty.
 */
export async function seedIfEmpty(): Promise<void> {
  const siteCount = await Site.countDocuments();
  if (siteCount === 0) {
    await Site.create({
      site_id: DEMO_SITE_ID,
      name: "KINETIC SUPPLY (Demo Store)",
      url: DEMO_URL,
      origin: DEMO_ORIGIN,
    });
  }

  const count = await Event.countDocuments();
  if (count > 0) {
    return;
  }

  const now = Date.now();
  const min = 60 * 1000;

  const sampleEvents = [
    {
      site_id: DEMO_SITE_ID,
      session_id: "sess_8f4a21c9-01a4",
      event_type: "page_view",
      url: DEMO_URL,
      timestamp: new Date(now - 42 * min),
      viewport_w: 1280,
      viewport_h: 800,
    },
    {
      site_id: DEMO_SITE_ID,
      session_id: "sess_8f4a21c9-01a4",
      event_type: "click",
      url: DEMO_URL,
      timestamp: new Date(now - 41 * min - 48000),
      x: 340,
      y: 196,
      viewport_w: 1280,
      viewport_h: 800,
      element_tag: "BUTTON",
      element_text: "Apparel",
    },
    {
      site_id: DEMO_SITE_ID,
      session_id: "sess_8f4a21c9-01a4",
      event_type: "click",
      url: DEMO_URL,
      timestamp: new Date(now - 41 * min - 32000),
      x: 410,
      y: 440,
      viewport_w: 1280,
      viewport_h: 800,
      element_tag: "BUTTON",
      element_text: "Add to Cart",
    },
    {
      site_id: DEMO_SITE_ID,
      session_id: "sess_8f4a21c9-01a4",
      event_type: "click",
      url: DEMO_URL,
      timestamp: new Date(now - 41 * min - 15000),
      x: 1140,
      y: 44,
      viewport_w: 1280,
      viewport_h: 800,
      element_tag: "BUTTON",
      element_text: "Cart (1)",
    },
    {
      site_id: DEMO_SITE_ID,
      session_id: "sess_8f4a21c9-01a4",
      event_type: "click",
      url: DEMO_URL,
      timestamp: new Date(now - 41 * min - 3000),
      x: 1110,
      y: 710,
      viewport_w: 1280,
      viewport_h: 800,
      element_tag: "BUTTON",
      element_text: "Checkout",
    },
    {
      site_id: DEMO_SITE_ID,
      session_id: "sess_3b9e77d2-09f1",
      event_type: "page_view",
      url: DEMO_URL,
      timestamp: new Date(now - 26 * min),
      viewport_w: 1280,
      viewport_h: 800,
    },
    {
      site_id: DEMO_SITE_ID,
      session_id: "sess_3b9e77d2-09f1",
      event_type: "click",
      url: DEMO_URL,
      timestamp: new Date(now - 25 * min - 50000),
      x: 265,
      y: 196,
      viewport_w: 1280,
      viewport_h: 800,
      element_tag: "BUTTON",
      element_text: "Carry",
    },
    {
      site_id: DEMO_SITE_ID,
      session_id: "sess_3b9e77d2-09f1",
      event_type: "click",
      url: DEMO_URL,
      timestamp: new Date(now - 25 * min - 34000),
      x: 780,
      y: 442,
      viewport_w: 1280,
      viewport_h: 800,
      element_tag: "BUTTON",
      element_text: "Add to Cart",
    },
    {
      site_id: DEMO_SITE_ID,
      session_id: "sess_3b9e77d2-09f1",
      event_type: "click",
      url: DEMO_URL,
      timestamp: new Date(now - 25 * min - 19000),
      x: 415,
      y: 445,
      viewport_w: 1280,
      viewport_h: 800,
      element_tag: "BUTTON",
      element_text: "Add to Cart",
    },
    {
      site_id: DEMO_SITE_ID,
      session_id: "sess_c1209a4e-77b3",
      event_type: "page_view",
      url: DEMO_URL,
      timestamp: new Date(now - 11 * min),
      viewport_w: 1280,
      viewport_h: 800,
    },
    {
      site_id: DEMO_SITE_ID,
      session_id: "sess_c1209a4e-77b3",
      event_type: "click",
      url: DEMO_URL,
      timestamp: new Date(now - 10 * min - 51000),
      x: 195,
      y: 196,
      viewport_w: 1280,
      viewport_h: 800,
      element_tag: "BUTTON",
      element_text: "All",
    },
    {
      site_id: DEMO_SITE_ID,
      session_id: "sess_c1209a4e-77b3",
      event_type: "click",
      url: DEMO_URL,
      timestamp: new Date(now - 10 * min - 38000),
      x: 1095,
      y: 445,
      viewport_w: 1280,
      viewport_h: 800,
      element_tag: "BUTTON",
      element_text: "Add to Cart",
    },
  ];

  await Event.insertMany(sampleEvents);
  console.log(`[seed] Inserted ${sampleEvents.length} sample e-commerce events`);
}
