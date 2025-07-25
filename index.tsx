
import React, { useState, useMemo, useCallback, ChangeEvent, DragEvent, FC, FormEvent, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// Let TypeScript know that XLSX is available on the window object
declare const XLSX: any;

// --- DATA & TYPE DEFINITIONS ---

interface UnitData {
    'Unit Code': string;
    'Building Type'?: string;
    'Floor'?: number | string;
    'Area'?: number | string;
    'Ownership Status'?: 'Available' | 'Sold' | string;
    'Finishing'?: 'Finished' | 'Semi-Finished' | 'Core' | string;
    'Zone'?: string;
    'Rooms'?: number | string;
    'Building'?: string;
    'Type'?: string;
    'Floor Status'?: string;
    'Category'?: string;
    'Views'?: string;
    'Meter Price'?: number | string;
    'Unit Status'?: string;
    'Garage'?: string;
    'Units finishing situation (Site)'?: string;
}


type Permission = 'manage_users' | 'manage_projects' | 'view_dashboard' | 'view_projects';

const allPermissions: Permission[] = ['view_dashboard', 'view_projects', 'manage_projects', 'manage_users'];
const assignablePermissions: Exclude<Permission, 'manage_users'>[] = ['view_dashboard', 'view_projects', 'manage_projects'];

interface User {
    username: string;
    password: string; // In a real app, this should be a hash
    role: 'admin' | 'user';
    permissions: Permission[];
}

interface CurrentUser {
    username: string;
    role: 'admin' | 'user';
    permissions: Permission[];
}

interface Project {
    id: number;
    name: string;
    logo?: string;
    description: string;
    status: 'Ongoing' | 'Completed' | 'Planned';
    location: string;
    type: 'Residential' | 'Commercial' | 'Mixed-Use';
    units: number;
    completionDate: string;
    features: string[];
    unitTypes: string[];
    detailedUnits?: UnitData[];
    galleryImages?: string[];
}

interface Filters {
  buildingType: string;
  ownershipStatus: string;
  finishing: string;
}

interface Sort {
  key: 'Area' | 'Floor';
  direction: 'asc' | 'desc';
}

type Language = 'en' | 'ar';
type UnitViewContext = { source: 'global' } | { source: 'project', projectId: number };

// --- TRANSLATIONS ---
const translations = {
  en: {
    // Login
    loginTitle: "Dashboard Login",
    loginSubtitle: "Enter your credentials to access the unit dashboard.",
    username: "Username",
    password: "Password",
    loginButton: "Login",
    invalidCredentialsError: "Invalid username or password.",
    noAccessError: "You do not have permission to access any pages.",
    changeToArabic: "العربية",

    // Header & Sidebar
    headerTitle: "SUD Development",
    headerSubtitle: "Real Estate Unit Dashboard",
    logout: "Logout",
    menu: "Menu",
    home: "Home",
    projects: "Projects",
    manageUsers: "Manage Users",
    filtersAndControls: "Filters & Controls",
    uploadToFilter: "Upload a file to enable filters.",
    changeToEnglish: "English",

    // File Uploader
    dragAndDrop: "Drag & Drop your Excel file here",
    orBrowse: "or click to browse",
    
    // Status Messages
    processingFile: "Processing your file...",
    fileReadError: "Failed to read the file.",
    invalidFormatError: "Invalid Excel format. Make sure the sheet has at least 'Unit Code' and 'Area' columns.",
    noMatch: "No units match the current filters.",
    uploadPrompt: "Upload your Excel file to view real estate data.",
    menuHint: "Use the menu button to access filters once data is loaded.",
    uploadSuccess: "Successfully uploaded {count} units.",

    // Dashboard
    showingResults: "Showing",
    of: "of",
    units: "units",
    totalUnits: "Total Units",
    available: "Available",
    sold: "Sold",
    averageArea: "Average Area",
    globalDashboard: "Global Unit Dashboard",
    projectDashboard: "Unit Dashboard for: {projectName}",
    ats: "ATS",
    
    // Controls
    searchUnitCode: "Search Unit Code",
    buildingType: "Building Type",
    ownership: "Ownership",
    finishing: "Finishing",
    sortBy: "Sort By",
    areaHighToLow: "Area (High to Low)",
    areaLowToHigh: "Area (Low to High)",
    floorHighToLow: "Floor (High to Low)",
    floorLowToHigh: "Floor (Low to High)",
    clearFilters: "Clear Filters",
    all: "All",

    // Table Headers
    unitCode: "Unit Code",
    floor: "Floor",
    area: "Area (m²)",
    ownershipStatus: "Ownership Status",
    zone: "Zone",
    rooms: "Rooms",
    building: "Building",
    type: "Type",
    floorStatus: "Floor Status",
    category: "Category",
    views: "Views",
    meterPrice: "Meter Price",
    unitStatus: "Unit Status",
    garage: "Garage",
    finishingSituation: "Finishing Situation (Site)",
    addValuePlaceholder: "Click to edit...",


    // User Management
    userManagement: "User Management",
    backToHome: "Back to Home",
    addNewUser: "Add New User",
    usernameEmptyError: "Username and password cannot be empty.",
    userExistsError: "Username already exists.",
    addUser: "Add User",
    existingUsers: "Existing Users",
    enterUsername: "Enter new username",
    enterPassword: "Enter password",
    userPermissions: "User Permissions",
    permission_view_dashboard: "View Dashboard",
    permission_view_projects: "View Projects",
    permission_manage_projects: "Manage Projects",
    
    // Projects
    ourProjects: "Our Projects",
    ongoing: "Ongoing",
    completed: "Completed",
    planned: "Planned",
    location: "Location",
    projectType: "Project Type",
    unitsTotal: "Project Units",
    estCompletion: "Est. Completion",
    keyFeatures: "Key Features",
    projectTypePageTitle: "{type} Projects",
    backToAllProjects: "Back to All Projects",
    backToProject: "Back to Project",
    residential: "Residential",
    commercial: "Commercial",
    mixedUse: "Mixed-Use",
    moreDetails: "More Details",
    projectDetails: "Project Details",
    gallery: "Image Gallery",
    map: "Location Map",
    viewAvailableUnits: "View Available Units",
    addNewProject: "Add New Project",
    editProject: "Edit Project",
    addEditDetails: "Add/Edit Details",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    upload: "Upload",
    remove: "Remove",
    removeProject: "Remove Project",
    confirmRemoval: "Confirm Removal",
    confirmRemovalMessage: "Are you sure you want to remove this project? This action cannot be undone.",
    projectName: "Project Name",
    projectLogo: "Project Logo",
    description: "Description",
    status: "Status",
    featuresCommaSeparated: "Features (comma-separated)",
    unitTypes: "Unit Types",
    unitTypesCommaSeparated: "Unit Types (comma-separated)",
    formErrors: "Please fill out all required fields.",
    unitDetails: "Unit Details",
    unitsDetails: "Units Details",
    projectHasUnits: "This project has {count} units on record.",
    noProjectUnits: "No detailed unit information has been uploaded for this project.",
    uploadUnits: "Upload Units",
    uploadUnitsHelper: "Upload an Excel file with unit details.",
    viewUnits: "View Units",
    logoUploadHelper: "Click upload or drag an image here.",

    // Password Change
    changePassword: "Change Password",
    profileMenu: "Profile Menu",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    passwordMismatchError: "New passwords do not match.",
    incorrectPasswordError: "Incorrect current password.",
    passwordChangedSuccess: "Password changed successfully.",
    passwordMinLengthError: "Password must be at least 6 characters.",
  },
  ar: {
    // Login
    loginTitle: "تسجيل الدخول للوحة التحكم",
    loginSubtitle: "أدخل بياناتك للوصول إلى لوحة بيانات الوحدات.",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    loginButton: "تسجيل الدخول",
    invalidCredentialsError: "اسم المستخدم أو كلمة المرور غير صالحة.",
    noAccessError: "ليس لديك صلاحية للوصول إلى أي صفحات.",
    changeToArabic: "العربية",

    // Header & Sidebar
    headerTitle: "التطويرية | SUD",
    headerSubtitle: "لوحة بيانات الوحدات العقارية",
    logout: "خروج",
    menu: "القائمة",
    home: "الرئيسية",
    projects: "المشاريع",
    manageUsers: "إدارة المستخدمين",
    filtersAndControls: "عوامل التصفية والتحكم",
    uploadToFilter: "قم برفع ملف لتفعيل عوامل التصفية.",
    changeToEnglish: "English",

    // File Uploader
    dragAndDrop: "اسحب وأفلت ملف Excel هنا",
    orBrowse: "أو انقر للتصفح",

    // Status Messages
    processingFile: "جاري معالجة ملفك...",
    fileReadError: "فشل في قراءة الملف.",
    invalidFormatError: "تنسيق Excel غير صالح. تأكد من أن الورقة تحتوي على الأقل على عمودي 'Unit Code' و 'Area'.",
    noMatch: "لا توجد وحدات تطابق عوامل التصفية الحالية.",
    uploadPrompt: "قم برفع ملف Excel الخاص بك لعرض بيانات العقارات.",
    menuHint: "استخدم زر القائمة للوصول إلى عوامل التصفية بمجرد تحميل البيانات.",
    uploadSuccess: "تم رفع {count} وحدة بنجاح.",

    // Dashboard
    showingResults: "عرض",
    of: "من",
    units: "وحدات",
    totalUnits: "إجمالي الوحدات",
    available: "متاح",
    sold: "مباع",
    averageArea: "متوسط المساحة",
    globalDashboard: "لوحة بيانات الوحدات العامة",
    projectDashboard: "لوحة بيانات وحدات مشروع: {projectName}",
    ats: "ATS",

    // Controls
    searchUnitCode: "بحث برقم الوحدة",
    buildingType: "نوع المبنى",
    ownership: "حالة الملكية",
    finishing: "التشطيب",
    sortBy: "فرز حسب",
    areaHighToLow: "المساحة (من الأعلى للأقل)",
    areaLowToHigh: "المساحة (من الأقل للأعلى)",
    floorHighToLow: "الطابق (من الأعلى للأقل)",
    floorLowToHigh: "الطابق (من الأقل للأعلى)",
    clearFilters: "مسح الفلاتر",
    all: "الكل",

    // Table Headers
    unitCode: "رقم الوحدة",
    floor: "الطابق",
    area: "المساحة (م²)",
    ownershipStatus: "حالة الملكية",
    zone: "المنطقة",
    rooms: "الغرف",
    building: "المبنى",
    type: "النوع",
    floorStatus: "حالة الطابق",
    category: "الفئة",
    views: "الإطلالة",
    meterPrice: "سعر المتر",
    unitStatus: "حالة الوحدة",
    garage: "موقف سيارة",
    finishingSituation: "حالة التشطيب (الموقع)",
    addValuePlaceholder: "انقر للتعديل...",

    // User Management
    userManagement: "إدارة المستخدمين",
    backToHome: "العودة للرئيسية",
    addNewUser: "إضافة مستخدم جديد",
    usernameEmptyError: "لا يمكن أن يكون اسم المستخدم وكلمة المرور فارغين.",
    userExistsError: "اسم المستخدم موجود بالفعل.",
    addUser: "إضافة مستخدم",
    existingUsers: "المستخدمون الحاليون",
    enterUsername: "أدخل اسم مستخدم جديد",
    enterPassword: "أدخل كلمة المرور",
    userPermissions: "صلاحيات المستخدم",
    permission_view_dashboard: "عرض لوحة البيانات",
    permission_view_projects: "عرض المشاريع",
    permission_manage_projects: "إدارة المشاريع",

    // Projects
    ourProjects: "مشاريعنا",
    ongoing: "جاري",
    completed: "مكتمل",
    planned: "مخطط له",
    location: "الموقع",
    projectType: "نوع المشروع",
    unitsTotal: "وحدات المشروع",
    estCompletion: "الإنجاز المتوقع",
    keyFeatures: "المميزات الرئيسية",
    projectTypePageTitle: "مشاريع {type}",
    backToAllProjects: "العودة إلى كل المشاريع",
    backToProject: "العودة للمشروع",
    residential: "سكنية",
    commercial: "تجارية",
    mixedUse: "متعددة الاستخدامات",
    moreDetails: "المزيد من التفاصيل",
    projectDetails: "تفاصيل المشروع",
    gallery: "معرض الصور",
    map: "خريطة الموقع",
    viewAvailableUnits: "عرض الوحدات المتاحة",
    addNewProject: "إضافة مشروع جديد",
    editProject: "تعديل المشروع",
    addEditDetails: "إضافة/تعديل التفاصيل",
    saveChanges: "حفظ التغييرات",
    cancel: "إلغاء",
    upload: "رفع",
    remove: "إزالة",
    removeProject: "إزالة المشروع",
    confirmRemoval: "تأكيد الإزالة",
    confirmRemovalMessage: "هل أنت متأكد من رغبتك في إزالة هذا المشروع؟ لا يمكن التراجع عن هذا الإجراء.",
    projectName: "اسم المشروع",
    projectLogo: "شعار المشروع",
    description: "الوصف",
    status: "الحالة",
    featuresCommaSeparated: "المميزات (مفصولة بفاصلة)",
    unitTypes: "أنواع الوحدات",
    unitTypesCommaSeparated: "أنواع الوحدات (مفصولة بفاصلة)",
    formErrors: "يرجى ملء جميع الحقول المطلوبة.",
    unitDetails: "تفاصيل الوحدات",
    unitsDetails: "تفاصيل الوحدات",
    projectHasUnits: "هذا المشروع به {count} وحدة مسجلة.",
    noProjectUnits: "لم يتم رفع معلومات تفصيلية عن الوحدات لهذا المشروع.",
    uploadUnits: "رفع الوحدات",
    uploadUnitsHelper: "قم برفع ملف Excel بتفاصيل الوحدات.",
    viewUnits: "عرض الوحدات",
    logoUploadHelper: "انقر للرفع أو اسحب صورة إلى هنا.",

    // Password Change
    changePassword: "تغيير كلمة المرور",
    profileMenu: "قائمة الملف الشخصي",
    currentPassword: "كلمة المرور الحالية",
    newPassword: "كلمة المرور الجديدة",
    confirmNewPassword: "تأكيد كلمة المرور الجديدة",
    passwordMismatchError: "كلمتا المرور الجديدتان غير متطابقتين.",
    incorrectPasswordError: "كلمة المرور الحالية غير صحيحة.",
    passwordChangedSuccess: "تم تغيير كلمة المرور بنجاح.",
    passwordMinLengthError: "يجب أن لا تقل كلمة المرور عن 6 أحرف.",
  }
};


// --- STATIC DATA ---
const initialProjects: Project[] = [
    { 
        id: 7, 
        name: "Capital Height 1",
        logo: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIz8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAEAABADASIAAhEBAxEB/8QAGwABAAMBAQEBAAAAAAAAAAAAAAUGBwQDAgH/xABGEAABAwMCAwQFBgsGBwAAAAABAgMEAAUGEQcSITFBURMUImFxFRYyVIGRk9IjQlJUobHB0uEIM2JzdIKisvA0NjdDRWOC/8QAGAEBAQEBAQAAAAAAAAAAAAAAAAECAwT/xAAgEQEAAgMAAwEBAQEAAAAAAAAAAQIRAxIhEzEyQVFh/9oADAMBAAIRAxEAPwDsoCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooqhcLtEtbKVyVne4rattCSpazzwEjma87/dIkWUiM64VPqISUtpKyknkFEDA+JqfU0zVvFFQXm+QLEyhyc4re4dqG0JKlrV1xpHM16WS+wL7HW/b3StKFbFpUkoUhWM4UDyNRXVFFAUUUUBRRRQFFFFAUGg14yXkR2HHnDtbbSVKPcAMmg8L3eYlht7k+esobQcJSkZU4s8koHUk1lVi4gvF5vLF3k3yLbnGGVobhQHEKQ2lWMqUpJ3KPTHSo9oal3y+xb7NnO3COhSy3AhNZaZQcgKUfylDGeQq/e4uGf3bMfu+2SGrg60rL8ZAW0heOQUk5APjiqjW41u/C9/wDE9w/+oK9uFrleLrc7q/d7m1PZSUtNpaWktNqByQjHTHIZ55zUqycP2rTqnFWphxDiwCsuvLdJIzjlRPPmeVe2nrBbNNwzCtLKmWilSsb1LOVEDJUSSeQA+AqbrFFFFAUUUUBRRRQFFFFAVGvdmiX+3uwZ4UplZBCkqKVJIOQQocjUqigMzwHwxA4cduciPd5VwefQGlF9KU4Sk55AZyTge7POrpwxY2eIpepkuSVzH0hCm1LCmQMAbgMd8DPXArQ6KDN3fhlAvV9kXeyXyZaH5gAkpaQlQWRyIyORxke6vThvhsOG7e5AuVylXB+Y6h9959KU7inBBSkA5BPTJ761OioooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooCiiigKKKKAooooP/2Q==",
        description: "Premier residential tower offering a mix of luxury apartments and penthouses with panoramic city views.", 
        status: "Ongoing",
        location: "New Capital City",
        type: "Residential",
        units: 450,
        completionDate: "Q4 2025",
        features: ["Infinity Pool", "Sky Lounge", "24/7 Security", "Underground Parking"],
        unitTypes: ["1-Bedroom Apartment", "2-Bedroom Apartment", "3-Bedroom Penthouse"],
        detailedUnits: [],
        galleryImages: [],
    },
    { 
        id: 8, 
        name: "Capital Heights 2", 
        description: "The second phase of the Capital Heights development, expanding on the success of the first with enhanced amenities and designs.", 
        status: "Ongoing",
        location: "New Capital City",
        type: "Residential",
        units: 600,
        completionDate: "Q2 2026",
        features: ["Shared Sports Club", "Kids Area", "Commercial Strip", "Smart Home Ready"],
        unitTypes: ["Studio", "1-Bedroom Apartment", "2-Bedroom Duplex"],
        detailedUnits: [],
        galleryImages: [],
    },
    { 
        id: 1, 
        name: "Sunset Valley Compound", 
        description: "A luxury residential compound featuring modern villas and apartments with extensive green spaces.", 
        status: "Ongoing",
        location: "North Coast",
        type: "Residential",
        units: 250,
        completionDate: "Q3 2025",
        features: ["Private Beach Access", "Clubhouse", "Water Features", "Gated Community"],
        unitTypes: ["2-Bedroom Chalet", "3-Bedroom Villa", "Twin House"],
        detailedUnits: [],
        galleryImages: [],
    },
    { 
        id: 2, 
        name: "Downtown Business Tower", 
        description: "A state-of-the-art commercial high-rise in the heart of the business district, offering premium office spaces.", 
        status: "Ongoing",
        location: "City Center",
        type: "Commercial",
        units: 120,
        completionDate: "Q1 2025",
        features: ["High-speed Elevators", "Conference Center", "Rooftop Cafe", "Valet Parking"],
        unitTypes: ["Small Office (50m²)", "Medium Office (120m²)", "Full Floor (500m²)"],
        detailedUnits: [],
        galleryImages: [],
    },
    { 
        id: 3, 
        name: "Coastal Retail Promenade", 
        description: "A vibrant beachfront shopping and dining destination designed to attract tourists and locals alike.", 
        status: "Planned",
        location: "Red Sea Coast",
        type: "Mixed-Use",
        units: 80,
        completionDate: "Q1 2027",
        features: ["Sea Views", "Outdoor Seating", "Anchor Stores", "Ample Parking"],
        unitTypes: ["Retail Shop", "Food Court Unit", "Anchor Store Space"],
        detailedUnits: [],
        galleryImages: [],
    },
    { 
        id: 4, 
        name: "The Oasis Residences", 
        description: "Completed residential complex known for its family-friendly environment and community amenities.", 
        status: "Completed",
        location: "Sheikh Zayed City",
        type: "Residential",
        units: 800,
        completionDate: "Q2 2022",
        features: ["Community Pools", "Landscaped Gardens", "On-site Supermarket", "24/7 Maintenance"],
        unitTypes: ["Studio Apartment", "1-Bedroom Apartment", "2-Bedroom Apartment", "3-Bedroom Apartment"],
        detailedUnits: [],
        galleryImages: [],
    },
    { 
        id: 5, 
        name: "Tech Park One", 
        description: "A modern technology park providing flexible office solutions for startups and established tech companies.", 
        status: "Completed",
        location: "Smart Village",
        type: "Commercial",
        units: 150,
        completionDate: "Q4 2021",
        features: ["Fiber-optic Internet", "Meeting Rooms", "Incubation Center", "Food Court"],
        unitTypes: ["Co-working Desk", "Private Office", "Custom Office Suite"],
        detailedUnits: [],
        galleryImages: [],
    },
    { 
        id: 6, 
        name: "Cityscape Mall Expansion", 
        description: "An upcoming expansion project to add a new wing with a cinema, food court, and international brands.", 
        status: "Planned",
        location: "6th of October City",
        type: "Commercial",
        units: 50,
        completionDate: "Q3 2026",
        features: ["IMAX Cinema", "International Food Court", "Luxury Brand Outlets", "Multi-level Car Park"],
        unitTypes: ["Inline Store", "Kiosk Space", "Restaurant Unit"],
        detailedUnits: [],
        galleryImages: [],
    },
];


// --- LOCAL STORAGE & DATA HOOKS ---

const useUsers = () => {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        try {
            const storedUsers = localStorage.getItem('app_users');
            if (storedUsers) {
                 const parsedUsers = JSON.parse(storedUsers).map((user: any) => {
                    if (!user.permissions) { // Backwards compatibility for old user format
                        return { 
                            ...user, 
                            permissions: user.role === 'admin' ? allPermissions : ['view_dashboard', 'view_projects'] 
                        };
                    }
                    return user;
                });
                setUsers(parsedUsers);
            } else {
                // Seed with a default admin user if no users exist
                const defaultAdmin: User = { username: 'admin', password: 'password', role: 'admin', permissions: allPermissions };
                localStorage.setItem('app_users', JSON.stringify([defaultAdmin]));
                setUsers([defaultAdmin]);
            }
        } catch (error) {
            console.error("Failed to load users from localStorage", error);
            // Handle potential JSON parsing errors
            const defaultAdmin: User = { username: 'admin', password: 'password', role: 'admin', permissions: allPermissions };
            localStorage.setItem('app_users', JSON.stringify([defaultAdmin]));
            setUsers([defaultAdmin]);
        }
    }, []);

    const updateUserStorage = (updatedUsers: User[]) => {
        localStorage.setItem('app_users', JSON.stringify(updatedUsers));
        setUsers(updatedUsers);
    };

    const addUser = (user: Pick<User, 'username' | 'password'>, permissions: Permission[]) => {
        const newUser: User = { ...user, role: 'user', permissions };
        const updatedUsers = [...users, newUser];
        updateUserStorage(updatedUsers);
    };

    const deleteUser = (username: string) => {
        const updatedUsers = users.filter(user => user.username !== username);
        updateUserStorage(updatedUsers);
    };
    
    const updateUserPermissions = (username: string, permissions: Permission[]) => {
        const updatedUsers = users.map(user => 
            user.username === username ? { ...user, permissions } : user
        );
        updateUserStorage(updatedUsers);
    };
    
    const changePassword = (username: string, currentPass: string, newPass: string): { success: boolean; messageKey: keyof typeof translations['en'] } => {
        const user = users.find(u => u.username === username);

        if (!user) {
            // This case should ideally never be reached if called correctly
            return { success: false, messageKey: 'invalidCredentialsError' };
        }

        if (user.password !== currentPass) {
            return { success: false, messageKey: 'incorrectPasswordError' };
        }

        const updatedUsers = users.map(u => 
            u.username === username ? { ...u, password: newPass } : u
        );
        
        updateUserStorage(updatedUsers);
        return { success: true, messageKey: 'passwordChangedSuccess' };
    };

    return { users, addUser, deleteUser, updateUserPermissions, changePassword };
};

