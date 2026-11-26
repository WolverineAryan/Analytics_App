import { Event } from "./models/Event";

const DEMO_URL = process.env.DEMO_URL || "http://localhost:3000/demo";

/**
 * Seeds realistic e-commerce user journeys if the database is empty.
 * This ensures the dashboard is immediately demonstrable on first run.
 */
export async function seedIfEmpty(): Promise<void> {
  const count = await Event.countDocuments();
  if (count > 0) {
    return;
  }

  const now = Date.now();
  const min = 60 * 1000;

  const sampleEvents = [
    // Session 1: High-intent buyer who filters, inspects a product, and adds to cart
    {
      session_id: "sess_8f4a21c9-01a4",
      event_type: "page_view",
      url: DEMO_URL,
      timestamp: new Date(now - 42 * min),
      viewport_w: 1280,
      viewport_h: 800,
    },
    {
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

    // Session 2: Comparison shopper clicking multiple product cards
    {
      session_id: "sess_3b9e77d2-09f1",
      event_type: "page_view",
      url: DEMO_URL,
      timestamp: new Date(now - 26 * min),
      viewport_w: 1280,
      viewport_h: 800,
    },
    {
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

    // Session 3: Quick bounce / explorer
    {
      session_id: "sess_c1209a4e-77b3",
      event_type: "page_view",
      url: DEMO_URL,
      timestamp: new Date(now - 11 * min),
      viewport_w: 1280,
      viewport_h: 800,
    },
    {
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
