// src/app/admin/dashboard/page.tsx
// Dashboard — Server Component (données Supabase côté serveur)
// Portage exact du prototype : prototype/dashboard.jsx

import { createClient } from '@supabase/supabase-js';
import { DashboardClient } from './DashboardClient';

// ── Types ────────────────────────────────────────────────────
interface Service { id: string; name: string; status: 'online' | 'offline' | 'pending'; detail: string }
interface ActivityItem { kind: 'found' | 'sent' | 'opened' | 'paid'; who: string; city: string; t: string }

// ── Services (à brancher sur vos health checks) ───────────────
async function getServicesStatus(): Promise<Service[]> {
  // TODO: faire un vrai health check
  return [
    { id: 'stitch',    name: 'Stitch Server', status: 'online', detail: '3 clés actives'    },
    { id: 'n8n',       name: 'N8N',           status: 'online', detail: '20 workflows'       },
    { id: 'scrapling', name: 'Scrapling',     status: 'online', detail: 'Enrichissement'     },
    { id: 'brevo',     name: 'Brevo',         status: 'online', detail: '18 056 crédits'     },
    { id: 'sms',       name: 'SMS',           status: 'online', detail: '191 crédits'        },
  ];
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export default async function DashboardPage() {
  const supabase = db();

  // KPIs
  const [
    { count: totalProspects },
    { count: envoyes },
    { count: ouverts },
    { count: maquettesStitch },
  ] = await Promise.all([
    supabase.from('prospects').select('*', { count: 'exact', head: true }),
    supabase.from('prospects').select('*', { count: 'exact', head: true }).neq('status', 'found'),
    supabase.from('prospects').select('*', { count: 'exact', head: true }).in('status', ['opened', 'replied', 'paid']),
    supabase.from('prospects').select('*', { count: 'exact', head: true }).eq('mockup_type', 'stitch'),
  ]);

  const revenue = 0; // TODO: SELECT SUM(amount) FROM orders WHERE paid = true
  const objectif = 2000;

  const tauxOuverture = envoyes ? ((ouverts ?? 0) / envoyes * 100).toFixed(1) : '0.0';
  const services = await getServicesStatus();

  // Activité récente (8 derniers événements)
  const { data: recentActivity } = await supabase
    .from('prospects')
    .select('name, city, status, updated_at')
    .order('updated_at', { ascending: false })
    .limit(8);

  const activity: ActivityItem[] = (recentActivity ?? []).map(p => ({
    kind: p.status as ActivityItem['kind'],
    who: p.name,
    city: p.city,
    t: formatRelative(p.updated_at),
  }));

  return (
    <DashboardClient
      revenue={revenue}
      objectif={objectif}
      services={services}
      activity={activity}
      totalProspects={totalProspects ?? 0}
      envoyes={envoyes ?? 0}
      ouverts={ouverts ?? 0}
      maquettesStitch={maquettesStitch ?? 0}
      tauxOuverture={tauxOuverture}
    />
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}
