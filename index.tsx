import React, { useState, useMemo, useCallback, ChangeEvent, DragEvent, FC, FormEvent, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// Let TypeScript know that XLSX is available on the window object
declare const XLSX: any;

// --- DATA & TYPE DEFINITIONS ---

interface UnitData {
  'Unit Code': string;
  'Building Type': string;
  'Floor': number;
  'Area (m²)': number;
  'Ownership Status': 'Available' | 'Sold';
  'Finishing': 'Finished' | 'Semi-Finished' | 'Core';
}

interface User {
    username: string;
    password: string; // In a real app, this should be a hash
    role: 'admin' | 'user';
}

interface CurrentUser {
    username: string;
    role: 'admin' | 'user';
}

interface Project {
    id: number;
    name: string;
    description: string;
    status: 'Ongoing' | 'Completed' | 'Planned';
    location: string;
    type: 'Residential' | 'Commercial' | 'Mixed-Use';
    units: number;
    completionDate: string;
    features: string[];
}

interface Filters {
  buildingType: string;
  ownershipStatus: string;
  finishing: string;
}

interface Sort {
  key: 'Area (m²)' | 'Floor';
  direction: 'asc' | 'desc';
}

type Language = 'en' | 'ar';

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
    invalidFormatError: "Invalid Excel format. Make sure the sheet has columns: 'Unit Code', 'Building Type', 'Floor', 'Area (m²)', 'Ownership Status', 'Finishing'.",
    noMatch: "No units match the current filters.",
    uploadPrompt: "Upload your Excel file to view real estate data.",
    menuHint: "Use the menu button to access filters once data is loaded.",

    // Dashboard
    showingResults: "Showing",
    of: "of",
    units: "units",
    totalUnits: "Total Units",
    available: "Available",
    sold: "Sold",
    averageArea: "Average Area",
    
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
    
    // Projects
    ourProjects: "Our Projects",
    ongoing: "Ongoing",
    completed: "Completed",
    planned: "Planned",
    location: "Location",
    projectType: "Project Type",
    unitsTotal: "Total Units",
    estCompletion: "Est. Completion",
    keyFeatures: "Key Features",
    projectTypePageTitle: "{type} Projects",
    backToAllProjects: "Back to All Projects",
    residential: "Residential",
    commercial: "Commercial",
    mixedUse: "Mixed-Use",
    moreDetails: "More Details",
    projectDetails: "Project Details",
    gallery: "Image Gallery",
    map: "Location Map",
    viewAvailableUnits: "View Available Units",
  },
  ar: {
    // Login
    loginTitle: "تسجيل الدخول للوحة التحكم",
    loginSubtitle: "أدخل بياناتك للوصول إلى لوحة بيانات الوحدات.",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    loginButton: "تسجيل الدخول",
    invalidCredentialsError: "اسم المستخدم أو كلمة المرور غير صالحة.",
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
    invalidFormatError: "تنسيق Excel غير صالح. تأكد من أن الورقة تحتوي على الأعمدة: 'Unit Code', 'Building Type', 'Floor', 'Area (m²)', 'Ownership Status', 'Finishing'.",
    noMatch: "لا توجد وحدات تطابق عوامل التصفية الحالية.",
    uploadPrompt: "قم برفع ملف Excel الخاص بك لعرض بيانات العقارات.",
    menuHint: "استخدم زر القائمة للوصول إلى عوامل التصفية بمجرد تحميل البيانات.",
    
    // Dashboard
    showingResults: "عرض",
    of: "من",
    units: "وحدات",
    totalUnits: "إجمالي الوحدات",
    available: "متاح",
    sold: "مباع",
    averageArea: "متوسط المساحة",

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

    // Projects
    ourProjects: "مشاريعنا",
    ongoing: "جاري",
    completed: "مكتمل",
    planned: "مخطط له",
    location: "الموقع",
    projectType: "نوع المشروع",
    unitsTotal: "إجمالي الوحدات",
    estCompletion: "الإنجاز المتوقع",
    keyFeatures: "المميزات الرئيسية",
    projectTypePageTitle: "مشاريع {type}",
    backToAllProjects: "العودة إلى كل المشاريع",
    residential: "سكنية",
    commercial: "تجارية",
    mixedUse: "متعددة الاستخدامات",
    moreDetails: "المزيد من التفاصيل",
    projectDetails: "تفاصيل المشروع",
    gallery: "معرض الصور",
    map: "خريطة الموقع",
    viewAvailableUnits: "عرض الوحدات المتاحة",
  }
};