const useProjects = () => {
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        try {
            const storedProjects = localStorage.getItem('app_projects');
            if (storedProjects) {
                setProjects(JSON.parse(storedProjects));
            } else {
                localStorage.setItem('app_projects', JSON.stringify(initialProjects));
                setProjects(initialProjects);
            }
        } catch (error) {
            console.error("Failed to load projects from localStorage", error);
            localStorage.setItem('app_projects', JSON.stringify(initialProjects));
            setProjects(initialProjects);
        }
    }, []);

    const updateProjectStorage = (updatedProjects: Project[]) => {
        localStorage.setItem('app_projects', JSON.stringify(updatedProjects));
        setProjects(updatedProjects);
    };

    const saveProject = (projectToSave: Omit<Project, 'id' | 'detailedUnits'> & { id?: number, logo?: string }) => {
        let updatedProjects;
        if (projectToSave.id) {
            // Update existing project
            updatedProjects = projects.map(p => p.id === projectToSave.id ? { ...p, ...projectToSave } as Project : p);
        } else {
            // Add new project
            const newProject: Project = {
                ...(projectToSave as Omit<Project, 'id' | 'detailedUnits' | 'galleryImages'>),
                id: new Date().getTime(), // Simple unique ID
                detailedUnits: [],
                galleryImages: [],
            };
            updatedProjects = [...projects, newProject];
        }
        updateProjectStorage(updatedProjects);
    };

    const deleteProject = (id: number) => {
        const updatedProjects = projects.filter(p => p.id !== id);
        updateProjectStorage(updatedProjects);
    };

    const addUnitsToProject = (projectId: number, units: UnitData[]) => {
        const updatedProjects = projects.map(p => {
            if (p.id === projectId) {
                return { 
                    ...p, 
                    detailedUnits: units,
                    units: units.length // Also update the total unit count
                };
            }
            return p;
        });
        updateProjectStorage(updatedProjects);
    };
    
    const addGalleryImageToProject = (projectId: number, imageBase64: string) => {
        const updatedProjects = projects.map(p => {
            if (p.id === projectId) {
                const newGalleryImages = [...(p.galleryImages || []), imageBase64];
                return { ...p, galleryImages: newGalleryImages };
            }
            return p;
        });
        updateProjectStorage(updatedProjects);
    };

    const deleteGalleryImageFromProject = (projectId: number, imageIndex: number) => {
        const updatedProjects = projects.map(p => {
            if (p.id === projectId) {
                const newGalleryImages = p.galleryImages ? [...p.galleryImages] : [];
                if (imageIndex >= 0 && imageIndex < newGalleryImages.length) {
                    newGalleryImages.splice(imageIndex, 1);
                }
                return { ...p, galleryImages: newGalleryImages };
            }
            return p;
        });
        updateProjectStorage(updatedProjects);
    };


    return { projects, saveProject, deleteProject, addUnitsToProject, addGalleryImageToProject, deleteGalleryImageFromProject };
};


