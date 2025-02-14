import { User, InsertUser, Product, CartItem, SubscriptionPlan } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPremiumStatus(userId: number, isPremium: boolean): Promise<void>;
  
  getProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  
  getCartItems(userId: number): Promise<CartItem[]>;
  addToCart(userId: number, productId: number, quantity: number): Promise<void>;
  updateCartItem(id: number, quantity: number): Promise<void>;
  removeFromCart(id: number): Promise<void>;
  
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private cartItems: Map<number, CartItem>;
  private subscriptionPlans: Map<number, SubscriptionPlan>;
  sessionStore: session.Store;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.cartItems = new Map();
    this.subscriptionPlans = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Add sample products
    const sampleProducts: Product[] = [
      {
        id: 1,
        name: "Soccer Ball",
        description: "Professional match ball",
        price: "89.99",
        imageUrl: "https://placehold.co/300x300/webp?text=Soccer+Ball"
      },
      {
        id: 2,
        name: "Running Shoes",
        description: "Lightweight performance shoes",
        price: "199.99",
        imageUrl: "https://placehold.co/300x300/webp?text=Running+Shoes"
      }
    ];

    // Add sample subscription plans
    const samplePlans: SubscriptionPlan[] = [
      {
        id: 1,
        name: "Basic",
        description: "Monthly sports box",
        price: "79.99",
        interval: "monthly"
      },
      {
        id: 2,
        name: "Premium",
        description: "Premium monthly sports box",
        price: "149.99",
        interval: "monthly"
      }
    ];

    sampleProducts.forEach(p => this.products.set(p.id, p));
    samplePlans.forEach(p => this.subscriptionPlans.set(p.id, p));
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id, isPremium: false };
    this.users.set(id, user);
    return user;
  }

  async updateUserPremiumStatus(userId: number, isPremium: boolean): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      user.isPremium = isPremium;
      this.users.set(userId, user);
    }
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductById(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getCartItems(userId: number): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(
      item => item.userId === userId
    );
  }

  async addToCart(userId: number, productId: number, quantity: number): Promise<void> {
    const id = this.currentId++;
    const cartItem: CartItem = { id, userId, productId, quantity };
    this.cartItems.set(id, cartItem);
  }

  async updateCartItem(id: number, quantity: number): Promise<void> {
    const item = this.cartItems.get(id);
    if (item) {
      item.quantity = quantity;
      this.cartItems.set(id, item);
    }
  }

  async removeFromCart(id: number): Promise<void> {
    this.cartItems.delete(id);
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlans.values());
  }
}

export const storage = new MemStorage();
