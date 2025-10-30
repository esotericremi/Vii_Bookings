# VII Bookings - Meeting Room Booking System

> **Problem-Solving Internship Project by Remilekun Omoyeni**  
> *Built to address meeting room management gaps identified during her Admin Department internship at VIISAUS Limited*

## 📋 Project Overview

VII Bookings is a comprehensive meeting room booking and management system developed to address a critical gap in meeting room management at VIISAUS Limited. The project was conceived and built by Remilekun Omoyeni during her internship in the Admin Department, where she identified inefficiencies in the existing room booking processes and developed this solution to streamline operations.

The application provides an intuitive interface for staff to book meeting rooms and administrators to manage the entire booking ecosystem, solving real-world operational challenges through technology.

## 👥 Development Team

### 🎓 **Primary Developer & Project Originator**
- **Name**: Remilekun Omoyeni
- **Role**: Admin Department Intern
- **Company**: VIISAUS Limited
- **Project Genesis**: Identified meeting room management gaps during admin work and developed this solution
- **Background**: Worked in Admin Department, observed operational inefficiencies, and built this system to solve them

### 🚀 **Major Contributor**
- **Name**: Obinna Akaolisa
- **GitHub**: [github.com/obinnakaolisa](https://github.com/obinnakaolisa)
- **Role**: Major Contributor & Technical Mentor
- **Contributions**: Architecture design, advanced features implementation, code optimization, and technical guidance

## 💡 Project Motivation

### 🔍 **Problem Identified**
During her internship in the Admin Department at VIISAUS Limited, Remilekun Omoyeni observed significant inefficiencies in the company's meeting room management processes:

- **Manual Booking Systems**: Time-consuming paper-based or email booking processes
- **Double Bookings**: Conflicts arising from lack of real-time availability tracking
- **Poor Visibility**: Difficulty in seeing room availability and usage patterns
- **Administrative Overhead**: Manual coordination and conflict resolution
- **Lack of Analytics**: No insights into room utilization for optimization

### 🎯 **Solution Developed**
Recognizing these operational challenges, Remilekun took initiative to develop VII Bookings as a comprehensive digital solution that:

- **Streamlines Booking Process**: Intuitive interface for quick room reservations
- **Prevents Conflicts**: Real-time availability checking and booking validation
- **Provides Transparency**: Clear visibility of room schedules and availability
- **Reduces Admin Work**: Automated notifications and booking management
- **Enables Data-Driven Decisions**: Analytics for room utilization optimization

This project exemplifies how identifying real-world problems and applying technical skills can create meaningful solutions that improve organizational efficiency.

## ✨ Features

### 🏢 For Staff Users
- **Room Selection**: Browse and filter available meeting rooms
- **Easy Booking**: Intuitive booking interface with real-time availability
- **My Bookings**: View and manage personal reservations
- **Dashboard**: Overview of room availability and booking insights
- **Profile Management**: Personal profile and settings
- **Notifications**: Real-time booking confirmations and updates

### 👨‍💼 For Administrators
- **Admin Dashboard**: Comprehensive overview of all bookings and system metrics
- **Room Management**: Add, edit, and configure meeting rooms
- **Booking Management**: Oversee all bookings and resolve conflicts
- **Analytics**: Detailed usage statistics and reports
- **System Settings**: Configure application-wide settings
- **User Management**: Manage user roles and permissions

### 🎨 User Experience
- **Modern Sidebar Navigation**: Collapsible sidebar with role-based menu items
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Live notifications and booking status updates
- **Clean Empty States**: Intuitive messaging when no data is available
- **Accessibility**: ARIA labels and keyboard navigation support

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: Radix UI with shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM
- **Backend**: Supabase (Database, Authentication, Real-time)
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Form Management**: React Hook Form with Zod validation

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vii-bookings
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
   
   ⚠️ **Security Note**: Never commit the `.env` file to version control. It's now properly ignored by Git.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Create Admin User**
   ```bash
   npm run create-admin
   ```

## 🔐 Default Admin Credentials

After running the admin creation script:

- **Email**: `admin@viibookings.com`
- **Password**: `admin123!`
- **Role**: `admin`

⚠️ **Important**: Change the password after first login!

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── auth/           # Authentication components
│   ├── booking/        # Booking-related components
│   ├── layout/         # Layout components (Header, Sidebar, etc.)
│   ├── navigation/     # Navigation components
│   ├── routing/        # Route configuration
│   ├── shared/         # Shared utility components
│   └── ui/             # Base UI components (shadcn/ui)
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and configurations
├── pages/              # Page components
│   ├── admin/          # Admin pages
│   └── auth/           # Authentication pages
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🎯 Key Features Implemented

### ✅ Recent Updates & Fixes
- **Modern Sidebar Navigation**: Replaced horizontal menu with collapsible sidebar
- **Enhanced Authentication**: Improved logout functionality with proper state clearing
- **Notification System**: Moved notifications to header for better UX
- **User Profile & Settings**: Dedicated pages for user management
- **Admin User Creation**: Automated scripts for admin account setup
- **Empty States**: Clean messaging for pages without data
- **Brand Identity**: Updated from "RoomRover" to "VII Bookings"

### 🔧 Admin Management Tools
- **Room Management**: CRUD operations for meeting rooms
- **Booking Oversight**: View and manage all user bookings
- **Analytics Dashboard**: Usage statistics and insights
- **System Configuration**: Application-wide settings management

### 📱 Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Desktop Enhanced**: Rich desktop experience with sidebar navigation
- **Touch-Friendly**: Intuitive touch interactions

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📊 Database Schema

The application uses Supabase with the following main tables:
- `users` - User profiles and roles
- `rooms` - Meeting room information
- `bookings` - Booking records
- `notifications` - User notifications

## 🤝 Contributing

This project was developed as part of an internship program. For any questions or suggestions, please contact:

- **Primary Developer**: Remilekun Omoyeni
- **Major Contributor**: Obinna Akaolisa ([github.com/obinnakaolisa](https://github.com/obinnakaolisa))
- **Supervisor**: VIISAUS Limited Team

## 📄 License

This project is developed for VIISAUS Limited as part of an internship program.

## 🙏 Acknowledgments

- **VIISAUS Limited** for providing the internship opportunity and supporting innovative problem-solving initiatives
- **Admin Department Team** for providing insights into operational challenges and testing the solution
- **Obinna Akaolisa** ([github.com/obinnakaolisa](https://github.com/obinnakaolisa)) for major contributions, technical mentorship, and advanced feature implementations
- **Mentors and Team Members** for guidance and support throughout the development process
- **Open Source Community** for the amazing tools and libraries that made this project possible

---

**© 2025 VIISAUS Limited - Internship Project by Remilekun Omoyeni**  
**Major Contributions by Obinna Akaolisa ([github.com/obinnakaolisa](https://github.com/obinnakaolisa))**
