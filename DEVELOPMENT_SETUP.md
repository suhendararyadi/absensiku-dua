# 🚀 Development Setup untuk SaaS Migration

## 📋 Overview

Dokumentasi ini menjelaskan setup development environment untuk migrasi aplikasi menjadi SaaS multi-tenant.

## 🏗️ Branching Strategy

### Branches yang Tersedia:

- **`main`** - Production branch (stable)
- **`backup/pre-saas-migration`** - Backup sebelum migrasi SaaS
- **`feature/multi-tenant-architecture`** - Development branch untuk multi-tenant

### Git Tags:

- **`v1.0-production`** - Tag backup versi production sebelum migrasi

## 🔧 Environment Setup

### 1. Development Environment

```bash
# Switch ke development branch
git checkout feature/multi-tenant-architecture

# Install dependencies
npm install

# Run development server
npm run dev
```

### 2. Environment Variables

**Development (.env.development):**
- Firebase Project: `attendnow-dev` (akan dibuat)
- Debug mode: Enabled
- Multi-tenant: Enabled

**Production (.env.production):**
- Firebase Project: `attendnow-g1s9e` (existing)
- Debug mode: Disabled
- Multi-tenant: Disabled (sementara)

### 3. Available Scripts

```bash
# Development
npm run dev                 # Normal development
npm run dev:prod-data      # Development dengan production data

# Build
npm run build              # Normal build
npm run build:dev          # Development build
npm run build:staging      # Staging build
npm run build:prod         # Production build
```

## 🔒 Safety Measures

### Backup & Recovery:

1. **Tag Backup**: `v1.0-production`
2. **Branch Backup**: `backup/pre-saas-migration`
3. **Rollback Command**:
   ```bash
   git checkout main
   git reset --hard v1.0-production
   ```

### Development Isolation:

- Development menggunakan Firebase project terpisah
- Production data tetap aman
- Feature flags untuk kontrol fitur

## 📊 Next Steps

### Phase 1: Multi-Tenant Foundation

1. **Setup Firebase Development Project**
   ```bash
   firebase projects:create attendnow-dev
   firebase use attendnow-dev
   ```

2. **Database Schema Restructuring**
   - Organizations collection
   - Tenant-based data isolation
   - Migration scripts

3. **Authentication & Context**
   - Tenant middleware
   - Auth context updates
   - Route protection

### Phase 2: Testing & Validation

1. **Data Isolation Testing**
2. **Performance Optimization**
3. **Security Audit**

### Phase 3: Deployment

1. **Staging Deployment**
2. **User Acceptance Testing**
3. **Production Migration**

## ⚠️ Important Notes

- **JANGAN** merge ke `main` tanpa testing lengkap
- **SELALU** test di development environment dulu
- **BACKUP** data sebelum migration
- **MONITOR** performance setelah deployment

## 🆘 Emergency Procedures

### Rollback ke Production:

```bash
# Quick rollback
git checkout main
git reset --hard v1.0-production
git push origin main --force-with-lease

# Restore Firebase
firebase use attendnow-g1s9e
```

### Contact:

- Development Issues: Check logs di development environment
- Production Issues: Immediate rollback ke `v1.0-production`
- Emergency: Gunakan backup branch `backup/pre-saas-migration`