# 🍔 Gourmet Burger - Complete Setup Guide

## ✅ Features Implemented

### 1. **Authentication System** ✓
- ✅ login/Register modal
- ✅ Local storage session persistence
- ✅ Demo accounts for testing
- ✅ Logout functionality

### 2. **Side Navigation Menu** ✓
- ✅ Mobile-friendly hamburger menu
- ✅ User profile quick access
- ✅ Admin panel link (for admins)
- ✅ Orders history
- ✅ Logout button

### 3. **Admin Panel** ✓
- ✅ Product management (Add/Edit/Delete)
- ✅ Analytics dashboard
- ✅ Orders management
- ✅ Admin-only access

### 4. **User Profile** ✓
- ✅ Profile information management
- ✅ Delivery address storage
- ✅ Phone number management
- ✅ Local persistence

### 5. **Firebase Integration** 🔧
- Framework ready for Firebase Authentication
- Framework ready for Firestore Database
- Configuration file created at `JS/firebase-config.js`

### 6. **EmailJS Integration** 🔧
- Framework ready for order confirmation emails
- Configuration file created at `JS/firebase-config.js`

---

## 🚀 Getting Started

### Default Demo Accounts

```
Admin Account:
  Email: admin@burger.com
  Password: admin123

Regular User:
  Email: email@test.com
  Password: password123

  Email: user@test.com
  Password: user1234
```

---

## 🔧 Firebase Setup (Optional but Recommended)

### Step 1: Create Firebase Project
1. Go to [firebase.google.com](https://firebase.google.com)
2. Click "Go to console"
3. Click "Add project"
4. Name it "gourmet-burger"
5. Follow the setup wizard

### Step 2: Get Firebase Credentials
1. In Firebase console, click your project
2. Go to **Settings** ⚙️ → **Project Settings**
3. Scroll to "Your apps" section
4. Click **Web** icon
5. Copy the config object

### Step 3: Update `JS/firebase-config.js`

Replace the `firebaseConfig` object with your credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Step 4: Enable Firebase Services

In Firebase console:
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Go to **Firestore Database**
4. Click **Create database**
5. Start in **Test mode** (for development)
6. Create collection `users` and `orders`

---

## 📧 EmailJS Setup (Optional but Recommended)

### Step 1: Create EmailJS Account
1. Go to [emailjs.com](https://www.emailjs.com)
2. Sign up for free account
3. Navigate to **Email Services**

### Step 2: Connect Email Service
1. Click **Add Service**
2. Choose your email provider (Gmail, Outlook, etc.)
3. Follow authentication steps
4. Save service

### Step 3: Create Email Template
1. Go to **Email Templates**
2. Click **Create New Template**
3. Use these variables in template:
   ```
   User: {{user_name}}
   Order ID: {{order_id}}
   Items: {{items}}
   Total: {{total}}
   Delivery: {{delivery_address}}
   ```

### Step 4: Get Your Credentials
1. Go to **Integration** section
2. Copy:
   - **Service ID** (e.g., `service_abc123`)
   - **Template ID** (e.g., `template_xyz789`)
   - **Public Key** (API key)

### Step 5: Update `JS/firebase-config.js`

```javascript
const emailjsConfig = {
  serviceID: 'service_your_id',
  templateID: 'template_your_id',
  publicKey: 'your_public_key'
};
```

---

## 📁 Project Structure

```
Title/Data/
├── index.html                    ← Main HTML
├── Data.json                     ← Menu data
├── Style/
│   └── style.css                 ← All styling
├── JS/
│   ├── script.js                 ← Main app logic (UPDATED)
│   ├── firebase-config.js        ← Firebase & EmailJS config
│   └── script_old.js             ← Backup of original
└── Images/
    └── (burger images go here)
```

---

## 🎨 Customization Guide

### Add New Menu Items
Edit `Data.json`:
```json
{
  "id": 10,
  "category": "burger",
  "name": "Dream Burger",
  "description": "Your description",
  "price": 12.99,
  "image": "images/dream-burger.png",
  "badges": [
    { "label": "New!", "type": "new" }
  ]
}
```

### Change Brand Colors
Edit `Style/style.css` (CSS Variables section):
```css
:root {
  --red: #C0272D;        /* Change to your brand color */
  --red-dark: #8f1a1e;
  --black: #111111;
  /* ... more colors */
}
```

### Add More Admin Accounts
Edit `JS/script.js`, update `ADMIN_EMAILS`:
```javascript
const ADMIN_EMAILS = ['admin@burger.com', 'newemail@burger.com'];
```

---

## 🔒 Security Notes

**⚠️ DO NOT:**
- Commit Firebase credentials to public repositories
- Use real credentials in demo mode
- Store sensitive data in localStorage

**✅ DO:**
- Use environment variables for production
- Enable Firebase security rules
- Validate all server-side
- Use HTTPS in production

---

## 📱 Mobile Responsive Features

- ✅ Hamburger menu on tablets/phones
- ✅ Touch-friendly buttons (48px minimum)
- ✅ Responsive admin tables
- ✅ Mobile-optimized modals

---

## 🛠️ Troubleshooting

### Images not loading?
- Check `Images/` folder exists
- Verify image names match `Data.json`
- Check browser console for 404 errors

### Firebase connection issues?
- Verify credentials in `firebase-config.js`
- Check Firebase security rules allow reads/writes
- Test with Firebase emulator locally

### EmailJS not sending?
- Verify service/template/public key
- Check email template variables match code
- Test with EmailJS dashboard first

### Admin panel not showing?
- User must be in `ADMIN_EMAILS` list
- Must login with admin email
- Check browser console for errors

---

## 📚 Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [EmailJS Documentation](https://www.emailjs.com/docs)
- [MDN Web Docs](https://developer.mozilla.org)

---

## 🎉 Next Steps

1. ✅ Test with demo accounts
2. 🔧 Setup Firebase (optional)
3. 📧 Setup EmailJS (optional)
4. 🎨 Customize colors & content
5. 📱 Test on mobile devices
6. 🚀 Deploy to hosting!

---

**Made with 🍔 and ❤️ by Your Development Team**
