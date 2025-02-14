import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCartItemSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Products
  app.get("/api/products", async (_req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  // Cart
  app.get("/api/cart", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const items = await storage.getCartItems(req.user.id);

    // Get products for each cart item
    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await storage.getProductById(item.productId);
        return { ...item, product };
      })
    );

    res.json(itemsWithProducts);
  });

  app.post("/api/cart", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    try {
      const result = insertCartItemSchema.safeParse({
        ...req.body,
        userId: req.user.id
      });

      if (!result.success) {
        return res.status(400).json(result.error);
      }

      await storage.addToCart(
        req.user.id,
        result.data.productId,
        result.data.quantity
      );
      res.sendStatus(201);
    } catch (error) {
      console.error("Cart error:", error);
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    await storage.removeFromCart(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // Subscription Plans
  app.get("/api/subscription-plans", async (_req, res) => {
    const plans = await storage.getSubscriptionPlans();
    res.json(plans);
  });

  app.post("/api/subscribe", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const { planId } = req.body;
    if (!planId) return res.status(400).json({ error: "Plan ID required" });

    await storage.updateUserPremiumStatus(req.user.id, true);
    res.sendStatus(200);
  });

  // Add this after other routes but before returning httpServer
  app.get("/api/admin/users", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    // For simplicity, we'll consider the first user as admin
    // In production, you would want proper admin role checks
    if (req.user.id !== 1) return res.sendStatus(403);

    const users = await storage.getAllUsers();
    res.json(users);
  });

  const httpServer = createServer(app);
  return httpServer;
}