// --- COMPONENTS ---

interface LoginScreenProps {
    onLogin: (user: string, pass: string) => void;
    error: string | null;
    language: Language;
    onLanguageChange: () => void;
    loginAttempts: number;
}

const LoginScreen: FC<LoginScreenProps> = ({ onLogin, error, language, onLanguageChange, loginAttempts }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isShaking, setIsShaking] = useState(false);
    const t = translations[language];

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onLogin(username, password);
    };
    
    useEffect(() => {
        // Trigger shake only on new failed attempts.
        if (loginAttempts > 0 && error) {
            setIsShaking(true);
            const timer = setTimeout(() => setIsShaking(false), 500); // Match animation duration
            return () => clearTimeout(timer);
        }
    }, [loginAttempts, error]);

    return (
        <div className="login-container">
            <button onClick={onLanguageChange} className="language-switcher-login">
                {language === 'en' ? t.changeToArabic : t.changeToEnglish}
            </button>
            <form onSubmit={handleSubmit} className="login-form">
                <div className="login-header">
                    <i className="fa-solid fa-lock login-icon"></i>
                    <h2>{t.loginTitle}</h2>
                    <p>{t.loginSubtitle}</p>
                </div>
                {error && <div className="login-error">{error}</div>}
                <div className="input-group">
                    <label htmlFor="username">{t.username}</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoComplete="username"
                    />
                </div>
                <div className={`input-group ${isShaking ? 'shake-effect' : ''}`}>
                    <label htmlFor="password">{t.password}</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                    />
                </div>
                <button type="submit" className="login-button">
                    {t.loginButton} <i className="fa-solid fa-arrow-right-to-bracket"></i>
                </button>
            </form>
        </div>
    );
};

interface AppHeaderProps {
    onToggleSidebar: () => void;
    onLogout: () => void;
    onShowChangePassword: () => void;
    currentUser: CurrentUser | null;
    language: Language;
    onLanguageChange: () => void;
}