// --- STATIC DATA ---
const companyProjects: Project[] = [
    { 
        id: 7, 
        name: "Capital Height 1", 
        description: "Premier residential tower offering a mix of luxury apartments and penthouses with panoramic city views.", 
        status: "Ongoing",
        location: "New Capital City",
        type: "Residential",
        units: 450,
        completionDate: "Q4 2025",
        features: ["Infinity Pool", "Sky Lounge", "24/7 Security", "Underground Parking"]
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
        features: ["Shared Sports Club", "Kids Area", "Commercial Strip", "Smart Home Ready"]
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
        features: ["Private Beach Access", "Clubhouse", "Water Features", "Gated Community"]
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
        features: ["High-speed Elevators", "Conference Center", "Rooftop Cafe", "Valet Parking"]
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
        features: ["Sea Views", "Outdoor Seating", "Anchor Stores", "Ample Parking"]
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
        features: ["Community Pools", "Landscaped Gardens", "On-site Supermarket", "24/7 Maintenance"]
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
        features: ["Fiber-optic Internet", "Meeting Rooms", "Incubation Center", "Food Court"]
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
        features: ["IMAX Cinema", "International Food Court", "Luxury Brand Outlets", "Multi-level Car Park"]
    },
];


// --- LOCAL STORAGE & USER HOOK ---

const useUsers = () => {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        try {
            const storedUsers = localStorage.getItem('app_users');
            if (storedUsers) {
                setUsers(JSON.parse(storedUsers));
            } else {
                // Seed with a default admin user if no users exist
                const defaultAdmin: User = { username: 'admin', password: 'password', role: 'admin' };
                localStorage.setItem('app_users', JSON.stringify([defaultAdmin]));
                setUsers([defaultAdmin]);
            }
        } catch (error) {
            console.error("Failed to load users from localStorage", error);
            // Handle potential JSON parsing errors
            const defaultAdmin: User = { username: 'admin', password: 'password', role: 'admin' };
            localStorage.setItem('app_users', JSON.stringify([defaultAdmin]));
            setUsers([defaultAdmin]);
        }
    }, []);

    const updateUserStorage = (updatedUsers: User[]) => {
        localStorage.setItem('app_users', JSON.stringify(updatedUsers));
        setUsers(updatedUsers);
    };

    const addUser = (user: User) => {
        const updatedUsers = [...users, user];
        updateUserStorage(updatedUsers);
    };

    const deleteUser = (username: string) => {
        const updatedUsers = users.filter(user => user.username !== username);
        updateUserStorage(updatedUsers);
    };

    return { users, addUser, deleteUser };
};


// --- COMPONENTS ---

interface LoginScreenProps {
    onLogin: (user: string, pass: string) => void;
    error: string | null;
    language: Language;
    onLanguageChange: () => void;
}

const LoginScreen: FC<LoginScreenProps> = ({ onLogin, error, language, onLanguageChange }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const t = translations[language];

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onLogin(username, password);
    };

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
                <div className="input-group">
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
    language: Language;
    onLanguageChange: () => void;
}

const AppHeader: FC<AppHeaderProps> = ({ onToggleSidebar, onLogout, language, onLanguageChange }) => {
    const t = translations[language];
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
                <button onClick={onLogout} className="header-logout-button" aria-label={t.logout}>
                    <i className="fa-solid fa-right-from-bracket"></i>
                    <span>{t.logout}</span>
                </button>
            </div>
        </header>
    );
};

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: CurrentUser | null;
    onNavigate: (view: 'home' | 'users' | 'projects') => void;
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
}

