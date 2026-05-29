import { formatMoney } from "../utils/currency";

/** Sidebar / BOQ layer order (Servers tab is separate, always first). */
export const INFRA_CATEGORY_ORDER = [
  "vmware",
  "storage",
  "rack",
  "power",
  "network",
  "database",
  "backup",
  "licenses",
  "monitoring",
] as const;

const INFRA_CATALOGUE_DATA = {
  network:{label:"Network",icon:"🔗",color:"#7c3aed",items:[
    {id:"net-cisco-c9300",  name:"Cisco Catalyst 9300 (Access)",      brand:"cisco",   spec:"48x1G/10G PoE+, 4x25G uplinks, DNA, L3",           unitPrice:9500},
    {id:"net-cisco-n9k-tor",name:"Cisco Nexus 9300 (ToR 25G)",         brand:"cisco",   spec:"48x25G SFP28 + 6x100G QSFP28, VXLAN, ACI-ready",   unitPrice:24000},
    {id:"net-cisco-n9k-spine",name:"Cisco Nexus 9500 (Spine/Core)",    brand:"cisco",   spec:"64x100G or 16x400G QSFP, non-blocking, ACI fabric", unitPrice:85000},
    {id:"net-cisco-asr1k",  name:"Cisco ASR 1001-X (WAN Router)",      brand:"cisco",   spec:"10G WAN, BGP/OSPF/MPLS/SD-WAN, 20Gbps",            unitPrice:32000},
    {id:"net-cisco-ftd",    name:"Cisco Firepower 4115 (NGFW)",        brand:"cisco",   spec:"20Gbps FW, 15Gbps IPS, AMP, TLS 1.3 decrypt",      unitPrice:48000},
    {id:"net-cisco-ftd-smb",name:"Cisco Firepower 1140 (NGFW SMB)",    brand:"cisco",   spec:"2.2Gbps FW, 1Gbps IPS, AMP, branch/small DC",      unitPrice:8500},
    {id:"net-cisco-aci",    name:"Cisco ACI Licence (APIC Cluster)",   brand:"cisco",   spec:"3-node APIC cluster, SDN policy, multi-tenancy",    unitPrice:42000},
    {id:"net-jun-ex4300",   name:"Juniper EX4300-48P (Access)",        brand:"juniper", spec:"48x1G PoE+, 4x10G SFP+, Virtual Chassis, L3",      unitPrice:6800},
    {id:"net-jun-qfx5120",  name:"Juniper QFX5120-48Y (ToR 25G)",      brand:"juniper", spec:"48x25G SFP28 + 8x100G QSFP28, EVPN/VXLAN",         unitPrice:22000},
    {id:"net-jun-qfx10k",   name:"Juniper QFX10008 (Spine/Core)",      brand:"juniper", spec:"8-slot, 128x100G, 160Tbps, non-blocking spine",      unitPrice:95000},
    {id:"net-jun-mx204",    name:"Juniper MX204 (Core/WAN Router)",    brand:"juniper", spec:"400G aggregate, BGP/MPLS/SR, 4x100G native",         unitPrice:28000},
    {id:"net-jun-srx4600",  name:"Juniper SRX4600 (NGFW/IPS)",        brand:"juniper", spec:"100Gbps FW, 40Gbps IPS, AppID, GPRS-GTP",            unitPrice:55000},
    {id:"net-aruba-6300",   name:"Aruba CX 6300M (Access PoE)",        brand:"aruba",   spec:"48x1G PoE+ + 4x25G, VSX, CX-OS, AI Insights",      unitPrice:7200},
    {id:"net-aruba-8360",   name:"Aruba CX 8360-48Y6C (25G Agg)",      brand:"aruba",   spec:"48x25G + 6x100G, VSX stacking, EVPN/VXLAN",         unitPrice:28000},
    {id:"net-aruba-8400",   name:"Aruba CX 8400 (Core/Spine)",         brand:"aruba",   spec:"Modular, up to 32x100G per slot, AI-driven fabric",  unitPrice:68000},
    {id:"net-aruba-edgecnt",name:"Aruba EdgeConnect SD-WAN",           brand:"aruba",   spec:"Virtual/appliance SD-WAN, SASE-ready, 2Gbps",        unitPrice:12000},
    {id:"net-forti-fg100f", name:"FortiGate 100F (NGFW Branch/SMB)",   brand:"fortinet",spec:"20Gbps FW, 5Gbps IPS, SD-WAN, ZTNA, FortiOS",       unitPrice:6500},
    {id:"net-forti-fg1100e",name:"FortiGate 1100E (NGFW DC Mid)",      brand:"fortinet",spec:"74Gbps FW, 23Gbps IPS, SSL-DPI, HA pair ready",      unitPrice:28000},
    {id:"net-forti-fg4200f",name:"FortiGate 4200F (NGFW DC Large)",    brand:"fortinet",spec:"198Gbps FW, 80Gbps IPS, NP7 ASIC, 100G ports",      unitPrice:82000},
    {id:"net-forti-fabric", name:"Fortinet Security Fabric Licence",   brand:"fortinet",spec:"FortiAnalyzer + FortiManager + FortiSIEM bundle",     unitPrice:18000},
    {id:"net-forti-sd-wan", name:"FortiGate SD-WAN (WAN Edge)",        brand:"fortinet",spec:"Integrated SD-WAN, SASE, application steering",      unitPrice:9500},
    {id:"net-f5-best",      name:"F5 BIG-IP i5800 (ADC/LB)",           brand:"f5",      spec:"40Gbps ADC, SSL offload, iRules, L4-L7, 3yr",       unitPrice:48000},
    {id:"net-f5-ltm",       name:"F5 BIG-IP LTM (Load Balancer)",      brand:"f5",      spec:"Local Traffic Manager, full-proxy, 20Gbps",          unitPrice:32000},
    {id:"net-f5-asm",       name:"F5 Advanced WAF (App Firewall)",      brand:"f5",      spec:"Behavioural WAF, API protection, bot defence",       unitPrice:22000},
    {id:"net-f5-gtm",       name:"F5 BIG-IP DNS (Global LB/GSLB)",     brand:"f5",      spec:"Anycast DNS, GSLB, health-based geo routing",        unitPrice:18000},
    {id:"net-f5-sslo",      name:"F5 SSL Orchestrator",                 brand:"f5",      spec:"TLS 1.3 inspection, service chaining, 40Gbps",       unitPrice:28000},
    {id:"net-pa-pa820",     name:"Palo Alto PA-820 (NGFW SMB/Branch)", brand:"paloalto",spec:"1.9Gbps App-ID FW, 800Mbps threat prevention, ZTNA", unitPrice:7800},
    {id:"net-pa-pa5250",    name:"Palo Alto PA-5250 (NGFW DC)",        brand:"paloalto",spec:"64Gbps FW, 30Gbps threat, WildFire, DNS Security",   unitPrice:68000},
    {id:"net-pa-panorama",  name:"Palo Alto Panorama (Central Mgmt)",  brand:"paloalto",spec:"Centralised policy, log mgmt, up to 5000 devices",   unitPrice:16000},
  ]},
  storage:{label:"Storage",icon:"💾",color:"#059669",items:[
    {id:"sto-san-af",name:"All-Flash SAN Array",spec:"200TB raw, 4x16Gbps FC, <0.2ms latency",unitPrice:95000},
    {id:"sto-san-hybrid",name:"Hybrid SAN Array",spec:"400TB raw, SSD+HDD, 4x16Gbps FC",unitPrice:55000},
    {id:"sto-nas",name:"NAS Appliance",spec:"200TB usable, SMB/NFS/iSCSI, 25G",unitPrice:28000},
    {id:"sto-obj",name:"Object Storage Node",spec:"500TB raw, S3-compatible, erasure coding",unitPrice:38000},
    {id:"sto-tape",name:"Tape Library LTO-9",spec:"LTO-9, 18TB/cartridge, 200-slot",unitPrice:42000},
  ]},
  backup:{label:"Backup",icon:"🔒",color:"#d97706",items:[
    {id:"bkp-sw-ent",name:"Backup Software Enterprise",spec:"Veeam/Commvault, unlimited workloads",unitPrice:28000},
    {id:"bkp-appl",name:"Backup Appliance",spec:"100TB usable, inline dedup/compress",unitPrice:35000},
    {id:"bkp-cloud-gw",name:"Cloud Backup Gateway",spec:"AWS/Azure/GCP, tiered archival, 10Gbps",unitPrice:12000},
    {id:"bkp-immutable",name:"Immutable Backup Repository",spec:"200TB, WORM, ransomware-proof",unitPrice:48000},
  ]},
  monitoring:{label:"Monitoring",icon:"📊",color:"#e11d48",items:[
    {id:"mon-sw",name:"Infrastructure Monitoring Suite",spec:"Zabbix/PRTG/Nagios XI Enterprise, unlimited nodes, 3yr",unitPrice:8500},
    {id:"mon-apm",name:"APM & Log Analytics",spec:"Elastic/Dynatrace/New Relic, 500GB/day ingest, 3yr",unitPrice:22000},
    {id:"mon-dcim",name:"DCIM Platform",spec:"Nlyte/Sunbird — power, cooling, capacity, asset management",unitPrice:35000},
    {id:"mon-siem",name:"SIEM Solution",spec:"Splunk/IBM QRadar, 50GB/day ingest, correlation rules, 1yr",unitPrice:45000},
    {id:"mon-gpu",name:"GPU & HPC Telemetry Suite",spec:"NVIDIA DCGM + Grafana, GPU utilization, thermal, job metrics",unitPrice:12000},
    {id:"mon-netflow",name:"Network Flow Analyzer",spec:"SolarWinds NTA / ntopng Enterprise, full NetFlow/sFlow, 3yr",unitPrice:9500},
    {id:"mon-db",name:"Database Performance Monitor",spec:"SolarWinds DPA / SentryOne, multi-DB, query analytics, 3yr",unitPrice:14000},
    {id:"mon-aio",name:"All-in-One Observability Platform",spec:"Datadog/Dynatrace Full Stack — infra, APM, logs, synthetics",unitPrice:38000},
  ]},
  database:{label:"Database",icon:"🗄️",color:"#0ea5e9",items:[
    {id:"db-orcl",name:"Oracle DB Enterprise",spec:"Per-processor, unlimited users",unitPrice:47500},
    {id:"db-mssql",name:"MS SQL Server Enterprise",spec:"2-core pack, SA 3yr",unitPrice:14800},
    {id:"db-pg-sub",name:"PostgreSQL Enterprise Sub",spec:"EDB/Percona, 24x7, 1yr",unitPrice:6500},
    {id:"db-mysql-ent",name:"MySQL Enterprise",spec:"Unlimited cluster, HA, 3yr",unitPrice:8200},
    {id:"db-nosql",name:"NoSQL Cluster (MongoDB)",spec:"Ops Manager, Enterprise 1yr",unitPrice:18000},
  ]},
  vmware:{label:"Hypervisor / Virtualisation",icon:"⚙️",color:"#8b5cf6",items:[
    {id:"vm-vsphere",name:"VMware vSphere Enterprise Plus",spec:"Per-CPU, 3yr SnS, DRS/HA/FT",unitPrice:5200},
    {id:"vm-vcenter",name:"VMware vCenter Server Standard",spec:"Unlimited hosts, 3yr SnS, lifecycle mgmt",unitPrice:6800},
    {id:"vm-vsan",name:"VMware vSAN Enterprise",spec:"Per-CPU, all-flash, stretched cluster, dedup",unitPrice:4800},
    {id:"vm-nsx",name:"VMware NSX-T Enterprise+",spec:"Per-CPU, micro-segmentation, L4-7 FW, IDS",unitPrice:7500},
    {id:"vm-horizon",name:"VMware Horizon Enterprise",spec:"Per-CCU, VDI+RDSH, instant clone, 3yr SnS",unitPrice:280},
    {id:"vm-vrops",name:"VMware vRealize Operations",spec:"Per-OSI, AI-driven ops, capacity planning, 3yr",unitPrice:180},
    {id:"hv-hyperv",name:"Microsoft Hyper-V (Windows Server)",spec:"Included with Win Server DC, SCVMM optional",unitPrice:0},
    {id:"hv-scvmm",name:"Microsoft SCVMM 2022",spec:"System Center VMM, fabric mgmt, per-OSE",unitPrice:3800},
    {id:"hv-azstack",name:"Microsoft Azure Stack HCI",spec:"Per-node/yr, hyper-converged, Azure Arc integrated",unitPrice:12000},
    {id:"hv-ocp",name:"Red Hat OpenShift Platform Plus",spec:"Per-core, Kubernetes+VMs, 3yr subs, 24x7",unitPrice:9600},
    {id:"hv-oshift-virt",name:"OpenShift Virtualization",spec:"KubeVirt-based VM mgmt on OpenShift, per-core",unitPrice:2800},
    {id:"hv-ocp-storage",name:"Red Hat OpenShift Data Foundation",spec:"Ceph-based, S3/block/file, per-node, 3yr",unitPrice:7500},
    {id:"hv-oracle-vm",name:"Oracle VM Server",spec:"Per-socket, Oracle Linux KVM, zero-cost base",unitPrice:0},
    {id:"hv-oracle-olvm",name:"Oracle Linux Virtualization Manager",spec:"oVirt-based, per-node, Oracle support 3yr",unitPrice:3200},
    {id:"hv-oracle-oci-hci",name:"Oracle Private Cloud Appliance",spec:"Full rack HCI, OCI-compatible, 3yr support",unitPrice:185000},
    {id:"hv-nutanix-aos",name:"Nutanix AOS Ultimate",spec:"Per-node/yr, HCI, AHV hypervisor included",unitPrice:18000},
    {id:"hv-nutanix-prism",name:"Nutanix Prism Pro",spec:"Per-node/yr, AI-ops, capacity planning, analytics",unitPrice:4500},
    {id:"hv-nutanix-nc2",name:"Nutanix NC2 (Cloud Bursting)",spec:"Per-node/hr, burst to AWS/Azure, unified mgmt",unitPrice:6000},
    {id:"hv-nutanix-files",name:"Nutanix Files + Objects",spec:"Per-node/yr, SMB/NFS/S3, data services",unitPrice:3800},
    {id:"hv-hpe-morpheus",name:"HPE Morpheus (Multi-cloud Mgmt)",spec:"Per-socket/yr, VMware/HyperV/KVM/cloud unified",unitPrice:5500},
    {id:"hv-hpe-simplivity",name:"HPE SimpliVity HCI",spec:"Per-node, OmniStack, built-in backup/WAN opt",unitPrice:28000},
    {id:"hv-hpe-synergy-cm",name:"HPE Synergy Composer",spec:"Software-defined composable infra mgmt, per-frame",unitPrice:15000},
    {id:"hv-proxmox",name:"Proxmox VE Enterprise",spec:"Per-socket/yr, KVM+LXC, ceph storage, HA cluster",unitPrice:1200},
    {id:"hv-xcp-ng",name:"XCP-ng + Xen Orchestra",spec:"Open-source Xen, enterprise support, per-socket",unitPrice:800},
  ]},
  licenses:{label:"Licenses",icon:"📋",color:"#f59e0b",items:[
    {id:"lic-win-srv",name:"Windows Server Datacenter",spec:"Per 2-core, SA 3yr, unlimited VMs",unitPrice:6200},
    {id:"lic-rhel",name:"RHEL Server Premium",spec:"2-socket, Priority support, 3yr",unitPrice:2800},
    {id:"lic-suse",name:"SUSE Linux Enterprise",spec:"2-socket, Priority support, 3yr",unitPrice:1800},
    {id:"lic-antivirus",name:"Endpoint Protection Suite",spec:"CrowdStrike/Symantec, per node, 3yr",unitPrice:120},
    {id:"lic-citrix",name:"Citrix Virtual Apps & Desktops",spec:"Per-CCU Premium, 3yr SA",unitPrice:350},
  ]},
  power:{label:"Power and Cooling",icon:"⚡",color:"#f59e0b",items:[
    {id:"pwr-ups-10k",name:"UPS 10kVA Modular",spec:"Online double-conversion, N+1 ready",unitPrice:8500},
    {id:"pwr-ups-80k",name:"UPS 80kVA 3-Phase",spec:"Online, scalable, SNMP managed",unitPrice:52000},
    {id:"pwr-pdu-basic",name:"Basic PDU",spec:"0U vertical, 32A, C13/C19 outlets",unitPrice:450},
    {id:"pwr-pdu-smart",name:"Smart PDU",spec:"Switched+metered, per-outlet, SNMP",unitPrice:1800},
    {id:"pwr-crac",name:"CRAC Unit 50kW",spec:"Precision cooling, N+1 EC fans",unitPrice:28000},
    {id:"pwr-gen",name:"Diesel Generator 500kVA",spec:"Auto-transfer, 48hr fuel tank",unitPrice:85000},
  ]},
  rack:{label:"Rack and Stack",icon:"🏗️",color:"#6b7280",items:[
    {id:"rack-42u",name:"42U Server Rack",spec:"800x1000mm, 1200kg rated, blanking panels",unitPrice:1200},
    {id:"rack-48u",name:"48U Network Cabinet",spec:"600x800mm, vented, lockable",unitPrice:950},
    {id:"rack-cable-mgr",name:"Cable Management Kit",spec:"Horizontal+vertical per rack",unitPrice:320},
    {id:"rack-kvm",name:"KVM Switch 16-port IP",spec:"IP-based, multi-platform, 4K",unitPrice:2800},
    {id:"rack-install",name:"Rack Integration Services",spec:"Cabling, labeling, documentation",unitPrice:3500},
    {id:"rack-amc",name:"AMC / Support Contract 1yr",spec:"24x7 onsite, 4-hour SLA",unitPrice:18000},
  ]},
} as const;