const AppHeader: FC<AppHeaderProps> = ({ onToggleSidebar, onLogout, onShowChangePassword, currentUser, language, onLanguageChange }) => {
    const t = translations[language];
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header>
            <button onClick={onToggleSidebar} className="menu-toggle" aria-label={t.menu}>
                <i className="fa-solid fa-bars"></i>
            </button>
            <div className="header-title-container">
                <h1><i className="fa-solid fa-building-user"></i> {t.headerTitle}</h1>
                <p>{t.headerSubtitle}</p>
            </div>
            <div className="header-actions">
                <button onClick={onLanguageChange} className="header-lang-button" aria-label="Change Language">
                    {language === 'en' ? t.changeToArabic : t.changeToEnglish}
                </button>
                <div className="profile-menu-container" ref={profileMenuRef}>
                    <button onClick={() => setIsProfileMenuOpen(prev => !prev)} className="profile-menu-button" aria-haspopup="true" aria-expanded={isProfileMenuOpen}>
                        <i className="fa-solid fa-user-circle"></i>
                        <span className="profile-menu-username">{currentUser?.username}</span>
                        <i className={`fa-solid fa-caret-down ${isProfileMenuOpen ? 'open' : ''}`}></i>
                    </button>
                    {isProfileMenuOpen && (
                        <div className="profile-menu-dropdown" role="menu">
                             <button role="menuitem" onClick={() => { onShowChangePassword(); setIsProfileMenuOpen(false); }}>
                                <i className="fa-solid fa-key"></i> {t.changePassword}
                            </button>
                            <button role="menuitem" onClick={onLogout}>
                                <i className="fa-solid fa-right-from-bracket"></i> {t.logout}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: CurrentUser | null;
    onNavigate: (view: 'home' | 'users' | 'projects', resetContext?: boolean) => void;
    filters: Filters;
    sort: Sort;
    searchTerm: string;
    options: {
        buildingTypes: string[];
        ownershipStatuses: string[];
        finishings: string[];
    };
    onFilterChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    onSortChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onClearFilters: () => void;
    hasData: boolean;
    language: Language;
    hasPermission: (permission: Permission) => boolean;
}

const Sidebar: FC<SidebarProps> = ({
    isOpen,
    onClose,
    currentUser,
    onNavigate,
    hasData,
    language,
    hasPermission,
    ...controlProps
}) => {
    const t = translations[language];
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleNavigate = (view: 'home' | 'users' | 'projects') => {
        onNavigate(view, view === 'home');
        onClose(); // Close sidebar on navigation
    };
    
    return (
        <>
            <div className="sidebar-overlay" onClick={onClose}></div>
            <aside className={`sidebar ${isOpen ? 'open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="sidebar-title">
                <div className="sidebar-header">
                    <h3 id="sidebar-title">{t.menu}</h3>
                    <button onClick={onClose} className="close-sidebar-button" aria-label="Close menu">
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>
                <nav className="sidebar-nav">
                    {hasPermission('view_dashboard') && 
                        <button onClick={() => handleNavigate('home')}>
                            <i className="fa-solid fa-table-columns"></i> {t.home}
                        </button>
                    }
                    {hasPermission('view_projects') &&
                        <button onClick={() => handleNavigate('projects')}>
                            <i className="fa-solid fa-briefcase"></i> {t.projects}
                        </button>
                    }
                    {currentUser?.role === 'admin' && (
                        <button onClick={() => handleNavigate('users')}>
                            <i className="fa-solid fa-users-gear"></i> {t.manageUsers}
                        </button>
                    )}
                </nav>
                <div className="sidebar-content">
                    <h4><i className="fa-solid fa-filter"></i> {t.filtersAndControls}</h4>
                    {hasData ? (
                        <Controls {...controlProps} language={language} />
                    ) : (
                        <div className="sidebar-placeholder">
                            {t.uploadToFilter}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}

interface UserManagementPageProps {
    users: User[];
    currentUser: CurrentUser;
    addUser: (user: Pick<User, 'username' | 'password'>, permissions: Permission[]) => void;
    deleteUser: (username: string) => void;
    updateUserPermissions: (username: string, permissions: Permission[]) => void;
    onBackToHome: () => void;
    language: Language;
}

const UserManagementPage: FC<UserManagementPageProps> = ({ users, currentUser, addUser, deleteUser, updateUserPermissions, onBackToHome, language }) => {
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newUserPermissions, setNewUserPermissions] = useState<Permission[]>(['view_dashboard', 'view_projects']);
    const [error, setError] = useState<string | null>(null);
    const t = translations[language];

    const handleAddUser = (e: FormEvent) => {
        e.preventDefault();
        if (!newUsername.trim() || !newPassword.trim()) {
            setError(t.usernameEmptyError);
            return;
        }
        if (users.find(u => u.username === newUsername)) {
            setError(t.userExistsError);
            return;
        }
        addUser({ username: newUsername, password: newPassword }, newUserPermissions);
        setNewUsername('');
        setNewPassword('');
        setNewUserPermissions(['view_dashboard', 'view_projects']);
        setError(null);
    };
    
    const handlePermissionChange = (username: string, permission: Permission, isChecked: boolean) => {
        const targetUser = users.find(u => u.username === username);
        if (!targetUser) return;

        const newPermissions = isChecked
            ? [...targetUser.permissions, permission]
            : targetUser.permissions.filter(p => p !== permission);
        
        updateUserPermissions(username, [...new Set(newPermissions)]); // Use Set to remove duplicates
    };

    const handleNewUserPermissionChange = (permission: Permission, isChecked: boolean) => {
        const newPermissions = isChecked
            ? [...newUserPermissions, permission]
            : newUserPermissions.filter(p => p !== permission);
            
        setNewUserPermissions([...new Set(newPermissions)]);
    };

    return (
        <div className="user-management-container">
            <div className="user-management-header">
                <h2>{t.userManagement}</h2>
                <button onClick={onBackToHome} className="back-button">
                    <i className="fa-solid fa-arrow-left"></i> {t.backToHome}
                </button>
            </div>

            <div className="user-management-content">
                <div className="add-user-form card">
                    <h3>{t.addNewUser}</h3>
                    <form onSubmit={handleAddUser}>
                        {error && <div className="form-error">{error}</div>}
                        <div className="input-group">
                            <label htmlFor="new-username">{t.username}</label>
                            <input
                                id="new-username"
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                placeholder={t.enterUsername}
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="new-password">{t.password}</label>
                            <input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder={t.enterPassword}
                            />
                        </div>
                        <fieldset className="permissions-fieldset">
                            <legend>{t.userPermissions}</legend>
                            <div className="permissions-control">
                                {assignablePermissions.map(p => (
                                     <label key={`new-${p}`} className="permission-label">
                                        <input
                                            type="checkbox"
                                            checked={newUserPermissions.includes(p)}
                                            onChange={(e) => handleNewUserPermissionChange(p, e.target.checked)}
                                        />
                                        {t[`permission_${p as keyof typeof t}`]}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        <button type="submit" className="add-user-button">
                            <i className="fa-solid fa-user-plus"></i> {t.addUser}
                        </button>
                    </form>
                </div>

                <div className="user-list card">
                    <h3>{t.existingUsers}</h3>
                    <ul>
                        {users.map(user => (
                            <li key={user.username}>
                                <div className="user-info">
                                    <span className="user-name"><i className="fa-solid fa-user"></i> {user.username}</span>
                                    <span className={`user-role role-${user.role}`}>{user.role}</span>
                                </div>
                                
                                {user.role !== 'admin' && (
                                    <div className="permissions-control">
                                        {assignablePermissions.map(p => (
                                            <label key={`${user.username}-${p}`} className="permission-label">
                                                <input
                                                    type="checkbox"
                                                    checked={user.permissions.includes(p)}
                                                    onChange={(e) => handlePermissionChange(user.username, p, e.target.checked)}
                                                />
                                                {t[`permission_${p as keyof typeof t}`]}
                                            </label>
                                        ))}
                                    </div>
                                )}
                                
                                {user.username !== currentUser.username && (
                                    <button onClick={() => deleteUser(user.username)} className="delete-user-button" aria-label={`Delete user ${user.username}`}>
                                        <i className="fa-solid fa-trash-can"></i>
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

interface ProjectCardProps {
    project: Project;
    language: Language;
    currentUser: CurrentUser | null;
    hasPermission: (permission: Permission) => boolean;
    onTypeClick?: (type: Project['type']) => void;
    onMoreDetailsClick: (id: number) => void;
    onEditClick: (id: number) => void;
    onDeleteClick: (id: number) => void;
    onViewProjectUnits: (id: number) => void;
}

const ProjectCard: FC<ProjectCardProps> = ({ project, language, currentUser, hasPermission, onTypeClick, onMoreDetailsClick, onEditClick, onDeleteClick, onViewProjectUnits }) => {
    const t = translations[language];

    const getStatusText = (status: Project['status']) => {
        switch (status) {
            case 'Ongoing': return t.ongoing;
            case 'Completed': return t.completed;
            case 'Planned': return t.planned;
            default: return status;
        }
    }
    
    const getTranslatedProjectType = (type: Project['type']) => {
        switch (type) {
            case 'Residential': return t.residential;
            case 'Commercial': return t.commercial;
            case 'Mixed-Use': return t.mixedUse;
            default: return type;
        }
    }

    return (
        <div className="project-card">
            <div className="project-card-header">
                <h3>
                    {project.logo ? (
                        <img src={project.logo} alt={`${project.name} logo`} className="project-card-logo" />
                    ) : (
                        <i className="fa-solid fa-folder-open"></i>
                    )}
                    {project.name}
                </h3>
                <span className={`project-status status-${(project.status || '').toLowerCase()}`}>
                    {getStatusText(project.status)}
                </span>
            </div>
            <p>{project.description}</p>
            
            <div className="project-details">
                <div className="detail-item">
                    <strong><i className="fa-solid fa-map-marker-alt"></i> {t.location}</strong>
                    <span>{project.location}</span>
                </div>
                <div className="detail-item">
                    <strong><i className="fa-solid fa-building-flag"></i> {t.projectType}</strong>
                    {onTypeClick ? (
                        <button className="project-type-link" onClick={() => onTypeClick(project.type)}>
                            {getTranslatedProjectType(project.type)}
                        </button>
                    ) : (
                        <span>{getTranslatedProjectType(project.type)}</span>
                    )}
                </div>
                <div className="detail-item">
                    <strong><i className="fa-solid fa-hashtag"></i> {t.unitsTotal}</strong>
                    <span>{project.units}</span>
                </div>
                <div className="detail-item">
                    <strong><i className="fa-solid fa-calendar-check"></i> {t.estCompletion}</strong>
                    <span>{project.completionDate}</span>
                </div>
            </div>

            <div className="project-features">
                <h4>{t.keyFeatures}</h4>
                <ul>
                    {project.features.map((feature, index) => (
                        <li key={index}><i className="fa-solid fa-check"></i> {feature}</li>
                    ))}
                </ul>
            </div>
            <div className="project-card-footer">
                <div className="project-card-main-actions">
                    <button className="more-details-button" onClick={() => onMoreDetailsClick(project.id)}>
                        {t.moreDetails} <i className="fa-solid fa-arrow-right"></i>
                    </button>
                    <button className="units-details-button" onClick={() => onViewProjectUnits(project.id)}>
                        <i className="fa-solid fa-table-list"></i> {t.unitsDetails}
                    </button>
                </div>
                 {hasPermission('manage_projects') && (
                    <div className="project-admin-actions">
                        <button className="edit-details-button" title={t.editProject} onClick={() => onEditClick(project.id)}>
                            <i className="fa-solid fa-pencil"></i>
                        </button>
                        <button className="delete-button" title={t.removeProject} onClick={() => onDeleteClick(project.id)}>
                            <i className="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

interface ProjectsPageProps {
    projects: Project[];
    language: Language;
    currentUser: CurrentUser | null;
    hasPermission: (permission: Permission) => boolean;
    onTypeClick: (type: Project['type']) => void;
    onMoreDetailsClick: (id: number) => void;
    onEditClick: (id: number) => void;
    onDeleteClick: (id: number) => void;
    onAddNewProject: () => void;
    onNavigateToHome: () => void;
    onViewProjectUnits: (id: number) => void;
}

const ProjectsPage: FC<ProjectsPageProps> = ({ projects, language, currentUser, hasPermission, onTypeClick, onMoreDetailsClick, onEditClick, onDeleteClick, onAddNewProject, onNavigateToHome, onViewProjectUnits }) => {
    const t = translations[language];

    return (
        <div className="projects-page-container">
            <div className="projects-page-header">
                <h2>{t.ourProjects}</h2>
                <div className="page-header-actions">
                    <button onClick={onNavigateToHome} className="home-button">
                        <i className="fa-solid fa-house"></i> {t.home}
                    </button>
                    {hasPermission('manage_projects') && (
                        <button onClick={onAddNewProject} className="add-new-project-button">
                            <i className="fa-solid fa-plus"></i> {t.addNewProject}
                        </button>
                    )}
                </div>
            </div>
            <div className="projects-grid">
                {projects.map(project => (
                    <ProjectCard 
                        key={project.id} 
                        project={project} 
                        language={language}
                        currentUser={currentUser}
                        hasPermission={hasPermission}
                        onTypeClick={onTypeClick}
                        onMoreDetailsClick={onMoreDetailsClick}
                        onEditClick={onEditClick}
                        onDeleteClick={onDeleteClick}
                        onViewProjectUnits={onViewProjectUnits}
                    />
                ))}
            </div>
        </div>
    );
};

interface ProjectTypePageProps {
    projects: Project[];
    projectType: Project['type'];
    language: Language;
    currentUser: CurrentUser | null;
    hasPermission: (permission: Permission) => boolean;
    onBackToProjects: () => void;
    onMoreDetailsClick: (id: number) => void;
    onEditClick: (id: number) => void;
    onDeleteClick: (id: number) => void;
    onNavigateToHome: () => void;
    onViewProjectUnits: (id: number) => void;
}

const ProjectTypePage: FC<ProjectTypePageProps> = ({ projects, projectType, language, currentUser, hasPermission, onBackToProjects, onMoreDetailsClick, onEditClick, onDeleteClick, onNavigateToHome, onViewProjectUnits }) => {
    const t = translations[language];
    const filteredProjects = useMemo(() => projects.filter(p => p.type === projectType), [projects, projectType]);
    
    const getTranslatedProjectType = (type: Project['type']) => {
        switch (type) {
            case 'Residential': return t.residential;
            case 'Commercial': return t.commercial;
            case 'Mixed-Use': return t.mixedUse;
            default: return type;
        }
    }
    
    return (
        <div className="project-type-page-container">
            <div className="project-type-page-header">
                 <h2>{t.projectTypePageTitle.replace('{type}', getTranslatedProjectType(projectType))}</h2>
                 <div className="page-header-actions">
                    <button onClick={onNavigateToHome} className="home-button">
                        <i className="fa-solid fa-house"></i> {t.home}
                    </button>
                    <button onClick={onBackToProjects} className="back-to-projects-button">
                        <i className="fa-solid fa-arrow-left"></i> {t.backToAllProjects}
                    </button>
                 </div>
            </div>
            <div className="projects-grid">
                {filteredProjects.map(project => (
                    <ProjectCard 
                        key={project.id} 
                        project={project} 
                        language={language} 
                        currentUser={currentUser}
                        hasPermission={hasPermission}
                        onMoreDetailsClick={onMoreDetailsClick}
                        onEditClick={onEditClick}
                        onDeleteClick={onDeleteClick}
                        onViewProjectUnits={onViewProjectUnits}
                    />
                ))}
            </div>
        </div>
    );
}

// Helper function to normalize headers from Excel files
const normalizeDataKeys = (data: any[]): UnitData[] => {
    // A map from various possible header names (lowercase, no spaces/symbols) to the canonical key in UnitData
    const keyMap: { [key: string]: keyof UnitData } = {
        'unitcode': 'Unit Code',
        'buildingtype': 'Building Type',
        'floor': 'Floor',
        'area': 'Area',
        'aream2': 'Area', // Handles 'Area (m²)', 'Area m2', etc.
        'ownershipstatus': 'Ownership Status',
        'zone': 'Zone',
        'rooms': 'Rooms',
        'building': 'Building',
        'type': 'Type',
        'floorstatus': 'Floor Status',
        'category': 'Category',
        'views': 'Views',
        'meterprice': 'Meter Price',
        'unitstatus': 'Unit Status',
        
        // Aliases for Finishing
        'finishing': 'Finishing',
        'finishingstatus': 'Finishing',
        'finishingsituation': 'Finishing',


        // Aliases for Garage
        'garage': 'Garage',
        'garagestatus': 'Garage',
        'garageavailable': 'Garage',

        // Aliases for Finishing Situation
        'unitsfinishingsituationsite': 'Units finishing situation (Site)',
        'finishingsituationsite': 'Units finishing situation (Site)',
        'situationfinishing': 'Units finishing situation (Site)',
    };

    return data.map(row => {
        const newRow: { [key: string]: any } = {};
        for (const key in row) {
            if (Object.prototype.hasOwnProperty.call(row, key)) {
                // Normalize by removing spaces, non-alphanumeric chars, and making it lowercase
                const normalizedKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                const canonicalKey = keyMap[normalizedKey];
                
                if (canonicalKey) {
                    // If a canonical key exists, use it. This is now much more robust.
                    newRow[canonicalKey] = row[key];
                } else {
                    // if no mapping is found, keep the original (trimmed) key.
                    // This preserves any extra columns from the Excel file.
                    newRow[key.trim()] = row[key];
                }
            }
        }
        return newRow as UnitData;
    });
};


interface ProjectDetailPageProps {
    projects: Project[];
    projectId: number;
    language: Language;
    currentUser: CurrentUser | null;
    hasPermission: (permission: Permission) => boolean;
    onBackToProjects: () => void;
    onViewProjectUnits: (id: number) => void;
    onAddUnitsToProject: (projectId: number, units: UnitData[]) => void;
    addGalleryImageToProject: (projectId: number, imageBase64: string) => void;
    deleteGalleryImageFromProject: (projectId: number, imageIndex: number) => void;
    showNotification: (message: string, type: 'success' | 'error') => void;
    onEditClick: (id: number) => void;
    onDeleteClick: (id: number) => void;
    onNavigateToHome: () => void;
}

const ProjectDetailPage: FC<ProjectDetailPageProps> = ({ projects, projectId, language, currentUser, hasPermission, onBackToProjects, onViewProjectUnits, onAddUnitsToProject, addGalleryImageToProject, deleteGalleryImageFromProject, showNotification, onEditClick, onDeleteClick, onNavigateToHome }) => {
    const t = translations[language];
    const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const unitFileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && project) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.result) {
                    addGalleryImageToProject(project.id, reader.result as string);
                    showNotification("Image uploaded successfully!", 'success');
                } else {
                    showNotification("Failed to read image file.", 'error');
                }
            };
            reader.readAsDataURL(file);
        }
        if(e.target) e.target.value = ''; // Reset file input
    };

    const handleUnitFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !project) return;
        const file = e.target.files[0];

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const fileData = event.target?.result;
                if (!fileData) throw new Error(t.fileReadError);
                
                const workbook = XLSX.read(fileData, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const rawJsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

                const jsonData = normalizeDataKeys(rawJsonData);

                // Basic validation on normalized data
                if (jsonData.length === 0 || !jsonData[0]['Unit Code'] || jsonData[0]['Area'] === undefined) {
                    throw new Error(t.invalidFormatError);
                }
                
                onAddUnitsToProject(projectId, jsonData);

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
                showNotification(errorMessage, 'error');
            }
        };
        reader.onerror = () => {
             showNotification(t.fileReadError, 'error');
        }
        reader.readAsBinaryString(file);
        
        if (e.target) e.target.value = '';
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    if (!project) {
        return (
            <div className="status-message error-message">Project not found.</div>
        );
    }

    const { id, name, description, status, location, type, units, completionDate, features, unitTypes, detailedUnits, galleryImages } = project;
    
    const getStatusText = (status: Project['status']) => {
        switch (status) {
            case 'Ongoing': return t.ongoing;
            case 'Completed': return t.completed;
            case 'Planned': return t.planned;
            default: return status;
        }
    }
    
    const getTranslatedProjectType = (type: Project['type']) => {
        switch (type) {
            case 'Residential': return t.residential;
            case 'Commercial': return t.commercial;
            case 'Mixed-Use': return t.mixedUse;
            default: return type;
        }
    }

    return (
        <div className="project-detail-page-container">
            <div className="project-detail-header">
                <div className="project-detail-title">
                    {project.logo && <img src={project.logo} alt={`${project.name} logo`} className="project-detail-logo" />}
                    <h2>{name}</h2>
                </div>
                <div className="page-header-actions">
                    <button onClick={onNavigateToHome} className="home-button">
                        <i className="fa-solid fa-house"></i> {t.home}
                    </button>
                    {hasPermission('manage_projects') && (
                        <>
                            <button className="edit-details-button" onClick={() => onEditClick(id)}>
                                <i className="fa-solid fa-pencil"></i> {t.editProject}
                            </button>
                            <button className="delete-button" onClick={() => onDeleteClick(id)}>
                                <i className="fa-solid fa-trash-can"></i> {t.removeProject}
                            </button>
                        </>
                    )}
                    <button onClick={onBackToProjects} className="back-to-projects-button">
                        <i className="fa-solid fa-arrow-left"></i> {t.backToAllProjects}
                    </button>
                </div>
            </div>
            <div className="project-detail-content">
                <div className="project-main-details">
                    <div className="card">
                        <span className={`project-status status-${(status || '').toLowerCase()}`}>
                            {getStatusText(status)}
                        </span>
                        <p className="project-description">{description}</p>
                        <div className="project-details">
                             <div className="detail-item">
                                <strong><i className="fa-solid fa-map-marker-alt"></i> {t.location}</strong>
                                <span>{location}</span>
                            </div>
                            <div className="detail-item">
                                <strong><i className="fa-solid fa-building-flag"></i> {t.projectType}</strong>
                                <span>{getTranslatedProjectType(type)}</span>
                            </div>
                            <div className="detail-item">
                                <strong><i className="fa-solid fa-hashtag"></i> {t.unitsTotal}</strong>
                                <span>{units}</span>
                            </div>
                            <div className="detail-item">
                                <strong><i className="fa-solid fa-calendar-check"></i> {t.estCompletion}</strong>
                                <span>{completionDate}</span>
                            </div>
                        </div>
                        <div className="project-features">
                            <h4>{t.keyFeatures}</h4>
                            <ul>
                                {features.map((feature, index) => (
                                    <li key={index}><i className="fa-solid fa-check"></i> {feature}</li>
                                ))}
                            </ul>
                        </div>
                        {unitTypes && unitTypes.length > 0 && (
                            <div className="project-features">
                                <h4>{t.unitTypes}</h4>
                                <ul>
                                    {unitTypes.map((type, index) => (
                                        <li key={index}><i className="fa-solid fa-tag"></i> {type}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
                <div className="project-detail-gallery-map">
                    <div className="card">
                        <div className="card-header">
                            <h3>{t.gallery}</h3>
                            {hasPermission('manage_projects') && (
                                <>
                                    <button className="upload-gallery-button" onClick={triggerFileUpload} aria-label="Upload image">
                                        <i className="fa-solid fa-upload"></i> {t.upload}
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        aria-hidden="true"
                                    />
                                </>
                            )}
                        </div>
                        <div className="project-image-gallery">
                            {galleryImages && galleryImages.length > 0 ? (
                                <div className="gallery-grid">
                                    {galleryImages.map((imgSrc, index) => (
                                        <div key={index} className="gallery-item">
                                            <img src={imgSrc} alt={`Gallery image ${index + 1}`} />
                                            {hasPermission('manage_projects') && (
                                                <button
                                                    className="delete-gallery-image-button"
                                                    onClick={() => deleteGalleryImageFromProject(project.id, index)}
                                                    title="Delete Image"
                                                >
                                                    <i className="fa-solid fa-trash-can"></i>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="gallery-empty-placeholder">
                                    <i className="fa-solid fa-images"></i>
                                    <span>No images in gallery.</span>
                                </div>
                            )}
                        </div>
                    </div>
                     <div className="card">
                        <h3>{t.unitDetails}</h3>
                        <div className="unit-details-content">
                            {detailedUnits && detailedUnits.length > 0 ? (
                                <>
                                    <p>{t.projectHasUnits.replace('{count}', detailedUnits.length.toString())}</p>
                                    <button className="view-units-button" onClick={() => onViewProjectUnits(id)}>
                                        <i className="fa-solid fa-table-list"></i> {t.unitsDetails}
                                    </button>
                                </>
                            ) : (
                                <p>{t.noProjectUnits}</p>
                            )}

                            {hasPermission('manage_projects') && (
                                <div className="upload-units-section">
                                    <button className="upload-units-button" onClick={() => unitFileInputRef.current?.click()}>
                                        <i className="fa-solid fa-file-upload"></i> {t.uploadUnits}
                                    </button>
                                    <input
                                        type="file"
                                        ref={unitFileInputRef}
                                        onChange={handleUnitFileUpload}
                                        accept=".xlsx, .xls"
                                        style={{ display: 'none' }}
                                        aria-hidden="true"
                                    />
                                    <small>{t.uploadUnitsHelper}</small>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="card">
                        <h3>{t.map}</h3>
                        <div className="project-location-map">
                            <i className="fa-solid fa-map-location-dot"></i>
                            <span>Interactive map coming soon</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Specific interface for the project edit form to handle input types correctly
interface ProjectFormData {
    id?: number;
    name?: string;
    logo?: string;
    description?: string;
    status?: 'Ongoing' | 'Completed' | 'Planned';
    location?: string;
    type?: 'Residential' | 'Commercial' | 'Mixed-Use';
    units?: number | string;
    completionDate?: string;
    features?: string;
    unitTypes?: string;
}

interface ProjectEditModalProps {
    project: Partial<Project> | null;
    onSave: (project: Omit<Project, 'id' | 'detailedUnits'> & { id?: number; logo?: string }) => void;
    onClose: () => void;
    language: Language;
}

const ProjectEditModal: FC<ProjectEditModalProps> = ({ project, onSave, onClose, language }) => {
    const t = translations[language];
    const [formData, setFormData] = useState<ProjectFormData>({});
    const [error, setError] = useState('');
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [isDraggingLogo, setIsDraggingLogo] = useState(false);

    useEffect(() => {
        const isEditing = project && project.id;

        const initialData: ProjectFormData = isEditing ? {
            id: project.id,
            name: project.name || '',
            logo: project.logo || '',
            description: project.description || '',
            status: project.status || 'Planned',
            location: project.location || '',
            type: project.type || 'Residential',
            units: project.units || 0,
            completionDate: project.completionDate || '',
            features: project.features?.join(', ') || '',
            unitTypes: project.unitTypes?.join(', ') || ''
        } : {
            name: '',
            logo: '',
            description: '',
            status: 'Planned',
            location: '',
            type: 'Residential',
            units: 0,
            completionDate: '',
            features: '',
            unitTypes: ''
        };

        setFormData(initialData);
    }, [project]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };
    
    const processLogoFile = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processLogoFile(e.target.files[0]);
        }
    };

    const handleRemoveLogo = () => {
        setFormData(prev => ({ ...prev, logo: '' }));
        if (logoInputRef.current) {
            logoInputRef.current.value = '';
        }
    };

    const handleLogoDragEvents = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDraggingLogo(true);
        } else if (e.type === 'dragleave') {
            setIsDraggingLogo(false);
        }
    };

    const handleLogoDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingLogo(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processLogoFile(e.dataTransfer.files[0]);
        }
    };


    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const { name, description, location, completionDate, units, status, type, id, logo } = formData;
        
        if (!name || !description || !location || !completionDate || !units) {
            setError(t.formErrors);
            return;
        }

        const featuresArray = formData.features
            ? formData.features.split(',').map(f => f.trim()).filter(Boolean)
            : [];
        
        const unitTypesArray = formData.unitTypes
            ? formData.unitTypes.split(',').map(f => f.trim()).filter(Boolean)
            : [];
            
        const projectToSave = {
            id,
            logo,
            name,
            description,
            status: status || 'Planned',
            location,
            type: type || 'Residential',
            units: Number(units),
            completionDate,
            features: featuresArray,
            unitTypes: unitTypesArray,
        };

        onSave(projectToSave);
        setError('');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="project-edit-modal card" onClick={e => e.stopPropagation()}>
                <h3>{project?.id ? t.editProject : t.addNewProject}</h3>
                <form onSubmit={handleSubmit} noValidate>
                    {error && <div className="form-error">{error}</div>}
                    <div className="input-group">
                        <label htmlFor="name">{t.projectName}</label>
                        <input type="text" id="name" name="name" value={formData.name || ''} onChange={handleChange} required />
                    </div>
                     <div className="input-group">
                        <label htmlFor="logo-upload">{t.projectLogo}</label>
                        <div 
                            className={`logo-upload-section ${isDraggingLogo ? 'drag-over' : ''}`}
                            onDrop={handleLogoDrop}
                            onDragEnter={handleLogoDragEvents}
                            onDragOver={handleLogoDragEvents}
                            onDragLeave={handleLogoDragEvents}
                        >
                            {formData.logo ? (
                                <img src={formData.logo} alt="Project Logo Preview" className="logo-preview" />
                            ) : (
                                <div className="logo-placeholder"><i className="fa-solid fa-image"></i></div>
                            )}
                            <div className="logo-upload-controls">
                                <input
                                    type="file"
                                    ref={logoInputRef}
                                    onChange={handleLogoChange}
                                    accept="image/png, image/jpeg, image/gif"
                                    style={{ display: 'none' }}
                                    id="logo-upload"
                                />
                                <button type="button" className="upload-button" onClick={() => logoInputRef.current?.click()}>
                                    <i className="fa-solid fa-upload"></i> {t.upload}
                                </button>
                                {formData.logo && (
                                    <button type="button" className="remove-button" onClick={handleRemoveLogo}>
                                        <i className="fa-solid fa-trash-can"></i> {t.remove}
                                    </button>
                                )}
                            </div>
                        </div>
                        <small className="logo-upload-helper">{t.logoUploadHelper}</small>
                    </div>
                     <div className="input-group">
                        <label htmlFor="description">{t.description}</label>
                        <textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} required rows={3}></textarea>
                    </div>
                    <div className="form-grid">
                        <div className="input-group">
                            <label htmlFor="status">{t.status}</label>
                            <select id="status" name="status" value={formData.status || 'Planned'} onChange={handleChange}>
                                <option value="Planned">{t.planned}</option>
                                <option value="Ongoing">{t.ongoing}</option>
                                <option value="Completed">{t.completed}</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label htmlFor="type">{t.projectType}</label>
                            <select id="type" name="type" value={formData.type || 'Residential'} onChange={handleChange}>
                                <option value="Residential">{t.residential}</option>
                                <option value="Commercial">{t.commercial}</option>
                                <option value="Mixed-Use">{t.mixedUse}</option>
                            </select>
                        </div>
                         <div className="input-group">
                            <label htmlFor="location">{t.location}</label>
                            <input type="text" id="location" name="location" value={formData.location || ''} onChange={handleChange} required />
                        </div>
                        <div className="input-group">
                            <label htmlFor="units">{t.unitsTotal}</label>
                            <input type="number" id="units" name="units" value={formData.units || 0} onChange={handleChange} required />
                        </div>
                        <div className="input-group">
                            <label htmlFor="completionDate">{t.estCompletion}</label>
                            <input type="text" id="completionDate" name="completionDate" value={formData.completionDate || ''} onChange={handleChange} required placeholder="e.g., Q4 2025" />
                        </div>
                    </div>
                     <div className="input-group">
                        <label htmlFor="features">{t.featuresCommaSeparated}</label>
                        <textarea id="features" name="features" value={formData.features || ''} onChange={handleChange} rows={2}></textarea>
                    </div>
                     <div className="input-group">
                        <label htmlFor="unitTypes">{t.unitTypesCommaSeparated}</label>
                        <textarea id="unitTypes" name="unitTypes" value={formData.unitTypes || ''} onChange={handleChange} rows={2}></textarea>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="cancel-button" onClick={onClose}>{t.cancel}</button>
                        <button type="submit" className="save-button">{t.saveChanges}</button>
                    </div>
                </form>
            </div>
        </div>
    )
};

interface ConfirmationModalProps {
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    language: Language;
}

const ConfirmationModal: FC<ConfirmationModalProps> = ({ onClose, onConfirm, title, message, language }) => {
    const t = translations[language];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="confirm-modal card" onClick={e => e.stopPropagation()}>
                <h3>{title}</h3>
                <p className="confirm-message">{message}</p>
                <div className="modal-actions">
                    <button type="button" className="cancel-button" onClick={onClose}>{t.cancel}</button>
                    <button type="button" className="delete-button" onClick={onConfirm}>{t.remove}</button>
                </div>
            </div>
        </div>
    );
};

interface ChangePasswordModalProps {
    onClose: () => void;
    onChangePassword: (currentPass: string, newPass: string) => { success: boolean; message: string };
    language: Language;
}

const ChangePasswordModal: FC<ChangePasswordModalProps> = ({ onClose, onChangePassword, language }) => {
    const t = translations[language];
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setError(t.formErrors);
            return;
        }
        if (newPassword.length < 6) {
            setError(t.passwordMinLengthError);
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setError(t.passwordMismatchError);
            return;
        }

        const result = onChangePassword(currentPassword, newPassword);

        if (!result.success) {
            setError(result.message);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="project-edit-modal card" onClick={e => e.stopPropagation()}>
                <h3>{t.changePassword}</h3>
                <form onSubmit={handleSubmit} noValidate>
                    {error && <div className="form-error">{error}</div>}
                    <div className="input-group">
                        <label htmlFor="current-password">{t.currentPassword}</label>
                        <input type="password" id="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
                    </div>
                    <div className="input-group">
                        <label htmlFor="new-password">{t.newPassword}</label>
                        <input type="password" id="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" />
                    </div>
                    <div className="input-group">
                        <label htmlFor="confirm-new-password">{t.confirmNewPassword}</label>
                        <input type="password" id="confirm-new-password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required autoComplete="new-password" />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="cancel-button" onClick={onClose}>{t.cancel}</button>
                        <button type="submit" className="save-button">{t.saveChanges}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface NotificationProps {
    notification: { message: string; type: 'success' | 'error' } | null;
    onClear: () => void;
}

const Notification: FC<NotificationProps> = ({ notification, onClear }) => {
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(onClear, 4000);
            return () => clearTimeout(timer);
        }
    }, [notification, onClear]);

    if (!notification) return null;

    return (
        <div className={`notification-bar ${notification.type} show`} role="alert">
            <p>{notification.message}</p>
            <button onClick={onClear} className="close-notification-button" aria-label="Close notification">&times;</button>
        </div>
    );
};


const App: FC = () => {
  const { users, addUser, deleteUser, updateUserPermissions, changePassword } = useUsers();
  const { projects, saveProject, deleteProject, addUnitsToProject, addGalleryImageToProject, deleteGalleryImageFromProject } = useProjects();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [view, setView] = useState<'login' | 'home' | 'users' | 'projects' | 'projectType' | 'projectDetail'>('login');
  const [selectedProjectType, setSelectedProjectType] = useState<Project['type'] | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [data, setData] = useState<UnitData[]>([]);
  const [unitViewContext, setUnitViewContext] = useState<UnitViewContext>({ source: 'global' });
  const [filters, setFilters] = useState<Filters>({
    buildingType: 'all',
    ownershipStatus: 'all',
    finishing: 'all',
  });
  const [sort, setSort] = useState<Sort>({ key: 'Area', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [language, setLanguage] = useState<Language>(
    () => (localStorage.getItem('app_language') as Language) || 'en'
  );
  
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const t = translations[language];

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('app_language', language);
  }, [language]);

  const hasPermission = useCallback((permission: Permission): boolean => {
      if (!currentUser) return false;
      if (currentUser.role === 'admin') return true; // Admin has all permissions
      return currentUser.permissions.includes(permission);
  }, [currentUser]);

  useEffect(() => {
      if (!currentUser || view === 'login') return;

      const viewAllowed = 
          (view === 'home' && hasPermission('view_dashboard')) ||
          ((view === 'projects' || view === 'projectType' || view === 'projectDetail') && hasPermission('view_projects')) ||
          (view === 'users' && currentUser.role === 'admin');

      if (!viewAllowed) {
          // If current view is not allowed, find the first one that is and redirect.
          if (hasPermission('view_dashboard')) setView('home');
          else if (hasPermission('view_projects')) setView('projects');
          else if (currentUser.role === 'admin') setView('users');
          else {
              // This should theoretically not be reached due to login checks, but it's a safe fallback.
              handleLogout();
          }
      }
  }, [view, currentUser, hasPermission]);


  const handleLanguageChange = () => {
    setLanguage(prev => (prev === 'en' ? 'ar' : 'en'));
  };

  const handleLogin = (username: string, pass: string) => {
    setLoginAttempts(prev => prev + 1);
    const user = users.find(u => u.username === username);
    if (user && user.password === pass) {
      const tempUser: CurrentUser = { username: user.username, role: user.role, permissions: user.permissions };
      
      const canViewDashboard = tempUser.role === 'admin' || tempUser.permissions.includes('view_dashboard');
      const canViewProjects = tempUser.role === 'admin' || tempUser.permissions.includes('view_projects');

      if (!canViewDashboard && !canViewProjects && tempUser.role !== 'admin') {
          setLoginError(t.noAccessError);
          return;
      }
      
      setIsAuthenticated(true);
      setCurrentUser(tempUser);
      
      if (canViewDashboard) setView('home');
      else if (canViewProjects) setView('projects');
      else if (tempUser.role === 'admin') setView('users');

      setLoginError(null);
    } else {
      setLoginError(t.invalidCredentialsError);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setView('login');
    setIsSidebarOpen(false);
    // Reset app state for a clean session next time
    setData([]);
    setFilters({ buildingType: 'all', ownershipStatus: 'all', finishing: 'all' });
    setSort({ key: 'Area', direction: 'desc' });
    setSearchTerm('');
    setIsLoading(false);
    setError(null);
    setSelectedProjectType(null);
    setSelectedProjectId(null);
    setLoginError(null);
    setLoginAttempts(0);
    setUnitViewContext({ source: 'global' });
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  };
    
  const handlePasswordChange = (currentPass: string, newPass: string): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: "Not logged in" };
    
    const result = changePassword(currentUser.username, currentPass, newPass);
    const translatedMessage = t[result.messageKey] || result.messageKey;

    if (result.success) {
        showNotification(translatedMessage, 'success');
        setIsChangePasswordModalOpen(false);
        return { success: true, message: translatedMessage };
    } else {
        return { success: false, message: translatedMessage };
    }
  };

  const handleOpenProjectModal = (projectId?: number) => {
      if (projectId) {
          const projectToEdit = projects.find(p => p.id === projectId);
          setEditingProject(projectToEdit || null);
      } else {
          setEditingProject({}); // For new project
      }
      setIsProjectModalOpen(true);
  };
  const handleCloseProjectModal = () => {
      setIsProjectModalOpen(false);
      setEditingProject(null);
  };

  const handleSaveProject = (project: Omit<Project, 'id' | 'detailedUnits'> & { id?: number; logo?: string }) => {
      saveProject(project);
      handleCloseProjectModal();
  }

 const handleOpenConfirmDeleteModal = (id: number) => {
     setProjectToDelete(id);
     setIsConfirmModalOpen(true);
 };

 const handleCloseConfirmDeleteModal = () => {
     setProjectToDelete(null);
     setIsConfirmModalOpen(false);
 };

 const handleConfirmDelete = () => {
     if (projectToDelete !== null) {
         deleteProject(projectToDelete);
         // If we were on the detail page of the deleted project, navigate back
         if (view === 'projectDetail' && selectedProjectId === projectToDelete) {
             setView('projects');
             setSelectedProjectId(null);
         }
         // If we were viewing units of the deleted project, navigate home
         if (unitViewContext.source === 'project' && unitViewContext.projectId === projectToDelete) {
             setUnitViewContext({ source: 'global' });
             setView('home');
         }
     }
     handleCloseConfirmDeleteModal();
 };

  const handleProjectTypeClick = (type: Project['type']) => {
      setSelectedProjectType(type);
      setView('projectType');
  };

  const handleMoreDetailsClick = (id: number) => {
      setSelectedProjectId(id);
      setView('projectDetail');
  };
  
    const handleNavigation = (view: 'home' | 'users' | 'projects', resetContext?: boolean) => {
        if (resetContext) {
            setUnitViewContext({ source: 'global' });
        }
        setView(view);
    };

    const handleBackToProjectDetail = (id: number) => {
        setSelectedProjectId(id);
        setView('projectDetail');
    };

    const handleViewProjectUnits = (id: number) => {
        setUnitViewContext({ source: 'project', projectId: id });
        setView('home');
    };

    const handleAddUnitsToProject = (projectId: number, units: UnitData[]) => {
        addUnitsToProject(projectId, units);
        const message = t.uploadSuccess.replace('{count}', units.length.toString());
        showNotification(message, 'success');
    };

  const handleFileUpload = (file: File) => {
    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileData = e.target?.result;
        if (!fileData) {
            throw new Error(t.fileReadError);
        }
        const workbook = XLSX.read(fileData, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        const jsonData = normalizeDataKeys(rawJsonData);

        // Basic validation on normalized data
        if (jsonData.length === 0 || !jsonData[0]['Unit Code'] || jsonData[0]['Area'] === undefined) {
            throw new Error(t.invalidFormatError);
        }

        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred during file processing.');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
        setError(t.fileReadError);
        setIsLoading(false);
    }
    reader.readAsBinaryString(file);
  };
  
  const dashboardData = useMemo(() => {
    if (unitViewContext.source === 'project') {
        const project = projects.find(p => p.id === unitViewContext.projectId);
        return project?.detailedUnits || [];
    }
    return data;
  }, [unitViewContext, projects, data]);


  const handleUnitUpdate = (unitCode: string, field: keyof UnitData, value: string | number) => {
    const updater = (units: UnitData[]): UnitData[] =>
      units.map(unit => {
        if (unit['Unit Code'] === unitCode) {
          // Try to preserve number type for specific fields
          const keysToKeepAsNumbers: (keyof UnitData)[] = ['Floor', 'Area', 'Meter Price', 'Rooms'];
          const finalValue =
            keysToKeepAsNumbers.includes(field) && typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== ''
              ? Number(value)
              : value;
          return { ...unit, [field]: finalValue };
        }
        return unit;
      });

    if (unitViewContext.source === 'project') {
      const projectId = unitViewContext.projectId;
      const project = projects.find(p => p.id === projectId);
      if (project && project.detailedUnits) {
        const updatedUnits = updater(project.detailedUnits);
        // This function saves to localStorage
        addUnitsToProject(projectId, updatedUnits);
      }
    } else {
      // This is an in-memory update for global data
      setData(updater(data));
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...dashboardData];

    // Search
    if (searchTerm) {
        result = result.filter(item =>
            (item['Unit Code'] || '').toString().toLowerCase().includes(searchTerm.toLowerCase().trim())
        );
    }

    // Filtering
    result = result.filter(item => {
      const { buildingType, ownershipStatus, finishing } = filters;
      const buildingMatch = buildingType === 'all' || item['Building Type'] === buildingType;
      const statusMatch = ownershipStatus === 'all' || item['Ownership Status'] === ownershipStatus;
      const finishingMatch = finishing === 'all' || item['Finishing'] === finishing;
      return buildingMatch && statusMatch && finishingMatch;
    });

    // Sorting
    result.sort((a, b) => {
        const valA = a[sort.key] || 0;
        const valB = b[sort.key] || 0;
        if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    return result;
  }, [dashboardData, filters, sort, searchTerm]);

  const filterOptions = useMemo(() => {
    const buildingTypes = [...new Set(dashboardData.map(item => item['Building Type']))].filter(Boolean) as string[];
    const ownershipStatuses = [...new Set(dashboardData.map(item => item['Ownership Status']))].filter(Boolean) as string[];
    const finishings = [...new Set(dashboardData.map(item => item['Finishing']))].filter(Boolean) as string[];
    return { buildingTypes, ownershipStatuses, finishings };
  }, [dashboardData]);

  const handleFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
      const [key, direction] = e.target.value.split('-') as [Sort['key'], Sort['direction']];
      setSort({ key, direction });
  }

  const clearFilters = () => {
      setFilters({ buildingType: 'all', ownershipStatus: 'all', finishing: 'all' });
      setSearchTerm('');
      setSort({ key: 'Area', direction: 'desc' });
  }

  const renderView = () => {
    switch(view) {
        case 'home': {
            const isProjectView = unitViewContext.source === 'project';
            const projectForUnits = isProjectView ? projects.find(p => p.id === unitViewContext.projectId) : null;

            return (
                <>
                    <div className="dashboard-header">
                        <h2>{isProjectView && projectForUnits ? t.projectDashboard.replace('{projectName}', projectForUnits.name) : t.globalDashboard}</h2>
                        {isProjectView && projectForUnits && (
                            <button onClick={() => handleBackToProjectDetail(projectForUnits.id)} className="back-button">
                                <i className="fa-solid fa-arrow-left"></i> {t.backToProject}
                            </button>
                        )}
                    </div>
                    {!isProjectView && <FileUploader onFileUpload={handleFileUpload} language={language} />}
                    {isLoading && <div className="status-message">{t.processingFile} <i className="fa-solid fa-spinner fa-spin"></i></div>}
                    {error && <div className="status-message error-message">{error}</div>}
                    
                    {dashboardData.length > 0 && (
                        <>
                          <DashboardSummary data={dashboardData} language={language} />
                          <div className="results-count">
                              {t.showingResults} <strong>{filteredAndSortedData.length}</strong> {t.of} <strong>{dashboardData.length}</strong> {t.units}.
                          </div>
                          <UnitTable 
                            units={filteredAndSortedData} 
                            language={language}
                            onUnitUpdate={handleUnitUpdate}
                            canEdit={hasPermission('manage_projects')}
                          />
                          {filteredAndSortedData.length === 0 && !searchTerm && <div className="status-message">{t.noMatch}</div>}
                        </>
                    )}
                     {(dashboardData.length === 0 || (filteredAndSortedData.length === 0 && searchTerm)) && (
                      <div className="status-message">
                          {!isLoading && !error && (
                            <>
                              {isProjectView && <p>{t.noProjectUnits}</p>}
                              {!isProjectView && <p>{t.uploadPrompt}</p>}
                              {filteredAndSortedData.length === 0 && searchTerm && <p>{t.noMatch}</p>}
                            </>
                          )}
                      </div>
                    )}
                </>
            );
        }
        case 'users':
            return currentUser ? <UserManagementPage 
              users={users} 
              currentUser={currentUser} 
              addUser={addUser} 
              deleteUser={deleteUser}
              updateUserPermissions={updateUserPermissions}
              onBackToHome={() => setView('home')}
              language={language}
            /> : null;
        case 'projects':
            return <ProjectsPage 
                projects={projects} 
                language={language} 
                currentUser={currentUser}
                hasPermission={hasPermission}
                onTypeClick={handleProjectTypeClick} 
                onMoreDetailsClick={handleMoreDetailsClick}
                onEditClick={handleOpenProjectModal}
                onDeleteClick={handleOpenConfirmDeleteModal}
                onAddNewProject={() => handleOpenProjectModal()}
                onNavigateToHome={() => setView('home')}
                onViewProjectUnits={handleViewProjectUnits}
             />;
        case 'projectType':
            return selectedProjectType ? <ProjectTypePage 
                projects={projects}
                projectType={selectedProjectType}
                language={language}
                currentUser={currentUser}
                hasPermission={hasPermission}
                onBackToProjects={() => setView('projects')}
                onMoreDetailsClick={handleMoreDetailsClick}
                onEditClick={handleOpenProjectModal}
                onDeleteClick={handleOpenConfirmDeleteModal}
                onNavigateToHome={() => setView('home')}
                onViewProjectUnits={handleViewProjectUnits}
            /> : null;
        case 'projectDetail':
            return selectedProjectId ? <ProjectDetailPage
                projects={projects}
                projectId={selectedProjectId}
                language={language}
                currentUser={currentUser}
                hasPermission={hasPermission}
                onBackToProjects={() => setView('projects')}
                onViewProjectUnits={handleViewProjectUnits}
                onAddUnitsToProject={handleAddUnitsToProject}
                addGalleryImageToProject={addGalleryImageToProject}
                deleteGalleryImageFromProject={deleteGalleryImageFromProject}
                showNotification={showNotification}
                onEditClick={handleOpenProjectModal}
                onDeleteClick={handleOpenConfirmDeleteModal}
                onNavigateToHome={() => setView('home')}
            /> : null;
        default:
            return null;
    }
  }

  if (view === 'login') {
    return <LoginScreen 
        onLogin={handleLogin} 
        error={loginError} 
        language={language} 
        onLanguageChange={handleLanguageChange}
        loginAttempts={loginAttempts}
    />;
  }
  
  return (
    <>
      <Notification notification={notification} onClear={() => setNotification(null)} />
      <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentUser={currentUser}
          onNavigate={handleNavigation}
          hasData={dashboardData.length > 0}
          filters={filters}
          sort={sort}
          searchTerm={searchTerm}
          options={filterOptions}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          onClearFilters={clearFilters}
          language={language}
          hasPermission={hasPermission}
      />
      {isConfirmModalOpen && (
        <ConfirmationModal
            onClose={handleCloseConfirmDeleteModal}
            onConfirm={handleConfirmDelete}
            title={t.confirmRemoval}
            message={t.confirmRemovalMessage}
            language={language}
        />
      )}
      {isProjectModalOpen && hasPermission('manage_projects') && <ProjectEditModal project={editingProject} onSave={handleSaveProject} onClose={handleCloseProjectModal} language={language}/>}
      {isChangePasswordModalOpen && 
        <ChangePasswordModal 
            onClose={() => setIsChangePasswordModalOpen(false)}
            onChangePassword={handlePasswordChange}
            language={language}
        />
      }
      <div className="container">
        <AppHeader 
            onToggleSidebar={() => setIsSidebarOpen(true)} 
            onLogout={handleLogout} 
            language={language} 
            onLanguageChange={handleLanguageChange}
            currentUser={currentUser}
            onShowChangePassword={() => setIsChangePasswordModalOpen(true)}
        />
        
        {renderView()}

      </div>
    </>
  );
};

const FileUploader: FC<{ onFileUpload: (file: File) => void, language: Language }> = ({ onFileUpload, language }) => {
    const [dragOver, setDragOver] = useState(false);
    const t = translations[language];
    
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileUpload(e.target.files[0]);
        }
    };

    const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleDragEvents = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragOver(true);
        } else if (e.type === 'dragleave') {
            setDragOver(false);
        }
    }
    
    return (
        <label 
            htmlFor="file-input"
            className={`uploader-container ${dragOver ? 'drag-over' : ''}`}
            onDrop={handleDrop}
            onDragEnter={handleDragEvents}
            onDragOver={handleDragEvents}
            onDragLeave={handleDragEvents}
        >
            <i className="uploader-icon fa-solid fa-file-excel"></i>
            <div className="uploader-text">{t.dragAndDrop}</div>
            <div className="uploader-subtext">{t.orBrowse}</div>
            <input id="file-input" type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
        </label>
    );
};

interface ControlsProps {
    filters: Filters;
    sort: Sort;
    searchTerm: string;
    options: {
        buildingTypes: string[];
        ownershipStatuses: string[];
        finishings: string[];
    };
    onFilterChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    onSortChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onClearFilters: () => void;
    language: Language;
}

const Controls: FC<ControlsProps> = ({ filters, sort, searchTerm, options, onFilterChange, onSortChange, onSearchChange, onClearFilters, language }) => {
    const t = translations[language];
    return (
        <div className="controls-container">
            <div className="control-group search-group">
                <label htmlFor="search">{t.searchUnitCode}</label>
                <div className="search-wrapper">
                    <i className="fa-solid fa-magnifying-glass search-icon"></i>
                    <input type="text" id="search" placeholder="e.g. A-101" value={searchTerm} onChange={onSearchChange} />
                </div>
            </div>
            <div className="control-group">
                <label htmlFor="buildingType">{t.buildingType}</label>
                <select id="buildingType" name="buildingType" value={filters.buildingType} onChange={onFilterChange}>
                    <option value="all">{t.all}</option>
                    {options.buildingTypes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
             <div className="control-group">
                <label htmlFor="ownershipStatus">{t.ownership}</label>
                <select id="ownershipStatus" name="ownershipStatus" value={filters.ownershipStatus} onChange={onFilterChange}>
                    <option value="all">{t.all}</option>
                    {options.ownershipStatuses.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
             <div className="control-group">
                <label htmlFor="finishing">{t.finishing}</label>
                <select id="finishing" name="finishing" value={filters.finishing} onChange={onFilterChange}>
                    <option value="all">{t.all}</option>
                    {options.finishings.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
             <div className="control-group">
                <label htmlFor="sort">{t.sortBy}</label>
                <select id="sort" name="sort" value={`${sort.key}-${sort.direction}`} onChange={onSortChange}>
                    <option value="Area-desc">{t.areaHighToLow}</option>
                    <option value="Area-asc">{t.areaLowToHigh}</option>
                    <option value="Floor-desc">{t.floorHighToLow}</option>
                    <option value="Floor-asc">{t.floorLowToHigh}</option>
                </select>
            </div>
            <div className="control-group">
                <label>&nbsp;</label>
                <button className="clear-button" onClick={onClearFilters}>{t.clearFilters}</button>
            </div>
        </div>
    );
}

const DashboardSummary: FC<{ data: UnitData[], language: Language }> = ({ data, language }) => {
    const t = translations[language];
    const summary = useMemo(() => {
        const totalUnits = data.length;
        let soldCount = 0;
        let atsCount = 0;

        data.forEach(u => {
            const unitStatus = String(u['Unit Status'] || '').toLowerCase().trim();
            const ownershipStatus = String(u['Ownership Status'] || '').toLowerCase().trim();
            
            if (unitStatus === 'ats') {
                atsCount++;
            } else {
                const soldUnitStatuses = ['contracted', 'delivered', 'sold'];
                if (ownershipStatus === 'sold' || soldUnitStatuses.includes(unitStatus)) {
                    soldCount++;
                }
            }
        });

        const availableCount = totalUnits - soldCount - atsCount;
        const totalArea = data.reduce((sum, u) => sum + (Number(u['Area']) || 0), 0);
        const avgArea = totalUnits > 0 ? (totalArea / totalUnits).toFixed(2) : 0;

        return { totalUnits, available: availableCount, sold: soldCount, ats: atsCount, avgArea };
    }, [data]);

    return (
        <div className="summary-container">
            <div className="stat-card">
                <div className="stat-icon"><i className="fa-solid fa-building"></i></div>
                <div className="stat-info">
                    <span className="stat-value">{summary.totalUnits}</span>
                    <span className="stat-label">{t.totalUnits}</span>
                </div>
            </div>
            <div className="stat-card">
                 <div className="stat-icon" style={{color: 'var(--status-available)'}}><i className="fa-solid fa-key"></i></div>
                <div className="stat-info">
                    <span className="stat-value">{summary.available}</span>
                    <span className="stat-label">{t.available}</span>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon" style={{color: 'var(--status-sold)'}}><i className="fa-solid fa-handshake"></i></div>
                <div className="stat-info">
                    <span className="stat-value">{summary.sold}</span>
                    <span className="stat-label">{t.sold}</span>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon" style={{color: 'var(--info-color)'}}><i className="fa-solid fa-file-signature"></i></div>
                <div className="stat-info">
                    <span className="stat-value">{summary.ats}</span>
                    <span className="stat-label">{t.ats}</span>
                </div>
            </div>
            <div className="stat-card">
                 <div className="stat-icon"><i className="fa-solid fa-ruler-horizontal"></i></div>
                <div className="stat-info">
                    <span className="stat-value">{summary.avgArea} m²</span>
                    <span className="stat-label">{t.averageArea}</span>
                </div>
            </div>
        </div>
    );
};

interface EditableCellProps {
    value: string | number | undefined;
    onSave: (newValue: string | number) => void;
    placeholder: string;
    disabled: boolean;
}

const EditableCell: FC<EditableCellProps> = ({ value, onSave, placeholder, disabled }) => {
    const cellRef = useRef<HTMLDivElement>(null);
    
    const handleBlur = () => {
        if (disabled || !cellRef.current) return;
        const newValueText = cellRef.current.innerText;
        // Check if value actually changed to avoid unnecessary re-renders
        if (newValueText !== String(value || '')) {
            onSave(newValueText);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (disabled) return;
        if (e.key === 'Enter') {
            e.preventDefault(); // prevent new line
            e.currentTarget.blur();
        } else if (e.key === 'Escape') {
            if (cellRef.current) {
                cellRef.current.innerText = String(value || '');
            }
            e.currentTarget.blur();
        }
    };

    return (
        <div
            ref={cellRef}
            contentEditable={!disabled}
            suppressContentEditableWarning={true}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`editable-cell-content ${disabled ? 'disabled' : ''}`}
            data-placeholder={!value ? placeholder : ''}
            style={{cursor: disabled ? 'not-allowed' : 'text'}}
        >
            {value ? String(value) : ''}
        </div>
    );
};

interface UnitTableProps {
    units: UnitData[];
    language: Language;
    onUnitUpdate: (unitCode: string, field: keyof UnitData, value: any) => void;
    canEdit: boolean;
}

const UnitTable: FC<UnitTableProps> = ({ units, language, onUnitUpdate, canEdit }) => {
    const t = translations[language];
    
    const headers: (keyof UnitData)[] = [
        'Unit Code', 'Building Type', 'Zone', 'Rooms', 'Building', 'Type', 'Floor', 'Floor Status', 'Area', 'Category', 'Views', 'Meter Price', 'Unit Status', 'Garage', 'Units finishing situation (Site)', 'Ownership Status', 'Finishing'
    ];
    
    const headerTranslationMap: { [K in keyof UnitData]?: keyof typeof t } = {
        'Unit Code': 'unitCode',
        'Building Type': 'buildingType',
        'Floor': 'floor',
        'Area': 'area',
        'Ownership Status': 'ownershipStatus',
        'Finishing': 'finishing',
        'Zone': 'zone',
        'Rooms': 'rooms',
        'Building': 'building',
        'Type': 'type',
        'Floor Status': 'floorStatus',
        'Category': 'category',
        'Views': 'views',
        'Meter Price': 'meterPrice',
        'Unit Status': 'unitStatus',
        'Garage': 'garage',
        'Units finishing situation (Site)': 'finishingSituation',
    };

    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        {headers.map(header => {
                            const translationKey = headerTranslationMap[header];
                            const headerText = translationKey ? t[translationKey] : header;
                            return <th key={header}>{headerText}</th>;
                        })}
                    </tr>
                </thead>
                <tbody>
                    {units.map((unit) => (
                        <tr key={unit['Unit Code']}>
                            {headers.map(header => (
                                <td key={header}>
                                    {header === 'Finishing' || header === 'Ownership Status' ? (
                                        // Keep badges for specific status columns
                                        <>
                                            {unit[header] && (
                                                <span className={`${header === 'Finishing' ? 'finishing-badge' : 'status-badge'} ${String(unit[header] || '').replace(' ', '-')}`}>
                                                     {String(unit[header])}
                                                </span>
                                            )}
                                            {canEdit && (
                                                <EditableCell
                                                    value={unit[header]}
                                                    onSave={(newValue) => onUnitUpdate(unit['Unit Code'], header, newValue)}
                                                    placeholder={t.addValuePlaceholder}
                                                    disabled={!canEdit}
                                                />
                                            )}
                                        </>
                                    ) : (
                                        <EditableCell
                                            value={unit[header]}
                                            onSave={(newValue) => onUnitUpdate(unit['Unit Code'], header, newValue)}
                                            placeholder={t.addValuePlaceholder}
                                            disabled={!canEdit}
                                        />
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
