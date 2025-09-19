# 🔑 Admin Access Guide - LegacyLink Alumni Platform

## 🚀 How to Access Admin Accounts

### **Method 1: Create Super Admin Account**

1. **Register a new account:**
   - Visit: `http://localhost:3000/auth/sign-up`
   - Fill in your details (any email/university)
   - Complete email verification

2. **Manually promote to Super Admin:**
   - Visit: `http://localhost:3000/debug/admin-promotion`
   - Enter your email address
   - Click "Make Super Admin"
   - You'll be promoted to super_admin role

3. **Access Super Admin Dashboard:**
   - Visit: `http://localhost:3000/admin`
   - You'll see platform-wide statistics
   - Can manage ALL universities and users

### **Method 2: Create University Admin Account**

1. **Register account with university email:**
   - Visit: `http://localhost:3000/auth/sign-up`
   - Use email matching university domain (e.g., admin@cuchd.in)
   - Select appropriate university during signup

2. **Create University & Become Admin:**
   - Visit: `http://localhost:3000/admin` (after being promoted to admin)
   - Use "Create University" card
   - Enter university name and domain
   - Click "Create & Become Admin"
   - You'll become university_admin for that university

3. **Access University Admin Dashboard:**
   - Visit: `http://localhost:3000/admin`
   - You'll see university-specific statistics
   - Can only manage users from your university

---

## 👥 Verification Queue - How Unverified Users Are Shown

### **Verification Queue System**

The admin dashboard automatically shows **unverified users** who need approval:

#### **What Shows in Verification Queue:**
- **Alumni** with `verified = false`
- **Students** with `verified = false`
- **Mentors** with `verified = false` (in separate mentor management)

#### **University Admin View:**
- Shows ONLY users from their university
- Filtered by `university_id` matching admin's university
- Cannot see users from other universities

#### **Super Admin View:**
- Shows ALL unverified users from ALL universities
- Platform-wide verification queue
- Can verify users from any university

### **Verification Queue Location:**
- **Main Location:** `http://localhost:3000/admin`
- **Section:** "Multi-level Verification Queue"
- **Mentor Management:** `http://localhost:3000/admin/mentors`

---

## 🔧 Admin Promotion Tool

### **Quick Admin Access Tool:**
Visit: `http://localhost:3000/debug/admin-promotion`

This tool allows you to:
- ✅ Promote any account to Super Admin
- ✅ Promote any account to University Admin  
- ✅ Create university associations
- ✅ Check current admin status
- ✅ Test admin dashboard access

---

## 📊 Admin Dashboard Features

### **Super Admin Dashboard Features:**
- Platform-wide user statistics
- ALL university management
- Global verification queue
- Cross-university analytics
- System-wide settings

### **University Admin Dashboard Features:**
- University-specific statistics
- Only their university's users
- University-scoped verification queue
- University event management
- University-specific analytics

---

## 🔍 How to Test Verification System

### **Step 1: Create Test Users**
1. Register 2-3 accounts as alumni/students
2. Do NOT verify them initially
3. These will appear in verification queue

### **Step 2: Access Admin Dashboard**
1. Visit: `http://localhost:3000/debug/admin-promotion`
2. Make yourself admin
3. Visit: `http://localhost:3000/admin`
4. Check "Multi-level Verification Queue" section

### **Step 3: Verify Users**
1. Click "View Profile" or verification buttons
2. Users will be marked as verified
3. They'll gain full platform access
4. Verification badges awarded

---

## 🎯 Default Test Accounts (If Available)

Check database for existing admin accounts:
- Look for profiles with role = 'super_admin'
- Look for profiles with role = 'university_admin'
- Check scripts/008_demo_users.sql for test accounts

---

## 🚨 Important Notes

1. **Admin Access Control:**
   - Only admin roles can access `/admin`
   - Non-admins redirected to `/dashboard`
   - University admins see only their university data

2. **Verification Requirements:**
   - Alumni and Students need admin verification
   - Mentors need separate admin verification
   - Email verification is automatic (Supabase)
   - LinkedIn integration is optional

3. **Security Features:**
   - Row Level Security (RLS) policies active
   - University admins cannot cross-verify
   - Super admins have platform-wide access
   - Regular users cannot access admin features

---

## 📞 Quick Access Summary

| Access Method | URL | Purpose |
|---------------|-----|---------|
| **Admin Promotion Tool** | `/debug/admin-promotion` | Make yourself admin |
| **Main Admin Dashboard** | `/admin` | Verification queue & stats |
| **Mentor Management** | `/admin/mentors` | Verify mentors |
| **Admin Function Test** | `/debug/admin-test` | Test all admin features |
| **Verification Status** | `/debug/verification-status` | Check your verification |

**Remember:** After promoting yourself to admin, refresh the page and visit `/admin` to access the full admin dashboard with verification queue!