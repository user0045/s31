import { users, type User, type InsertUser } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();

// Add advertisement request methods to the main storage object
storage.getAdvertisementRequests = getAdvertisementRequests;
storage.createAdvertisementRequest = createAdvertisementRequest;
storage.deleteAdvertisementRequest = deleteAdvertisementRequest;
storage.checkRecentAdvertisementRequest = checkRecentAdvertisementRequest;

// Advertisement request types
interface CreateAdvertisementRequestData {
  email: string;
  description: string;
  budget: number;
  user_ip: string;
}

interface AdvertisementRequest {
  id: string;
  email: string;
  description: string;
  budget: number;
  user_ip: string;
  created_at: string;
  updated_at: string;
}

// Advertisement request functions
async function getAdvertisementRequests(): Promise<AdvertisementRequest[]> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    // Check if environment variables are set
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return [];
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('advertisement_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching advertisement requests:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Database connection error:', error);
    return [];
  }
}

async function createAdvertisementRequest(data: CreateAdvertisementRequestData): Promise<AdvertisementRequest> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      throw new Error('Database configuration error');
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: result, error } = await supabase
      .from('advertisement_requests')
      .insert([{
        email: data.email,
        description: data.description,
        budget: data.budget,
        user_ip: data.user_ip
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating advertisement request:', error);
      throw new Error('Failed to create advertisement request');
    }
    
    return result;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

async function deleteAdvertisementRequest(id: string): Promise<void> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      throw new Error('Database configuration error');
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { error } = await supabase
      .from('advertisement_requests')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting advertisement request:', error);
      throw new Error('Failed to delete advertisement request');
    }
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

async function checkRecentAdvertisementRequest(userIP: string, since: Date): Promise<boolean> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('advertisement_requests')
      .select('id')
      .eq('user_ip', userIP)
      .gte('created_at', since.toISOString())
      .limit(1);
    
    if (error) {
      console.error('Error checking recent advertisement request:', error);
      return false;
    }
    
    return (data && data.length > 0);
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

