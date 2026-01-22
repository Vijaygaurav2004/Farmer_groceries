// Firebase Setup and Seed Data Script
// Run this script to populate your Firebase with sample data

import { collection, addDoc, setDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../src/config/firebase';

// Sample Farmers
const sampleFarmers = [
  {
    id: 'farmer_1',
    farmName: 'Green Valley Farms',
    farmAddress: {
      street: '123 Farm Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      latitude: 19.0760,
      longitude: 72.8777,
    },
    verificationStatus: 'verified',
    verificationDocuments: [],
    rating: 4.8,
    totalReviews: 45,
    bio: 'Organic farming for over 20 years',
  },
  {
    id: 'farmer_2',
    farmName: 'Sunshine Organic',
    farmAddress: {
      street: '456 Village Path',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      latitude: 18.5204,
      longitude: 73.8567,
    },
    verificationStatus: 'verified',
    verificationDocuments: [],
    rating: 4.9,
    totalReviews: 67,
    bio: 'Certified organic produce',
  },
  {
    id: 'farmer_3',
    farmName: 'Fresh Fields',
    farmAddress: {
      street: '789 Rural Lane',
      city: 'Nashik',
      state: 'Maharashtra',
      pincode: '422001',
      latitude: 19.9975,
      longitude: 73.7898,
    },
    verificationStatus: 'verified',
    verificationDocuments: [],
    rating: 4.7,
    totalReviews: 34,
    bio: 'Farm-to-table fresh produce',
  },
];

// Sample Products
const sampleProducts = [
  {
    farmerId: 'farmer_1',
    farmerName: 'Green Valley Farms',
    name: 'Fresh Tomatoes',
    description: 'Juicy red tomatoes, freshly harvested',
    category: 'vegetables',
    images: [],
    unit: 'kg',
    pricePerUnit: 40,
    stock: 100,
    harvestDate: new Date(),
    isOrganic: true,
    isAvailable: true,
  },
  {
    farmerId: 'farmer_1',
    farmerName: 'Green Valley Farms',
    name: 'Green Spinach',
    description: 'Fresh organic spinach leaves',
    category: 'vegetables',
    images: [],
    unit: 'kg',
    pricePerUnit: 30,
    stock: 50,
    harvestDate: new Date(),
    isOrganic: true,
    isAvailable: true,
  },
  {
    farmerId: 'farmer_2',
    farmerName: 'Sunshine Organic',
    name: 'Sweet Mangoes',
    description: 'Alphonso mangoes from Ratnagiri',
    category: 'fruits',
    images: [],
    unit: 'kg',
    pricePerUnit: 200,
    stock: 30,
    harvestDate: new Date(),
    isOrganic: false,
    isAvailable: true,
  },
  {
    farmerId: 'farmer_2',
    farmerName: 'Sunshine Organic',
    name: 'Farm Fresh Milk',
    description: 'Pure cow milk, delivered daily',
    category: 'dairy',
    images: [],
    unit: 'liter',
    pricePerUnit: 60,
    stock: 20,
    harvestDate: new Date(),
    isOrganic: true,
    isAvailable: true,
  },
  {
    farmerId: 'farmer_3',
    farmerName: 'Fresh Fields',
    name: 'Fresh Carrots',
    description: 'Crunchy orange carrots',
    category: 'vegetables',
    images: [],
    unit: 'kg',
    pricePerUnit: 35,
    stock: 80,
    harvestDate: new Date(),
    isOrganic: true,
    isAvailable: true,
  },
  {
    farmerId: 'farmer_3',
    farmerName: 'Fresh Fields',
    name: 'Farm Eggs',
    description: 'Fresh chicken eggs',
    category: 'eggs',
    images: [],
    unit: 'dozen',
    pricePerUnit: 80,
    stock: 40,
    harvestDate: new Date(),
    isOrganic: false,
    isAvailable: true,
  },
  {
    farmerId: 'farmer_1',
    farmerName: 'Green Valley Farms',
    name: 'Fresh Potatoes',
    description: 'Quality potatoes for cooking',
    category: 'vegetables',
    images: [],
    unit: 'kg',
    pricePerUnit: 25,
    stock: 150,
    harvestDate: new Date(),
    isOrganic: false,
    isAvailable: true,
  },
  {
    farmerId: 'farmer_2',
    farmerName: 'Sunshine Organic',
    name: 'Sweet Oranges',
    description: 'Juicy Nagpur oranges',
    category: 'fruits',
    images: [],
    unit: 'kg',
    pricePerUnit: 60,
    stock: 45,
    harvestDate: new Date(),
    isOrganic: false,
    isAvailable: true,
  },
  {
    farmerId: 'farmer_3',
    farmerName: 'Fresh Fields',
    name: 'Pure Honey',
    description: 'Raw organic honey from our farm',
    category: 'honey',
    images: [],
    unit: 'kg',
    pricePerUnit: 400,
    stock: 15,
    harvestDate: new Date(),
    isOrganic: true,
    isAvailable: true,
  },
  {
    farmerId: 'farmer_1',
    farmerName: 'Green Valley Farms',
    name: 'Fresh Onions',
    description: 'Red onions for daily cooking',
    category: 'vegetables',
    images: [],
    unit: 'kg',
    pricePerUnit: 30,
    stock: 120,
    harvestDate: new Date(),
    isOrganic: false,
    isAvailable: true,
  },
];

// Function to seed the database
export async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Add farmers
    console.log('Adding farmers...');
    for (const farmer of sampleFarmers) {
      await setDoc(doc(db, 'farmers', farmer.id), {
        ...farmer,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      // Also create user entry
      await setDoc(doc(db, 'users', farmer.id), {
        id: farmer.id,
        phoneNumber: `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
        role: 'farmer',
        name: farmer.farmName,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
    console.log('Farmers added successfully!');

    // Add products
    console.log('Adding products...');
    for (const product of sampleProducts) {
      await addDoc(collection(db, 'products'), {
        ...product,
        harvestDate: Timestamp.fromDate(product.harvestDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
    console.log('Products added successfully!');

    console.log('Database seeding completed!');
    return { success: true, message: 'Database seeded successfully' };
  } catch (error) {
    console.error('Error seeding database:', error);
    return { success: false, error };
  }
}

// Run this function to seed your database
// Note: You can call this from your app or create a separate script
// seedDatabase();