const Sidebar: FC<SidebarProps> = ({
    isOpen,
    onClose,
    currentUser,
    onNavigate,
    hasData,
    language,
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
        onNavigate(view);
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
                    <button onClick={() => handleNavigate('home')}>
                        <i className="fa-solid fa-table-columns"></i> {t.home}
                    </button>
                    <button onClick={() => handleNavigate('projects')}>
                        <i className="fa-solid fa-briefcase"></i> {t.projects}
                    </button>
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
    addUser: (user: User) => void;
    deleteUser: (username: string) => void;
    onBackToHome: () => void;
    language: Language;
}

const UserManagementPage: FC<UserManagementPageProps> = ({ users, currentUser, addUser, deleteUser, onBackToHome, language }) => {
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
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
        addUser({ username: newUsername, password: newPassword, role: 'user' });
        setNewUsername('');
        setNewPassword('');
        setError(null);
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
                                {user.username !== currentUser.username && (
                                    <button onClick={() => deleteUser(user.username)} className="delete-user-button">
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
    onTypeClick?: (type: Project['type']) => void;
    onMoreDetailsClick: (id: number) => void;
}

const ProjectCard: FC<ProjectCardProps> = ({ project, language, onTypeClick, onMoreDetailsClick }) => {
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
                <h3><i className="fa-solid fa-folder-open"></i> {project.name}</h3>
                <span className={`project-status status-${project.status.toLowerCase()}`}>
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
                <button className="more-details-button" onClick={() => onMoreDetailsClick(project.id)}>
                    {t.moreDetails} <i className="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </div>
    );
};

interface ProjectsPageProps {
    language: Language;
    onTypeClick: (type: Project['type']) => void;
    onMoreDetailsClick: (id: number) => void;
}

const ProjectsPage: FC<ProjectsPageProps> = ({ language, onTypeClick, onMoreDetailsClick }) => {
    const t = translations[language];

    return (
        <div className="projects-page-container">
            <h2>{t.ourProjects}</h2>
            <div className="projects-grid">
                {companyProjects.map(project => (
                    <ProjectCard 
                        key={project.id} 
                        project={project} 
                        language={language}
                        onTypeClick={onTypeClick}
                        onMoreDetailsClick={onMoreDetailsClick}
                    />
                ))}
            </div>
        </div>
    );
};

interface ProjectTypePageProps {
    projectType: Project['type'];
    language: Language;
    onBackToProjects: () => void;
    onMoreDetailsClick: (id: number) => void;
}

const ProjectTypePage: FC<ProjectTypePageProps> = ({ projectType, language, onBackToProjects, onMoreDetailsClick }) => {
    const t = translations[language];
    const filteredProjects = useMemo(() => companyProjects.filter(p => p.type === projectType), [projectType]);
    
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
                 <button onClick={onBackToProjects} className="back-to-projects-button">
                    <i className="fa-solid fa-arrow-left"></i> {t.backToAllProjects}
                 </button>
            </div>
            <div className="projects-grid">
                {filteredProjects.map(project => (
                    <ProjectCard 
                        key={project.id} 
                        project={project} 
                        language={language} 
                        onMoreDetailsClick={onMoreDetailsClick}
                    />
                ))}
            </div>
        </div>
    );
}

interface ProjectDetailPageProps {
    projectId: number;
    language: Language;
    onBackToProjects: () => void;
    onViewUnits: () => void;
}

const ProjectDetailPage: FC<ProjectDetailPageProps> = ({ projectId, language, onBackToProjects, onViewUnits }) => {
    const t = translations[language];
    const project = useMemo(() => companyProjects.find(p => p.id === projectId), [projectId]);

    if (!project) {
        return (
            <div className="status-message error-message">Project not found.</div>
        );
    }

    const { name, description, status, location, type, units, completionDate, features } = project;
    
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
                <h2>{name}</h2>
                <button onClick={onBackToProjects} className="back-to-projects-button">
                    <i className="fa-solid fa-arrow-left"></i> {t.backToAllProjects}
                </button>
            </div>
            <div className="project-detail-content">
                <div className="project-main-details">
                    <div className="card">
                        <span className={`project-status status-${status.toLowerCase()}`}>
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
                    </div>
                </div>
                <div className="project-detail-gallery-map">
                    <div className="card">
                        <h3>{t.gallery}</h3>
                        <div className="project-image-gallery">
                            <i className="fa-solid fa-images"></i>
                            <span>Gallery coming soon</span>
                        </div>
                    </div>
                     <div className="card">
                        <h3>{t.map}</h3>
                        <div className="project-location-map">
                            <i className="fa-solid fa-map-location-dot"></i>
                            <span>Interactive map coming soon</span>
                        </div>
                    </div>
                    <button className="view-units-button" onClick={onViewUnits}>
                        <i className="fa-solid fa-building-user"></i> {t.viewAvailableUnits}
                    </button>
                </div>
            </div>
        </div>
    )
}

