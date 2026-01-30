/**
 * CERIP Sénégal - Plateforme d'incubation
 * UI ultra-moderne, raffinée, Desktop First & Mobile First
 */

const { useState, useEffect, useMemo } = React;

const ThemeToggle = ({ theme, toggleTheme }) => (
    <button onClick={toggleTheme} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors" title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}>
        {theme === 'dark' ? <Icon name="sun" size={18} className="text-amber-500" /> : <Icon name="moon" size={18} className="text-gray-600" />}
    </button>
);

// --- Icon ---
const Icon = ({ name, size = 18, className = '' }) => {
    const icons = {
        dashboard: <g><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></g>,
        users: <g><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></g>,
        layers: <g><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></g>,
        lock: <g><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></g>,
        check: <polyline points="20 6 9 17 4 12"/>,
        chevronDown: <polyline points="6 9 12 15 18 9"/>,
        chevronRight: <polyline points="9 18 15 12 9 6"/>,
        rocket: <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.71.79-1.81.2-2.55L4.5 16.5zM9 15l3 3M15 9l-3-3"/>,
        award: <g><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></g>,
        logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>,
        plus: <g><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></g>,
        edit: <g><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></g>,
        trash: <g><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></g>,
        save: <g><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></g>,
        video: <g><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></g>,
        x: <g><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></g>,
        play: <polygon points="5 3 19 12 5 21 5 3"/>,
        clock: <g><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></g>,
        star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
        file: <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>,
        sun: <g><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></g>,
        moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 0 0 0 21 12.79z"/>,
        eye: <g><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></g>,
        eyeOff: <g><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></g>
    };
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            {icons[name] || <circle cx="12" cy="12" r="10"/>}
        </svg>
    );
};