export const INFRA_CATALOGUE = Object.fromEntries(
  INFRA_CATEGORY_ORDER.map((key) => [key, INFRA_CATALOGUE_DATA[key]])
) as { [K in (typeof INFRA_CATEGORY_ORDER)[number]]: (typeof INFRA_CATALOGUE_DATA)[K] };

export const infraCatalogueEntries = () =>
  INFRA_CATEGORY_ORDER.map((key) => [key, INFRA_CATALOGUE[key]] as const);

export const BRAND_COLORS: Record<string, string> = {cisco:"#1ba0d7",juniper:"#84ba27",aruba:"#f96c1b",fortinet:"#e7222e",f5:"#e5002b",paloalto:"#fa582d"};
export const BRAND_LABELS: Record<string, string> = {cisco:"CISCO",juniper:"JUNIPER",aruba:"ARUBA",fortinet:"FORTINET",f5:"F5",paloalto:"PALO ALTO"};

/** Format USD catalogue amounts (use useQuoteMoney().fmt in UI when quote currency applies). */
export const fmt = (n: number) => formatMoney(n, "USD");

export type InfraCategory = keyof typeof INFRA_CATALOGUE;

export function findProduct(category: string, productId: string) {
  const cat = INFRA_CATALOGUE[category as InfraCategory];
  if (!cat) return null;
  const item = cat.items.find(i => i.id === productId);
  if (!item) return null;
  return { category, categoryLabel: cat.label, categoryIcon: cat.icon, categoryColor: cat.color, ...item };
}

export function getAllProducts() {
  return INFRA_CATEGORY_ORDER.flatMap((category) => {
    const cat = INFRA_CATALOGUE[category];
    return cat.items.map((item) => ({
      category,
      categoryLabel: cat.label,
      categoryColor: cat.color,
      ...item,
    }));
  });
}