const App: FC = () => {
  const { users, addUser, deleteUser } = useUsers();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [view, setView] = useState<'login' | 'home' | 'users' | 'projects' | 'projectType' | 'projectDetail'>('login');
  const [selectedProjectType, setSelectedProjectType] = useState<Project['type'] | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);


  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [loginError, setLoginError] = useState<string | null>(null);
  const [data, setData] = useState<UnitData[]>([]);
  const [filters, setFilters] = useState<Filters>({
    buildingType: 'all',
    ownershipStatus: 'all',
    finishing: 'all',
  });
  const [sort, setSort] = useState<Sort>({ key: 'Area (m²)', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [language, setLanguage] = useState<Language>(
    () => (localStorage.getItem('app_language') as Language) || 'en'
  );
  
  const t = translations[language];

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('app_language', language);
  }, [language]);

  const handleLanguageChange = () => {
    setLanguage(prev => (prev === 'en' ? 'ar' : 'en'));
  };

  const handleLogin = (username: string, pass: string) => {
    const user = users.find(u => u.username === username);
    if (user && user.password === pass) {
      setIsAuthenticated(true);
      setCurrentUser({ username: user.username, role: user.role });
      setView('home');
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
    setSort({ key: 'Area (m²)', direction: 'desc' });
    setSearchTerm('');
    setIsLoading(false);
    setError(null);
    setSelectedProjectType(null);
    setSelectedProjectId(null);
  };

  const handleProjectTypeClick = (type: Project['type']) => {
      setSelectedProjectType(type);
      setView('projectType');
  };

  const handleMoreDetailsClick = (id: number) => {
      setSelectedProjectId(id);
      setView('projectDetail');
  };
  
  const handleViewUnitsClick = () => {
      setView('home');
      // Maybe scroll to uploader or something in a future iteration
  }

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
        const jsonData: UnitData[] = XLSX.utils.sheet_to_json(worksheet);

        // Basic validation
        if (jsonData.length === 0 || !jsonData[0]['Unit Code'] || !jsonData[0]['Area (m²)']) {
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
  
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchTerm) {
        result = result.filter(item =>
            item['Unit Code'].toLowerCase().includes(searchTerm.toLowerCase().trim())
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
        const valA = a[sort.key];
        const valB = b[sort.key];
        if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    return result;
  }, [data, filters, sort, searchTerm]);

  const filterOptions = useMemo(() => {
    const buildingTypes = [...new Set(data.map(item => item['Building Type']))].filter(Boolean);
    const ownershipStatuses = [...new Set(data.map(item => item['Ownership Status']))].filter(Boolean);
    const finishings = [...new Set(data.map(item => item['Finishing']))].filter(Boolean);
    return { buildingTypes, ownershipStatuses, finishings };
  }, [data]);

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
      setSort({ key: 'Area (m²)', direction: 'desc' });
  }

  const renderView = () => {
    switch(view) {
        case 'home':
            return (
                <>
                    <FileUploader onFileUpload={handleFileUpload} language={language} />
                    {isLoading && <div className="status-message">{t.processingFile} <i className="fa-solid fa-spinner fa-spin"></i></div>}
                    {error && <div className="status-message error-message">{error}</div>}
                    {data.length > 0 && (
                        <>
                          <DashboardSummary data={data} language={language} />
                          <div className="results-count">
                              {t.showingResults} <strong>{filteredAndSortedData.length}</strong> {t.of} <strong>{data.length}</strong> {t.units}.
                          </div>
                          <UnitTable units={filteredAndSortedData} language={language} />
                          {filteredAndSortedData.length === 0 && <div className="status-message">{t.noMatch}</div>}
                        </>
                    )}
                    {!isLoading && data.length === 0 && !error && (
                      <div className="status-message">
                          <p>{t.uploadPrompt}</p>
                          <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>{t.menuHint}</p>
                      </div>
                    )}
                </>
            );
        case 'users':
            return currentUser ? <UserManagementPage 
              users={users} 
              currentUser={currentUser} 
              addUser={addUser} 
              deleteUser={deleteUser} 
              onBackToHome={() => setView('home')}
              language={language}
            /> : null;
        case 'projects':
            return <ProjectsPage language={language} onTypeClick={handleProjectTypeClick} onMoreDetailsClick={handleMoreDetailsClick} />;
        case 'projectType':
            return selectedProjectType ? <ProjectTypePage 
                projectType={selectedProjectType}
                language={language}
                onBackToProjects={() => setView('projects')}
                onMoreDetailsClick={handleMoreDetailsClick}
            /> : null;
        case 'projectDetail':
            return selectedProjectId ? <ProjectDetailPage
                projectId={selectedProjectId}
                language={language}
                onBackToProjects={() => setView('projects')}
                onViewUnits={handleViewUnitsClick}
            /> : null;
        default:
            return null;
    }
  }

  if (view === 'login') {
    return <LoginScreen onLogin={handleLogin} error={loginError} language={language} onLanguageChange={handleLanguageChange} />;
  }
  
  return (
    <>
      <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentUser={currentUser}
          onNavigate={setView}
          hasData={data.length > 0}
          filters={filters}
          sort={sort}
          searchTerm={searchTerm}
          options={filterOptions}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          onClearFilters={clearFilters}
          language={language}
      />
      <div className="container">
        <AppHeader 
            onToggleSidebar={() => setIsSidebarOpen(true)} 
            onLogout={handleLogout} 
            language={language} 
            onLanguageChange={handleLanguageChange}
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
                    <option value="Area (m²)-desc">{t.areaHighToLow}</option>
                    <option value="Area (m²)-asc">{t.areaLowToHigh}</option>
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
        const available = data.filter(u => u['Ownership Status'] === 'Available').length;
        const sold = totalUnits - available;
        const totalArea = data.reduce((sum, u) => sum + (u['Area (m²)'] || 0), 0);
        const avgArea = totalUnits > 0 ? (totalArea / totalUnits).toFixed(2) : 0;
        return { totalUnits, available, sold, avgArea };
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
                 <div className="stat-icon"><i className="fa-solid fa-ruler-horizontal"></i></div>
                <div className="stat-info">
                    <span className="stat-value">{summary.avgArea} m²</span>
                    <span className="stat-label">{t.averageArea}</span>
                </div>
            </div>
        </div>
    );
};

const UnitTable: FC<{ units: UnitData[], language: Language }> = ({ units, language }) => {
    const t = translations[language];
    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>{t.unitCode}</th>
                        <th>{t.buildingType}</th>
                        <th>{t.floor}</th>
                        <th>{t.area}</th>
                        <th>{t.finishing}</th>
                        <th>{t.ownershipStatus}</th>
                    </tr>
                </thead>
                <tbody>
                    {units.map((unit) => (
                        <tr key={unit['Unit Code']}>
                            <td>{unit['Unit Code']}</td>
                            <td>{unit['Building Type']}</td>
                            <td>{unit.Floor}</td>
                            <td>{unit['Area (m²)']} m²</td>
                            <td>
                                {unit.Finishing ? (
                                    <span className={`finishing-badge ${unit.Finishing.replace(' ', '-')}`}>
                                        {unit.Finishing}
                                    </span>
                                ) : null}
                            </td>
                            <td>
                                {unit['Ownership Status'] ? (
                                    <span className={`status-badge ${unit['Ownership Status']}`}>
                                        {unit['Ownership Status']}
                                    </span>
                                ) : null}
                            </td>
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