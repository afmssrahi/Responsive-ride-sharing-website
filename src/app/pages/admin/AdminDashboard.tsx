import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  LayoutDashboard, Users, Car, MapPin, BarChart2, Settings,
  LogOut, Menu, TrendingUp, Star, CheckCircle,
  XCircle, Search, Shield, Loader2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useAuth } from "../../context/AuthContext";
import { admin as adminApi } from "../../services/api";

type Section = "overview" | "users" | "drivers" | "rides" | "analytics" | "settings";
const NAV = [
  { id: "overview" as Section, label: "Overview", icon: LayoutDashboard },
  { id: "users" as Section, label: "Users", icon: Users },
  { id: "drivers" as Section, label: "Drivers", icon: Car },
  { id: "rides" as Section, label: "Rides", icon: MapPin },
  { id: "analytics" as Section, label: "Analytics", icon: BarChart2 },
  { id: "settings" as Section, label: "Settings", icon: Settings },
];

function StatusDot({ status }: { status: string }) {
  const s = status?.toLowerCase();
  const colors: Record<string,string> = { active:"bg-green-500", suspended:"bg-red-400", online:"bg-green-500", offline:"bg-gray-300", on_trip:"bg-blue-400", completed:"bg-green-500", in_progress:"bg-blue-400", cancelled:"bg-red-400", confirmed:"bg-blue-400", pending:"bg-yellow-400" };
  return <span className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors[s]||"bg-gray-300"}`}/><span className="text-gray-600 text-xs capitalize">{s?.replace('_',' ')||status}</span></span>;
}

function Overview() {
  const [data, setData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([adminApi.getOverview(), adminApi.getAnalytics(), adminApi.getRides(1)])
      .then(([o,a,r]) => { setData(o.data); setAnalytics(a.data||[]); setRides((r as any).rides||[]); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400"/></div>;
  const stats = [
    { label:"Total Users", value: data?.totalUsers||0 },
    { label:"Active Drivers", value: data?.activeDrivers||0 },
    { label:"Total Rides", value: data?.totalRides||0 },
    { label:"Completed", value: data?.completedRides||0 },
  ];
  return (
    <div className="space-y-8">
      <div><h2 className="text-gray-900 mb-1" style={{fontWeight:800,fontSize:"1.3rem",letterSpacing:"-0.02em"}}>Platform Overview</h2><p className="text-gray-400 text-sm">Live snapshot of UniRide operations.</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s=><div key={s.label} className="bg-white border border-gray-100 rounded-xl p-5"><p className="text-gray-400 mb-3" style={{fontSize:"0.75rem",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.05em"}}>{s.label}</p><p className="text-gray-900" style={{fontWeight:800,fontSize:"1.4rem",letterSpacing:"-0.02em"}}>{s.value.toLocaleString()}</p></div>)}
      </div>
      {analytics.length>0&&<div className="bg-white border border-gray-100 rounded-xl p-6"><p className="text-gray-900 mb-5" style={{fontWeight:600,fontSize:"0.875rem"}}>This Week (Rides)</p><ResponsiveContainer width="100%" height={200}><BarChart data={analytics} barSize={26}><XAxis dataKey="day" tick={{fontSize:11,fill:"#9ca3af"}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:11,fill:"#9ca3af"}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{borderRadius:8,border:"1px solid #e5e7eb",fontSize:12,boxShadow:"none"}}/><Bar dataKey="rides" fill="#111827" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>}
      {rides.length>0&&<div className="bg-white border border-gray-100 rounded-xl"><div className="px-6 py-4 border-b border-gray-100"><p className="text-gray-900" style={{fontWeight:600,fontSize:"0.875rem"}}>Recent Rides</p></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-gray-400 border-b border-gray-100">{["Code","Creator","Driver","Route","Fare","Status"].map(h=><th key={h} className="px-5 py-3 text-left" style={{fontWeight:500,fontSize:"0.72rem",textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-50">{rides.slice(0,5).map((r:any)=><tr key={r.id} className="hover:bg-gray-50 transition-colors"><td className="px-5 py-3.5 font-mono text-gray-400" style={{fontSize:"0.75rem"}}>{r.rideCode}</td><td className="px-5 py-3.5 text-gray-800" style={{fontWeight:500}}>{r.creator?.name||'—'}</td><td className="px-5 py-3.5 text-gray-500">{r.driver?.name||'—'}</td><td className="px-5 py-3.5 text-gray-400 text-xs">{r.pickupLocation}→{r.dropoffLocation}</td><td className="px-5 py-3.5 text-gray-900" style={{fontWeight:600}}>{r.totalFare?`BDT ${r.totalFare}`:'—'}</td><td className="px-5 py-3.5"><StatusDot status={r.status}/></td></tr>)}</tbody></table></div></div>}
    </div>
  );
}

function UsersSection() {
  const [search, setSearch] = useState("");
  const [userList, setUserList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminApi.getUsers(1,search).then(r=>setUserList((r as any).users||[])).catch(()=>{}).finally(()=>setLoading(false)); }, [search]);
  async function toggle(id:string, status:string) {
    const newStatus = status==="ACTIVE"?"SUSPENDED":"ACTIVE";
    try { await adminApi.updateUserStatus(id,newStatus); setUserList(p=>p.map(u=>u.id===id?{...u,status:newStatus}:u)); } catch{}
  }
  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400"/></div>;
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div><h2 className="text-gray-900 mb-1" style={{fontWeight:800,fontSize:"1.3rem",letterSpacing:"-0.02em"}}>Users</h2><p className="text-gray-400 text-sm">{userList.length} users</p></div>
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"/><input value={search} onChange={e=>{setLoading(true);setSearch(e.target.value)}} placeholder="Search users" className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-gray-400 w-56 transition-colors"/></div>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-gray-400 border-b border-gray-100">{["Name","Email","Role","Status","Action"].map(h=><th key={h} className="px-5 py-3.5 text-left" style={{fontWeight:500,fontSize:"0.72rem",textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-50">{userList.map((u:any)=><tr key={u.id} className="hover:bg-gray-50"><td className="px-5 py-4 text-gray-900" style={{fontWeight:600}}>{u.name}</td><td className="px-5 py-4 text-gray-400">{u.email}</td><td className="px-5 py-4 text-gray-600 text-xs">{u.role}</td><td className="px-5 py-4"><StatusDot status={u.status?.toLowerCase()}/></td><td className="px-5 py-4"><button onClick={()=>toggle(u.id,u.status)} className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${u.status==="ACTIVE"?"border-red-200 text-red-600 hover:bg-red-50":"border-green-200 text-green-700 hover:bg-green-50"}`}>{u.status==="ACTIVE"?"Suspend":"Activate"}</button></td></tr>)}</tbody></table></div></div>
    </div>
  );
}