const StatCard = ({ title, value, sub, color, icon }) => {
    const colorMap = { indigo: 'bg-indigo-100 text-indigo-600', green: 'bg-emerald-100 text-emerald-600', blue: 'bg-blue-100 text-blue-600', orange: 'bg-amber-100 text-amber-600', purple: 'bg-violet-100 text-violet-600', red: 'bg-red-100 text-red-600' };
    const c = colorMap[color] || colorMap.indigo;
    return (
        <div className="stat-card">
            <div className={`stat-icon ${c}`}><Icon name={icon} size={24}/></div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{title}</div>
            {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
        </div>
    );
};

// --- LoginScreen (maquette : formulaire gauche, branding droite) ---
const LoginScreen = ({ users, onLogin, setUsers, theme, toggleTheme }) => {
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [prenom, setPrenom] = useState('');
    const [nom, setNom] = useState('');
    const [showPass, setShowPass] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        const user = users.find(u => u.email === email && u.pass === pass);
        if (user) onLogin(user);
        else alert('Identifiants incorrects.');
    };

    const handleSignup = (e) => {
        e.preventDefault();
        if (pass !== confirmPass) { alert('Les mots de passe ne correspondent pas.'); return; }
        if (users.some(u => u.email === email)) { alert('Cette adresse email est déjà utilisée.'); return; }
        const newUser = { id: Date.now(), prenom: prenom || 'Utilisateur', nom: nom || '', email, pass, role: 'incubé', level: 0, xp: 0, coachId: null };
        setUsers([...users, newUser]);
        onLogin(newUser);
    };

    const submit = isSignup ? handleSignup : handleLogin;

    return (
        <div className="auth-container animate-fade-in">
            {/* Colonne gauche : formulaire centré, style vitrine */}
            <div className="auth-form-column">
                <div className="auth-form-inner">
                    <div className="auth-form-logo">
                        <img src="logo-cerip-senegal.png" alt="CERIP Sénégal" width="140" height="auto" />
                    </div>
                    <div className="auth-form-header-row auth-form-header-row--center">
                        <span className="auth-form-header-text">
                            {isSignup ? 'Déjà un compte ?' : 'Pas encore de compte ?'}
                        </span>
                        <button type="button" className="auth-form-header-link" onClick={() => { setIsSignup(!isSignup); setEmail(''); setPass(''); setConfirmPass(''); setPrenom(''); setNom(''); }}>
                            {isSignup ? 'Se connecter' : 'Créer un compte'}
                        </button>
                    </div>
                    <h1 className="auth-form-title auth-form-title--center">
                        {isSignup ? 'Créer un compte' : 'Bienvenue'}
                    </h1>
                    <p className="auth-form-subtitle auth-form-subtitle--center">
                        {isSignup ? 'Rejoignez la plateforme d\'incubation.' : 'Adresse e-mail et mot de passe pour accéder à votre espace.'}
                    </p>
                    <div className="auth-form-panel">
                        <form onSubmit={submit}>
                            {isSignup && (
                                <>
                                    <div className="auth-field">
                                        <label className="auth-field-label" htmlFor="auth-prenom">Prénom</label>
                                        <input id="auth-prenom" type="text" className="auth-input" placeholder="Votre prénom" value={prenom} onChange={e => setPrenom(e.target.value)} />
                                    </div>
                                    <div className="auth-field">
                                        <label className="auth-field-label" htmlFor="auth-nom">Nom</label>
                                        <input id="auth-nom" type="text" className="auth-input" placeholder="Votre nom" value={nom} onChange={e => setNom(e.target.value)} />
                                    </div>
                                </>
                            )}
                            <div className="auth-field">
                                <label className="auth-field-label" htmlFor="auth-email">Adresse e-mail</label>
                                <div className="auth-input-wrap">
                                    <input id="auth-email" type="email" className="auth-input" placeholder="exemple@mail.com" value={email} onChange={e => setEmail(e.target.value)} required />
                                    <span className="auth-input-icon" aria-hidden>@</span>
                                </div>
                            </div>
                            <div className="auth-field">
                                <label className="auth-field-label" htmlFor="auth-password">Mot de passe</label>
                                <div className="auth-input-wrap">
                                    <input id="auth-password" type={showPass ? 'text' : 'password'} className="auth-input" placeholder="6+ caractères" value={pass} onChange={e => setPass(e.target.value)} required />
                                    <button type="button" className="auth-input-icon auth-input-icon-btn" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                                        {showPass ? <Icon name="eyeOff" size={18}/> : <Icon name="lock" size={18}/>}
                                    </button>
                                </div>
                            </div>
                            {isSignup && (
                                <div className="auth-field">
                                    <label className="auth-field-label" htmlFor="auth-confirm">Confirmer le mot de passe</label>
                                    <div className="auth-input-wrap">
                                        <input id="auth-confirm" type="password" className="auth-input" placeholder="6+ caractères" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required={isSignup} />
                                        <span className="auth-input-icon"><Icon name="lock" size={18}/></span>
                                    </div>
                                </div>
                            )}
                            <button type="submit" className="auth-btn-primary">
                                {isSignup ? 'Créer un compte' : 'Se connecter'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            {/* Colonne droite : branding fond bleu vif */}
            <div className="auth-branding-column">
                <div className="auth-branding-quote">"</div>
                <h2 className="auth-branding-title">
                    <span className="auth-branding-title-line">De l'idée</span>
                    <span className="auth-branding-title-line">à l'entreprise.</span>
                </h2>
                <div className="auth-branding-line" />
                <p className="auth-branding-desc">
                    Accompagnons les entrepreneurs de l'idée à l'entreprise durable. Formation, mentorat et ressources au service de votre projet à Thiès.
                </p>
                <div className="auth-branding-footer">
                    <div className="auth-branding-avatar" aria-hidden />
                    <div>
                        <p className="auth-branding-name">CERIP Sénégal</p>
                        <p className="auth-branding-role">Incubateur à Thiès</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- ManagementInterface (Admin / Coach) ---
const ManagementInterface = ({ user, users, setUsers, logout, theme, toggleTheme }) => {
    const [modules, setModules] = useState(() => JSON.parse(localStorage.getItem('ga_master_v91')) || INITIAL_MODULES);
    const [currentView, setCurrentView] = useState('dashboard');
    const [navState, setNavState] = useState({ users: true, parcours: false });
    const [selectedModule, setSelectedModule] = useState(null);
    const [activeTab, setActiveTab] = useState('general');
    const [editingUser, setEditingUser] = useState(null);
    const [showUserBMC, setShowUserBMC] = useState(null);

    const isSuperAdmin = user.role === 'admin';
    const isCoach = user.role === 'coach';

    useEffect(() => localStorage.setItem('ga_master_v91', JSON.stringify(modules)), [modules]);
    const toggleNav = (key) => setNavState(prev => ({ ...prev, [key]: !prev[key] }));

    const visibleUsers = isSuperAdmin ? users : users.filter(u => u.coachId === user.id);
    const metrics = useMemo(() => {
        const myIncubes = visibleUsers.filter(u => u.role === 'incubé');
        const totalXP = myIncubes.reduce((acc, u) => acc + (u.xp || 0), 0);
        const avgLvl = myIncubes.length ? Math.round(myIncubes.reduce((acc, u) => acc + u.level, 0) / myIncubes.length) : 0;
        return {
            total: myIncubes.length,
            active: myIncubes.filter(u => u.level > 0).length,
            avgLevel: avgLvl,
            totalXP,
            p1Finishers: myIncubes.filter(u => u.level >= 8).length,
            certified: myIncubes.filter(u => u.level >= 16).length
        };
    }, [visibleUsers]);

    const handleSaveUser = () => {
        if (!editingUser.prenom) return;
        if (editingUser.id) setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
        else setUsers([...users, { ...editingUser, id: Date.now(), regDate: new Date().toISOString().split('T')[0], level: 0, xp: 0 }]);
        setEditingUser(null);
    };
    const handleCreateUser = () => setEditingUser({ id: null, prenom: '', nom: '', email: '', pass: '123456', role: 'incubé', level: 0, xp: 0, coachId: null });
    const handleDeleteUser = (id) => { if (confirm('Supprimer ?')) setUsers(users.filter(u => u.id !== id)); };

    const handleCreateModule = () => {
        const newModule = { id: `M_${Date.now()}`, title: 'Nouveau Module', parcours: 'P1', xp: 350, requiredLevel: 1, video: '', shortDesc: '...', theoryTitle: 'Titre', paragraphs: [{ id: Date.now(), text: 'Contenu...' }], quiz: [{ q: 'Question ?', options: ['A', 'B'], correct: 0 }], formStructure: [] };
        setModules([...modules, newModule]);
        setSelectedModule(newModule);
    };
    const handleDeleteModule = (id) => { if (confirm('Supprimer module ?')) { setModules(modules.filter(m => m.id !== id)); setSelectedModule(null); } };
    const handleSaveModule = () => { setModules(modules.map(m => m.id === selectedModule.id ? selectedModule : m)); setSelectedModule(null); };

    const updateParagraph = (idx, text) => { const np = [...selectedModule.paragraphs]; np[idx].text = text; setSelectedModule({ ...selectedModule, paragraphs: np }); };
    const addParagraph = () => { setSelectedModule({ ...selectedModule, paragraphs: [...selectedModule.paragraphs, { id: Date.now(), text: '' }] }); };
    const removeParagraph = (idx) => { setSelectedModule({ ...selectedModule, paragraphs: selectedModule.paragraphs.filter((_, i) => i !== idx) }); };
    const updateQuestion = (idx, field, val) => { const nq = [...selectedModule.quiz]; nq[idx][field] = val; setSelectedModule({ ...selectedModule, quiz: nq }); };
    const updateOption = (qIdx, oIdx, val) => { const nq = [...selectedModule.quiz]; nq[qIdx].options[oIdx] = val; setSelectedModule({ ...selectedModule, quiz: nq }); };
    const setCorrectOption = (qIdx, oIdx) => { const nq = [...selectedModule.quiz]; nq[qIdx].correct = oIdx; setSelectedModule({ ...selectedModule, quiz: nq }); };
    const addQuestion = () => { setSelectedModule({ ...selectedModule, quiz: [...selectedModule.quiz, { q: '?', options: ['A', 'B', 'C', 'D'], correct: 0 }] }); };
    const removeQuestion = (idx) => { setSelectedModule({ ...selectedModule, quiz: selectedModule.quiz.filter((_, i) => i !== idx) }); };

    const renderBMC = (u) => {
        const data = u.bmcData || {};
        const map = {
            kp: data['input-partners'] || '-', ka: data['input-activities'] || '-', kr: data['input-resources'] || '-',
            vp: data['input-value-prop'] || '-', cr: data['input-relations'] || '-', ch: data['input-channels'] || '-',
            cs: data['input-segments'] || '-', cst: data['input-costs'] || '-', rev: data['input-revenue'] || '-'
        };
        return (
            <div className="bmc-overlay">
                <div className="bmc-inner">
                    <div className="bmc-header">
                        <h1 className="bmc-title">BMC : {u.prenom} {u.nom}</h1>
                        <button onClick={() => setShowUserBMC(null)} className="bmc-close-btn" aria-label="Fermer"><Icon name="x" size={24}/></button>
                    </div>
                    <div className="bmc-grid-wrapper">
                        <div className="bmc-grid">
                            <div className="bmc-block kp"><h3>Partenaires Clés</h3><div className="bmc-content">{map.kp}</div></div>
                            <div className="bmc-block ka"><h3>Activités Clés</h3><div className="bmc-content">{map.ka}</div></div>
                            <div className="bmc-block kr"><h3>Ressources Clés</h3><div className="bmc-content">{map.kr}</div></div>
                            <div className="bmc-block vp"><h3>Proposition de Valeur</h3><div className="bmc-content">{map.vp}</div></div>
                            <div className="bmc-block cr"><h3>Relations Clients</h3><div className="bmc-content">{map.cr}</div></div>
                            <div className="bmc-block ch"><h3>Canaux</h3><div className="bmc-content">{map.ch}</div></div>
                            <div className="bmc-block cs"><h3>Segments Clients</h3><div className="bmc-content">{map.cs}</div></div>
                            <div className="bmc-block cst"><h3>Coûts</h3><div className="bmc-content">{map.cst}</div></div>
                            <div className="bmc-block rev"><h3>Revenus</h3><div className="bmc-content">{map.rev}</div></div>
                        </div>
                    </div>
                    <div className="bmc-print-wrap"><button type="button" onClick={() => window.print()} className="bmc-print-btn">Imprimer / PDF</button></div>
                </div>
            </div>
        );
    };

    return (
        <div className="app-layout animate-fade-in">
            {showUserBMC && renderBMC(showUserBMC)}
            <header className="app-header">
                <div className="app-logo">
                    <img src="logo-cerip-senegal.png" alt="" className="app-logo-img" width="36" height="36" />
                    <span>CERIP Sénégal <span className="app-logo-badge">{isSuperAdmin ? 'Administrateur' : 'Coach'}</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={logout} className="btn-secondary text-sm"><Icon name="logout" size={16}/> Déconnexion</button>
                    <ThemeToggle theme={theme} toggleTheme={toggleTheme}/>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <aside className="app-sidebar custom-scroll">
                    <nav className="p-4 space-y-1">
                        <button onClick={() => setCurrentView('dashboard')} className={`app-nav-item w-full flex gap-3 ${currentView === 'dashboard' ? 'active' : ''}`}><Icon name="dashboard" size={20}/> Tableau de bord</button>
                        <div>
                            <button onClick={() => toggleNav('users')} className="app-nav-item w-full flex justify-between"><span className="flex gap-3"><Icon name="users" size={20}/> Utilisateurs</span><Icon name="chevronDown" size={14}/></button>
                            <div className={`pl-4 ml-2 ${navState.users ? 'block' : 'hidden'}`}>
                                <button onClick={() => setCurrentView('users_incub')} className={`app-nav-item text-sm w-full ${currentView === 'users_incub' ? 'active' : ''}`}>Incubés</button>
                                {isSuperAdmin && <><button onClick={() => setCurrentView('users_coach')} className={`app-nav-item text-sm w-full ${currentView === 'users_coach' ? 'active' : ''}`}>Coachs</button><button onClick={() => setCurrentView('users_admin')} className={`app-nav-item text-sm w-full ${currentView === 'users_admin' ? 'active' : ''}`}>Admins</button></>}
                            </div>
                        </div>
                        {isSuperAdmin && (
                            <div>
                                <button onClick={() => toggleNav('parcours')} className="app-nav-item w-full flex justify-between"><span className="flex gap-3"><Icon name="layers" size={20}/> Programmes</span><Icon name="chevronDown" size={14}/></button>
                                <div className={`pl-4 ml-2 ${navState.parcours ? 'block' : 'hidden'}`}>
                                    <button onClick={() => setCurrentView('parcours_p1')} className={`app-nav-item text-sm w-full ${currentView === 'parcours_p1' ? 'active' : ''}`}>Parcours 1</button>
                                    <button onClick={() => setCurrentView('parcours_p2')} className={`app-nav-item text-sm w-full ${currentView === 'parcours_p2' ? 'active' : ''}`}>Parcours 2</button>
                                    <button onClick={() => setCurrentView('parcours_p3')} className={`app-nav-item text-sm w-full ${currentView === 'parcours_p3' ? 'active' : ''}`}>Certification</button>
                                </div>
                            </div>
                        )}
                    </nav>
                </aside>

                <main className="app-main custom-scroll">
                    {currentView === 'dashboard' && (
                        <>
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Aperçu</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <StatCard title="Participants" value={metrics.total} sub="Incubés" color="indigo" icon="users"/>
                                <StatCard title="Actifs" value={metrics.active} sub="Niveau > 0" color="green" icon="play"/>
                                <StatCard title="Niveau moyen" value={metrics.avgLevel} sub="Progression" color="blue" icon="layers"/>
                                <StatCard title="XP total" value={metrics.totalXP} sub="Engagement" color="orange" icon="star"/>
                                <StatCard title="Fin parcours 1" value={metrics.p1Finishers} sub="Idéateurs" color="purple" icon="rocket"/>
                                <StatCard title="Certifiés" value={metrics.certified} sub="Experts" color="red" icon="award"/>
                            </div>
                        </>
                    )}

                    {currentView.startsWith('users') && (
                        <div>
                            <div className="flex justify-between items-end mb-6">
                                <h2 className="text-xl font-bold text-gray-900 capitalize">{currentView.replace('_', ' ')}</h2>
                                {isSuperAdmin && <button onClick={handleCreateUser} className="btn-primary text-sm"><Icon name="plus" size={18}/> Créer un participant</button>}
                            </div>
                            <div className="card-modern overflow-hidden">
                                <table className="table-modern">
                                    <thead>
                                        <tr><th>Nom</th><th>Rôle</th><th>Niveau</th><th>BMC</th><th className="text-right">Actions</th></tr>
                                    </thead>
                                    <tbody>
                                        {visibleUsers.filter(u => {
                                            if (currentView === 'users_incub') return u.role === 'incubé';
                                            if (currentView === 'users_coach') return u.role === 'coach';
                                            if (currentView === 'users_admin') return u.role === 'admin';
                                            return false;
                                        }).map(u => (
                                            <tr key={u.id}>
                                                <td className="font-semibold text-gray-900">{u.prenom} {u.nom}</td>
                                                <td><span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 capitalize">{u.role}</span></td>
                                                <td className="font-semibold text-indigo-600">Niv. {u.level}</td>
                                                <td>{u.role === 'incubé' && u.level >= 7 ? <button onClick={() => setShowUserBMC(u)} className="text-emerald-600 hover:text-emerald-700 font-medium"><Icon name="file" size={18}/></button> : '–'}</td>
                                                <td className="text-right">
                                                    <button onClick={() => setEditingUser(u)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Icon name="edit" size={18}/></button>
                                                    {isSuperAdmin && <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Icon name="trash" size={18}/></button>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {currentView.startsWith('parcours') && isSuperAdmin && (
                        <div>
                            <div className="flex justify-between items-end mb-6">
                                <h2 className="text-xl font-bold text-gray-900 capitalize">{currentView.replace('_', ' ')}</h2>
                                <button onClick={handleCreateModule} className="btn-primary text-sm"><Icon name="plus" size={18}/> Créer un module</button>
                            </div>
                            <div className="space-y-3">
                                {modules.filter(m => m.parcours.toLowerCase() === currentView.split('_')[1]).map((m, i) => (
                                    <div key={i} className="card-modern p-5 flex justify-between items-center hover:border-indigo-200 transition-colors">
                                        <div onClick={() => { setSelectedModule(m); setActiveTab('general'); }} className="cursor-pointer flex-1">
                                            <div className="font-bold text-sm theme-text-main">{m.title} (Niv {m.requiredLevel})</div>
                                            <div className="text-[10px] theme-text-muted">{m.shortDesc}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setSelectedModule(m); setActiveTab('general'); }} className="p-2 theme-text-muted hover:text-white"><Icon name="edit"/></button>
                                            <button onClick={() => handleDeleteModule(m.id)} className="p-2 text-gray-600 hover:text-red-500"><Icon name="trash"/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Modale édition module */}
            {selectedModule && isSuperAdmin && (
                <div className="modal-backdrop justify-end">
                    <div className="modal-panel w-full max-w-[600px] h-full animate-slide-in">
                        <div className="p-6 border-b theme-border flex justify-between items-center">
                            <h3 className="font-bold theme-text-main font-tech text-lg">Édition Complète</h3>
                            <button onClick={() => setSelectedModule(null)} className="theme-text-muted"><Icon name="x"/></button>
                        </div>
                        <div className="flex border-b theme-border theme-bg-element">
                            {['general', 'theory', 'quiz', 'form'].map(t => (
                                <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-3 text-[10px] font-bold uppercase ${activeTab === t ? 'text-white bg-blue-600' : 'theme-text-muted'}`}>{t}</button>
                            ))}
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 custom-scroll space-y-6">
                            {activeTab === 'general' && (
                                <div className="space-y-4">
                                    <div><label className="text-[10px] font-bold theme-text-muted">Titre</label><input value={selectedModule.title} onChange={e => setSelectedModule({ ...selectedModule, title: e.target.value })} className="w-full p-3 input-cyber rounded"/></div>
                                    <div><label className="text-[10px] font-bold theme-text-muted">Description</label><textarea value={selectedModule.shortDesc} onChange={e => setSelectedModule({ ...selectedModule, shortDesc: e.target.value })} className="w-full p-3 input-cyber rounded h-20"/></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-[10px] font-bold theme-text-muted">Niveau Requis</label><input type="number" value={selectedModule.requiredLevel} onChange={e => setSelectedModule({ ...selectedModule, requiredLevel: parseInt(e.target.value) })} className="w-full p-3 input-cyber rounded"/></div>
                                        <div><label className="text-[10px] font-bold theme-text-muted">XP</label><input type="number" value={selectedModule.xp} onChange={e => setSelectedModule({ ...selectedModule, xp: parseInt(e.target.value) })} className="w-full p-3 input-cyber rounded"/></div>
                                    </div>
                                    <div><label className="text-[10px] font-bold theme-text-muted">ID Vidéo</label><input value={selectedModule.video || ''} onChange={e => setSelectedModule({ ...selectedModule, video: e.target.value })} className="w-full p-3 input-cyber rounded"/></div>
                                </div>
                            )}
                            {activeTab === 'theory' && (
                                <div className="space-y-4">
                                    <div><label className="text-[10px] font-bold theme-text-muted">Titre Théorie</label><input value={selectedModule.theoryTitle || ''} onChange={e => setSelectedModule({ ...selectedModule, theoryTitle: e.target.value })} className="w-full p-3 input-cyber rounded"/></div>
                                    <label className="text-[10px] font-bold theme-text-muted">Paragraphes</label>
                                    {(selectedModule.paragraphs || []).map((p, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <textarea value={p.text} onChange={e => updateParagraph(idx, e.target.value)} className="w-full p-3 input-cyber rounded h-24 text-sm"/>
                                            <button onClick={() => removeParagraph(idx)} className="text-red-500 hover:text-red-400"><Icon name="trash"/></button>
                                        </div>
                                    ))}
                                    <button onClick={addParagraph} className="w-full py-2 border border-dashed theme-border text-xs theme-text-muted hover:text-white">+ Ajouter Paragraphe</button>
                                </div>
                            )}
                            {activeTab === 'quiz' && (
                                <div className="space-y-6">
                                    {(selectedModule.quiz || []).map((q, i) => (
                                        <div key={i} className="p-4 theme-bg-element rounded border theme-border space-y-2 relative group">
                                            <button onClick={() => removeQuestion(i)} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100"><Icon name="trash" size={14}/></button>
                                            <input value={q.q} onChange={e => updateQuestion(i, 'q', e.target.value)} className="w-full bg-transparent border-b theme-border text-xs font-bold theme-text-main mb-2" placeholder="Question"/>
                                            {q.options.map((o, oi) => (
                                                <div key={oi} className="flex gap-2 items-center">
                                                    <div className={`w-3 h-3 rounded-full border cursor-pointer ${q.correct === oi ? 'bg-green-500 border-green-500' : 'border-gray-500'}`} onClick={() => setCorrectOption(i, oi)}></div>
                                                    <input value={o} onChange={e => updateOption(i, oi, e.target.value)} className="bg-transparent w-full text-[10px] theme-text-muted"/>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                    <button onClick={addQuestion} className="w-full py-2 bg-blue-900/30 text-blue-400 text-xs font-bold rounded">+ Ajouter Question</button>
                                </div>
                            )}
                            {activeTab === 'form' && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-yellow-900/20 text-yellow-500 text-xs border border-yellow-500/30 rounded">⚠️ Zone Expert : Édition du JSON de structure du formulaire.</div>
                                    <textarea value={JSON.stringify(selectedModule.formStructure, null, 2)} onChange={e => { try { setSelectedModule({ ...selectedModule, formStructure: JSON.parse(e.target.value) }); } catch (err) {} }} className="w-full h-64 bg-black border theme-border text-green-400 font-mono text-xs p-3 rounded"/>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t theme-border"><button onClick={handleSaveModule} className="w-full py-3 btn-cyber rounded-lg font-bold">SAUVEGARDER TOUT</button></div>
                    </div>
                </div>
            )}

            {/* Modale édition user */}
            {editingUser && (
                <div className="modal-backdrop">
                    <div className="modal-panel w-full max-w-lg p-6 space-y-4">
                        <h3 className="font-bold theme-text-main text-lg font-tech uppercase">{editingUser.id ? 'Modifier' : 'Créer'}</h3>
                        <input value={editingUser.prenom} onChange={e => setEditingUser({ ...editingUser, prenom: e.target.value })} className="w-full p-3 rounded-lg input-cyber text-sm" placeholder="Prénom"/>
                        <input value={editingUser.nom} onChange={e => setEditingUser({ ...editingUser, nom: e.target.value })} className="w-full p-3 rounded-lg input-cyber text-sm" placeholder="Nom"/>
                        <input value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} className="w-full p-3 rounded-lg input-cyber text-sm" placeholder="Email"/>
                        {isSuperAdmin && <select value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })} className="w-full p-3 rounded-lg input-cyber text-sm"><option value="incubé">Incubé</option><option value="coach">Coach</option><option value="admin">Admin</option></select>}
                        {editingUser.role === 'incubé' && (
                            <div className="theme-bg-element p-4 rounded border border-blue-500/30">
                                <label className="text-xs text-blue-400 font-bold uppercase mb-1 block">Niveau (0=Bloqué, 1=Début)</label>
                                <input type="number" value={editingUser.level} onChange={e => setEditingUser({ ...editingUser, level: parseInt(e.target.value) })} className="w-full p-3 rounded-lg input-cyber text-sm font-bold"/>
                            </div>
                        )}
                        <div className="flex gap-4">
                            <button onClick={() => setEditingUser(null)} className="flex-1 py-3 theme-text-muted hover:text-white">Annuler</button>
                            <button onClick={handleSaveUser} className="flex-1 py-3 btn-cyber rounded-xl font-bold">Sauvegarder</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- UserInterface (Incubé) ---
const UserInterface = ({ user, logout, setUsers, theme, toggleTheme }) => {
    const [modules, setModules] = useState(() => JSON.parse(localStorage.getItem('ga_master_v91')) || INITIAL_MODULES);
    const [activeMod, setActiveMod] = useState(null);
    const [step, setStep] = useState(1);
    const [videoWatched, setVideoWatched] = useState(false);
    const [answers, setAnswers] = useState({});
    const [formValues, setFormValues] = useState({});
    const [parcoursOpen, setParcoursOpen] = useState({ P1: true, P2: false, P3: false });
    const [showBMC, setShowBMC] = useState(false);

    const parcoursData = [
        { id: 'P1', title: "1. L'Idéateur (Pré-Seed)", minLvl: 1 },
        { id: 'P2', title: '2. La Jeune Pousse (Seed)', minLvl: 8 },
        { id: 'P3', title: '3. Certification', minLvl: 16 }
    ];

    useEffect(() => {
        if (user.level > 0) {
            const current = modules.find(m => m.requiredLevel === user.level) || modules[modules.length - 1];
            setActiveMod(current);
            if (current.parcours === 'P2') setParcoursOpen({ P1: false, P2: true, P3: false });
            if (current.parcours === 'P3') setParcoursOpen({ P1: false, P2: false, P3: true });
        }
    }, [user.level]);

    useEffect(() => { setStep(1); setVideoWatched(false); setAnswers({}); setFormValues({}); }, [activeMod]);

    const saveBMC = (values) => {
        const updatedBmcData = { ...(user.bmcData || {}), ...values };
        const updatedUsers = (JSON.parse(localStorage.getItem('ga_users_v91') || '[]')).map(u =>
            u.id === user.id ? { ...u, bmcData: updatedBmcData } : u
        );
        localStorage.setItem('ga_users_v91', JSON.stringify(updatedUsers));
    };

    const unlockNextLevel = () => {
        saveBMC(formValues);
        const nextLevel = user.level + 1;
        const updatedUsers = (JSON.parse(localStorage.getItem('ga_users_v91') || '[]')).map(u =>
            u.id === user.id ? { ...u, level: nextLevel, xp: u.xp + 500 } : u
        );
        localStorage.setItem('ga_users_v91', JSON.stringify(updatedUsers));
        alert(`🎉 Niveau ${user.level} validé ! Passage au Niveau ${nextLevel}.`);
        window.location.reload();
    };

    const finishExam = () => {
        let s = 0;
        activeMod.quiz.forEach((q, i) => { if (answers[i] === q.correct) s++; });
        if ((s / activeMod.quiz.length) * 100 >= 80) unlockNextLevel();
        else alert('Échec (<80%). Réessayez.');
    };

    const handleSimulateVideo = () => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            if (progress >= 80) { clearInterval(interval); setVideoWatched(true); }
        }, 100);
    };

    const finishQuiz = (score) => {
        if (score >= 80) { alert('Bravo ! Atelier débloqué.'); setStep(3); }
        else { alert('Score < 80%. Retour Théorie.'); setStep(1); setVideoWatched(false); }
    };

    const handleFormChange = (id, val) => setFormValues(prev => ({ ...prev, [id]: val }));

    const renderField = (f) => {
        const val = formValues[f.id] || '';
        if (f.type && f.type.includes('textarea')) return <textarea value={val} onChange={e => handleFormChange(f.id, e.target.value)} className="w-full p-3 input-cyber rounded-lg text-sm h-24" placeholder={f.placeholder}/>;
        if (f.type === 'slider') return <div className="space-y-1"><div className="flex justify-between text-xs text-gray-400"><span>1</span><span className="text-blue-400">{val}</span><span>10</span></div><input type="range" min="1" max="10" value={val} onChange={e => handleFormChange(f.id, e.target.value)} className="w-full accent-blue-500"/></div>;
        if (f.type === 'select') return <select value={val} onChange={e => handleFormChange(f.id, e.target.value)} className="w-full p-3 input-cyber rounded"><option value="">Choisir...</option>{(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}</select>;
        return <input value={val} onChange={e => handleFormChange(f.id, e.target.value)} className="w-full p-3 input-cyber rounded" placeholder={f.placeholder}/>;
    };

    const renderBMC = () => {
        const data = user.bmcData || {};
        const map = {
            kp: data['input-partners'] || '-', ka: data['input-activities'] || '-', kr: data['input-resources'] || '-',
            vp: data['input-value-prop'] || '-', cr: data['input-relations'] || '-', ch: data['input-channels'] || '-',
            cs: data['input-segments'] || '-', cst: data['input-costs'] || '-', rev: data['input-revenue'] || '-'
        };
        return (
            <div className="bmc-overlay">
                <div className="bmc-inner">
                    <div className="bmc-header">
                        <h1 className="bmc-title">Mon Business Model Canvas</h1>
                        <button onClick={() => setShowBMC(false)} className="bmc-close-btn" aria-label="Fermer"><Icon name="x" size={24}/></button>
                    </div>
                    <div className="bmc-grid-wrapper">
                        <div className="bmc-grid">
                            <div className="bmc-block kp"><h3>Partenaires Clés</h3><div className="bmc-content">{map.kp}</div></div>
                            <div className="bmc-block ka"><h3>Activités Clés</h3><div className="bmc-content">{map.ka}</div></div>
                            <div className="bmc-block kr"><h3>Ressources Clés</h3><div className="bmc-content">{map.kr}</div></div>
                            <div className="bmc-block vp"><h3>Proposition de Valeur</h3><div className="bmc-content">{map.vp}</div></div>
                            <div className="bmc-block cr"><h3>Relations Clients</h3><div className="bmc-content">{map.cr}</div></div>
                            <div className="bmc-block ch"><h3>Canaux</h3><div className="bmc-content">{map.ch}</div></div>
                            <div className="bmc-block cs"><h3>Segments Clients</h3><div className="bmc-content">{map.cs}</div></div>
                            <div className="bmc-block cst"><h3>Coûts</h3><div className="bmc-content">{map.cst}</div></div>
                            <div className="bmc-block rev"><h3>Revenus</h3><div className="bmc-content">{map.rev}</div></div>
                        </div>
                    </div>
                    <div className="bmc-print-wrap"><button type="button" onClick={() => window.print()} className="bmc-print-btn">Imprimer / PDF</button></div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full overflow-hidden animate-fade-in">
            {showBMC && renderBMC()}
            <header className="app-header">
                <div className="app-logo">
                    <div className="app-logo-icon">CERIP</div>
                    <span>CERIP Sénégal <span className="text-xs font-medium text-gray-500 uppercase ml-1">Espace incubé</span></span>
                </div>
                <div className="flex items-center gap-4">
                    {user.level >= 7 && <button onClick={() => setShowBMC(true)} className="btn-primary text-sm"><Icon name="layers" size={18}/> Voir mon BMC</button>}
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-semibold text-gray-900">{user.prenom} {user.nom}</div>
                        <div className="text-xs text-indigo-600 font-medium">Niv. {user.level}</div>
                    </div>
                    <button onClick={logout} className="btn-secondary text-sm"><Icon name="logout" size={16}/> Déconnexion</button>
                    <ThemeToggle theme={theme} toggleTheme={toggleTheme}/>
                </div>
            </header>
            <div className="flex flex-1 overflow-hidden">
                <aside className="app-sidebar custom-scroll w-[20%] min-w-[240px]">
                    {parcoursData.map(p => (
                        <div key={p.id}>
                            <button
                                onClick={() => user.level >= p.minLvl && setParcoursOpen(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                                className={`parcours-section ${user.level < p.minLvl ? 'locked' : ''}`}
                            >
                                <span>{p.title}</span>
                                {user.level < p.minLvl ? <Icon name="lock" size={14}/> : <Icon name={parcoursOpen[p.id] ? 'chevronDown' : 'chevronRight'} size={14}/>}
                            </button>
                            {parcoursOpen[p.id] && user.level >= p.minLvl && (
                                <div className="parcours-modules">
                                    {modules.filter(m => m.parcours === p.id).map(m => {
                                        const isLocked = user.level < m.requiredLevel;
                                        const isCurrent = user.level === m.requiredLevel;
                                        const isDone = user.level > m.requiredLevel;
                                        return (
                                            <div key={m.id} className={`parcours-module-item ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''} ${isDone ? 'done' : ''}`}>
                                                <span className="truncate">{m.title}</span>
                                                {isLocked ? <Icon name="lock" size={14}/> : (isDone ? <Icon name="check" size={14} className="text-emerald-500"/> : <Icon name="play" size={14} className="text-indigo-500"/>)}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </aside>
                <main className="flex-1 overflow-y-auto custom-scroll p-10 relative bg-[var(--surface-50)]">
                    {user.level === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon"><Icon name="lock" size={40}/></div>
                            <h2 className="empty-title">Parcours verrouillé</h2>
                            <p className="empty-desc">En attente de validation par votre coach.</p>
                        </div>
                    ) : activeMod && (
                        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
                            <h1 className="text-3xl font-black text-[var(--text-primary)] mb-6 tracking-tight">{activeMod.title}</h1>

                            {activeMod.id && (activeMod.id.includes('EXAM') || activeMod.parcours === 'P3') ? (
                                <div className="content-card">
                                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Examen de passage</h2>
                                    {activeMod.quiz.map((q, i) => (
                                        <div key={i} className="mb-6 text-left">
                                            <div className="text-[var(--text-primary)] mb-3 font-semibold">{q.q}</div>
                                            <div className="space-y-2">
                                                {q.options.map((o, oi) => (
                                                    <button key={oi} onClick={() => setAnswers({ ...answers, [i]: oi })} className={`quiz-option ${answers[i] === oi ? 'selected' : ''}`}>{o}</button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={finishExam} className="btn-action-primary mt-6">Valider l'examen</button>
                                </div>
                            ) : (
                                <>
                                    {step === 1 && (
                                        <div className="content-card space-y-6">
                                            <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                                                <span className="content-step-badge step-1">1</span>
                                                Immersion théorique
                                            </h3>
                                            <div className="prose text-[var(--text-secondary)] leading-relaxed">{activeMod.paragraphs && activeMod.paragraphs.map(para => <p key={para.id}>{para.text}</p>)}</div>
                                            <div className="bg-[var(--surface-50)] p-5 rounded-[var(--radius-md)] border border-[var(--border-light)]">
                                                <div className="flex justify-between text-sm text-[var(--text-secondary)] mb-3"><span>Progression vidéo (min. 80%)</span><span className="font-semibold text-[var(--text-primary)]">{videoWatched ? '100%' : '0%'}</span></div>
                                                <button type="button" onClick={() => { if (!videoWatched) { alert('Regardez la vidéo'); return; } setStep(2); }} className={`w-full py-3 rounded-[var(--radius-md)] font-semibold transition-all ${videoWatched ? 'btn-action-primary' : 'bg-[var(--surface-200)] text-[var(--text-muted)] cursor-not-allowed'}`}>Passer au quiz</button>
                                            </div>
                                        </div>
                                    )}
                                    {step === 2 && (
                                        <div className="content-card">
                                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3">
                                                <span className="content-step-badge step-2">2</span>
                                                Quiz (min. 80%)
                                            </h3>
                                            <p className="text-[var(--text-secondary)] mb-4 font-medium">Question : {activeMod.quiz && activeMod.quiz[0] && activeMod.quiz[0].q}</p>
                                            <div className="space-y-2">{activeMod.quiz && activeMod.quiz[0] && activeMod.quiz[0].options.map((o, i) => <button key={i} type="button" onClick={() => finishQuiz(i === activeMod.quiz[0].correct ? 100 : 0)} className="quiz-option">{o}</button>)}</div>
                                        </div>
                                    )}
                                    {step === 3 && (
                                        <div className="content-card">
                                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3">
                                                <span className="content-step-badge step-3">3</span>
                                                Atelier
                                            </h3>
                                            {activeMod.formStructure && activeMod.formStructure.map((sec, i) => (
                                                <div key={i} className="mb-6">
                                                    <h4 className="section-label">{sec.section}</h4>
                                                    <div className="grid gap-4">{sec.fields && sec.fields.map((f, j) => <div key={j}><label className="text-xs text-[var(--text-secondary)] block mb-1 font-semibold">{f.label}</label>{renderField(f)}</div>)}</div>
                                                </div>
                                            ))}
                                            <button type="button" onClick={unlockNextLevel} className="btn-action-success">Valider et passer au suivant</button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </main>
                <aside className="video-panel flex-shrink-0">
                    <div className="video-wrapper">
                        {activeMod && activeMod.video ? <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${activeMod.video}`} frameBorder="0" allowFullScreen title="Vidéo du module"></iframe> : <div className="video-placeholder">Vidéo</div>}
                        {step === 1 && !videoWatched && <div className="video-overlay-btn"><button type="button" onClick={handleSimulateVideo} className="video-simulate-btn">▶ Simuler la lecture (80%)</button></div>}
                    </div>
                </aside>
            </div>
        </div>
    );
};

// --- App ---
const App = () => {
    const [users, setUsers] = useState(() => {
        try { return JSON.parse(localStorage.getItem('ga_users_v91')) || INITIAL_USERS; }
        catch (e) { return INITIAL_USERS; }
    });
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState('dark');
    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    useEffect(() => {
        if (theme === 'light') document.body.classList.add('light-mode');
        else document.body.classList.remove('light-mode');
    }, [theme]);

    useEffect(() => localStorage.setItem('ga_users_v91', JSON.stringify(users)), [users]);

    if (!user) return <LoginScreen users={users} onLogin={setUser} setUsers={setUsers} theme={theme} toggleTheme={toggleTheme} />;
    if (user.role === 'admin' || user.role === 'coach') return <ManagementInterface user={user} users={users} setUsers={setUsers} logout={() => setUser(null)} theme={theme} toggleTheme={toggleTheme} />;
    return <UserInterface user={user} logout={() => setUser(null)} setUsers={setUsers} theme={theme} toggleTheme={toggleTheme} />;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
