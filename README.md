# 🌾 Farmer Groceries

### *Connecting Farmers Directly to Consumers*

[![React Native](https://img.shields.io/badge/React_Native-0.81.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_54-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-3ECF8E.svg)](https://supabase.com/)

A production-ready mobile application that eliminates middlemen in the agricultural supply chain, enabling farmers to sell directly to consumers while providing delivery partners with flexible earning opportunities.

---

## 🎯 The Problem

Traditional agricultural supply chains have **5+ intermediaries** between farmers and consumers:

```
Farmer → Local Trader → Commission Agent → Wholesaler → Retailer → Consumer
```

**The Impact:**
- 👨‍🌾 Farmers receive only **20-25%** of final retail price
- 💰 Customers pay **200-300%** markup
- 🗑️ **30-40%** of produce wasted
- ⏱️ **3-7 days** from farm to table

---

## 💡 Our Solution

**Direct connection with zero middlemen:**

```
Farmer → Delivery Partner → Consumer
```

**One App. Three Roles. Maximum Impact.**

- **👨‍🌾 Farmers:** Earn 50-70% more by selling directly
- **🛒 Customers:** Save 20-30% on fresh produce
- **🚚 Delivery Partners:** Flexible income opportunities

---

## ✨ Features

### For Customers 🛒

- **Browse Products**: 12 categories of fresh produce with real-time stock updates
- **Product Details**: High-quality images, detailed descriptions, farmer information
- **Shopping Cart**: Easy cart management with quantity controls
- **Order Tracking**: Real-time order status with 7-step progress tracker
- **Multiple Payments**: Cash on Delivery, GPay, PhonePe
- **Save Addresses**: Manage multiple delivery addresses
- **Profile Management**: Edit personal information, view order history

### For Farmers 👨‍🌾

- **Dashboard**: Business analytics with orders and earnings overview
- **Product Management**: Add/edit products with images and inventory tracking
- **Order Processing**: Accept, confirm, and pack orders
- **Earnings Tracking**: Real-time revenue and payment breakdown
- **Profile Management**: Farm details, verification documents, ratings

### For Delivery Partners 🚚

- **Available Orders**: View and accept customer orders from farmers
- **Order Status Updates**: Track orders through the delivery workflow
- **Map Navigation**: Google Maps/Apple Maps integration with directions
- **Call Customer**: Quick contact button for customer communication
- **Earnings Dashboard**: Track today's, weekly, and monthly earnings
- **Flexible Hours**: Toggle availability on/off

---

## 🏗️ Tech Stack

### Frontend
- **React Native 0.81.5** - Cross-platform mobile framework
- **TypeScript 5.x** - Type-safe JavaScript
- **Expo SDK 54** - Managed workflow
- **NativeWind** - Tailwind CSS for React Native
- **Moti** - Smooth animations
- **Expo Router 6.x** - File-based routing

### Backend
- **Supabase Auth** - Email/password authentication
- **PostgreSQL** - Relational database with real-time subscriptions
- **Supabase Storage** - Image hosting
- **Row Level Security** - Database-level security

### Integrations
- **Google Maps API** - Navigation & location services
- **React Native Maps** - Native map components

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js >= 18.x
npm or yarn
Expo Go app (iOS/Android)
```

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/farmer-groceries.git
cd farmer-groceries
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**

Create a `.env` file in the root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Start the development server:**
```bash
npm start
```

5. **Run on your device:**
- Open **Expo Go** app on your phone
- Scan the QR code displayed in terminal
- App will load automatically

---

## 📁 Project Structure

```
farmer-groceries/
├── app/                          # Expo Router pages
│   ├── (auth)/                   # Authentication screens
│   │   └── login.tsx             # Login/Signup
│   ├── (customer)/               # Customer role screens
│   │   ├── home.tsx              # Browse products
│   │   ├── cart.tsx              # Shopping cart
│   │   ├── orders.tsx            # Order history
│   │   ├── payment.tsx           # Payment selection
│   │   ├── profile.tsx           # Profile management
│   │   ├── product/              
│   │   │   └── [id].tsx          # Product details
│   │   └── track-order/
│   │       └── [id].tsx          # Order tracking
│   ├── (farmer)/                 # Farmer role screens
│   │   ├── dashboard.tsx         # Business overview
│   │   ├── products.tsx          # Product management
│   │   ├── orders.tsx            # Order processing
│   │   └── profile.tsx           # Farmer profile
│   ├── (delivery)/               # Delivery role screens
│   │   ├── orders.tsx            # Available deliveries
│   │   ├── map.tsx               # Navigation & directions
│   │   ├── earnings.tsx          # Earnings tracker
│   │   └── profile.tsx           # Delivery profile
│   ├── role-select.tsx           # Role selection
│   └── _layout.tsx               # Root layout & auth guard
├── src/
│   ├── components/               # Reusable UI components
│   ├── contexts/                 # React Context (Global state)
│   │   ├── AuthContext.tsx       # Authentication state
│   │   └── CartContext.tsx       # Shopping cart state
│   ├── services/                 # Business logic
│   │   ├── supabase.ts           # Supabase operations
│   │   └── storage.ts            # AsyncStorage operations
│   ├── types/                    # TypeScript definitions
│   ├── config/                   # Configuration
│   │   └── supabase.ts           # Supabase config
│   └── utils/                    # Helper functions
├── assets/                       # Images, fonts, etc.
├── package.json                  # Dependencies
├── app.json                      # Expo configuration
├── tsconfig.json                 # TypeScript config
└── tailwind.config.js            # NativeWind config
```

---

## 🔐 Supabase Setup

### 1. Create a Supabase Project
- Go to [supabase.com](https://supabase.com)
- Create a new project
- Copy your project URL and anon key

### 2. Set Environment Variables
Add your Supabase credentials to `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Tables
The app requires the following tables:
- `users` - User profiles with roles
- `farmers` - Farmer-specific information
- `products` - Product catalog
- `orders` - Order management

### 4. Row Level Security (RLS)
For production, enable RLS on all tables:
- Users can read/write their own data
- Farmers can manage their own products
- Customers can view all products and their own orders
- Delivery partners can view assigned orders

---

## 🧪 Testing

### Test Scenarios

**Customer Flow:**
1. Sign up / Log in
2. Browse products by category
3. Click product to view details
4. Add items to cart
5. Go to cart and checkout
6. Enter delivery address
7. Select payment method (COD/GPay/PhonePe)
8. Place order
9. Track order from Orders page
10. View order progress

**Farmer Flow:**
1. Sign up / Log in as farmer
2. View dashboard with stats
3. Add new product with image
4. Manage product inventory
5. View incoming orders
6. Confirm and pack orders
7. View earnings

**Delivery Flow:**
1. Sign up / Log in as delivery partner
2. View available orders (from customers)
3. Accept an order
4. Order moves to "My Deliveries"
5. Update order status (Picked Up → Out for Delivery)
6. Use map to navigate to customer
7. Click "Navigate" to open Google Maps
8. Mark order as delivered
9. View earnings

---

## 🌱 Social Impact

This project contributes to **UN Sustainable Development Goals:**

- **🎯 SDG 1: No Poverty** - Increase farmer income by 50-70%
- **🎯 SDG 2: Zero Hunger** - Reduce food wastage by 30-40%
- **🎯 SDG 8: Decent Work** - Create flexible jobs for delivery partners
- **🎯 SDG 12: Responsible Consumption** - Shorter supply chain, less waste
- **🎯 SDG 13: Climate Action** - Lower carbon footprint

---

## 🗺️ Roadmap

### ✅ Phase 1: MVP (Completed)
- ✅ Authentication system with role-based access
- ✅ Product browsing and management
- ✅ Shopping cart and checkout
- ✅ Order tracking with progress tracker
- ✅ Map navigation for delivery partners
- ✅ Profile management for all roles
- ✅ Real-time data from Supabase

### 📅 Phase 2: Enhancement (Coming Soon)
- Push notifications for order updates
- In-app chat between customers and delivery partners
- Ratings & reviews for products and farmers
- Advanced search and filters
- Image upload optimization

### 📅 Phase 3: Scale
- Multi-language support
- Analytics dashboard for farmers
- Subscription features for regular orders
- Loyalty programs and referral system
- Multi-city support

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 🙏 Acknowledgments

- React Native Community
- Expo Team
- Supabase
- Open Source Community

---

## ⭐ Show Your Support

If this project helped you, please give it a ⭐️!

---

<div align="center">

**Made with ❤️ for farmers, customers, and delivery partners**

</div>