function DriversSection() {
  const [driverList, setDriverList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminApi.getDrivers(1).then(r=>setDriverList((r as any).drivers||[])).catch(()=>{}).finally(()=>setLoading(false)); }, []);
  async function toggleApproval(id:string, approved:boolean) {
    try { await adminApi.approveDriver(id,!approved); setDriverList(p=>p.map(d=>d.id===id?{...d,driverProfile:{...d.driverProfile,isApproved:!approved}}:d)); } catch{}
  }
  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400"/></div>;
  return (
    <div className="space-y-6">
      <div><h2 className="text-gray-900 mb-1" style={{fontWeight:800,fontSize:"1.3rem",letterSpacing:"-0.02em"}}>Drivers</h2><p className="text-gray-400 text-sm">{driverList.length} drivers</p></div>
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-gray-400 border-b border-gray-100">{["Driver","Vehicle","Rating","Rides","Approved","Action"].map(h=><th key={h} className="px-5 py-3.5 text-left" style={{fontWeight:500,fontSize:"0.72rem",textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-50">{driverList.map((d:any)=>{const dp=d.driverProfile;const v=d.vehicles?.[0];const approved=dp?.isApproved;return(<tr key={d.id} className="hover:bg-gray-50"><td className="px-5 py-4"><p className="text-gray-900" style={{fontWeight:600}}>{d.name}</p><p className="text-gray-400 text-xs">{d.email}</p></td><td className="px-5 py-4 text-gray-500 text-xs">{v?`${v.make} ${v.model}`:'—'}</td><td className="px-5 py-4"><span className="flex items-center gap-1 text-gray-700" style={{fontWeight:600}}><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"/>{dp?.rating||'—'}</span></td><td className="px-5 py-4 text-gray-600">{dp?.totalRides||0}</td><td className="px-5 py-4">{approved?<span className="flex items-center gap-1 text-gray-600 text-xs"><CheckCircle className="w-3.5 h-3.5 text-green-500"/>Yes</span>:<span className="flex items-center gap-1 text-gray-600 text-xs"><XCircle className="w-3.5 h-3.5 text-red-400"/>No</span>}</td><td className="px-5 py-4"><button onClick={()=>toggleApproval(d.id,approved)} className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${approved?"border-red-200 text-red-600 hover:bg-red-50":"border-green-200 text-green-700 hover:bg-green-50"}`}>{approved?"Revoke":"Approve"}</button></td></tr>)})}</tbody></table></div></div>
    </div>
  );
}

function RidesSection() {
  const [filter, setFilter] = useState("all");
  const [rideList, setRideList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); adminApi.getRides(1,filter==="all"?undefined:filter.toUpperCase()).then(r=>setRideList((r as any).rides||[])).catch(()=>{}).finally(()=>setLoading(false)); }, [filter]);
  const filters = [{key:"all",label:"All"},{key:"in_progress",label:"In Progress"},{key:"completed",label:"Completed"},{key:"cancelled",label:"Cancelled"}];
  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400"/></div>;
  return (
    <div className="space-y-6">
      <div><h2 className="text-gray-900 mb-1" style={{fontWeight:800,fontSize:"1.3rem",letterSpacing:"-0.02em"}}>Rides</h2><p className="text-gray-400 text-sm">All trips across the platform.</p></div>
      <div className="flex gap-2 flex-wrap">{filters.map(f=><button key={f.key} onClick={()=>setFilter(f.key)} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${filter===f.key?"bg-gray-900 text-white border-gray-900":"bg-white border-gray-200 text-gray-600 hover:border-gray-400"}`}>{f.label}</button>)}</div>
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-gray-400 border-b border-gray-100">{["Code","Creator","Driver","From","To","Fare","Status"].map(h=><th key={h} className="px-5 py-3.5 text-left" style={{fontWeight:500,fontSize:"0.72rem",textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-50">{rideList.map((r:any)=><tr key={r.id} className="hover:bg-gray-50"><td className="px-5 py-3.5 font-mono text-gray-400" style={{fontSize:"0.75rem"}}>{r.rideCode}</td><td className="px-5 py-3.5 text-gray-900" style={{fontWeight:500}}>{r.creator?.name||'—'}</td><td className="px-5 py-3.5 text-gray-500">{r.driver?.name||'—'}</td><td className="px-5 py-3.5 text-gray-400 text-xs">{r.pickupLocation}</td><td className="px-5 py-3.5 text-gray-400 text-xs">{r.dropoffLocation}</td><td className="px-5 py-3.5 text-gray-900" style={{fontWeight:600}}>{r.totalFare?`BDT ${r.totalFare}`:'—'}</td><td className="px-5 py-3.5"><StatusDot status={r.status}/></td></tr>)}</tbody></table></div></div>
    </div>
  );
}

function AnalyticsSection() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminApi.getAnalytics().then(r=>setData(r.data||[])).catch(()=>{}).finally(()=>setLoading(false)); }, []);
  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400"/></div>;
  return (
    <div className="space-y-6">
      <div><h2 className="text-gray-900 mb-1" style={{fontWeight:800,fontSize:"1.3rem",letterSpacing:"-0.02em"}}>Analytics</h2><p className="text-gray-400 text-sm">Last 7 days performance.</p></div>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-100 rounded-xl p-6"><p className="text-gray-900 mb-4" style={{fontWeight:600,fontSize:"0.875rem"}}>Daily Revenue (BDT)</p><ResponsiveContainer width="100%" height={200}><BarChart data={data} barSize={22}><XAxis dataKey="day" tick={{fontSize:11,fill:"#9ca3af"}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:11,fill:"#9ca3af"}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{borderRadius:8,border:"1px solid #e5e7eb",fontSize:11,boxShadow:"none"}}/><Bar dataKey="revenue" fill="#111827" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
        <div className="bg-white border border-gray-100 rounded-xl p-6"><p className="text-gray-900 mb-4" style={{fontWeight:600,fontSize:"0.875rem"}}>Daily Ride Count</p><ResponsiveContainer width="100%" height={200}><LineChart data={data}><XAxis dataKey="day" tick={{fontSize:11,fill:"#9ca3af"}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:11,fill:"#9ca3af"}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{borderRadius:8,border:"1px solid #e5e7eb",fontSize:11,boxShadow:"none"}}/><Line type="monotone" dataKey="rides" stroke="#16a34a" strokeWidth={2} dot={{r:3,fill:"#16a34a"}}/></LineChart></ResponsiveContainer></div>
      </div>
    </div>
  );
}

function SettingsSection() {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vals, setVals] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminApi.getSettings().then(r=>setVals(r.data||{})).catch(()=>{}).finally(()=>setLoading(false)); }, []);
  async function save() { setSaving(true); try { await adminApi.updateSettings(vals); setSaved(true); setTimeout(()=>setSaved(false),2000); } catch{} setSaving(false); }
  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400"/></div>;
  const pricing = [{label:"Platform Fee",key:"platform_fee_percent",suffix:"%"},{label:"Minimum Fare",key:"min_fare_bdt",suffix:"BDT"},{label:"Per Km Rate",key:"price_per_km",suffix:"BDT"},{label:"Max Surge",key:"surge_multiplier_max",suffix:"x"}];
  const contact = [{label:"Support Phone",key:"support_phone"},{label:"Support Email",key:"support_email"}];
  return (
    <div className="space-y-6 max-w-2xl">
      <div><h2 className="text-gray-900 mb-1" style={{fontWeight:800,fontSize:"1.3rem",letterSpacing:"-0.02em"}}>Platform Settings</h2><p className="text-gray-400 text-sm">Configure global settings.</p></div>
      <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-5">
        <p className="text-gray-700 text-sm" style={{fontWeight:600}}>Pricing</p><div className="h-px bg-gray-100"/>
        {pricing.map(f=><div key={f.key} className="flex items-center justify-between gap-4"><label className="text-gray-600 text-sm">{f.label}</label><div className="relative w-36"><input value={vals[f.key]||''} onChange={e=>setVals(p=>({...p,[f.key]:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400 text-right pr-7 transition-colors"/><span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{f.suffix}</span></div></div>)}
      </div>
      <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-5">
        <p className="text-gray-700 text-sm" style={{fontWeight:600}}>Contact & Support</p><div className="h-px bg-gray-100"/>
        {contact.map(f=><div key={f.key} className="flex items-center justify-between gap-4"><label className="text-gray-600 text-sm">{f.label}</label><input value={vals[f.key]||''} onChange={e=>setVals(p=>({...p,[f.key]:e.target.value}))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400 w-64 transition-colors"/></div>)}
      </div>
      <button onClick={save} disabled={saving} className="bg-gray-900 hover:bg-gray-700 text-white px-6 py-2.5 rounded-lg transition-colors text-sm font-medium disabled:opacity-60">{saved?"Saved ✓":saving?"Saving…":"Save Changes"}</button>
    </div>
  );
}

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  function handleLogout() { logout(); navigate("/login"); }
  const sectionMap: Record<Section, JSX.Element> = { overview:<Overview/>, users:<UsersSection/>, drivers:<DriversSection/>, rides:<RidesSection/>, analytics:<AnalyticsSection/>, settings:<SettingsSection/> };
  return (
    <div className="min-h-screen bg-[#F7F7F5] flex" style={{fontFamily:"'Plus Jakarta Sans', sans-serif"}}>
      <aside className={`fixed inset-y-0 left-0 z-40 w-58 bg-gray-950 text-white flex flex-col transition-transform duration-300 ${sidebarOpen?"translate-x-0":"-translate-x-full"} lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:flex`} style={{width:228}}>
        <div className="px-5 py-5 border-b border-white/8"><span className="text-white" style={{fontSize:"1rem",fontWeight:800,letterSpacing:"-0.02em"}}>uni<span className="text-green-400">ride</span></span><div className="flex items-center gap-1.5 mt-0.5"><Shield className="w-2.5 h-2.5 text-white/30"/><span className="text-white/30 text-xs">Admin Panel</span></div></div>
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">{NAV.map(({id,label,icon:Icon})=><button key={id} onClick={()=>{setSection(id);setSidebarOpen(false)}} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${section===id?"bg-white/10 text-white":"text-white/40 hover:text-white/80 hover:bg-white/5"}`} style={{fontSize:"0.8rem",fontWeight:500}}><Icon className="w-3.5 h-3.5 flex-shrink-0"/>{label}</button>)}</nav>
        <div className="flex-shrink-0 px-4 py-4 border-t border-white/8">
          <button onClick={()=>{navigate("/admin/account");setSidebarOpen(false)}} className="flex items-center gap-2.5 mb-3 w-full text-left hover:opacity-80 transition-opacity"><div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 text-xs font-bold">{user?.avatar}</div><div className="min-w-0"><p className="text-white/80 text-xs font-medium truncate">{user?.name}</p><p className="text-white/30 text-xs truncate">{user?.email}</p></div></button>
          <button onClick={handleLogout} className="flex items-center gap-2 text-white/30 hover:text-red-400 transition-colors text-xs py-1"><LogOut className="w-3 h-3"/>Sign out</button>
        </div>
      </aside>
      {sidebarOpen&&<div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={()=>setSidebarOpen(false)}/>}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-5 sm:px-8 py-4 flex items-center justify-between"><button onClick={()=>setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-900"><Menu className="w-5 h-5"/></button><p className="hidden lg:block text-gray-900 text-sm font-semibold capitalize">{section}</p><div className="flex items-center gap-2 ml-auto"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"/><span className="text-gray-400 text-xs">System operational</span></div></header>
        <main className="flex-1 px-5 sm:px-8 py-8 overflow-auto">{sectionMap[section]}</main>
      </div>
    </div>
  );
}