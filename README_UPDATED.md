# 🍔 Gourmet Burger — v3.0 Complete

Full-featured restaurant website with Firebase Auth, Google Login, Firestore orders, EmailJS confirmations, Admin Panel, Reviews, Search, and Cart.

---

## 📁 Project Structure

```
gourmet-burger/
├── index.html                 ← Main HTML (all modals included)
├── data/
│   └── Data.json              ← Menu data
├── Style/
│   └── style.css              ← Complete styles
├── JS/
│   ├── firebase-config.js     ← ⚠️ Update your credentials here
│   └── script.js              ← Full app logic
└── Images/
    └── (your food images)
```

---

## 🚀 Quick Start

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Demo login: `admin@burger.com` / `admin123`

---

## 🔧 Setup — 3 Steps

### 1. Firebase (already configured — nikas-shop project)
Your Firebase credentials are already in `JS/firebase-config.js`.

In Firebase Console:
1. **Authentication** → Sign-in method → Enable **Email/Password** + **Google**
2. **Firestore** → Create database → Start in test mode
3. Collections needed: `orders`, `users`

**Firestore Security Rules (paste in Firebase Console → Firestore → Rules):**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{orderId} {
      allow create: if request.auth != null;
      allow read:   if request.auth != null &&
                       (request.auth.uid == resource.data.userId ||
                        request.auth.token.email in ['admin@burger.com']);
    }
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

### 2. EmailJS
1. Go to [emailjs.com](https://emailjs.com) → Sign Up (free)
2. **Email Services** → Add Service → Gmail → Connect your Gmail
3. **Email Templates** → Create New → use these variables:
   ```
   To: {{to_email}}
   Subject: Order Confirmed #{{order_id}}

   Hi {{user_name}},
   Your order is confirmed!

   Items:
   {{order_items}}

   Total: {{order_total}}
   Delivery to: {{delivery_addr}}
   Date: {{order_date}}
   ```
4. Copy: Service ID, Template ID, Public Key
5. Open `JS/firebase-config.js` → replace:
   ```javascript
   window.EMAILJS_CONFIG = {
     publicKey:  "your_real_public_key",
     serviceID:  "your_real_service_id",
     templateID: "your_real_template_id"
   };
   ```

### 3. Google Login — Authorize domain
In Firebase Console → Authentication → Settings → **Authorized domains**:
Add: `localhost` (for dev) + your live domain when deploying.

---

## ✨ Features

| Feature | Status |
|---|---|
| Email + Password Login | ✅ |
| Google Sign-In | ✅ |
| Register new account | ✅ |
| Demo accounts (no Firebase needed) | ✅ |
| Admin panel (products/orders/analytics) | ✅ |
| Add / Delete menu products | ✅ |
| Cart with qty controls | ✅ |
| Checkout → Firestore order saved | ✅ |
| Order confirmation email (EmailJS) | ✅ |
| My Orders history | ✅ |
| User profile + delivery address | ✅ |
| Star reviews per menu item | ✅ |
| Search (cross-category) | ✅ |
| Photo gallery | ✅ |
| Contact form (EmailJS) | ✅ |
| Fully responsive mobile | ✅ |
| Scroll-to-top | ✅ |
| Footer with links | ✅ |

---

## 🛠 Troubleshooting

| Problem | Fix |
|---|---|
| Google login popup blocked | Allow popups for localhost |
| Firebase permission error | Check Firestore Rules above |
| Emails not sending | Verify EmailJS credentials in firebase-config.js |
| Images not loading | Use URLs from unsplash.com or put files in Images/ |
| Admin panel not showing | Login with admin@burger.com |

---

## 🚀 Deploy

```bash
# Firebase Hosting
npm i -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

**Made with 🍔 ❤️ — Gourmet Burger v3.0**