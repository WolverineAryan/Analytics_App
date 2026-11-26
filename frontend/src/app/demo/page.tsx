"use client";

import React, { useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { API_BASE } from "@/lib/api";
import { ShoppingBag, X, Plus, Minus, ArrowUpRight, Check } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: "Apparel" | "Carry" | "Objects";
  price: number;
  tag: string;
}

const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Merino Heavyweight Crew",
    category: "Apparel",
    price: 128,
    tag: "NEW",
  },
  {
    id: "p2",
    name: "Cordura Daypack 22L",
    category: "Carry",
    price: 185,
    tag: "BESTSELLER",
  },
  {
    id: "p3",
    name: "Machined Desk Tray",
    category: "Objects",
    price: 64,
    tag: "LIMITED",
  },
  {
    id: "p4",
    name: "Technical Shell Jacket",
    category: "Apparel",
    price: 260,
    tag: "WATERPROOF",
  },
  {
    id: "p5",
    name: "Ballistic Tech Pouch",
    category: "Carry",
    price: 58,
    tag: "CORE",
  },
  {
    id: "p6",
    name: "Borosilicate Carafe",
    category: "Objects",
    price: 48,
    tag: "STUDIO",
  },
];

const CATEGORIES = ["All", "Apparel", "Carry", "Objects"] as const;

export default function DemoStorePage() {
  const [category, setCategory] =
    useState<(typeof CATEGORIES)[number]>("All");
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);

  const filtered =
    category === "All"
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === category);

  const addToCart = (product: Product) => {
    setCheckedOut(false);
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.product.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#18181B]">
      {/* Standalone Vanilla JS Tracker SDK */}
      <Script src={`${API_BASE}/tracker.js`} strategy="afterInteractive" />

      {/* Store Header */}
      <header className="bg-[#FFFFFF] border-b border-[#E4E4E7] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold tracking-tight text-sm">
              KINETIC SUPPLY
            </span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#F4F4F5] border border-[#E4E4E7] text-[#71717A]">
              Demo Storefront
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sessions"
              data-analytics-ignore="true"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-mono text-[#71717A] hover:text-[#18181B]"
            >
              View Telemetry
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-[#18181B] text-white hover:bg-[#27272A] transition-colors cursor-pointer"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Cart ({totalItems})
            </button>
          </div>
        </div>
      </header>

      {/* Store Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
              Instrumented with tracker.js
            </p>
            <h1 className="text-2xl font-semibold tracking-tight mt-1">
              Everyday Functional Goods
            </h1>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                  category === cat
                    ? "bg-[#FF4F00] text-white border-[#FF4F00]"
                    : "bg-[#FFFFFF] text-[#52525B] border-[#E4E4E7] hover:bg-[#F4F4F5]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#F4F4F5] border border-[#E4E4E7] text-[#52525B]">
                    {product.category}
                  </span>
                  <span className="text-[10px] font-mono text-[#71717A]">
                    {product.tag}
                  </span>
                </div>

                <div className="h-28 rounded bg-[#F4F4F5] border border-[#E4E4E7] mb-4 flex items-center justify-center font-mono text-xs text-[#A1A1AA]">
                  {product.id.toUpperCase()} // STUDIO
                </div>

                <h2 className="text-sm font-semibold text-[#18181B]">
                  {product.name}
                </h2>
                <p className="text-sm font-mono text-[#52525B] mt-1">
                  ${product.price}.00
                </p>
              </div>

              <button
                type="button"
                onClick={() => addToCart(product)}
                className="mt-5 w-full py-2 px-3 text-xs font-medium rounded-md border border-[#E4E4E7] bg-[#FAFAFA] hover:bg-[#FF4F00] hover:text-white hover:border-[#FF4F00] transition-colors cursor-pointer"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Cart Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/25">
          <div className="w-full max-w-sm bg-[#FFFFFF] h-full border-l border-[#E4E4E7] flex flex-col justify-between p-5">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E4E4E7]">
                <h2 className="text-sm font-semibold">Your Cart ({totalItems})</h2>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 text-[#71717A] hover:text-[#18181B] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {checkedOut ? (
                <div className="py-12 text-center">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF0EA] text-[#FF4F00] mb-3">
                    <Check className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium">Order Recorded</p>
                  <p className="text-xs text-[#71717A] mt-1">
                    Check the Sessions &amp; Heatmap views to inspect your journey.
                  </p>
                </div>
              ) : cart.length === 0 ? (
                <p className="py-12 text-center text-xs text-[#71717A]">
                  Your cart is empty. Click &quot;Add to Cart&quot; on any item.
                </p>
              ) : (
                <div className="divide-y divide-[#E4E4E7] mt-2">
                  {cart.map(({ product, qty }) => (
                    <div
                      key={product.id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-medium">{product.name}</div>
                        <div className="text-[11px] font-mono text-[#71717A]">
                          ${product.price * qty}.00
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateQty(product.id, -1)}
                          className="h-6 w-6 rounded border border-[#E4E4E7] flex items-center justify-center hover:bg-[#F4F4F5] cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-mono text-xs w-5 text-center">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(product.id, 1)}
                          className="h-6 w-6 rounded border border-[#E4E4E7] flex items-center justify-center hover:bg-[#F4F4F5] cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && !checkedOut && (
              <div className="pt-4 border-t border-[#E4E4E7]">
                <div className="flex items-center justify-between text-xs font-mono mb-3">
                  <span className="text-[#71717A]">Subtotal</span>
                  <span className="font-semibold">${subtotal}.00</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCheckedOut(true);
                    setCart([]);
                  }}
                  className="w-full py-2.5 text-xs font-medium rounded-md bg-[#FF4F00] text-white hover:bg-[#E04600] transition-colors cursor-pointer"
                >
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
