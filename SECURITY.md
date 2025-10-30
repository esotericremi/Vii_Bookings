# Security Guidelines

## 🔒 Environment Variables

### ⚠️ Important Security Notice

**NEVER commit `.env` files to version control!**

The `.env` file contains sensitive information including:
- Database credentials
- API keys
- Service role keys
- Authentication secrets

### 🛡️ What We've Done

1. **Removed from tracking**: The `.env` file has been removed from Git tracking
2. **Added to .gitignore**: Multiple environment file patterns are now ignored:
   - `.env`
   - `.env.local`
   - `.env.development.local`
   - `.env.test.local`
   - `.env.production.local`

### 📋 Setup Instructions

1. **Copy the example file**:
   ```bash
   cp .env.example .env
   ```

2. **Fill in your actual values**:
   ```env
   VITE_SUPABASE_URL=your_actual_supabase_url
   VITE_SUPABASE_ANON_KEY=your_actual_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
   ```

3. **Never commit the .env file**:
   - The file is now properly ignored by Git
   - Always use `.env.example` for sharing configuration structure

### 🔐 Best Practices

- **Use different environments**: Separate `.env` files for development, staging, and production
- **Rotate keys regularly**: Update API keys and secrets periodically
- **Limit permissions**: Use the principle of least privilege for service accounts
- **Monitor access**: Keep track of who has access to production credentials

### 🚨 If Credentials Are Compromised

1. **Immediately rotate** all affected keys and secrets
2. **Review access logs** for any unauthorized usage
3. **Update all environments** with new credentials
4. **Notify team members** about the security incident

## 📝 Environment Variables Reference

### Required Variables

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous/public key

### Optional Variables

- `SUPABASE_SERVICE_ROLE_KEY`: Required only for admin user creation script

### Development vs Production

Make sure to use different Supabase projects/keys for:
- **Development**: Local development and testing
- **Production**: Live application deployment

This prevents development activities from affecting production data and users.