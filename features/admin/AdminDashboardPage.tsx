import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BriefcaseBusiness,
  CircleDollarSign,
  Gauge,
  Headphones,
  Loader2,
  RefreshCw,
  Server,
  ShieldCheck,
  Target,
  Trash2,
  UserCog,
  Users,
  Video,
  X
} from 'lucide-react';
import { UserType } from '../../types';
import {
  AdminContentItem,
  AdminDashboardData,
  AdminPrediction,
  AdminUser,
  approveAdminUser,
  createAdminAssistanceNote,
  createAdminPrediction,
  deleteAdminContent,
  fetchAdminDashboardData,
  migrateFirebaseStorageVideos,
  StorageMigrationResult,
  updateAdminPredictionStatus,
  updateAdminUserStatus,
  updateAdminUserType,
  updateContentModeration
} from '../../services/adminService';

type AdminTab = 'overview' | 'users' | 'content' | 'finance' | 'partners' | 'support' | 'predictions' | 'app';
type PanelState = { type: 'user'; item: AdminUser } | { type: 'content'; item: AdminContentItem } | { type: 'prediction'; item: AdminPrediction } | null;

const emptyData: AdminDashboardData = {
  users: [],
  content: [],
  reportages: [],
  finance: { walletCount: 0, totalBalance: 0, pendingWithdrawals: 0, transactionCount: 0 },
  partnerships: { count: 0, pending: 0, items: [] },
  support: { open: 0, urgent: 0, items: [] },
  predictions: { count: 0, pending: 0, items: [] },
  infrastructure: { firebaseProject: '', cloudinaryEnabled: false, pwaEnabled: false, lastCheckedAt: '', collections: [] }
};

const typeLabels: Record<string, string> = {
  [UserType.ATHLETE]: 'Athlètes',
  [UserType.RECRUITER]: 'Recruteurs',
  [UserType.CLUB]: 'Clubs',
  [UserType.PRESS]: 'Presse',
  [UserType.VISITOR]: 'Visiteurs',
  admin: 'Admins'
};

const n = (value: number) => new Intl.NumberFormat('fr-FR').format(value);

