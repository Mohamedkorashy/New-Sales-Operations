import React, { useState, useMemo, useCallback, ChangeEvent, DragEvent, FC, FormEvent } from 'react';
import { createRoot } from 'react-dom/client';

// Let TypeScript know that XLSX is available on the window object
declare const XLSX: any;

interface UnitData {
  'Unit Code': string;
  'Building Type': string;
  'Floor': number;
  'Area (m²)': number;
  'Ownership Status': 'Available' | 'Sold';
  'Finishing': 'Finished' | 'Semi-Finished' | 'Core';
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

interface LoginScreenProps {
    onLogin: (user: string, pass: string) => void;
    error: string | null;
}

const LoginScreen: FC<LoginScreenProps> = ({ onLogin, error }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onLogin(username, password);
    };

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit} className="login-form">
                <div className="login-header">
                    <i className="fa-solid fa-lock login-icon"></i>
                    <h2>Dashboard Login</h2>
                    <p>Enter your credentials to access the unit dashboard.</p>
                </div>
                {error && <div className="login-error">{error}</div>}
                <div className="input-group">
                    <label htmlFor="username">Username</label>
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
                    <label htmlFor="password">Password</label>
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
                    Login <i className="fa-solid fa-arrow-right-to-bracket"></i>
                </button>
            </form>
        </div>
    );
};

const App: FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

  const handleLogin = (user: string, pass: string) => {
    // In a real app, this would be an API call. For this demo, credentials are hardcoded.
    if (user === 'admin' && pass === 'password') {
      setIsAuthenticated(true);
      setLoginError(null);
    } else {
      setLoginError('Invalid username or password.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    // Reset app state for a clean session next time
    setData([]);
    setFilters({ buildingType: 'all', ownershipStatus: 'all', finishing: 'all' });
    setSort({ key: 'Area (m²)', direction: 'desc' });
    setSearchTerm('');
    setIsLoading(false);
    setError(null);
  };

  const handleFileUpload = (file: File) => {
    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileData = e.target?.result;
        if (!fileData) {
            throw new Error("Could not read the file.");
        }
        const workbook = XLSX.read(fileData, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: UnitData[] = XLSX.utils.sheet_to_json(worksheet);

        // Basic validation
        if (jsonData.length === 0 || !jsonData[0]['Unit Code'] || !jsonData[0]['Area (m²)']) {
            throw new Error("Invalid Excel format. Make sure the sheet has columns: 'Unit Code', 'Building Type', 'Floor', 'Area (m²)', 'Ownership Status', 'Finishing'.");
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
        setError('Failed to read the file.');
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

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="container">
      <header>
        <h1><i className="fa-solid fa-building-user"></i> <span className="company-name">SUD</span> Capital Heights 1</h1>
        <p>Real Estate Unit Dashboard</p>
         <button onClick={handleLogout} className="logout-button">
            Logout <i className="fa-solid fa-right-from-bracket"></i>
        </button>
      </header>

      <FileUploader onFileUpload={handleFileUpload} />

      {isLoading && <div className="status-message">Processing your file... <i className="fa-solid fa-spinner fa-spin"></i></div>}
      {error && <div className="status-message error-message">{error}</div>}
      
      {data.length > 0 && (
          <>
            <DashboardSummary data={data} />
            <Controls 
                filters={filters}
                sort={sort}
                searchTerm={searchTerm}
                options={filterOptions}
                onFilterChange={handleFilterChange}
                onSortChange={handleSortChange}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                onClearFilters={clearFilters}
            />
            <div className="results-count">
                Showing <strong>{filteredAndSortedData.length}</strong> of <strong>{data.length}</strong> units.
            </div>
            <UnitTable units={filteredAndSortedData} />
            {filteredAndSortedData.length === 0 && <div className="status-message">No units match the current filters.</div>}
          </>
      )}

      {!isLoading && data.length === 0 && !error && (
        <div className="status-message">
            <p>Upload your Excel file to view real estate data.</p>
            <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>The "automatically updates" feature means you can upload a new file at any time to see the latest data.</p>
        </div>
      )}
    </div>
  );
};

const FileUploader: FC<{ onFileUpload: (file: File) => void }> = ({ onFileUpload }) => {
    const [dragOver, setDragOver] = useState(false);
    
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
            <div className="uploader-text">Drag & Drop your Excel file here</div>
            <div className="uploader-subtext">or click to browse</div>
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
}

const Controls: FC<ControlsProps> = ({ filters, sort, searchTerm, options, onFilterChange, onSortChange, onSearchChange, onClearFilters }) => {
    return (
        <div className="controls-container">
            <div className="control-group search-group">
                <label htmlFor="search">Search Unit Code</label>
                <div className="search-wrapper">
                    <i className="fa-solid fa-magnifying-glass search-icon"></i>
                    <input type="text" id="search" placeholder="e.g. A-101" value={searchTerm} onChange={onSearchChange} />
                </div>
            </div>
            <div className="control-group">
                <label htmlFor="buildingType">Building Type</label>
                <select id="buildingType" name="buildingType" value={filters.buildingType} onChange={onFilterChange}>
                    <option value="all">All</option>
                    {options.buildingTypes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
             <div className="control-group">
                <label htmlFor="ownershipStatus">Ownership</label>
                <select id="ownershipStatus" name="ownershipStatus" value={filters.ownershipStatus} onChange={onFilterChange}>
                    <option value="all">All</option>
                    {options.ownershipStatuses.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
             <div className="control-group">
                <label htmlFor="finishing">Finishing</label>
                <select id="finishing" name="finishing" value={filters.finishing} onChange={onFilterChange}>
                    <option value="all">All</option>
                    {options.finishings.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
             <div className="control-group">
                <label htmlFor="sort">Sort By</label>
                <select id="sort" name="sort" value={`${sort.key}-${sort.direction}`} onChange={onSortChange}>
                    <option value="Area (m²)-desc">Area (High to Low)</option>
                    <option value="Area (m²)-asc">Area (Low to High)</option>
                    <option value="Floor-desc">Floor (High to Low)</option>
                    <option value="Floor-asc">Floor (Low to High)</option>
                </select>
            </div>
            <div className="control-group">
                <label>&nbsp;</label>
                <button className="clear-button" onClick={onClearFilters}>Clear Filters</button>
            </div>
        </div>
    );
}

const DashboardSummary: FC<{ data: UnitData[] }> = ({ data }) => {
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
                    <span className="stat-label">Total Units</span>
                </div>
            </div>
            <div className="stat-card">
                 <div className="stat-icon" style={{color: 'var(--status-available)'}}><i className="fa-solid fa-key"></i></div>
                <div className="stat-info">
                    <span className="stat-value">{summary.available}</span>
                    <span className="stat-label">Available</span>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon" style={{color: 'var(--status-sold)'}}><i className="fa-solid fa-handshake"></i></div>
                <div className="stat-info">
                    <span className="stat-value">{summary.sold}</span>
                    <span className="stat-label">Sold</span>
                </div>
            </div>
            <div className="stat-card">
                 <div className="stat-icon"><i className="fa-solid fa-ruler-horizontal"></i></div>
                <div className="stat-info">
                    <span className="stat-value">{summary.avgArea} m²</span>
                    <span className="stat-label">Average Area</span>
                </div>
            </div>
        </div>
    );
};

const UnitTable: FC<{ units: UnitData[] }> = ({ units }) => {
    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Unit Code</th>
                        <th>Building Type</th>
                        <th>Floor</th>
                        <th>Area (m²)</th>
                        <th>Finishing</th>
                        <th>Ownership Status</th>
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