const Pill = ({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'bad' }) => {
  const classes = {
    neutral: 'border-white/10 bg-white/10 text-white/70',
    good: 'border-[#19DB8A]/25 bg-[#19DB8A]/10 text-[#19DB8A]',
    warn: 'border-[#FF8A3C]/25 bg-[#FF8A3C]/10 text-[#FFB178]',
    bad: 'border-red-500/25 bg-red-500/10 text-red-300'
  }[tone];
  return <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${classes}`}>{children}</span>;
};

const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData>(emptyData);
  const [tab, setTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adminError, setAdminError] = useState('');
  const [panel, setPanel] = useState<PanelState>(null);
  const [userQuery, setUserQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userSort, setUserSort] = useState<'recent' | 'name' | 'type' | 'status'>('recent');
  const [contentFilter, setContentFilter] = useState('all');
  const [supportTitle, setSupportTitle] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [migrationResult, setMigrationResult] = useState<StorageMigrationResult | null>(null);
  const [prediction, setPrediction] = useState({ title: '', match: '', odds: '', analysis: '', status: 'en attente' as 'brouillon' | 'en attente' | 'publié' });

  const load = async () => {
    setLoading(true);
    try {
      setData(await fetchAdminDashboardData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const allContent = useMemo(() => [...data.content, ...data.reportages], [data.content, data.reportages]);
  const usersByType = useMemo(() => data.users.reduce<Record<string, number>>((acc, user) => {
    acc[user.type] = (acc[user.type] || 0) + 1;
    return acc;
  }, {}), [data.users]);
  const flaggedContent = allContent.filter((item) => item.reports > 0 || item.status.toLowerCase().includes('vérifier'));

  const visibleUsers = data.users.filter((user) => {
    const haystack = `${user.displayName} ${user.email} ${user.type} ${user.status} ${user.country} ${user.city}`.toLowerCase();
    const matchesSearch = haystack.includes(userQuery.toLowerCase());
    const matchesType = userTypeFilter === 'all' || user.type === userTypeFilter;
    const matchesStatus = userStatusFilter === 'all' || user.status === userStatusFilter;
    return matchesSearch && matchesType && matchesStatus;
  }).sort((a, b) => {
    if (userSort === 'name') return a.displayName.localeCompare(b.displayName);
    if (userSort === 'type') return a.type.localeCompare(b.type);
    if (userSort === 'status') return a.status.localeCompare(b.status);
    return Date.parse(b.createdAt || '') - Date.parse(a.createdAt || '');
  });

  const visibleContent = allContent.filter((item) => contentFilter === 'all' || item.source === contentFilter || item.status === contentFilter);

  const run = async (id: string, action: () => Promise<void>) => {
    setSavingId(id);
    setAdminError('');
    try {
      await action();
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setAdminError(message);
      console.error('Admin action failed:', error);
    } finally {
      setSavingId(null);
    }
  };

  const tabs: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Vue centrale', icon: <Gauge size={16} /> },
    { id: 'users', label: 'Utilisateurs', icon: <Users size={16} /> },
    { id: 'content', label: 'Médias', icon: <Video size={16} /> },
    { id: 'predictions', label: 'Pronostics', icon: <Target size={16} /> },
    { id: 'finance', label: 'Finance', icon: <CircleDollarSign size={16} /> },
    { id: 'partners', label: 'Partenariats', icon: <BriefcaseBusiness size={16} /> },
    { id: 'support', label: 'Assistance', icon: <Headphones size={16} /> },
    { id: 'app', label: 'App & Infra', icon: <Server size={16} /> }
  ];

  const openUserType = (type: string) => {
    setUserTypeFilter(type);
    setTab('users');
  };

  const createSupport = () => run('support', async () => {
    if (!supportTitle.trim() || !supportMessage.trim()) return;
    await createAdminAssistanceNote({ title: supportTitle, message: supportMessage, priority: 'normal' });
    setSupportTitle('');
    setSupportMessage('');
  });

  const createPrediction = () => run('prediction', async () => {
    if (!prediction.title.trim() || !prediction.match.trim()) return;
    await createAdminPrediction(prediction);
    setPrediction({ title: '', match: '', odds: '', analysis: '', status: 'en attente' });
  });

  const runStorageMigration = (dryRun: boolean) => run(dryRun ? 'migration-dry-run' : 'migration-run', async () => {
    const result = await migrateFirebaseStorageVideos({
      dryRun,
      limit: 25
    });
    setMigrationResult(result);
    if (!dryRun) await load();
  });

  return (
    <div className="h-screen overflow-y-auto bg-[#050505] text-white">
      <header className="border-b border-white/10 bg-black/60 px-4 py-5 backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#19DB8A] p-3 text-black"><ShieldCheck size={24} /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#19DB8A]">Choose-Me Admin Center</p>
              <h1 className="text-2xl font-black md:text-3xl">Pilotage centralisé</h1>
              <p className="mt-1 text-sm text-white/50">Comptes, médias, pronostics, finance, assistance, app et infrastructure.</p>
            </div>
          </div>
          <button onClick={load} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-bold">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Actualiser
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 md:px-8">
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl border px-4 text-xs font-bold ${tab === item.id ? 'border-[#19DB8A] bg-[#19DB8A] text-black' : 'border-white/10 bg-white/[0.055] text-white/65'}`}>
              {item.icon}{item.label}
            </button>
          ))}
        </div>

        {adminError && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">
            <span>{adminError}</span>
            <button onClick={() => setAdminError('')} className="rounded-full bg-white/10 p-1 text-white/70 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}

        {loading ? <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-[#19DB8A]" /></div> : (
          <div className="space-y-5">
            {tab === 'overview' && (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric icon={<Users size={22} />} label="Utilisateurs" value={n(data.users.length)} onClick={() => setTab('users')} />
                  <Metric icon={<Video size={22} />} label="Médias" value={n(allContent.length)} tone="blue" onClick={() => setTab('content')} />
                  <Metric icon={<AlertTriangle size={22} />} label="À modérer" value={n(flaggedContent.length)} tone="orange" onClick={() => { setContentFilter('à vérifier'); setTab('content'); }} />
                  <Metric icon={<Headphones size={22} />} label="Assistance" value={n(data.support.open)} tone="red" onClick={() => setTab('support')} />
                </div>
                <Section title="Types de comptes" icon={<UserCog size={18} />}>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(typeLabels).map(([type, label]) => (
                      <button key={type} onClick={() => openUserType(type)} className="rounded-2xl border border-white/10 bg-black/25 p-4 text-left hover:border-[#19DB8A]/50">
                        <p className="text-sm font-bold">{label}</p>
                        <p className="mt-2 text-2xl font-black text-[#19DB8A]">{n(usersByType[type] || 0)}</p>
                      </button>
                    ))}
                  </div>
                </Section>
                <ContentTable items={flaggedContent.length ? flaggedContent : allContent.slice(0, 8)} savingId={savingId} setPanel={setPanel} run={run} />
              </>
            )}

            {tab === 'users' && (
              <Section title="Gestion des utilisateurs" icon={<Users size={18} />}>
                <div className="mb-4 grid gap-2 md:grid-cols-[1fr_180px_180px_180px]">
                  <input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="Rechercher nom, email, pays..." className="h-11 rounded-2xl border border-white/10 bg-black/35 px-4 text-sm outline-none" />
                  <select value={userTypeFilter} onChange={(e) => setUserTypeFilter(e.target.value)} className="h-11 rounded-2xl border border-white/10 bg-black px-3 text-sm">
                    <option value="all">Tous les types</option>
                    {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <select value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)} className="h-11 rounded-2xl border border-white/10 bg-black px-3 text-sm">
                    <option value="all">Tous statuts</option>
                    <option value="actif">Actifs</option>
                    <option value="verification">À approuver</option>
                    <option value="suspendu">Suspendus</option>
                  </select>
                  <select value={userSort} onChange={(e) => setUserSort(e.target.value as typeof userSort)} className="h-11 rounded-2xl border border-white/10 bg-black px-3 text-sm">
                    <option value="recent">Plus récents</option>
                    <option value="name">Nom</option>
                    <option value="type">Type</option>
                    <option value="status">Statut</option>
                  </select>
                </div>
                <UserTable users={visibleUsers} savingId={savingId} setPanel={setPanel} run={run} />
              </Section>
            )}

            {tab === 'content' && (
              <Section title="Médias et modération" icon={<ShieldCheck size={18} />}>
                <div className="mb-4 flex flex-wrap gap-2">
                  {['all', 'performances', 'publication', 'reportage', 'à vérifier', 'masqué', 'publié'].map((filter) => (
                    <button key={filter} onClick={() => setContentFilter(filter)} className={`rounded-2xl border px-3 py-2 text-xs font-bold ${contentFilter === filter ? 'border-[#19DB8A] bg-[#19DB8A] text-black' : 'border-white/10 bg-white/10'}`}>{filter}</button>
                  ))}
                </div>
                <ContentTable items={visibleContent} savingId={savingId} setPanel={setPanel} run={run} />
              </Section>
            )}

            {tab === 'predictions' && (
              <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <Section title="Publier un pronostic" icon={<Target size={18} />}>
                  <div className="space-y-3">
                    <input value={prediction.title} onChange={(e) => setPrediction({ ...prediction, title: e.target.value })} placeholder="Titre" className="field" />
                    <input value={prediction.match} onChange={(e) => setPrediction({ ...prediction, match: e.target.value })} placeholder="Match ou événement" className="field" />
                    <input value={prediction.odds} onChange={(e) => setPrediction({ ...prediction, odds: e.target.value })} placeholder="Cote / probabilité" className="field" />
                    <textarea value={prediction.analysis} onChange={(e) => setPrediction({ ...prediction, analysis: e.target.value })} placeholder="Analyse" rows={5} className="field min-h-28 py-3" />
                    <select value={prediction.status} onChange={(e) => setPrediction({ ...prediction, status: e.target.value as any })} className="field">
                      <option value="brouillon">Brouillon</option>
                      <option value="en attente">En attente</option>
                      <option value="publié">Publier</option>
                    </select>
                    <button onClick={createPrediction} className="h-11 rounded-2xl bg-[#19DB8A] px-4 text-sm font-black text-black">Enregistrer le pronostic</button>
                  </div>
                </Section>
                <Section title="File des pronostics" icon={<Activity size={18} />}>
                  <List items={data.predictions.items} render={(item) => (
                    <div className="flex items-center justify-between gap-3">
                      <button onClick={() => setPanel({ type: 'prediction', item })} className="text-left">
                        <p className="font-bold">{item.title}</p>
                        <p className="text-xs text-white/45">{item.match} · {item.odds || 'cote non renseignée'}</p>
                      </button>
                      <div className="flex gap-2">
                        <Pill tone={item.status === 'publié' ? 'good' : item.status === 'en attente' ? 'warn' : 'neutral'}>{item.status}</Pill>
                        <button onClick={() => run(item.id, () => updateAdminPredictionStatus(item.id, 'brouillon'))} className="mini">Brouillon</button>
                        <button onClick={() => run(item.id, () => updateAdminPredictionStatus(item.id, 'en attente'))} className="mini warn">Attente</button>
                        <button onClick={() => run(item.id, () => updateAdminPredictionStatus(item.id, 'publié'))} className="mini">Publier</button>
                      </div>
                    </div>
                  )} />
                </Section>
              </div>
            )}

            {tab === 'finance' && <FinanceView data={data} />}
            {tab === 'partners' && <PartnerView data={data} />}
            {tab === 'support' && <SupportView data={data} savingId={savingId} title={supportTitle} message={supportMessage} setTitle={setSupportTitle} setMessage={setSupportMessage} createSupport={createSupport} />}
            {tab === 'app' && <InfraView data={data} savingId={savingId} migrationResult={migrationResult} runStorageMigration={runStorageMigration} />}
          </div>
        )}
      </main>

      {panel && <DetailsPanel panel={panel} close={() => setPanel(null)} run={run} />}
    </div>
  );
};

const Metric = ({ icon, label, value, tone = 'green', onClick }: { icon: React.ReactNode; label: string; value: string; tone?: 'green' | 'blue' | 'orange' | 'red'; onClick: () => void }) => {
  const toneClass = tone === 'green' ? 'text-[#19DB8A]' : tone === 'blue' ? 'text-[#72A7FF]' : tone === 'orange' ? 'text-[#FFB178]' : 'text-red-300';
  return <button onClick={onClick} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-left hover:border-[#19DB8A]/50"><div className="flex justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div><div className={`rounded-2xl bg-white/10 p-3 ${toneClass}`}>{icon}</div></div></button>;
};

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"><div className="mb-4 flex items-center gap-3"><div className="rounded-2xl bg-white/10 p-2.5 text-[#19DB8A]">{icon}</div><h2 className="text-lg font-black">{title}</h2></div>{children}</section>
);

const UserTable = ({ users, savingId, setPanel, run }: { users: AdminUser[]; savingId: string | null; setPanel: (panel: PanelState) => void; run: (id: string, action: () => Promise<void>) => void }) => (
  <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="text-xs uppercase tracking-[0.14em] text-white/35"><tr><th className="p-3">Utilisateur</th><th className="p-3">Type</th><th className="p-3">Localisation</th><th className="p-3">Statut</th><th className="p-3">Actions</th></tr></thead><tbody>{users.map((user) => <tr key={`${user.source}-${user.id}`} className="border-t border-white/10"><td className="p-3"><button onClick={() => setPanel({ type: 'user', item: user })} className="flex items-center gap-3 text-left"><img src={user.avatarUrl || '/assets/images/app_launcher_icon.png'} className="h-10 w-10 rounded-2xl object-cover" /><span><b>{user.displayName}</b><span className="block text-xs text-white/45">{user.email || user.id}</span></span></button></td><td className="p-3"><Pill>{typeLabels[user.type] || user.type}</Pill></td><td className="p-3 text-white/60">{[user.city, user.country].filter(Boolean).join(', ') || 'Non renseigné'}</td><td className="p-3"><Pill tone={user.status === 'actif' ? 'good' : user.status === 'suspendu' ? 'bad' : 'warn'}>{user.status}</Pill></td><td className="p-3"><div className="flex flex-wrap gap-2"><select value={user.type} disabled={savingId === user.id} onChange={(e) => run(user.id, () => updateAdminUserType(user, e.target.value as UserType | 'admin'))} className="h-9 rounded-xl border border-white/10 bg-black px-2 text-xs"><option value={UserType.ATHLETE}>Athlète</option><option value={UserType.RECRUITER}>Recruteur</option><option value={UserType.CLUB}>Club</option><option value={UserType.PRESS}>Presse</option><option value={UserType.VISITOR}>Visiteur</option><option value="admin">Admin</option></select><button onClick={() => run(user.id, () => approveAdminUser(user))} className="mini green">Approuver</button><button onClick={() => run(user.id, () => updateAdminUserStatus(user, 'suspendu'))} className="mini danger">Suspendre</button></div></td></tr>)}</tbody></table></div>
);

const ContentTable = ({ items, savingId, setPanel, run }: { items: AdminContentItem[]; savingId: string | null; setPanel: (panel: PanelState) => void; run: (id: string, action: () => Promise<void>) => void }) => (
  <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-sm"><thead className="text-xs uppercase tracking-[0.14em] text-white/35"><tr><th className="p-3">Contenu</th><th className="p-3">Source</th><th className="p-3">Auteur</th><th className="p-3">Signalements</th><th className="p-3">Statut</th><th className="p-3">Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item.docPath} className="border-t border-white/10"><td className="p-3"><button onClick={() => setPanel({ type: 'content', item })} className="max-w-[320px] text-left"><b className="block truncate">{item.title}</b><span className="block truncate text-xs text-white/35">{item.mediaUrl || item.docPath}</span></button></td><td className="p-3"><Pill>{item.source}</Pill></td><td className="p-3 text-white/60">{item.ownerName}</td><td className="p-3"><Pill tone={item.reports ? 'warn' : 'good'}>{item.reports}</Pill></td><td className="p-3"><Pill tone={item.status === 'masqué' ? 'bad' : item.status === 'à vérifier' ? 'warn' : 'good'}>{item.status}</Pill></td><td className="p-3"><div className="flex flex-wrap gap-2"><button disabled={savingId === item.docPath} onClick={() => run(item.docPath, () => updateContentModeration(item, 'publié'))} className="mini green">Publier</button><button onClick={() => run(item.docPath, () => updateContentModeration(item, 'à vérifier'))} className="mini warn">Attente</button><button onClick={() => run(item.docPath, () => updateContentModeration(item, 'masqué'))} className="mini">Masquer</button><button onClick={() => run(item.docPath, () => deleteAdminContent(item))} className="mini danger"><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div>
);

const List = <T extends { id: string }>({ items, render }: { items: T[]; render: (item: T) => React.ReactNode }) => <div className="space-y-3">{items.length === 0 && <p className="rounded-2xl bg-black/25 p-6 text-center text-sm text-white/40">Aucune donnée.</p>}{items.map((item) => <div key={item.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">{render(item)}</div>)}</div>;

const FinanceView = ({ data }: { data: AdminDashboardData }) => <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<CircleDollarSign size={22} />} label="Solde wallets" value={n(data.finance.totalBalance)} onClick={() => {}} /><Metric icon={<BadgeCheck size={22} />} label="Wallets" value={n(data.finance.walletCount)} tone="blue" onClick={() => {}} /><Metric icon={<AlertTriangle size={22} />} label="Retraits attente" value={n(data.finance.pendingWithdrawals)} tone="orange" onClick={() => {}} /><Metric icon={<Activity size={22} />} label="Transactions" value={n(data.finance.transactionCount)} tone="blue" onClick={() => {}} /></div>;
const PartnerView = ({ data }: { data: AdminDashboardData }) => <Section title="Partenariats" icon={<BriefcaseBusiness size={18} />}><List items={data.partnerships.items} render={(item) => <div className="flex justify-between gap-3"><div><p className="font-bold">{item.name}</p><p className="text-xs text-white/45">{item.contact || 'Contact non renseigné'}</p></div><Pill tone={item.status.includes('attente') ? 'warn' : 'good'}>{item.status}</Pill></div>} /></Section>;
const SupportView = ({ data, savingId, title, message, setTitle, setMessage, createSupport }: any) => <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]"><Section title="Créer une assistance" icon={<Headphones size={18} />}><div className="space-y-3"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sujet" className="field" /><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} placeholder="Message" className="field min-h-28 py-3" /><button onClick={createSupport} disabled={savingId === 'support'} className="h-11 rounded-2xl bg-[#19DB8A] px-4 text-sm font-black text-black">Créer le ticket</button></div></Section><Section title="Tickets assistance" icon={<Headphones size={18} />}><List items={data.support.items} render={(item: any) => <div className="flex justify-between gap-3"><div><p className="font-bold">{item.subject}</p><p className="text-xs text-white/45">{item.userName}</p></div><Pill tone={item.priority === 'urgent' ? 'bad' : 'warn'}>{item.status} · {item.priority}</Pill></div>} /></Section></div>;
const InfraView = ({
  data,
  savingId,
  migrationResult,
  runStorageMigration
}: {
  data: AdminDashboardData;
  savingId: string | null;
  migrationResult: StorageMigrationResult | null;
  runStorageMigration: (dryRun: boolean) => void;
}) => (
  <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
    <div className="space-y-4">
      <Section title="État de l’application" icon={<Server size={18} />}>
        <div className="space-y-3">
          <Row label="Firebase project" value={data.infrastructure.firebaseProject} />
          <Row label="Cloudinary média" value={data.infrastructure.cloudinaryEnabled ? 'configuré' : 'non configuré'} />
          <Row label="PWA" value={data.infrastructure.pwaEnabled ? 'active' : 'inactive'} />
          <Row label="Dernier contrôle" value={data.infrastructure.lastCheckedAt} />
        </div>
      </Section>

      <Section title="Migration médias Firebase Storage" icon={<Video size={18} />}>
        <p className="mb-4 text-sm leading-relaxed text-white/55">
          Utilise votre session admin Firebase actuelle, détecte les anciennes vidéos Firebase Storage, les envoie sur Cloudinary, puis remplace les champs vidéo dans Firestore.
        </p>
        <div className="flex flex-wrap gap-2">
          <button disabled={savingId === 'migration-dry-run'} onClick={() => runStorageMigration(true)} className="mini warn">
            {savingId === 'migration-dry-run' ? 'Analyse...' : 'Analyser sans modifier'}
          </button>
          <button disabled={savingId === 'migration-run'} onClick={() => runStorageMigration(false)} className="mini green">
            {savingId === 'migration-run' ? 'Migration...' : 'Migrer 25 vidéos'}
          </button>
        </div>
        {migrationResult && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <Row label={migrationResult.dryRun ? 'À migrer' : 'Migrées'} value={n(migrationResult.migratedCount)} />
              <Row label="Ignorées" value={n(migrationResult.skippedCount)} />
              <Row label="Échecs" value={n(migrationResult.failedCount)} />
            </div>
            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
              {migrationResult.migrated.slice(0, 10).map((item) => (
                <button key={item.path} onClick={() => navigator.clipboard?.writeText(item.path)} className="w-full rounded-xl bg-white/[0.04] p-3 text-left text-xs text-white/60">
                  <b className="text-white/85">{item.source}</b> · {item.field}
                  <span className="block truncate">{item.path}</span>
                </button>
              ))}
              {migrationResult.failed.map((item) => (
                <div key={item.path} className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-200">
                  <b>{item.source}</b> · {item.path}
                  <span className="block">{item.error}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>
    </div>

    <Section title="Collections et infrastructure" icon={<Activity size={18} />}>
      <List items={data.infrastructure.collections.map((item) => ({ id: item.name, ...item }))} render={(item: any) => <div className="flex justify-between"><div><p className="font-bold">{item.name}</p><p className="text-xs text-white/45">{n(item.count)} documents lus</p></div><Pill tone={item.status === 'ok' ? 'good' : 'bad'}>{item.status}</Pill></div>} />
    </Section>
  </div>
);
const Row = ({ label, value }: { label: string; value: string }) => <div className="flex items-center justify-between rounded-2xl bg-black/25 p-3"><span className="text-sm text-white/55">{label}</span><b className="text-sm">{value}</b></div>;

const DetailsPanel = ({ panel, close, run }: { panel: PanelState; close: () => void; run: (id: string, action: () => Promise<void>) => void }) => {
  if (!panel) return null;
  const title = panel.type === 'user' ? panel.item.displayName : panel.type === 'content' ? panel.item.title : panel.item.title;
  return <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm"><aside className="ml-auto flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#080808] p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#19DB8A]">Détails</p><h3 className="text-xl font-black">{title}</h3></div><button onClick={close} className="rounded-2xl bg-white/10 p-2"><X size={18} /></button></div><div className="flex-1 space-y-3 overflow-y-auto">{Object.entries(panel.item).map(([key, value]) => <button key={key} onClick={() => navigator.clipboard?.writeText(String(value || ''))} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/35">{key}</p><p className="mt-1 break-words text-sm text-white/80">{String(value || 'Non renseigné')}</p></button>)}</div><div className="mt-4 flex flex-wrap gap-2">{panel.type === 'user' && <><button onClick={() => run(panel.item.id, () => approveAdminUser(panel.item))} className="mini green">Approuver</button><button onClick={() => run(panel.item.id, () => updateAdminUserStatus(panel.item, 'verification'))} className="mini warn">Vérifier</button><button onClick={() => run(panel.item.id, () => updateAdminUserStatus(panel.item, 'suspendu'))} className="mini danger">Suspendre</button></>}{panel.type === 'content' && <><button onClick={() => run(panel.item.docPath, () => updateContentModeration(panel.item, 'publié'))} className="mini green">Publier</button><button onClick={() => run(panel.item.docPath, () => updateContentModeration(panel.item, 'à vérifier'))} className="mini warn">Attente</button><button onClick={() => run(panel.item.docPath, () => updateContentModeration(panel.item, 'masqué'))} className="mini">Masquer</button></>}{panel.type === 'prediction' && <><button onClick={() => run(panel.item.id, () => updateAdminPredictionStatus(panel.item.id, 'brouillon'))} className="mini">Brouillon</button><button onClick={() => run(panel.item.id, () => updateAdminPredictionStatus(panel.item.id, 'en attente'))} className="mini warn">Attente</button><button onClick={() => run(panel.item.id, () => updateAdminPredictionStatus(panel.item.id, 'publié'))} className="mini green">Publier</button><button onClick={() => run(panel.item.id, () => updateAdminPredictionStatus(panel.item.id, 'archivé'))} className="mini">Archiver</button></>}</div></aside></div>;
};

export default AdminDashboardPage;
