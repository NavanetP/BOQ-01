import { useState } from "react";







const SEGMENTS = {
  retail:        { label:"Retail",              icon:"🛒", color:"#f97316", description:"POS, e-commerce, inventory, omnichannel" },
  education:     { label:"Education",           icon:"🎓", color:"#3b82f6", description:"LMS, virtual labs, research, student portals" },
  healthcare:    { label:"Healthcare",          icon:"🏥", color:"#10b981", description:"EMR/EHR, PACS imaging, clinical apps, HIPAA" },
  bfsi:          { label:"BFSI",                icon:"🏦", color:"#6366f1", description:"Core banking, trading, risk analytics, compliance" },
  transport:     { label:"Transport",           icon:"🚊", color:"#f59e0b", description:"Fleet mgmt, logistics, traffic analytics, IoT" },
  manufacturing: { label:"Manufacturing",       icon:"🏭", color:"#84cc16", description:"MES, SCADA, ERP/SAP HANA, predictive maintenance" },
  research:      { label:"Research / HPC",      icon:"🔬", color:"#a855f7", description:"AI/ML training, genomics, CFD simulation" },
  smb:           { label:"SMB",                 icon:"🏢", color:"#06b6d4", description:"File/print, email, basic virtualization" },
  gaming:        { label:"Gaming",              icon:"🎮", color:"#ec4899", description:"Game servers, streaming, matchmaking, analytics" },
  design:        { label:"Design & Architecture",icon:"🎨", color:"#f43f5e", description:"CAD/BIM, rendering, VFX, visualization" },
};

const SEGMENT_RECOMMENDATIONS = {
  retail: {
    rationale: "Retail environments need reliable mid-tier servers for POS and e-commerce with HA storage, fast backups, and strong monitoring during peak seasons.",
    servers: { brand:"dell", series:"PowerEdge R-Series (Rack)", modelId:"dell-r650", cpuType:"intel", cpuId:"xeon-gold-5415", cpuCount:2, ramId:"ram-128", storageId:"sto-2x960", nicId:"nic-10g-2p", gpuId:"gpu-none", osId:"os-win-std", supportId:"sup-3y-nbd", psuId:"psu-redundant", qty:4, reason:"PowerEdge R650 balances cost and performance for POS/inventory workloads. 4 nodes for HA." },
    network: { items:["net-cisco-c9300","net-forti-fg1100e","net-f5-ltm"], reasons:{ "net-cisco-c9300":"Cisco Catalyst 9300 for POS and store access switching — DNA centre for visibility","net-forti-fg1100e":"FortiGate 1100E NGFW for PCI-DSS payment network compliance and anti-malware","net-f5-ltm":"F5 BIG-IP LTM for e-commerce web tier load balancing and session persistence" } },
    storage: { items:["sto-san-hybrid","sto-nas"], reasons:{ "sto-san-hybrid":"Hybrid SAN for mixed workloads — hot data on SSD, cold on HDD","sto-nas":"NAS for shared product catalogue, media assets, and backups" } },
    backup: { items:["bkp-sw-ent","bkp-appl"], reasons:{ "bkp-sw-ent":"Enterprise backup software for daily RPO/RTO compliance","bkp-appl":"Appliance with dedup for efficient retail transaction data backup" } },
    monitoring: { items:["mon-sw","mon-apm","mon-netflow","mon-db"], reasons:{ "mon-sw":"Infrastructure monitoring for server/network health and uptime","mon-apm":"APM to monitor e-commerce app performance during peak seasons","mon-netflow":"Network flow analysis to detect POS traffic anomalies","mon-db":"Database performance monitoring for SQL Server POS transaction bottlenecks" } },
    database: { items:["db-mssql","db-mysql-ent"], reasons:{ "db-mssql":"SQL Server for POS transactions and inventory management","db-mysql-ent":"MySQL for e-commerce product catalogue and web backend" } },
    vmware: { items:["vm-vsphere","vm-vcenter","hv-hyperv","hv-scvmm"], reasons:{ "vm-vsphere":"vSphere for retail server consolidation and live migration","vm-vcenter":"vCenter for centralised VM lifecycle management","hv-hyperv":"Hyper-V free with Windows Server DC — cost-effective for POS virtualisation","hv-scvmm":"SCVMM for fabric-level management of Hyper-V hosts across stores" } },
    licenses: { items:["lic-win-srv","lic-antivirus"], reasons:{ "lic-win-srv":"Windows Server Datacenter for unlimited VMs on each host","lic-antivirus":"Endpoint protection for POS terminals and servers" } },
    power: { items:["pwr-ups-10k","pwr-pdu-smart","pwr-crac"], reasons:{ "pwr-ups-10k":"10kVA UPS per rack pair for power continuity","pwr-pdu-smart":"Smart PDU for per-outlet metering and remote control","pwr-crac":"CRAC unit to maintain 20-22C for reliable POS operation" } },
    rack: { items:["rack-42u","rack-cable-mgr","rack-kvm","rack-install"], reasons:{ "rack-42u":"42U rack for 4 servers + network + patch panels","rack-cable-mgr":"Structured cabling for neat, maintainable layout","rack-kvm":"16-port KVM for out-of-band server management","rack-install":"Professional integration with labeling and documentation" } },
  },
  education: {
    rationale: "Education needs scalable VDI for students, GPU for research labs, shared storage, and strong monitoring to support thousands of concurrent users.",
    servers: { brand:"dell", series:"PowerEdge R-Series (Rack)", modelId:"dell-r750", cpuType:"intel", cpuId:"xeon-gold-6338", cpuCount:2, ramId:"ram-256", storageId:"sto-4x1920", nicId:"nic-25g-2p", gpuId:"gpu-t4", osId:"os-rhel", supportId:"sup-3y-4hr", psuId:"psu-redundant", qty:6, reason:"R750 2U with T4 GPU supports VDI and research workloads. 6 nodes for student concurrency." },
    network: { items:["net-aruba-6300","net-aruba-8360","net-forti-fg1100e","net-f5-ltm"], reasons:{ "net-aruba-6300":"Aruba CX 6300 PoE+ access switches for student labs and WiFi APs — AI Insights for campus ops","net-aruba-8360":"Aruba CX 8360 25G aggregation with VSX for inter-VLAN and storage fabric","net-forti-fg1100e":"FortiGate 1100E with web filtering and content inspection for campus AUP compliance","net-f5-ltm":"F5 BIG-IP LTM for LMS and student portal load balancing during peak exam seasons" } },
    storage: { items:["sto-san-af","sto-nas","sto-obj"], reasons:{ "sto-san-af":"All-Flash SAN for VDI boot and user profile performance","sto-nas":"NAS for shared home drives, coursework, and lab files","sto-obj":"Object storage for lecture recordings and media archives" } },
    backup: { items:["bkp-sw-ent","bkp-appl","bkp-cloud-gw"], reasons:{ "bkp-sw-ent":"Enterprise backup for LMS databases and VDI gold images","bkp-appl":"Dedup appliance for efficient daily backups of student data","bkp-cloud-gw":"Cloud gateway for long-term academic archive offload" } },
    monitoring: { items:["mon-sw","mon-apm","mon-dcim","mon-netflow"], reasons:{ "mon-sw":"Infrastructure monitoring across campus server estate","mon-apm":"APM for LMS performance during exam and enrollment peaks","mon-dcim":"DCIM for data center energy efficiency and capacity planning","mon-netflow":"Flow analysis for campus network traffic shaping" } },
    database: { items:["db-mssql","db-pg-sub"], reasons:{ "db-mssql":"SQL Server for student information and LMS backends","db-pg-sub":"PostgreSQL for open-source research and lab databases" } },
    vmware: { items:["vm-vsphere","vm-vcenter","vm-vsan","vm-horizon","hv-ocp","hv-proxmox"], reasons:{ "vm-vsphere":"vSphere for VDI host consolidation","vm-vcenter":"vCenter for centralised campus VM management","vm-vsan":"vSAN for hyper-converged student desktop storage","vm-horizon":"VMware Horizon for student virtual desktop delivery","hv-ocp":"Red Hat OpenShift for research Kubernetes workloads and CI/CD labs","hv-proxmox":"Proxmox VE for low-cost student lab virtualisation clusters" } },
    licenses: { items:["lic-win-srv","lic-rhel","lic-antivirus","lic-citrix"], reasons:{ "lic-win-srv":"Windows Server for AD, file, and print services","lic-rhel":"RHEL for research and lab Linux workloads","lic-antivirus":"Endpoint protection for lab desktops and servers","lic-citrix":"Citrix for application delivery to thin clients" } },
    power: { items:["pwr-ups-10k","pwr-pdu-smart","pwr-crac"], reasons:{ "pwr-ups-10k":"Modular UPS for each rack with N+1 redundancy","pwr-pdu-smart":"Smart PDU for energy consumption tracking and budget reporting","pwr-crac":"Precision cooling for dense VDI server clusters" } },
    rack: { items:["rack-42u","rack-cable-mgr","rack-kvm","rack-install","rack-amc"], reasons:{ "rack-42u":"42U racks for 6 servers with storage and network","rack-cable-mgr":"Color-coded structured cabling by VLAN/function","rack-kvm":"KVM for remote lab administration","rack-install":"Professional rack integration with full documentation","rack-amc":"Annual maintenance contract for campus DC support" } },
  },
  healthcare: {
    rationale: "Healthcare requires mission-critical HA, HIPAA compliance, high RAM for PACS imaging, encrypted storage, immutable backups, and 5-year 24x7 support.",
    servers: { brand:"hp", series:"ProLiant DL-Series (Rack)", modelId:"hp-dl580g11", cpuType:"intel", cpuId:"xeon-plat-8360", cpuCount:2, ramId:"ram-512", storageId:"sto-8x3840nvme", nicId:"nic-25g-4p", gpuId:"gpu-a10", osId:"os-win-dc", supportId:"sup-5y-247", psuId:"psu-titanium", qty:4, reason:"DL580 Gen11 provides 4-socket scalability for PACS. 512GB RAM, A10 GPU for AI diagnostics, 5yr 24x7." },
    network: { items:["net-cisco-n9k-tor","net-cisco-n9k-spine","net-pa-pa5250","net-f5-best","net-cisco-asr1k"], reasons:{ "net-cisco-n9k-tor":"Cisco Nexus 9300 ToR for PACS imaging traffic — VXLAN/ACI for clinical VLAN microsegmentation","net-cisco-n9k-spine":"Cisco Nexus 9500 spine for non-blocking 100G PACS and EHR storage fabric","net-pa-pa5250":"Palo Alto PA-5250 NGFW — App-ID and WildFire sandbox mandatory for HIPAA network security","net-f5-best":"F5 BIG-IP i5800 ADC for EHR application HA, SSL offload, and session persistence","net-cisco-asr1k":"Cisco ASR 1001-X for MPLS WAN interconnect between hospital sites and DR" } },
    storage: { items:["sto-san-af","sto-nas","sto-tape"], reasons:{ "sto-san-af":"All-Flash SAN for sub-ms PACS image retrieval","sto-nas":"NAS for clinical document management and DICOM archive","sto-tape":"LTO-9 tape for 7-year HIPAA-compliant long-term archival" } },
    backup: { items:["bkp-sw-ent","bkp-appl","bkp-immutable","bkp-cloud-gw"], reasons:{ "bkp-sw-ent":"Veeam/Commvault for EHR/PACS backup orchestration","bkp-appl":"Inline dedup appliance for fast clinical data backup","bkp-immutable":"Immutable WORM repository for ransomware protection - HIPAA mandatory","bkp-cloud-gw":"Cloud backup for geo-redundant DR of patient records" } },
    monitoring: { items:["mon-sw","mon-apm","mon-dcim","mon-siem","mon-db"], reasons:{ "mon-sw":"24x7 infrastructure monitoring for clinical uptime","mon-apm":"APM for EHR response time SLA compliance","mon-dcim":"DCIM for power and cooling in HIPAA-controlled environment","mon-siem":"SIEM for HIPAA audit logs, access monitoring, and threat detection","mon-db":"Database performance monitoring for Oracle EHR and SQL Server" } },
    database: { items:["db-orcl","db-mssql"], reasons:{ "db-orcl":"Oracle DB Enterprise for mission-critical EHR platforms (Epic/Cerner)","db-mssql":"SQL Server for clinical analytics and reporting databases" } },
    vmware: { items:["vm-vsphere","vm-vcenter","vm-vsan","vm-nsx","vm-vrops","hv-nutanix-aos","hv-nutanix-prism"], reasons:{ "vm-vsphere":"vSphere Enterprise+ for clinical VM consolidation","vm-vcenter":"vCenter for unified hospital VM management","vm-vsan":"vSAN for all-flash HCI storage for EHR","vm-nsx":"NSX micro-segmentation for HIPAA network isolation","vm-vrops":"vROps for capacity planning and compliance reporting","hv-nutanix-aos":"Nutanix AOS for HCI nodes running PACS imaging — AHV included","hv-nutanix-prism":"Nutanix Prism Pro for AI-driven ops and capacity analytics on HCI" } },
    licenses: { items:["lic-win-srv","lic-rhel","lic-antivirus"], reasons:{ "lic-win-srv":"Windows Server DC for AD, PACS clients, and EHR servers","lic-rhel":"RHEL for clinical Linux workloads and database servers","lic-antivirus":"Endpoint protection - mandatory for HIPAA compliance" } },
    power: { items:["pwr-ups-80k","pwr-pdu-smart","pwr-crac","pwr-gen"], reasons:{ "pwr-ups-80k":"80kVA 3-phase UPS - life-critical systems need no power interruption","pwr-pdu-smart":"Smart PDU with per-outlet metering for compliance reporting","pwr-crac":"Precision CRAC with N+1 redundancy for 24x7 clinical operation","pwr-gen":"Diesel generator for multi-day power outage resilience" } },
    rack: { items:["rack-42u","rack-cable-mgr","rack-kvm","rack-install","rack-amc"], reasons:{ "rack-42u":"42U racks with full security panels for HIPAA physical compliance","rack-cable-mgr":"Color-coded cabling with HIPAA asset tracking labels","rack-kvm":"IP KVM for secure out-of-band management","rack-install":"Certified integration with HIPAA-compliant documentation","rack-amc":"5yr AMC aligned with server support contract" } },
  },
  bfsi: {
    rationale: "BFSI demands zero-downtime mission-critical infrastructure, low-latency 100G networking for trading, encrypted immutable storage, and full SIEM for regulatory compliance.",
    servers: { brand:"dell", series:"PowerEdge R-Series (Rack)", modelId:"dell-r960", cpuType:"intel", cpuId:"xeon-plat-8592", cpuCount:2, ramId:"ram-768", storageId:"sto-8x3840nvme", nicId:"nic-100g-4p", gpuId:"gpu-a30", osId:"os-rhel", supportId:"sup-5y-247", psuId:"psu-titanium", qty:6, reason:"R960 for core banking - Platinum 8592+ for max throughput, 768GB RAM, 4x100G for algo trading latency." },
    network: { items:["net-cisco-n9k-tor","net-cisco-n9k-spine","net-pa-pa5250","net-f5-best","net-f5-gtm","net-cisco-asr1k"], reasons:{ "net-cisco-n9k-tor":"Cisco Nexus 9300 for 10/25G banking app server access — ACI policy for PCI-DSS zones","net-cisco-n9k-spine":"Cisco Nexus 9500 non-blocking 100G spine for algo trading and core banking latency","net-pa-pa5250":"Palo Alto PA-5250 NGFW — Panorama managed, WildFire sandbox, RBI/SEBI audit logs","net-f5-best":"F5 BIG-IP i5800 ADC for internet banking SSL offload and transactional HA","net-f5-gtm":"F5 BIG-IP DNS/GSLB for active-active DC failover and geo-redundant banking portals","net-cisco-asr1k":"Cisco ASR 1001-X with MPLS for DC-to-DC interconnect and RBI-mandated DR link" } },
    storage: { items:["sto-san-af","sto-obj","sto-tape"], reasons:{ "sto-san-af":"All-Flash SAN with <0.2ms latency for core banking OLTP","sto-obj":"Object storage for regulatory document archive and audit trails","sto-tape":"LTO-9 tape for 10-year RBI/SEBI mandatory records retention" } },
    backup: { items:["bkp-sw-ent","bkp-appl","bkp-immutable","bkp-cloud-gw"], reasons:{ "bkp-sw-ent":"Enterprise backup for core banking, CBS, and treasury apps","bkp-appl":"Inline dedup for efficient backup of large financial datasets","bkp-immutable":"WORM immutable backup - mandatory for RBI circular compliance","bkp-cloud-gw":"Cloud gateway for geo-redundant DR with RTO < 2 hours" } },
    monitoring: { items:["mon-sw","mon-apm","mon-dcim","mon-siem","mon-db","mon-aio"], reasons:{ "mon-sw":"24x7 monitoring with automated alerting for zero-downtime SLA","mon-apm":"APM for transaction response time monitoring (SLA < 200ms)","mon-dcim":"DCIM for power chain visibility in regulated DC environment","mon-siem":"SIEM mandatory for RBI/PCI-DSS security audit and log management","mon-db":"DB performance monitor for Oracle RAC core banking query latency","mon-aio":"Full-stack observability for unified trading platform telemetry" } },
    database: { items:["db-orcl","db-mssql","db-nosql"], reasons:{ "db-orcl":"Oracle RAC for core banking, CBS, and trading platforms","db-mssql":"SQL Server for MIS, reporting, and analytics workloads","db-nosql":"MongoDB for fraud detection real-time event streaming" } },
    vmware: { items:["vm-vsphere","vm-vcenter","vm-vsan","vm-nsx","vm-vrops","hv-ocp","hv-oracle-vm","hv-nutanix-aos"], reasons:{ "vm-vsphere":"vSphere Enterprise+ for banking workload HA and DRS","vm-vcenter":"vCenter for multi-site financial DC management","vm-vsan":"vSAN stretched cluster for metro-level active-active storage","vm-nsx":"NSX mandatory for PCI-DSS micro-segmentation of cardholder data","vm-vrops":"vROps for capacity planning and ITIL-aligned change management","hv-ocp":"Red Hat OpenShift for containerised microservices banking APIs and fintech workloads","hv-oracle-vm":"Oracle VM Server for Oracle DB RAC hosting — certified, zero licensing uplift","hv-nutanix-aos":"Nutanix HCI for DR site — AHV hypervisor with simple failover" } },
    licenses: { items:["lic-win-srv","lic-rhel","lic-antivirus"], reasons:{ "lic-win-srv":"Windows Server DC for AD, WSUS, and Windows-based banking apps","lic-rhel":"RHEL for core banking servers - certified by Oracle and IBM","lic-antivirus":"CrowdStrike/Symantec - PCI-DSS requirement for all endpoints" } },
    power: { items:["pwr-ups-80k","pwr-pdu-smart","pwr-crac","pwr-gen"], reasons:{ "pwr-ups-80k":"80kVA 3-phase online UPS - no tolerance for power interruption in CBS","pwr-pdu-smart":"Smart PDU with dual-feed for A+B power path redundancy","pwr-crac":"N+2 CRAC units - banking DCs run 24x7x365","pwr-gen":"500kVA generator for extended grid outage - RBI DC guidelines mandate this" } },
    rack: { items:["rack-42u","rack-cable-mgr","rack-kvm","rack-install","rack-amc"], reasons:{ "rack-42u":"Heavy-duty 42U racks with locks for PCI-DSS physical security","rack-cable-mgr":"Dual structured cable management for A+B path separation","rack-kvm":"Secure IP KVM for audit-logged out-of-band access","rack-install":"Bank-certified integration with full VAPT documentation","rack-amc":"5yr premium AMC with guaranteed 4-hour SLA and spare parts depot" } },
  },
  transport: {
    rationale: "Transport needs edge-capable servers for IoT ingestion, GPU for real-time analytics, redundant networking, and reliable 3-year support contracts.",
    servers: { brand:"lenovo", series:"ThinkSystem SR-Series (Rack)", modelId:"len-sr650v3", cpuType:"intel", cpuId:"xeon-gold-6338", cpuCount:2, ramId:"ram-256", storageId:"sto-4x1920", nicId:"nic-25g-2p", gpuId:"gpu-t4", osId:"os-rhel", supportId:"sup-3y-4hr", psuId:"psu-redundant", qty:4, reason:"SR650 V3 with T4 GPU for real-time fleet analytics. 4 nodes across 2 sites for HA." },
    network: { items:["net-cisco-c9300","net-forti-fg1100e","net-forti-sd-wan","net-cisco-asr1k"], reasons:{ "net-cisco-c9300":"Cisco Catalyst 9300 at depot and hub sites — IoT device profiling via DNA Centre","net-forti-fg1100e":"FortiGate 1100E NGFW to secure IoT gateway traffic and fleet management APIs","net-forti-sd-wan":"Fortinet SD-WAN for cost-effective multi-site WAN with application-aware routing","net-cisco-asr1k":"Cisco ASR 1001-X as hub router for MPLS/SD-WAN connectivity across transport network" } },
    storage: { items:["sto-san-hybrid","sto-nas","sto-obj"], reasons:{ "sto-san-hybrid":"Hybrid SAN for mixed hot/warm fleet data workloads","sto-nas":"NAS for route planning, schedule files, and shared operational data","sto-obj":"Object storage for GPS telemetry, video surveillance, and logs archive" } },
    backup: { items:["bkp-sw-ent","bkp-appl","bkp-cloud-gw"], reasons:{ "bkp-sw-ent":"Backup software for fleet management and operational databases","bkp-appl":"Dedup appliance for daily backup of telemetry and transaction data","bkp-cloud-gw":"Cloud backup for IoT data lake and long-term archive" } },
    monitoring: { items:["mon-sw","mon-apm","mon-dcim","mon-netflow"], reasons:{ "mon-sw":"Infrastructure monitoring for DC and edge nodes","mon-apm":"APM for fleet management platform performance","mon-dcim":"DCIM for remote DC facilities in transport hubs","mon-netflow":"Network flow analysis for IoT device traffic patterns and WAN bandwidth" } },
    database: { items:["db-pg-sub","db-nosql"], reasons:{ "db-pg-sub":"PostgreSQL for fleet scheduling, routing, and transaction records","db-nosql":"MongoDB for real-time IoT event streams and telemetry data" } },
    vmware: { items:["vm-vsphere","vm-vcenter","vm-vsan","hv-nutanix-aos","hv-azstack"], reasons:{ "vm-vsphere":"vSphere for server consolidation across depot sites","vm-vcenter":"vCenter for multi-site VM management","vm-vsan":"vSAN for hyper-converged edge nodes at depots","hv-nutanix-aos":"Nutanix HCI at remote depots — simple, ruggedised, single-vendor","hv-azstack":"Azure Stack HCI for edge sites needing hybrid cloud connectivity to Azure IoT" } },
    licenses: { items:["lic-rhel","lic-antivirus"], reasons:{ "lic-rhel":"RHEL for IoT gateway and edge analytics servers","lic-antivirus":"Endpoint protection for transport management terminals" } },
    power: { items:["pwr-ups-10k","pwr-pdu-smart","pwr-crac","pwr-gen"], reasons:{ "pwr-ups-10k":"10kVA modular UPS per rack","pwr-pdu-smart":"Smart PDU for remote power cycling of edge nodes","pwr-crac":"Precision cooling for transport hubs","pwr-gen":"Generator for depot edge DCs with unreliable grid" } },
    rack: { items:["rack-42u","rack-cable-mgr","rack-kvm","rack-install"], reasons:{ "rack-42u":"42U rack for transport hubs","rack-cable-mgr":"Structured cabling for operational maintainability","rack-kvm":"IP KVM for remote management of distributed nodes","rack-install":"Professional integration with network topology documentation" } },
  },
  manufacturing: {
    rationale: "Manufacturing needs AMD EPYC for SAP HANA, SCADA isolation, industrial IoT integration, OT/IT separation via NSX, and 5-year support for production continuity.",
    servers: { brand:"lenovo", series:"ThinkSystem SR-Series (Rack)", modelId:"len-sr665v3", cpuType:"amd", cpuId:"epyc-9454", cpuCount:2, ramId:"ram-384", storageId:"sto-4x1600nvme", nicId:"nic-25g-2p", gpuId:"gpu-a10", osId:"os-rhel", supportId:"sup-5y-4hr", psuId:"psu-redundant", qty:6, reason:"SR665 V3 (AMD EPYC 9454) is SAP-HANA certified. A10 GPU for AI-driven predictive maintenance." },
    network: { items:["net-cisco-n9k-tor","net-cisco-n9k-spine","net-pa-pa5250","net-cisco-asr1k"], reasons:{ "net-cisco-n9k-tor":"Cisco Nexus 9300 ToR for SCADA, MES, and SAP HANA server connectivity — OT/IT zoning","net-cisco-n9k-spine":"Cisco Nexus 9500 100G spine for SAP HANA replication and production storage fabric","net-pa-pa5250":"Palo Alto PA-5250 NGFW for OT/IT micro-segmentation — ICS/SCADA threat prevention signatures","net-cisco-asr1k":"Cisco ASR 1001-X for plant-to-plant MPLS WAN and ERP connectivity" } },
    storage: { items:["sto-san-af","sto-nas","sto-obj"], reasons:{ "sto-san-af":"All-Flash SAN for SAP HANA in-memory database persistence","sto-nas":"NAS for CAD files, production docs, and quality records","sto-obj":"Object storage for sensor telemetry, IoT data lake" } },
    backup: { items:["bkp-sw-ent","bkp-appl","bkp-immutable"], reasons:{ "bkp-sw-ent":"Backup for SAP HANA, MES, and production databases","bkp-appl":"Dedup appliance for efficient backup of large ERP datasets","bkp-immutable":"Immutable backup for audit trail and compliance archival" } },
    monitoring: { items:["mon-sw","mon-apm","mon-dcim","mon-siem","mon-db"], reasons:{ "mon-sw":"OT/IT infrastructure monitoring with SCADA integration","mon-apm":"APM for SAP and MES application performance","mon-dcim":"DCIM for industrial DC with power and environmental monitoring","mon-siem":"SIEM for ICS security monitoring and incident response","mon-db":"DB performance monitor for SAP HANA and Oracle ERP" } },
    database: { items:["db-orcl","db-mssql","db-nosql"], reasons:{ "db-orcl":"Oracle DB for manufacturing ERP and supply chain platforms","db-mssql":"SQL Server for MES, quality management, and plant reporting","db-nosql":"MongoDB for IoT sensor data streams and predictive analytics" } },
    vmware: { items:["vm-vsphere","vm-vcenter","vm-vsan","vm-nsx","hv-ocp","hv-nutanix-aos"], reasons:{ "vm-vsphere":"vSphere for production server consolidation","vm-vcenter":"vCenter for multi-plant DC management","vm-vsan":"vSAN for SCADA and MES hyper-converged nodes","vm-nsx":"NSX for OT/IT micro-segmentation - critical for ICS security","hv-ocp":"OpenShift for containerised MES and IIoT analytics microservices","hv-nutanix-aos":"Nutanix HCI at factory floor edge — AHV hypervisor, simple management" } },
    licenses: { items:["lic-rhel","lic-suse","lic-win-srv","lic-antivirus"], reasons:{ "lic-rhel":"RHEL - certified platform for SAP HANA and Oracle DB","lic-suse":"SUSE Linux Enterprise - SAP preferred OS for HANA","lic-win-srv":"Windows Server for MES clients and SCADA HMIs","lic-antivirus":"Industrial-hardened endpoint protection for OT systems" } },
    power: { items:["pwr-ups-80k","pwr-pdu-smart","pwr-crac","pwr-gen"], reasons:{ "pwr-ups-80k":"80kVA online UPS - production stoppage is unacceptable","pwr-pdu-smart":"Smart PDU for plant DC energy auditing","pwr-crac":"Precision cooling for industrial DCs","pwr-gen":"Generator for production continuity during grid maintenance" } },
    rack: { items:["rack-42u","rack-cable-mgr","rack-kvm","rack-install","rack-amc"], reasons:{ "rack-42u":"42U racks with IP-rated doors for industrial environment","rack-cable-mgr":"Color-coded cabling by plant system (SAP/SCADA/MES)","rack-kvm":"IP KVM for remote SCADA server access","rack-install":"Certified SAP-HANA infrastructure integration","rack-amc":"5yr AMC - production DCs need guaranteed 4hr SLA" } },
  },
  research: {
    rationale: "HPC/Research needs maximum GPU density, 100G fabric for MPI, TB-scale NVMe, parallel file systems, and specialized high-density rack builds.",
    servers: { brand:"dell", series:"PowerEdge XE-Series (High Density/GPU)", modelId:"dell-xe8545", cpuType:"amd", cpuId:"epyc-9654", cpuCount:2, ramId:"ram-1024", storageId:"sto-8x3840nvme", nicId:"nic-100g-4p", gpuId:"gpu-h100-80", osId:"os-rhel", supportId:"sup-5y-4hr", psuId:"psu-titanium", qty:8, reason:"XE8545 with 4xA100/H100 GPUs is the gold standard for AI training clusters. AMD EPYC 9654 (96 cores) for HPC." },
    network: { items:["net-jun-qfx10k","net-jun-qfx5120","net-jun-mx204"], reasons:{ "net-jun-qfx10k":"Juniper QFX10008 non-blocking spine — 160Tbps for MPI all-reduce and RDMA over converged fabric","net-jun-qfx5120":"Juniper QFX5120 25G/100G ToR for GPU compute node connectivity and storage fabric","net-jun-mx204":"Juniper MX204 core router for internet2/national research network and BGP peering" } },
    storage: { items:["sto-san-af","sto-obj","sto-nas"], reasons:{ "sto-san-af":"All-Flash SAN for checkpoint storage and dataset staging","sto-obj":"Object storage (Ceph/MinIO) for S3-compatible research data lake","sto-nas":"Parallel NAS (GPFS/Lustre) for shared /scratch and /home" } },
    backup: { items:["bkp-sw-ent","bkp-appl","bkp-immutable","bkp-cloud-gw"], reasons:{ "bkp-sw-ent":"Backup for simulation results, trained models, and datasets","bkp-appl":"High-throughput backup appliance for TB-scale checkpoint files","bkp-immutable":"Immutable storage for published research data - grant compliance","bkp-cloud-gw":"Cloud tier for cold research archive (AWS Glacier/Azure Cool)" } },
    monitoring: { items:["mon-sw","mon-apm","mon-dcim","mon-gpu"], reasons:{ "mon-sw":"HPC cluster monitoring with GPU utilization metrics","mon-apm":"Job scheduler and MPI performance profiling","mon-dcim":"DCIM critical for high-density GPU rack power and thermal management","mon-gpu":"NVIDIA DCGM GPU telemetry - track GPU utilization, temperature, memory bandwidth, and ECC errors across the cluster" } },
    database: { items:["db-pg-sub","db-nosql"], reasons:{ "db-pg-sub":"PostgreSQL for experiment metadata, results tracking, and lab notebooks","db-nosql":"MongoDB for unstructured research data and genomics pipelines" } },
    vmware: { items:["vm-vsphere","vm-vcenter","vm-vrops","hv-ocp","hv-ocp-storage","hv-proxmox"], reasons:{ "vm-vsphere":"vSphere for management VMs and interactive research nodes","vm-vcenter":"vCenter for cluster lifecycle and resource management","vm-vrops":"vROps for GPU and CPU utilization analytics and chargeback","hv-ocp":"Red Hat OpenShift for AI/ML pipelines, Jupyter hubs, and model serving","hv-ocp-storage":"OpenShift Data Foundation (Ceph) for S3-compatible research data lake on OpenShift","hv-proxmox":"Proxmox VE for cost-effective lab and dev cluster virtualisation alongside HPC" } },
    licenses: { items:["lic-rhel","lic-antivirus"], reasons:{ "lic-rhel":"RHEL - required for HPC middleware (Slurm, OpenMPI, CUDA drivers)","lic-antivirus":"Endpoint protection for cluster login nodes and storage servers" } },
    power: { items:["pwr-ups-80k","pwr-pdu-smart","pwr-crac","pwr-gen"], reasons:{ "pwr-ups-80k":"80kVA UPS - GPU cluster racks consume 20-30kW each","pwr-pdu-smart":"Smart PDU with per-outlet monitoring for GPU node power measurement","pwr-crac":"High-capacity CRAC - GPU servers generate extreme heat loads","pwr-gen":"Generator for running multi-week training jobs through grid events" } },
    rack: { items:["rack-42u","rack-cable-mgr","rack-kvm","rack-install","rack-amc"], reasons:{ "rack-42u":"42U high-density racks with enhanced airflow for GPU servers","rack-cable-mgr":"High-density cable management for 100G DAC/fiber bundles","rack-kvm":"IP KVM for cluster node console access during training jobs","rack-install":"HPC-certified integration with fabric and storage cabling","rack-amc":"5yr AMC to protect research investment in GPU infrastructure" } },
  },
  smb: {
    rationale: "SMB needs cost-effective, easy-to-manage infrastructure with integrated backup, basic monitoring, and simple virtualization - minimal operational complexity.",
    servers: { brand:"dell", series:"PowerEdge R-Series (Rack)", modelId:"dell-r350", cpuType:"intel", cpuId:"xeon-silver-4314", cpuCount:1, ramId:"ram-64", storageId:"sto-2x480", nicId:"nic-1g-2p", gpuId:"gpu-none", osId:"os-win-std", supportId:"sup-3y-nbd", psuId:"psu-single", qty:2, reason:"R350 entry-level provides reliable SMB server at low cost. 2 nodes for basic redundancy." },
    network: { items:["net-aruba-6300","net-forti-fg100f"], reasons:{ "net-aruba-6300":"Aruba CX 6300 managed PoE switch — right-sized for SMB servers, VoIP, and WiFi APs with zero-touch provisioning","net-forti-fg100f":"FortiGate 100F UTM firewall — all-in-one NGFW, SD-WAN, VPN, and web filtering ideal for SMB budget" } },
    storage: { items:["sto-nas"], reasons:{ "sto-nas":"NAS provides all SMB needs: file sharing, backup target, and simple iSCSI for VMs" } },
    backup: { items:["bkp-sw-ent","bkp-appl"], reasons:{ "bkp-sw-ent":"Backup software for business-critical data protection","bkp-appl":"Compact backup appliance with dedup for SMB budget" } },
    monitoring: { items:["mon-sw","mon-aio"], reasons:{ "mon-sw":"Basic infrastructure monitoring for proactive alerting on small team","mon-aio":"All-in-one observability replaces multiple point tools - cost-effective for SMB" } },
    database: { items:["db-mssql"], reasons:{ "db-mssql":"SQL Server Standard for SMB ERP, CRM, and accounting applications" } },
    vmware: { items:["vm-vsphere","vm-vcenter","hv-hyperv","hv-proxmox"], reasons:{ "vm-vsphere":"vSphere Essentials for SMB VM consolidation on 2 nodes","vm-vcenter":"vCenter Essentials for simple centralised management","hv-hyperv":"Hyper-V free with Windows Server — zero extra cost for SMB VMs","hv-proxmox":"Proxmox VE as budget-friendly alternative to vSphere for SMB KVM virtualisation" } },
    licenses: { items:["lic-win-srv","lic-antivirus"], reasons:{ "lic-win-srv":"Windows Server Standard for AD, DNS, DHCP, and file services","lic-antivirus":"Business endpoint protection for all servers and PCs" } },
    power: { items:["pwr-ups-10k","pwr-pdu-basic"], reasons:{ "pwr-ups-10k":"10kVA UPS for server room power protection","pwr-pdu-basic":"Basic PDU - cost-appropriate for SMB power distribution" } },
    rack: { items:["rack-42u","rack-install"], reasons:{ "rack-42u":"Single 42U rack sufficient for complete SMB infrastructure","rack-install":"Professional racking and cabling to ensure neat, maintainable setup" } },
  },
  gaming: {
    rationale: "Gaming platforms need high-frequency CPUs, fast NVMe, high-bandwidth NICs for real-time multiplayer, GPU for AI NPCs, and strong DDoS-capable network security.",
    servers: { brand:"dell", series:"PowerEdge R-Series (Rack)", modelId:"dell-r750xa", cpuType:"intel", cpuId:"xeon-gold-6448", cpuCount:2, ramId:"ram-256", storageId:"sto-4x1600nvme", nicId:"nic-25g-4p", gpuId:"gpu-a10", osId:"os-none", supportId:"sup-3y-4hr", psuId:"psu-redundant", qty:8, reason:"R750xa with 4x25G NICs for game server sharding. A10 GPU for AI-driven NPC and anti-cheat ML models." },
    network: { items:["net-cisco-n9k-tor","net-cisco-n9k-spine","net-forti-fg4200f","net-f5-best","net-f5-asm","net-cisco-asr1k"], reasons:{ "net-cisco-n9k-tor":"Cisco Nexus 9300 ToR for game server sharding and inter-node traffic","net-cisco-n9k-spine":"Cisco Nexus 9500 non-blocking 100G spine for matchmaking fabric","net-forti-fg4200f":"FortiGate 4200F with NP7 ASIC — 200Gbps DDoS mitigation and volumetric attack defence","net-f5-best":"F5 BIG-IP i5800 for game session ADC, matchmaking API load balancing, and SSL offload","net-f5-asm":"F5 Advanced WAF for API protection, bot detection, and game economy fraud prevention","net-cisco-asr1k":"Cisco ASR 1001-X with BGP for Anycast routing and global player latency optimisation" } },
    storage: { items:["sto-san-af","sto-obj"], reasons:{ "sto-san-af":"All-Flash SAN for game world state and player save data","sto-obj":"Object storage for game asset CDN, updates, and player replays" } },
    backup: { items:["bkp-sw-ent","bkp-appl","bkp-immutable"], reasons:{ "bkp-sw-ent":"Backup for player databases, economy, and world state","bkp-appl":"Rapid recovery appliance for game world rollback capability","bkp-immutable":"Immutable backup for player transaction records and anti-fraud" } },
    monitoring: { items:["mon-sw","mon-apm","mon-siem","mon-netflow","mon-aio"], reasons:{ "mon-sw":"Real-time server health monitoring for game uptime SLA","mon-apm":"Player experience monitoring - lag spikes directly impact retention","mon-siem":"SIEM for account security, bot detection, and exploit monitoring","mon-netflow":"Network flow analysis for DDoS early detection and player traffic profiling","mon-aio":"Full-stack observability for matchmaking, game servers, and CDN in a single pane of glass" } },
    database: { items:["db-mssql","db-nosql","db-pg-sub"], reasons:{ "db-mssql":"SQL Server for player accounts, billing, and in-game economy","db-nosql":"MongoDB/Redis for real-time leaderboards, sessions, and game state","db-pg-sub":"PostgreSQL for analytics, reporting, and player behavior data" } },
    vmware: { items:["vm-vsphere","vm-vcenter","vm-nsx","hv-ocp","hv-nutanix-aos"], reasons:{ "vm-vsphere":"vSphere for dev, test, and management server workloads","vm-vcenter":"vCenter for game platform VM lifecycle management","vm-nsx":"NSX micro-segmentation for isolated game server zones and DDoS containment","hv-ocp":"OpenShift for containerised game microservices, matchmaking APIs, and CI/CD pipelines","hv-nutanix-aos":"Nutanix HCI for game analytics and backend services with rapid horizontal scale" } },
    licenses: { items:["lic-win-srv","lic-antivirus"], reasons:{ "lic-win-srv":"Windows Server for game backend services and admin tools","lic-antivirus":"Endpoint protection for management and CI/CD infrastructure" } },
    power: { items:["pwr-ups-10k","pwr-pdu-smart","pwr-crac","pwr-gen"], reasons:{ "pwr-ups-10k":"Modular UPS per rack - game servers must not drop mid-match","pwr-pdu-smart":"Smart PDU for per-server power monitoring and density planning","pwr-crac":"Precision cooling for dense game server racks","pwr-gen":"Generator - gaming outages go viral; 99.99% uptime is business-critical" } },
    rack: { items:["rack-42u","rack-cable-mgr","rack-kvm","rack-install"], reasons:{ "rack-42u":"42U racks for 8 game servers with full cabling","rack-cable-mgr":"Color-coded cabling by game title/zone for operational clarity","rack-kvm":"IP KVM for rapid emergency server access during live incidents","rack-install":"Professional integration with network zone documentation" } },
  },
  design: {
    rationale: "Design & Architecture needs professional GPU servers for rendering, high-bandwidth shared storage, NVIDIA-certified visualization platforms, and Windows DC for Citrix/VDI delivery.",
    servers: { brand:"dell", series:"PowerEdge XE-Series (High Density/GPU)", modelId:"dell-xe8545", cpuType:"intel", cpuId:"xeon-plat-8360", cpuCount:2, ramId:"ram-512", storageId:"sto-4x1600nvme", nicId:"nic-100g-2p", gpuId:"gpu-l40s", osId:"os-win-dc", supportId:"sup-5y-4hr", psuId:"psu-titanium", qty:4, reason:"XE8545 with NVIDIA L40S (48GB) is purpose-built for professional visualization, BIM rendering, and VFX workflows." },
    network: { items:["net-jun-qfx5120","net-jun-qfx10k","net-f5-ltm","net-pa-pa820"], reasons:{ "net-jun-qfx5120":"Juniper QFX5120 25G/100G ToR for GPU-to-storage render fabric — low latency for large frame transfers","net-jun-qfx10k":"Juniper QFX10008 spine for high-bandwidth GPU cluster and NAS interconnect","net-f5-ltm":"F5 BIG-IP LTM for vGPU session delivery and Horizon/Citrix connection broker load balancing","net-pa-pa820":"Palo Alto PA-820 NGFW for IP protection of proprietary design assets and secure remote rendering access" } },
    storage: { items:["sto-san-af","sto-nas","sto-obj"], reasons:{ "sto-san-af":"All-Flash SAN for active project files and render farm scratch","sto-nas":"High-throughput NAS for shared project repositories","sto-obj":"Object storage for completed renders, archives, and asset libraries" } },
    backup: { items:["bkp-sw-ent","bkp-appl","bkp-cloud-gw"], reasons:{ "bkp-sw-ent":"Enterprise backup protecting valuable design IP and project files","bkp-appl":"Fast appliance for large CAD/BIM file sets with dedup","bkp-cloud-gw":"Cloud backup for off-site archival of completed project deliverables" } },
    monitoring: { items:["mon-sw","mon-apm","mon-dcim","mon-gpu"], reasons:{ "mon-sw":"Infrastructure monitoring for render farm and vGPU servers","mon-apm":"Performance monitoring of GPU utilization and render job throughput","mon-dcim":"DCIM critical - GPU servers have very high power density","mon-gpu":"NVIDIA DCGM telemetry for L40S vGPU utilization, frame buffer usage, and thermal throttling alerts" } },
    database: { items:["db-mssql","db-pg-sub"], reasons:{ "db-mssql":"SQL Server for project management, asset tracking, and billing","db-pg-sub":"PostgreSQL for open-source BIM data management platforms" } },
    vmware: { items:["vm-vsphere","vm-vcenter","vm-horizon","vm-vrops","hv-nutanix-aos","hv-hpe-simplivity"], reasons:{ "vm-vsphere":"vSphere for vGPU workload consolidation and HA","vm-vcenter":"vCenter for managing render farm VMs and designer desktops","vm-horizon":"VMware Horizon with NVIDIA vGPU for remote designer workstations","vm-vrops":"vROps for GPU resource optimization and render job scheduling","hv-nutanix-aos":"Nutanix HCI for render farm nodes — AHV with GPU passthrough support","hv-hpe-simplivity":"HPE SimpliVity for render nodes with built-in WAN optimisation and rapid backup" } },
    licenses: { items:["lic-win-srv","lic-antivirus","lic-citrix"], reasons:{ "lic-win-srv":"Windows Server DC for vGPU hosts and NVIDIA GRID licensing","lic-antivirus":"Endpoint protection for design workstations and render nodes","lic-citrix":"Citrix Virtual Apps for legacy CAD application delivery" } },
    power: { items:["pwr-ups-80k","pwr-pdu-smart","pwr-crac","pwr-gen"], reasons:{ "pwr-ups-80k":"80kVA - L40S GPU servers draw 350W each; full rack = 15kW+","pwr-pdu-smart":"High-amperage smart PDU (32A) for GPU rack power distribution","pwr-crac":"N+1 CRAC with direct liquid cooling option for GPU density","pwr-gen":"Generator for overnight render jobs that cannot be interrupted" } },
    rack: { items:["rack-42u","rack-cable-mgr","rack-kvm","rack-install","rack-amc"], reasons:{ "rack-42u":"Deep 42U racks (1000mm) for full-length GPU servers","rack-cable-mgr":"High-density cable management for 100G DAC/optical bundles","rack-kvm":"IP KVM for remote access to render nodes during off-hours","rack-install":"NVIDIA-certified rack integration for vGPU infrastructure","rack-amc":"5yr AMC for premium GPU investment protection" } },
  },
};

const SERVER_BRANDS = {
  dell: { label:"Dell PowerEdge", logo:"DELL", color:"#007DB8", series:{
    "PowerEdge R-Series (Rack)":{ models:[
      {id:"dell-r250",name:"PowerEdge R250",formFactor:"1U",basePrice:1800,tier:"Entry"},
      {id:"dell-r350",name:"PowerEdge R350",formFactor:"1U",basePrice:2400,tier:"Entry"},
      {id:"dell-r450",name:"PowerEdge R450",formFactor:"1U",basePrice:4200,tier:"Mid-range"},
      {id:"dell-r550",name:"PowerEdge R550",formFactor:"2U",basePrice:5800,tier:"Mid-range"},
      {id:"dell-r650",name:"PowerEdge R650",formFactor:"1U",basePrice:7200,tier:"Mid-range"},
      {id:"dell-r750",name:"PowerEdge R750",formFactor:"2U",basePrice:9500,tier:"High-end"},
      {id:"dell-r750xa",name:"PowerEdge R750xa",formFactor:"2U",basePrice:14000,tier:"High-end"},
      {id:"dell-r850",name:"PowerEdge R850",formFactor:"2U",basePrice:18000,tier:"High-end"},
      {id:"dell-r940",name:"PowerEdge R940",formFactor:"4U",basePrice:28000,tier:"Mission Critical"},
      {id:"dell-r960",name:"PowerEdge R960",formFactor:"4U",basePrice:38000,tier:"Mission Critical"},
      {id:"dell-r6625",name:"PowerEdge R6625 (AMD)",formFactor:"1U",basePrice:8500,tier:"High-end"},
      {id:"dell-r7625",name:"PowerEdge R7625 (AMD)",formFactor:"2U",basePrice:12000,tier:"High-end"},
    ]},
    "PowerEdge T-Series (Tower)":{ models:[
      {id:"dell-t150",name:"PowerEdge T150",formFactor:"Tower",basePrice:1200,tier:"Entry"},
      {id:"dell-t350",name:"PowerEdge T350",formFactor:"Tower",basePrice:2200,tier:"Entry"},
      {id:"dell-t550",name:"PowerEdge T550",formFactor:"Tower",basePrice:4800,tier:"Mid-range"},
      {id:"dell-t650",name:"PowerEdge T650",formFactor:"Tower",basePrice:7500,tier:"High-end"},
    ]},
    "PowerEdge XE-Series (High Density/GPU)":{ models:[
      {id:"dell-xe2420",name:"PowerEdge XE2420",formFactor:"2U",basePrice:18000,tier:"High-end"},
      {id:"dell-xe8545",name:"PowerEdge XE8545 (GPU)",formFactor:"4U",basePrice:85000,tier:"Mission Critical"},
      {id:"dell-xe9680",name:"PowerEdge XE9680 (AI/GPU)",formFactor:"8U",basePrice:180000,tier:"Mission Critical"},
    ]},
  }},
  hp: { label:"HPE ProLiant", logo:"HPE", color:"#01A982", series:{
    "ProLiant DL-Series (Rack)":{ models:[
      {id:"hp-dl20g11",name:"ProLiant DL20 Gen11",formFactor:"1U",basePrice:1600,tier:"Entry"},
      {id:"hp-dl360g11",name:"ProLiant DL360 Gen11",formFactor:"1U",basePrice:5200,tier:"Mid-range"},
      {id:"hp-dl380g11",name:"ProLiant DL380 Gen11",formFactor:"2U",basePrice:7800,tier:"Mid-range"},
      {id:"hp-dl385g11",name:"ProLiant DL385 Gen11 (AMD)",formFactor:"2U",basePrice:8500,tier:"High-end"},
      {id:"hp-dl560g11",name:"ProLiant DL560 Gen11",formFactor:"2U",basePrice:16000,tier:"High-end"},
      {id:"hp-dl580g11",name:"ProLiant DL580 Gen11",formFactor:"4U",basePrice:28000,tier:"Mission Critical"},
    ]},
    "ProLiant ML-Series (Tower)":{ models:[
      {id:"hp-ml30g11",name:"ProLiant ML30 Gen11",formFactor:"Tower",basePrice:1400,tier:"Entry"},
      {id:"hp-ml110g11",name:"ProLiant ML110 Gen11",formFactor:"Tower",basePrice:2600,tier:"Entry"},
      {id:"hp-ml350g11",name:"ProLiant ML350 Gen11",formFactor:"Tower",basePrice:5400,tier:"Mid-range"},
    ]},
    "Apollo / Cray (HPC/GPU)":{ models:[
      {id:"hp-apo2000g2",name:"Apollo 2000 Gen10+",formFactor:"2U",basePrice:22000,tier:"High-end"},
      {id:"hp-apo6500g11",name:"Apollo 6500 Gen11 (GPU)",formFactor:"4U",basePrice:78000,tier:"Mission Critical"},
      {id:"hp-cray-xd665",name:"Cray XD665 (AI/HPC)",formFactor:"2U",basePrice:145000,tier:"Mission Critical"},
    ]},
  }},
  lenovo: { label:"Lenovo ThinkSystem", logo:"LENOVO", color:"#E2231A", series:{
    "ThinkSystem SR-Series (Rack)":{ models:[
      {id:"len-sr250v3",name:"ThinkSystem SR250 V3",formFactor:"1U",basePrice:1700,tier:"Entry"},
      {id:"len-sr630v3",name:"ThinkSystem SR630 V3",formFactor:"1U",basePrice:5400,tier:"Mid-range"},
      {id:"len-sr650v3",name:"ThinkSystem SR650 V3",formFactor:"2U",basePrice:8200,tier:"Mid-range"},
      {id:"len-sr655v3",name:"ThinkSystem SR655 V3 (AMD)",formFactor:"1U",basePrice:6800,tier:"Mid-range"},
      {id:"len-sr665v3",name:"ThinkSystem SR665 V3 (AMD)",formFactor:"2U",basePrice:9500,tier:"High-end"},
      {id:"len-sr675v3",name:"ThinkSystem SR675 V3 (AMD)",formFactor:"2U",basePrice:12500,tier:"High-end"},
      {id:"len-sr850v3",name:"ThinkSystem SR850 V3",formFactor:"2U",basePrice:18000,tier:"High-end"},
      {id:"len-sr860v3",name:"ThinkSystem SR860 V3",formFactor:"4U",basePrice:32000,tier:"Mission Critical"},
      {id:"len-sr950v3",name:"ThinkSystem SR950 V3",formFactor:"4U",basePrice:42000,tier:"Mission Critical"},
    ]},
    "ThinkSystem ST-Series (Tower)":{ models:[
      {id:"len-st250v3",name:"ThinkSystem ST250 V3",formFactor:"Tower",basePrice:1500,tier:"Entry"},
      {id:"len-st650v3",name:"ThinkSystem ST650 V3",formFactor:"Tower",basePrice:5800,tier:"Mid-range"},
    ]},
    "ThinkSystem SD-Series (High Density/GPU)":{ models:[
      {id:"len-sd530",name:"ThinkSystem SD530 (2U4N)",formFactor:"2U",basePrice:14000,tier:"High-end"},
      {id:"len-sd650v3",name:"ThinkSystem SD650 V3 (GPU)",formFactor:"2U",basePrice:55000,tier:"Mission Critical"},
      {id:"len-sd650nv3",name:"ThinkSystem SD650-N V3 (AI)",formFactor:"2U",basePrice:95000,tier:"Mission Critical"},
    ]},
  }},
};

const CPU_OPTIONS = {
  intel:[
    {id:"xeon-silver-4314",label:"Xeon Silver 4314 (16C/2.4GHz)",priceAdder:0},
    {id:"xeon-silver-4416",label:"Xeon Silver 4416+ (20C/2.0GHz)",priceAdder:200},
    {id:"xeon-gold-5415",label:"Xeon Gold 5415+ (8C/2.9GHz)",priceAdder:600},
    {id:"xeon-gold-6338",label:"Xeon Gold 6338 (32C/2.0GHz)",priceAdder:1800},
    {id:"xeon-gold-6448",label:"Xeon Gold 6448Y (32C/2.1GHz)",priceAdder:2200},
    {id:"xeon-plat-8360",label:"Xeon Platinum 8360Y (36C/2.4GHz)",priceAdder:4500},
    {id:"xeon-plat-8468",label:"Xeon Platinum 8468 (48C/2.1GHz)",priceAdder:7200},
    {id:"xeon-plat-8592",label:"Xeon Platinum 8592+ (64C/1.9GHz)",priceAdder:9500},
  ],
  amd:[
    {id:"epyc-9124",label:"EPYC 9124 (16C/3.0GHz)",priceAdder:800},
    {id:"epyc-9254",label:"EPYC 9254 (24C/2.9GHz)",priceAdder:1500},
    {id:"epyc-9354",label:"EPYC 9354 (32C/3.25GHz)",priceAdder:2800},
    {id:"epyc-9454",label:"EPYC 9454 (48C/2.75GHz)",priceAdder:4200},
    {id:"epyc-9554",label:"EPYC 9554 (64C/3.1GHz)",priceAdder:6500},
    {id:"epyc-9654",label:"EPYC 9654 (96C/2.4GHz)",priceAdder:9800},
    {id:"epyc-9754",label:"EPYC 9754 (128C/2.25GHz)",priceAdder:14000},
  ]
};
const RAM_OPTIONS=[
  {id:"ram-64",label:"64 GB DDR5",priceAdder:0},{id:"ram-128",label:"128 GB DDR5",priceAdder:600},
  {id:"ram-256",label:"256 GB DDR5",priceAdder:1400},{id:"ram-384",label:"384 GB DDR5",priceAdder:2200},
  {id:"ram-512",label:"512 GB DDR5",priceAdder:3200},{id:"ram-768",label:"768 GB DDR5",priceAdder:5000},
  {id:"ram-1024",label:"1 TB DDR5",priceAdder:7500},{id:"ram-1536",label:"1.5 TB DDR5",priceAdder:11000},{id:"ram-2048",label:"2 TB DDR5",priceAdder:16000},
];
const STORAGE_OPT=[
  {id:"sto-none",label:"No Local Storage",priceAdder:0},{id:"sto-2x480",label:"2x480GB SATA SSD RAID-1",priceAdder:200},
  {id:"sto-2x960",label:"2x960GB SATA SSD RAID-1",priceAdder:380},{id:"sto-4x1920",label:"4x1.92TB SATA SSD RAID-5",priceAdder:1200},
  {id:"sto-2x800nvme",label:"2x800GB NVMe RAID-1",priceAdder:900},{id:"sto-4x1600nvme",label:"4x1.6TB NVMe RAID-5",priceAdder:2800},
  {id:"sto-8x3840nvme",label:"8x3.84TB NVMe RAID-6",priceAdder:9500},{id:"sto-4x8hdd",label:"4x8TB SAS HDD RAID-5",priceAdder:1400},
  {id:"sto-12x12hdd",label:"12x12TB NLSAS HDD RAID-6",priceAdder:3600},
];
const NIC_OPT=[
  {id:"nic-1g-2p",label:"2x1GbE",priceAdder:0},{id:"nic-10g-2p",label:"2x10GbE SFP+",priceAdder:350},
  {id:"nic-25g-2p",label:"2x25GbE SFP28",priceAdder:650},{id:"nic-25g-4p",label:"4x25GbE SFP28",priceAdder:1100},
  {id:"nic-100g-2p",label:"2x100GbE QSFP28",priceAdder:2200},{id:"nic-100g-4p",label:"4x100GbE QSFP28",priceAdder:3800},
];
const GPU_OPT=[
  {id:"gpu-none",label:"No GPU",priceAdder:0},{id:"gpu-t4",label:"NVIDIA T4 (16GB)",priceAdder:3200},
  {id:"gpu-a10",label:"NVIDIA A10 (24GB)",priceAdder:5500},{id:"gpu-a30",label:"NVIDIA A30 (24GB HBM2)",priceAdder:8000},
  {id:"gpu-a100-40",label:"NVIDIA A100 40GB SXM",priceAdder:14000},{id:"gpu-a100-80",label:"NVIDIA A100 80GB SXM",priceAdder:18000},
  {id:"gpu-h100-80",label:"NVIDIA H100 80GB SXM5",priceAdder:32000},{id:"gpu-l40s",label:"NVIDIA L40S (48GB Viz)",priceAdder:11000},
];
const OS_OPT=[
  {id:"os-none",label:"No OS (BYO)",priceAdder:0},{id:"os-win-std",label:"Windows Server 2022 Standard",priceAdder:1200},
  {id:"os-win-dc",label:"Windows Server 2022 Datacenter",priceAdder:6200},{id:"os-rhel",label:"RHEL 9 (1yr)",priceAdder:800},
  {id:"os-sles",label:"SUSE Linux Enterprise 15",priceAdder:600},{id:"os-vmware",label:"VMware ESXi (license sep.)",priceAdder:0},
];
const SUPPORT_OPT=[
  {id:"sup-base",label:"Basic 1-Year NBD",priceAdder:0},{id:"sup-3y-nbd",label:"3-Year Next Business Day",priceAdder:800},
  {id:"sup-3y-4hr",label:"3-Year 4-Hour Onsite",priceAdder:1800},{id:"sup-5y-4hr",label:"5-Year 4-Hour Onsite",priceAdder:3200},
  {id:"sup-5y-247",label:"5-Year 24x7 Mission Critical",priceAdder:5500},
];
const PSU_OPT=[
  {id:"psu-single",label:"Single PSU",priceAdder:0},{id:"psu-redundant",label:"Redundant (1+1) PSU",priceAdder:300},
  {id:"psu-titanium",label:"Redundant Titanium Efficiency",priceAdder:650},
];

const INFRA_CATALOGUE = {
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
  power:{label:"Power & Cooling",icon:"⚡",color:"#f59e0b",items:[
    {id:"pwr-ups-10k",name:"UPS 10kVA Modular",spec:"Online double-conversion, N+1 ready",unitPrice:8500},
    {id:"pwr-ups-80k",name:"UPS 80kVA 3-Phase",spec:"Online, scalable, SNMP managed",unitPrice:52000},
    {id:"pwr-pdu-basic",name:"Basic PDU",spec:"0U vertical, 32A, C13/C19 outlets",unitPrice:450},
    {id:"pwr-pdu-smart",name:"Smart PDU",spec:"Switched+metered, per-outlet, SNMP",unitPrice:1800},
    {id:"pwr-crac",name:"CRAC Unit 50kW",spec:"Precision cooling, N+1 EC fans",unitPrice:28000},
    {id:"pwr-gen",name:"Diesel Generator 500kVA",spec:"Auto-transfer, 48hr fuel tank",unitPrice:85000},
  ]},
  rack:{label:"Rack & Stack",icon:"🏗️",color:"#6b7280",items:[
    {id:"rack-42u",name:"42U Server Rack",spec:"800x1000mm, 1200kg rated, blanking panels",unitPrice:1200},
    {id:"rack-48u",name:"48U Network Cabinet",spec:"600x800mm, vented, lockable",unitPrice:950},
    {id:"rack-cable-mgr",name:"Cable Management Kit",spec:"Horizontal+vertical per rack",unitPrice:320},
    {id:"rack-kvm",name:"KVM Switch 16-port IP",spec:"IP-based, multi-platform, 4K",unitPrice:2800},
    {id:"rack-install",name:"Rack Integration Services",spec:"Cabling, labeling, documentation",unitPrice:3500},
    {id:"rack-amc",name:"AMC / Support Contract 1yr",spec:"24x7 onsite, 4-hour SLA",unitPrice:18000},
  ]},
};

const BRAND_COLORS={cisco:"#1ba0d7",juniper:"#84ba27",aruba:"#f96c1b",fortinet:"#e7222e",f5:"#e5002b",paloalto:"#fa582d"};
const BRAND_LABELS={cisco:"CISCO",juniper:"JUNIPER",aruba:"ARUBA",fortinet:"FORTINET",f5:"F5",paloalto:"PALO ALTO"};

const fmt=(n)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
const computeServerPrice=(cfg)=>{
  const brand=SERVER_BRANDS[cfg.brand];if(!brand)return 0;
  const sd=brand.series[cfg.series];if(!sd)return 0;
  const model=sd.models.find(m=>m.id===cfg.modelId);if(!model)return 0;
  const cpuList=CPU_OPTIONS[cfg.cpuType]||CPU_OPTIONS.intel;
  const cpu=cpuList.find(c=>c.id===cfg.cpuId)||cpuList[0];
  const ram=RAM_OPTIONS.find(r=>r.id===cfg.ramId)||RAM_OPTIONS[0];
  const sto=STORAGE_OPT.find(s=>s.id===cfg.storageId)||STORAGE_OPT[0];
  const nic=NIC_OPT.find(n=>n.id===cfg.nicId)||NIC_OPT[0];
  const gpu=GPU_OPT.find(g=>g.id===cfg.gpuId)||GPU_OPT[0];
  const os=OS_OPT.find(o=>o.id===cfg.osId)||OS_OPT[0];
  const sup=SUPPORT_OPT.find(s=>s.id===cfg.supportId)||SUPPORT_OPT[0];
  const psu=PSU_OPT.find(p=>p.id===cfg.psuId)||PSU_OPT[0];
  return(model.basePrice+cpu.priceAdder*cfg.cpuCount+ram.priceAdder+sto.priceAdder+nic.priceAdder+gpu.priceAdder+os.priceAdder+sup.priceAdder+psu.priceAdder)*cfg.qty;
};

function BrandBadge({brand}){
  if(!brand)return null;
  return <span style={{borderRadius:3,padding:"2px 7px",fontSize:9,fontWeight:700,background:BRAND_COLORS[brand]||"#7c3aed",color:"#fff",letterSpacing:0.5,flexShrink:0,whiteSpace:"nowrap"}}>{BRAND_LABELS[brand]||brand.toUpperCase()}</span>;
}









function MainApp(){



  const [appStep,setAppStep]=useState("segment");
  const [activeTab,setActiveTab]=useState("servers");
  const [segKey,setSegKey]=useState(null);
  const [projectInfo,setProjectInfo]=useState({name:"",client:"",date:new Date().toISOString().slice(0,10),engineer:"",notes:""});
  const [serverConfigs,setServerConfigs]=useState([]);
  const [infraSelections,setInfraSelections]=useState({});
  const [aiBoqResult,setAiBoqResult]=useState(null);

  const applyRec=(sk)=>{
    const rec=SEGMENT_RECOMMENDATIONS[sk];
    setServerConfigs([{...rec.servers}]);
    const ni={};
    Object.entries(rec).forEach(([l,d])=>{if(l==="servers"||l==="rationale")return;ni[l]={};d.items.forEach(id=>{ni[l][id]=1;});});
    setInfraSelections(ni);setSegKey(sk);setAppStep("configure");setActiveTab("servers");
  };

  const addServer=()=>{const rec=SEGMENT_RECOMMENDATIONS[segKey]?.servers||{};const brand=SERVER_BRANDS[rec.brand||"dell"];const sk=rec.series||Object.keys(brand.series)[0];setServerConfigs(p=>[...p,{...rec,brand:rec.brand||"dell",series:sk,modelId:rec.modelId||brand.series[sk].models[0].id,qty:1}]);};
  const removeServer=(i)=>setServerConfigs(p=>p.filter((_,idx)=>idx!==i));
  const updateServer=(i,f,v)=>setServerConfigs(p=>p.map((c,idx)=>{if(idx!==i)return c;const u={...c,[f]:v};if(f==="brand"){const b=SERVER_BRANDS[v];const s=Object.keys(b.series)[0];u.series=s;u.modelId=b.series[s].models[0].id;u.cpuType="intel";u.cpuId=CPU_OPTIONS.intel[0].id;}if(f==="series")u.modelId=SERVER_BRANDS[c.brand].series[v]?.models[0]?.id||c.modelId;return u;}));
  const updateInfraQty=(layer,id,delta)=>setInfraSelections(prev=>{const cat={...(prev[layer]||{})};const n=Math.max(0,(cat[id]||0)+delta);if(n===0)delete cat[id];else cat[id]=n;return{...prev,[layer]:cat};});

  const serverTotal=serverConfigs.reduce((a,c)=>a+computeServerPrice(c),0);
  const infraTotal=Object.entries(infraSelections).reduce((t,[layer,items])=>t+Object.entries(items).reduce((s,[id,qty])=>{const item=INFRA_CATALOGUE[layer]?.items.find(i=>i.id===id);return s+(item?item.unitPrice*qty:0);},0),0);
  const grandTotal=serverTotal+infraTotal;
  const seg=segKey?SEGMENTS[segKey]:null;
  const rec=segKey?SEGMENT_RECOMMENDATIONS[segKey]:null;

  if(appStep==="segment")return <SegmentScreen onSelect={applyRec} onAI={()=>setAppStep("ai")}/>;
  if(appStep==="ai")return <AIScreen onBack={()=>setAppStep("segment")} onResult={(res)=>{setAiBoqResult(res);setAppStep("configure");setActiveTab("ai-result");}}/>;
  if(appStep==="report")return <ReportView projectInfo={projectInfo} serverConfigs={serverConfigs} infraSelections={infraSelections} grandTotal={grandTotal} serverTotal={serverTotal} infraTotal={infraTotal} seg={seg} rec={rec} fmt={fmt} onBack={()=>setAppStep("configure")}/>;

  const TABS=[{key:"servers",label:"Servers",icon:"🖥️"},...Object.entries(INFRA_CATALOGUE).map(([k,v])=>({key:k,label:v.label,icon:v.icon})),{key:"ai-result",label:"AI BOQ",icon:"🤖"}];

  return(
    <div style={{fontFamily:"'Outfit',sans-serif",background:"#f0f7ff",minHeight:"100vh",color:"#1e3a5f"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#93c5fd;border-radius:3px}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.fade{animation:fadeIn 0.25s ease forwards}select,input,textarea{font-family:inherit!important}`}</style>
      <header style={{background:"#fff",borderBottom:"1px solid #bfdbfe",padding:"0 1.5rem",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:200,boxShadow:"0 1px 8px #1e40af10"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,background:"linear-gradient(135deg,#1e40af,#06b6d4)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>⚡</div>
          <div>
            <div style={{fontWeight:700,fontSize:14,color:"#0c1f3d",lineHeight:1}}>DC-BOQ Pro</div>
            <div style={{fontSize:9,color:"#7aa3c0",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>v9 · OEM NETWORK · MULTI-HYPERVISOR · AI</div>
          </div>
          {seg&&<span style={{background:`${seg.color}20`,border:`1px solid ${seg.color}40`,borderRadius:4,padding:"2px 9px",fontSize:10,color:seg.color,fontWeight:600,marginLeft:4}}>{seg.icon} {seg.label}</span>}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>setAppStep("ai")} style={{padding:"5px 12px",borderRadius:5,border:"1px solid #a855f740",background:"#a855f710",color:"#a855f7",cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:600}}>🤖 AI BOQ</button>
          <button onClick={()=>setAppStep("segment")} style={{padding:"5px 12px",borderRadius:5,border:"1px solid #bfdbfe",background:"transparent",color:"#4b7fa6",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>↩ Segments</button>
          <div style={{background:"linear-gradient(135deg,#1e40af,#0369a1)",borderRadius:16,padding:"4px 14px",display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:9,color:"#bfdbfe",fontFamily:"'JetBrains Mono',monospace"}}>TOTAL</span>
            <span style={{fontSize:13,fontWeight:700,color:"#fff",fontFamily:"'JetBrains Mono',monospace"}}>{fmt(grandTotal)}</span>
          </div>
          <button onClick={()=>setAppStep("report")} disabled={grandTotal===0} style={{padding:"7px 18px",borderRadius:5,border:"none",background:grandTotal>0?"linear-gradient(135deg,#1e40af,#06b6d4)":"#bfdbfe",color:grandTotal>0?"#fff":"#93c5fd",cursor:grandTotal>0?"pointer":"not-allowed",fontWeight:700,fontSize:12,fontFamily:"inherit"}}>Generate BOQ →</button>
        </div>
      </header>
      <HypervisorSelector infraSelections={infraSelections} updateInfraQty={updateInfraQty} rec={rec} seg={seg}/>
      <div style={{display:"flex",maxWidth:1600,margin:"0 auto"}}>
        <aside style={{width:205,padding:"1rem 0.8rem",position:"sticky",top:56,height:"calc(100vh - 56px)",overflowY:"auto",borderRight:"1px solid #bfdbfe",flexShrink:0,background:"#fff"}}>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:9,color:"#7aa3c0",letterSpacing:2,textTransform:"uppercase",marginBottom:8,fontWeight:600}}>Project Details</div>
            {[["name","Project Name"],["client","Client"],["engineer","Engineer"],["date","Date"]].map(([f,l])=>(
              <div key={f} style={{marginBottom:6}}>
                <label style={{fontSize:9,color:"#7aa3c0",display:"block",marginBottom:2}}>{l}</label>
                <input type={f==="date"?"date":"text"} value={projectInfo[f]} onChange={e=>setProjectInfo(p=>({...p,[f]:e.target.value}))} style={{width:"100%",background:"#f0f7ff",border:"1px solid #bfdbfe",borderRadius:4,padding:"5px 7px",color:"#1e3a5f",fontSize:10,fontFamily:"'JetBrains Mono',monospace"}}/>
              </div>
            ))}
            <div>
              <label style={{fontSize:9,color:"#7aa3c0",display:"block",marginBottom:2}}>Notes</label>
              <textarea value={projectInfo.notes} onChange={e=>setProjectInfo(p=>({...p,notes:e.target.value}))} rows={2} style={{width:"100%",background:"#f0f7ff",border:"1px solid #bfdbfe",borderRadius:4,padding:"5px 7px",color:"#1e3a5f",fontSize:10,fontFamily:"inherit",resize:"vertical"}}/>
            </div>
          </div>
          <div style={{fontSize:9,color:"#7aa3c0",letterSpacing:2,textTransform:"uppercase",marginBottom:8,fontWeight:600}}>Infrastructure Layers</div>
          {TABS.map(t=>{
            const hasRec=t.key==="servers"?(serverConfigs.length>0):t.key==="ai-result"?!!aiBoqResult:(infraSelections[t.key]&&Object.keys(infraSelections[t.key]).length>0);
            const isActive=activeTab===t.key;
            return(
              <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{width:"100%",display:"flex",alignItems:"center",gap:7,padding:"7px 9px",borderRadius:6,border:"1px solid",borderColor:isActive?"#bfdbfe":"transparent",background:isActive?"linear-gradient(135deg,#e8f2fb,#dbeafe)":"transparent",color:isActive?"#0f2644":t.key==="ai-result"?"#a855f7":"#4b7fa6",cursor:"pointer",marginBottom:3,textAlign:"left",transition:"all 0.12s",fontWeight:isActive?600:400}}>
                <span style={{fontSize:13}}>{t.icon}</span>
                <span style={{fontSize:11,flex:1}}>{t.label}</span>
                {hasRec&&<span style={{width:7,height:7,borderRadius:"50%",background:t.key==="ai-result"?"#a855f7":seg?.color||"#06b6d4",flexShrink:0,boxShadow:`0 0 4px ${t.key==="ai-result"?"#a855f7":seg?.color||"#06b6d4"}`}}/>}
              </button>
            );
          })}
        </aside>
        <main style={{flex:1,padding:"1.5rem",overflowY:"auto",background:"#f0f7ff"}} className="fade" key={activeTab}>
          {activeTab==="ai-result"
            ?<AIResultPanel result={aiBoqResult} fmt={fmt} onRerun={()=>setAppStep("ai")}/>
            :activeTab==="servers"
            ?<ServerPanel configs={serverConfigs} updateConfig={updateServer} addConfig={addServer} removeConfig={removeServer} seg={seg} rec={rec} fmt={fmt}/>
            :<InfraPanel cat={INFRA_CATALOGUE[activeTab]} selections={infraSelections[activeTab]||{}} updateQty={(id,d)=>updateInfraQty(activeTab,id,d)} rec={rec?.[activeTab]} seg={seg} fmt={fmt}/>
          }
        </main>
      </div>
    </div>
  );
}

const HV_VENDORS = [
  { key:"vmware",   label:"VMware",     color:"#607078", icon:"🔵", ids:["vm-vsphere","vm-vcenter","vm-vsan","vm-nsx","vm-horizon","vm-vrops"] },
  { key:"microsoft",label:"Microsoft",  color:"#0078d4", icon:"🪟", ids:["hv-hyperv","hv-scvmm","hv-azstack"] },
  { key:"redhat",   label:"Red Hat",    color:"#cc0000", icon:"🎩", ids:["hv-ocp","hv-oshift-virt","hv-ocp-storage"] },
  { key:"oracle",   label:"Oracle",     color:"#f80000", icon:"☁️", ids:["hv-oracle-vm","hv-oracle-olvm","hv-oracle-oci-hci"] },
  { key:"nutanix",  label:"Nutanix",    color:"#024da1", icon:"🟦", ids:["hv-nutanix-aos","hv-nutanix-prism","hv-nutanix-nc2","hv-nutanix-files"] },
  { key:"hpe",      label:"HPE",        color:"#01a982", icon:"🟢", ids:["hv-hpe-morpheus","hv-hpe-simplivity","hv-hpe-synergy-cm"] },
  { key:"opensource",label:"Open Source",color:"#f97316",icon:"🐧", ids:["hv-proxmox","hv-xcp-ng"] },
];

function HypervisorSelector({infraSelections,updateInfraQty,rec,seg}){
  const hvItems = INFRA_CATALOGUE.vmware?.items || [];
  const selectedIds = Object.keys(infraSelections.vmware || {});
  const [expanded, setExpanded] = useState(false);

  const toggleHv = (id) => {
    const cur = (infraSelections.vmware||{})[id]||0;
    if(cur>0){ updateInfraQty("vmware",id,-cur); }
    else { updateInfraQty("vmware",id,1); }
  };

  const recIds = rec?.vmware?.items || [];
  const totalSelected = selectedIds.length;

  return(
    <div style={{background:"#fff",borderBottom:"2px solid #8b5cf620",padding:"14px 24px",boxShadow:"0 2px 12px #1e40af08"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:expanded?14:0,cursor:"pointer"}} onClick={()=>setExpanded(e=>!e)}>
        <div style={{width:32,height:32,background:"linear-gradient(135deg,#8b5cf6,#6366f1)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>⚙️</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:13,color:"#0f2644",lineHeight:1}}>Hypervisor / Virtualisation Stack</div>
          <div style={{fontSize:10,color:"#7aa3c0",marginTop:2}}>
            {totalSelected>0
              ? <span>{totalSelected} selected — <span style={{color:"#8b5cf6",fontWeight:600}}>{selectedIds.map(id=>hvItems.find(i=>i.id===id)?.name.split(" ").slice(0,2).join(" ")).join(", ")}</span></span>
              : "Click to select hypervisors for this project"
            }
          </div>
        </div>
        {totalSelected>0&&<span style={{background:"#8b5cf620",border:"1px solid #8b5cf640",borderRadius:20,padding:"3px 10px",fontSize:10,color:"#8b5cf6",fontWeight:700}}>{totalSelected} selected</span>}
        <span style={{fontSize:16,color:"#8b5cf6",transform:expanded?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
      </div>
      {expanded&&(
        <div>
          {recIds.length>0&&(
            <div style={{marginBottom:12,padding:"8px 12px",background:"#8b5cf608",border:"1px solid #8b5cf630",borderRadius:8,fontSize:10,color:"#7aa3c0"}}>
              <span style={{color:"#8b5cf6",fontWeight:700}}>★ Recommended for {seg?.label}:</span>{" "}
              {recIds.map(id=>{const it=hvItems.find(i=>i.id===id);return it?<button key={id} onClick={()=>{if(!((infraSelections.vmware||{})[id]>0))updateInfraQty("vmware",id,1);}} style={{marginLeft:6,padding:"2px 8px",borderRadius:4,border:`1px solid #8b5cf650`,background:(infraSelections.vmware||{})[id]>0?"#8b5cf620":"transparent",color:"#8b5cf6",cursor:"pointer",fontSize:10,fontWeight:600,fontFamily:"inherit"}}>{it.name.split(" ").slice(0,3).join(" ")}</button>:null;})}
            </div>
          )}
          {HV_VENDORS.map(vendor=>{
            const vendorItems = vendor.ids.map(id=>hvItems.find(i=>i.id===id)).filter(Boolean);
            if(!vendorItems.length) return null;
            const vendorSelected = vendorItems.filter(i=>(infraSelections.vmware||{})[i.id]>0).length;
            return(
              <div key={vendor.key} style={{marginBottom:10}}>
                <div style={{fontSize:9,fontWeight:700,color:vendor.color,letterSpacing:1,textTransform:"uppercase",marginBottom:6,display:"flex",alignItems:"center",gap:5}}>
                  <span>{vendor.icon}</span>{vendor.label}
                  {vendorSelected>0&&<span style={{background:`${vendor.color}20`,border:`1px solid ${vendor.color}40`,borderRadius:10,padding:"1px 7px",fontSize:9,color:vendor.color}}>{vendorSelected}/{vendorItems.length}</span>}
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {vendorItems.map(item=>{
                    const isSelected = (infraSelections.vmware||{})[item.id]>0;
                    const isRec = recIds.includes(item.id);
                    return(
                      <button key={item.id} onClick={()=>toggleHv(item.id)}
                        style={{padding:"7px 12px",borderRadius:8,border:`2px solid ${isSelected?vendor.color:isRec?vendor.color+"60":"#e0e7ff"}`,background:isSelected?`${vendor.color}15`:"#fff",color:isSelected?vendor.color:"#4b7fa6",cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:isSelected?700:400,transition:"all 0.12s",display:"flex",alignItems:"center",gap:6,boxShadow:isSelected?`0 2px 8px ${vendor.color}25`:"none",position:"relative"}}>
                        {isRec&&!isSelected&&<span style={{position:"absolute",top:-4,right:-4,width:8,height:8,borderRadius:"50%",background:seg?.color||"#8b5cf6",border:"1px solid #fff"}}/>}
                        {isSelected&&<span style={{fontSize:12}}>✓</span>}
                        <div style={{textAlign:"left"}}>
                          <div style={{lineHeight:1.2}}>{item.name}</div>
                          <div style={{fontSize:9,color:isSelected?vendor.color+"aa":"#93c5fd",fontFamily:"'JetBrains Mono',monospace"}}>{item.unitPrice===0?"Free":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(item.unitPrice)}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #e0e7ff",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:10,color:"#7aa3c0"}}>{hvItems.length} total hypervisor products available</span>
            <button onClick={()=>setExpanded(false)} style={{padding:"5px 14px",borderRadius:5,border:"1px solid #bfdbfe",background:"#f0f7ff",color:"#1e40af",cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:600}}>Done ✓</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SegmentScreen({onSelect,onAI}){
  const [hov,setHov]=useState(null);
  return(
    <div style={{fontFamily:"'Outfit',sans-serif",background:"linear-gradient(160deg,#e8f2fb 0%,#f0f7ff 60%,#dbeafe 100%)",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"3rem 2rem"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:14,marginBottom:24}}>
          <div style={{width:58,height:58,background:"linear-gradient(135deg,#1e40af,#06b6d4)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,boxShadow:"0 8px 32px #1e40af30"}}>⚡</div>
          <div style={{textAlign:"left"}}>
            <div style={{fontWeight:800,fontSize:26,color:"#0c1f3d",letterSpacing:-0.5}}>DC-BOQ Pro</div>
            <div style={{fontSize:10,color:"#7aa3c0",letterSpacing:3,textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>v9 · OEM Network · Multi-Hypervisor · AI BOQ</div>
          </div>
        </div>
        <h1 style={{fontWeight:800,fontSize:30,color:"#0c1f3d",marginBottom:12,letterSpacing:-0.5}}>Select Your Industry Vertical</h1>
        <p style={{color:"#5a85a8",fontSize:13,maxWidth:560,margin:"0 auto",lineHeight:1.9}}>Choose a segment for a pre-configured full-stack — servers, OEM network, storage, hypervisor, monitoring and more — or let AI build it from your requirements.</p>
        <button onClick={onAI} style={{marginTop:20,padding:"11px 30px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#a855f7,#6366f1)",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:8,boxShadow:"0 4px 20px #a855f730"}}>
          🤖 Generate BOQ from My Requirements
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))",gap:12,maxWidth:1100,width:"100%"}}>
        {Object.entries(SEGMENTS).map(([key,seg])=>{
          const rc=Object.values(SEGMENT_RECOMMENDATIONS[key]).reduce((a,v)=>typeof v==="object"&&v.items?a+v.items.length:a,0);
          return(
            <button key={key} onClick={()=>onSelect(key)} onMouseEnter={()=>setHov(key)} onMouseLeave={()=>setHov(null)}
              style={{background:hov===key?`${seg.color}10`:"#fff",border:`1.5px solid ${hov===key?seg.color:"#bfdbfe"}`,borderRadius:14,padding:"20px 18px",cursor:"pointer",textAlign:"left",transition:"all 0.18s",transform:hov===key?"translateY(-4px)":"none",boxShadow:hov===key?`0 12px 32px ${seg.color}20`:"0 1px 4px #1e40af08"}}>
              <div style={{fontSize:30,marginBottom:12}}>{seg.icon}</div>
              <div style={{fontWeight:700,fontSize:13,color:"#0f2644",marginBottom:5}}>{seg.label}</div>
              <div style={{fontSize:10,color:"#7aa3c0",lineHeight:1.6,marginBottom:12}}>{seg.description}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10,borderTop:`1px solid ${seg.color}25`}}>
                <span style={{fontSize:9,color:seg.color,fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>~{rc} components</span>
                <span style={{fontSize:15,color:seg.color,fontWeight:700}}>→</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ServerPanel({configs,updateConfig,addConfig,removeConfig,seg,rec,fmt}){
  const Sel=({value,onChange,children,mono})=>(<select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",background:"#f0f7ff",border:"1px solid #bfdbfe",borderRadius:5,padding:"6px 8px",color:"#1e3a5f",fontSize:11,fontFamily:mono?"'JetBrains Mono',monospace":"inherit",cursor:"pointer"}}>{children}</select>);
  const F=({label,children})=>(<div style={{marginBottom:10}}><label style={{fontSize:9,color:"#7aa3c0",display:"block",marginBottom:3,letterSpacing:0.5,textTransform:"uppercase",fontWeight:600}}>{label}</label>{children}</div>);
  const TB=({active,color,onClick,children})=>(<button onClick={onClick} style={{flex:1,padding:"6px 4px",borderRadius:5,border:`1.5px solid ${active?color:"#bfdbfe"}`,background:active?`${color}18`:"#fff",color:active?color:"#7aa3c0",cursor:"pointer",fontSize:10,fontFamily:"inherit",fontWeight:active?700:400,transition:"all 0.1s"}}>{children}</button>);
  return(
    <div>
      {seg&&rec&&(
        <div style={{background:`linear-gradient(135deg,${seg.color}12,#f0f7ff)`,border:`1.5px solid ${seg.color}35`,borderRadius:12,padding:"14px 18px",marginBottom:18}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <span style={{fontSize:20}}>{seg.icon}</span>
            <span style={{fontWeight:700,fontSize:14,color:"#0f2644"}}>{seg.label} — Recommended Server</span>
          </div>
          <div style={{fontSize:11,color:"#5a85a8",lineHeight:1.7}}>💡 {rec.servers.reason}</div>
        </div>
      )}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{fontWeight:700,fontSize:16,color:"#0f2644"}}>🖥️ Server Configuration</h2>
        <button onClick={addConfig} style={{padding:"7px 14px",borderRadius:6,border:"1.5px dashed #bfdbfe",background:"transparent",color:"#1e40af",cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:600}}>+ Add Server Row</button>
      </div>
      {configs.map((cfg,idx)=>{
        const brand=SERVER_BRANDS[cfg.brand];
        const seriesData=brand?.series[cfg.series];
        const model=seriesData?.models.find(m=>m.id===cfg.modelId);
        const cpuList=cfg.cpuType==="amd"?CPU_OPTIONS.amd:CPU_OPTIONS.intel;
        const unitPrice=computeServerPrice({...cfg,qty:1});
        const tierColor={"Entry":"#7aa3c0","Mid-range":"#06b6d4","High-end":"#8b5cf6","Mission Critical":"#ef4444"}[model?.tier]||"#7aa3c0";
        return(
          <div key={idx} style={{background:"#fff",border:`1.5px solid ${brand.color}30`,borderRadius:12,marginBottom:14,overflow:"hidden",boxShadow:"0 2px 8px #1e40af08"}}>
            <div style={{background:`linear-gradient(90deg,${brand.color}12,#f0f7ff)`,borderBottom:`1px solid ${brand.color}20`,padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{background:`${brand.color}20`,border:`1.5px solid ${brand.color}40`,borderRadius:5,padding:"3px 10px",fontWeight:700,fontSize:11,color:brand.color,fontFamily:"'JetBrains Mono',monospace"}}>{brand.logo}</span>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:"#0f2644"}}>{model?.name||"Select Model"}</div>
                  <div style={{fontSize:10,color:"#7aa3c0"}}>Server {idx+1} · {model?.formFactor||"—"} · <span style={{color:tierColor,fontWeight:600}}>{model?.tier}</span></div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:15,fontWeight:700,color:"#0f2644",fontFamily:"'JetBrains Mono',monospace"}}>{fmt(unitPrice*cfg.qty)}</div>
                  <div style={{fontSize:9,color:"#7aa3c0"}}>{cfg.qty}x @ {fmt(unitPrice)}</div>
                </div>
                {configs.length>1&&<button onClick={()=>removeConfig(idx)} style={{background:"#fff1f2",border:"1px solid #fecdd3",borderRadius:5,width:26,height:26,color:"#ef4444",cursor:"pointer",fontSize:14,fontWeight:700}}>×</button>}
              </div>
            </div>
            <div style={{padding:"14px 18px"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
                <F label="Brand"><div style={{display:"flex",gap:5}}>{Object.entries(SERVER_BRANDS).map(([k,b])=><TB key={k} active={cfg.brand===k} color={b.color} onClick={()=>updateConfig(idx,"brand",k)}>{b.logo}</TB>)}</div></F>
                <F label="Series"><Sel value={cfg.series} onChange={v=>updateConfig(idx,"series",v)}>{Object.keys(brand.series).map(s=><option key={s} value={s}>{s}</option>)}</Sel></F>
                <F label="Model"><Sel value={cfg.modelId} onChange={v=>updateConfig(idx,"modelId",v)} mono>{seriesData?.models.map(m=><option key={m.id} value={m.id}>{m.name} · {m.tier}</option>)}</Sel></F>
                <F label="CPU Arch"><div style={{display:"flex",gap:5}}><TB active={cfg.cpuType==="intel"} color="#3b82f6" onClick={()=>updateConfig(idx,"cpuType","intel")}>Intel Xeon</TB><TB active={cfg.cpuType==="amd"} color="#ef4444" onClick={()=>updateConfig(idx,"cpuType","amd")}>AMD EPYC</TB></div></F>
                <F label="Processor"><Sel value={cfg.cpuId} onChange={v=>updateConfig(idx,"cpuId",v)} mono>{cpuList.map(c=><option key={c.id} value={c.id}>{c.label} (+{fmt(c.priceAdder)})</option>)}</Sel></F>
                <F label="CPU Count"><div style={{display:"flex",gap:5}}>{[1,2,4,8].map(n=><TB key={n} active={cfg.cpuCount===n} color="#0369a1" onClick={()=>updateConfig(idx,"cpuCount",n)}>{n}×</TB>)}</div></F>
                <F label="Memory"><Sel value={cfg.ramId} onChange={v=>updateConfig(idx,"ramId",v)}>{RAM_OPTIONS.map(r=><option key={r.id} value={r.id}>{r.label} (+{fmt(r.priceAdder)})</option>)}</Sel></F>
                <F label="Local Storage"><Sel value={cfg.storageId} onChange={v=>updateConfig(idx,"storageId",v)}>{STORAGE_OPT.map(s=><option key={s.id} value={s.id}>{s.label} (+{fmt(s.priceAdder)})</option>)}</Sel></F>
                <F label="NIC"><Sel value={cfg.nicId} onChange={v=>updateConfig(idx,"nicId",v)}>{NIC_OPT.map(n=><option key={n.id} value={n.id}>{n.label} (+{fmt(n.priceAdder)})</option>)}</Sel></F>
                <F label="GPU"><Sel value={cfg.gpuId} onChange={v=>updateConfig(idx,"gpuId",v)}>{GPU_OPT.map(g=><option key={g.id} value={g.id}>{g.label}{g.priceAdder>0?` (+${fmt(g.priceAdder)})`:""}</option>)}</Sel></F>
                <F label="OS"><Sel value={cfg.osId} onChange={v=>updateConfig(idx,"osId",v)}>{OS_OPT.map(o=><option key={o.id} value={o.id}>{o.label}{o.priceAdder>0?` (+${fmt(o.priceAdder)})`:""}</option>)}</Sel></F>
                <F label="PSU"><Sel value={cfg.psuId} onChange={v=>updateConfig(idx,"psuId",v)}>{PSU_OPT.map(p=><option key={p.id} value={p.id}>{p.label} (+{fmt(p.priceAdder)})</option>)}</Sel></F>
                <F label="Support"><Sel value={cfg.supportId} onChange={v=>updateConfig(idx,"supportId",v)}>{SUPPORT_OPT.map(s=><option key={s.id} value={s.id}>{s.label} (+{fmt(s.priceAdder)})</option>)}</Sel></F>
                <F label="Quantity"><div style={{display:"flex",alignItems:"center",gap:6}}>
                  <button onClick={()=>updateConfig(idx,"qty",Math.max(1,cfg.qty-1))} style={{width:30,height:32,borderRadius:5,border:"1px solid #bfdbfe",background:"#f0f7ff",color:"#1e3a5f",cursor:"pointer",fontSize:16,fontWeight:700}}>−</button>
                  <input type="number" min={1} value={cfg.qty} onChange={e=>updateConfig(idx,"qty",Math.max(1,parseInt(e.target.value)||1))} style={{flex:1,background:"#f0f7ff",border:"1px solid #bfdbfe",borderRadius:5,padding:"6px",color:"#0369a1",fontSize:15,fontWeight:700,textAlign:"center",fontFamily:"'JetBrains Mono',monospace"}}/>
                  <button onClick={()=>updateConfig(idx,"qty",cfg.qty+1)} style={{width:30,height:32,borderRadius:5,border:"1px solid #bfdbfe",background:"#f0f7ff",color:"#1e3a5f",cursor:"pointer",fontSize:16,fontWeight:700}}>+</button>
                </div></F>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InfraPanel({cat,selections,updateQty,rec,seg,fmt}){
  const isHypervisor = cat.label === "Hypervisor / Virtualisation";
  const [selectedVendor,setSelectedVendor] = useState(null);
  const [brandFilter,setBrandFilter]=useState("all");

  // For hypervisor tab: vendor-grouped view
  if(isHypervisor){
    const recIds = rec?.items||[];
    const visibleItems = selectedVendor
      ? HV_VENDORS.find(v=>v.key===selectedVendor)?.ids.map(id=>cat.items.find(i=>i.id===id)).filter(Boolean) || []
      : [];

    return(
      <div>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <div style={{width:44,height:44,background:`${cat.color}18`,border:`2px solid ${cat.color}35`,borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{cat.icon}</div>
          <div>
            <h2 style={{fontWeight:700,fontSize:17,color:"#0f2644"}}>{cat.label}</h2>
            <div style={{fontSize:10,color:"#7aa3c0"}}>{cat.items.length} products across {HV_VENDORS.length} vendors{rec?` · ${recIds.length} recommended for ${seg?.label}`:""}</div>
          </div>
        </div>

        {/* Recommended banner */}
        {rec&&seg&&(
          <div style={{background:`${seg.color}08`,border:`1.5px solid ${seg.color}30`,borderRadius:10,padding:"12px 16px",marginBottom:16}}>
            <div style={{fontSize:10,color:seg.color,fontWeight:700,marginBottom:8}}>★ Recommended for {seg.label}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {recIds.map(id=>{
                const item=cat.items.find(i=>i.id===id);if(!item)return null;
                const qty=selections[id]||0;
                return(
                  <button key={id} onClick={()=>updateQty(id, qty>0?-qty:1)}
                    style={{display:"inline-flex",alignItems:"center",gap:5,background:qty>0?`${seg.color}20`:`${seg.color}08`,border:`1.5px solid ${qty>0?seg.color:seg.color+"40"}`,borderRadius:6,padding:"5px 10px",fontSize:10,color:seg.color,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s"}}>
                    {qty>0&&<span>✓</span>}{item.name.split("(")[0].trim()}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Vendor selector cards */}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:10,fontWeight:700,color:"#1e3a5f",letterSpacing:1,textTransform:"uppercase",marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
            <span>🏢</span> Select Hypervisor Vendor
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>
            {HV_VENDORS.map(vendor=>{
              const vendorItems=vendor.ids.map(id=>cat.items.find(i=>i.id===id)).filter(Boolean);
              const selectedCount=vendorItems.filter(i=>(selections[i.id]||0)>0).length;
              const hasRec=vendorItems.some(i=>recIds.includes(i.id));
              const isActive=selectedVendor===vendor.key;
              return(
                <button key={vendor.key} onClick={()=>setSelectedVendor(isActive?null:vendor.key)}
                  style={{padding:"14px 12px",borderRadius:12,border:`2px solid ${isActive?vendor.color:selectedCount>0?vendor.color+"60":"#e0e7ff"}`,background:isActive?`${vendor.color}12`:selectedCount>0?`${vendor.color}06`:"#fff",cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all 0.15s",boxShadow:isActive?`0 4px 16px ${vendor.color}25`:"0 1px 4px #1e40af06",position:"relative"}}>
                  {hasRec&&<span style={{position:"absolute",top:8,right:8,width:7,height:7,borderRadius:"50%",background:seg?.color||"#8b5cf6",border:"1.5px solid #fff"}}/>}
                  <div style={{fontSize:22,marginBottom:7}}>{vendor.icon}</div>
                  <div style={{fontWeight:700,fontSize:12,color:isActive?vendor.color:"#0f2644",marginBottom:3}}>{vendor.label}</div>
                  <div style={{fontSize:9,color:"#7aa3c0",marginBottom:8}}>{vendorItems.length} products</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    {selectedCount>0
                      ? <span style={{fontSize:9,fontWeight:700,color:vendor.color,background:`${vendor.color}15`,borderRadius:10,padding:"2px 7px"}}>{selectedCount} added</span>
                      : <span style={{fontSize:9,color:"#c0d4e8"}}>none selected</span>
                    }
                    <span style={{fontSize:12,color:isActive?vendor.color:"#bfdbfe",fontWeight:700}}>{isActive?"▲":"▼"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Products for selected vendor */}
        {selectedVendor&&(
          <div style={{animation:"fadeIn 0.2s ease"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,paddingBottom:10,borderBottom:"1.5px solid #e0e7ff"}}>
              {(()=>{const v=HV_VENDORS.find(v=>v.key===selectedVendor);return(<>
                <span style={{fontSize:18}}>{v.icon}</span>
                <span style={{fontWeight:700,fontSize:14,color:v.color}}>{v.label} Products</span>
                <span style={{fontSize:10,color:"#7aa3c0",marginLeft:"auto"}}>{visibleItems.length} items</span>
              </>);})()}
            </div>
            {visibleItems.map(item=>{
              const qty=selections[item.id]||0;
              const isRec=recIds.includes(item.id);
              const reason=rec?.reasons?.[item.id];
              const vColor=HV_VENDORS.find(v=>v.key===selectedVendor)?.color||cat.color;
              return(
                <div key={item.id} style={{background:qty>0?`${vColor}06`:"#fff",border:`2px solid ${qty>0?vColor:isRec?vColor+"45":"#dbeafe"}`,borderRadius:11,padding:"13px 16px",marginBottom:9,transition:"all 0.15s",boxShadow:qty>0?`0 2px 12px ${vColor}18`:"0 1px 3px #1e40af05"}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,flexWrap:"wrap"}}>
                        {isRec&&<span style={{background:`${seg?.color}25`,border:`1px solid ${seg?.color}50`,borderRadius:4,padding:"2px 7px",fontSize:9,color:seg?.color,fontWeight:700,flexShrink:0}}>★ RECOMMENDED</span>}
                        <span style={{fontWeight:700,fontSize:13,color:"#0f2644"}}>{item.name}</span>
                      </div>
                      <div style={{fontSize:11,color:"#7aa3c0",marginBottom:reason?6:0,lineHeight:1.5}}>{item.spec}</div>
                      {reason&&<div style={{fontSize:10,color:"#1e3a5f",background:"#e8f2fb",borderRadius:6,padding:"6px 10px",borderLeft:`3px solid ${seg?.color||vColor}`,lineHeight:1.6,fontWeight:500}}>💡 {reason}</div>}
                    </div>
                    <div style={{textAlign:"right",minWidth:90,flexShrink:0}}>
                      <div style={{fontSize:15,color:vColor,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{item.unitPrice===0?"Free":fmt(item.unitPrice)}</div>
                      <div style={{fontSize:9,color:"#bfdbfe",marginTop:1}}>per unit</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
                      <button onClick={()=>updateQty(item.id,-1)} disabled={qty===0} style={{width:30,height:30,borderRadius:6,border:`1.5px solid ${qty>0?vColor:"#bfdbfe"}`,background:qty>0?`${vColor}15`:"#f0f7ff",color:qty===0?"#bfdbfe":vColor,cursor:qty===0?"not-allowed":"pointer",fontSize:17,fontWeight:700}}>−</button>
                      <span style={{width:30,textAlign:"center",fontSize:15,fontWeight:700,color:qty>0?vColor:"#bfdbfe",fontFamily:"'JetBrains Mono',monospace"}}>{qty}</span>
                      <button onClick={()=>updateQty(item.id,1)} style={{width:30,height:30,borderRadius:6,border:`1.5px solid ${vColor}`,background:`${vColor}15`,color:vColor,cursor:"pointer",fontSize:17,fontWeight:700}}>+</button>
                    </div>
                    {qty>0&&<div style={{minWidth:88,textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#0f2644",fontFamily:"'JetBrains Mono',monospace"}}>{fmt(item.unitPrice*qty)}</div>
                      <div style={{fontSize:9,color:"#7aa3c0"}}>subtotal</div>
                    </div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!selectedVendor&&(
          <div style={{textAlign:"center",padding:"32px 20px",color:"#93c5fd",fontSize:12}}>
            <div style={{fontSize:36,marginBottom:10}}>☝️</div>
            Select a vendor above to browse and add hypervisor products
          </div>
        )}
      </div>
    );
  }

  // Default view for all other tabs
  const uniqueBrands=[...new Set(cat.items.map(i=>i.brand).filter(Boolean))];
  const hasBrands=uniqueBrands.length>0;
  const filteredItems=brandFilter==="all"?cat.items:cat.items.filter(i=>i.brand===brandFilter);
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <div style={{width:44,height:44,background:`${cat.color}18`,border:`2px solid ${cat.color}35`,borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{cat.icon}</div>
        <div>
          <h2 style={{fontWeight:700,fontSize:17,color:"#0f2644"}}>{cat.label}</h2>
          <div style={{fontSize:10,color:"#7aa3c0"}}>{cat.items.length} products available{rec?` · ${rec.items.length} recommended for ${seg?.label}`:""}</div>
        </div>
      </div>

      {hasBrands&&(
        <div style={{marginBottom:16,padding:"12px 16px",background:"#fff",border:"1.5px solid #bfdbfe",borderRadius:10,boxShadow:"0 1px 4px #1e40af08"}}>
          <div style={{fontSize:10,fontWeight:700,color:"#1e3a5f",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:14}}>🏷️</span> Filter by OEM Brand
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            <button onClick={()=>setBrandFilter("all")} style={{padding:"6px 16px",borderRadius:20,border:`2px solid ${brandFilter==="all"?"#1e40af":"#bfdbfe"}`,background:brandFilter==="all"?"#1e40af":"#fff",color:brandFilter==="all"?"#fff":"#4b7fa6",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit",transition:"all 0.12s"}}>All Brands</button>
            {uniqueBrands.map(b=>(
              <button key={b} onClick={()=>setBrandFilter(b)} style={{padding:"6px 16px",borderRadius:20,border:`2px solid ${brandFilter===b?BRAND_COLORS[b]:"#bfdbfe"}`,background:brandFilter===b?BRAND_COLORS[b]:"#fff",color:brandFilter===b?"#fff":BRAND_COLORS[b]||"#4b7fa6",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit",transition:"all 0.12s"}}>
                {BRAND_LABELS[b]||b.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {rec&&(
        <div style={{background:`${seg.color}08`,border:`1.5px solid ${seg.color}30`,borderRadius:10,padding:"12px 16px",marginBottom:16}}>
          <div style={{fontSize:10,color:seg.color,fontWeight:700,marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
            ★ Recommended for {seg.label}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {rec.items.map(id=>{
              const item=cat.items.find(i=>i.id===id);if(!item)return null;
              return(
                <div key={id} style={{display:"inline-flex",alignItems:"center",gap:5,background:`${seg.color}12`,border:`1px solid ${seg.color}35`,borderRadius:6,padding:"4px 10px",fontSize:10,color:seg.color,fontWeight:600}}>
                  {item.brand&&<span style={{fontSize:8,fontWeight:700,background:BRAND_COLORS[item.brand]||seg.color,color:"#fff",borderRadius:2,padding:"1px 5px"}}>{BRAND_LABELS[item.brand]||item.brand.toUpperCase()}</span>}
                  {item.name}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filteredItems.map(item=>{
        const qty=selections[item.id]||0;
        const isRec=rec?.items.includes(item.id);
        const reason=rec?.reasons?.[item.id];
        return(
          <div key={item.id} style={{background:qty>0?`${cat.color}06`:"#fff",border:`2px solid ${qty>0?cat.color:isRec?cat.color+"45":"#dbeafe"}`,borderRadius:11,padding:"13px 16px",marginBottom:9,transition:"all 0.15s",boxShadow:qty>0?`0 2px 12px ${cat.color}18`:"0 1px 3px #1e40af05"}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,flexWrap:"wrap"}}>
                  {isRec&&<span style={{background:`${seg?.color}25`,border:`1px solid ${seg?.color}50`,borderRadius:4,padding:"2px 7px",fontSize:9,color:seg?.color,fontWeight:700,flexShrink:0}}>★ RECOMMENDED</span>}
                  <BrandBadge brand={item.brand}/>
                  <span style={{fontWeight:700,fontSize:13,color:"#0f2644"}}>{item.name}</span>
                </div>
                <div style={{fontSize:11,color:"#7aa3c0",marginBottom:reason?6:0,lineHeight:1.5}}>{item.spec}</div>
                {reason&&<div style={{fontSize:10,color:"#1e3a5f",background:"#e8f2fb",borderRadius:6,padding:"6px 10px",borderLeft:`3px solid ${seg?.color||cat.color}`,lineHeight:1.6,fontWeight:500}}>💡 {reason}</div>}
              </div>
              <div style={{textAlign:"right",minWidth:90,flexShrink:0}}>
                <div style={{fontSize:15,color:cat.color,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{fmt(item.unitPrice)}</div>
                <div style={{fontSize:9,color:"#bfdbfe",marginTop:1}}>per unit</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
                <button onClick={()=>updateQty(item.id,-1)} disabled={qty===0} style={{width:30,height:30,borderRadius:6,border:`1.5px solid ${qty>0?cat.color:"#bfdbfe"}`,background:qty>0?`${cat.color}15`:"#f0f7ff",color:qty===0?"#bfdbfe":cat.color,cursor:qty===0?"not-allowed":"pointer",fontSize:17,fontWeight:700}}>−</button>
                <span style={{width:30,textAlign:"center",fontSize:15,fontWeight:700,color:qty>0?cat.color:"#bfdbfe",fontFamily:"'JetBrains Mono',monospace"}}>{qty}</span>
                <button onClick={()=>updateQty(item.id,1)} style={{width:30,height:30,borderRadius:6,border:`1.5px solid ${cat.color}`,background:`${cat.color}15`,color:cat.color,cursor:"pointer",fontSize:17,fontWeight:700}}>+</button>
              </div>
              {qty>0&&<div style={{minWidth:88,textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:13,fontWeight:700,color:"#0f2644",fontFamily:"'JetBrains Mono',monospace"}}>{fmt(item.unitPrice*qty)}</div>
                <div style={{fontSize:9,color:"#7aa3c0"}}>subtotal</div>
              </div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReportView({projectInfo,serverConfigs,infraSelections,grandTotal,serverTotal,infraTotal,seg,rec,fmt,onBack}){
  const tax=grandTotal*0.18,total=grandTotal+tax;
  const refNo=`BOQ-${Date.now().toString(36).toUpperCase()}`;
  const today=new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
  const serverLines=serverConfigs.map((cfg)=>{
    const brand=SERVER_BRANDS[cfg.brand];
    const model=brand?.series[cfg.series]?.models.find(m=>m.id===cfg.modelId);
    const cpuList=cfg.cpuType==="amd"?CPU_OPTIONS.amd:CPU_OPTIONS.intel;
    const cpu=cpuList.find(c=>c.id===cfg.cpuId);
    const ram=RAM_OPTIONS.find(r=>r.id===cfg.ramId);
    const sto=STORAGE_OPT.find(s=>s.id===cfg.storageId);
    const nic=NIC_OPT.find(n=>n.id===cfg.nicId);
    const gpu=GPU_OPT.find(g=>g.id===cfg.gpuId);
    const os=OS_OPT.find(o=>o.id===cfg.osId);
    const sup=SUPPORT_OPT.find(s=>s.id===cfg.supportId);
    const psu=PSU_OPT.find(p=>p.id===cfg.psuId);
    const up=computeServerPrice({...cfg,qty:1});
    const spec=[cpu?`${cfg.cpuCount}x ${cpu.label}`:null,ram?.label,sto?.label,nic?.label,gpu?.id!=="gpu-none"?gpu?.label:null,os?.id!=="os-none"?os?.label:null,psu?.label,sup?.label].filter(Boolean).join(" | ");
    return{category:brand?.label||"Server",color:brand?.color||"#1e40af",icon:"🖥️",name:model?.name||"—",spec,unitPrice:up,qty:cfg.qty,total:up*cfg.qty};
  });
  const infraLines=[];
  Object.entries(infraSelections).forEach(([layer,items])=>{
    const cat=INFRA_CATALOGUE[layer];
    Object.entries(items).forEach(([id,qty])=>{if(qty>0){const item=cat.items.find(i=>i.id===id);if(item)infraLines.push({category:cat.label,color:cat.color,icon:cat.icon,...item,qty,total:item.unitPrice*qty});}});
  });
  const allLines=[...serverLines,...infraLines];
  return(
    <div style={{maxWidth:1100,margin:"0 auto",padding:"2rem",fontFamily:"'Outfit',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');*{box-sizing:border-box}@media print{.no-print{display:none!important}}`}</style>
      <div style={{display:"flex",gap:10,marginBottom:20}} className="no-print">
        <button onClick={onBack} style={{padding:"9px 18px",borderRadius:7,border:"1px solid #bfdbfe",background:"#fff",color:"#1e40af",cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600}}>← Back</button>
        <button onClick={()=>window.print()} style={{padding:"9px 18px",borderRadius:7,border:"none",background:"linear-gradient(135deg,#1e40af,#06b6d4)",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>🖨 Print / Save PDF</button>
      </div>
      <div style={{background:"#fff",color:"#111",borderRadius:16,overflow:"hidden",boxShadow:"0 20px 60px rgba(30,64,175,0.15)"}}>
        <div style={{background:"linear-gradient(135deg,#1e3a8a 0%,#0369a1 100%)",padding:"36px 44px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                <div style={{width:42,height:42,background:"rgba(255,255,255,0.2)",borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,border:"1px solid rgba(255,255,255,0.3)"}}>⚡</div>
                <div>
                  <div style={{fontWeight:800,fontSize:18,color:"#ffffff"}}>DC-BOQ Pro v9</div>
                  <div style={{fontSize:9,color:"#93c5fd",letterSpacing:3,textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>BILL OF QUANTITY · FULL STACK · OEM NETWORK</div>
                </div>
              </div>
              <h1 style={{fontWeight:800,fontSize:24,color:"#ffffff",marginBottom:6}}>{projectInfo.name||"Datacenter Project"}</h1>
              <div style={{fontSize:12,color:"#93c5fd"}}>Client: <span style={{color:"#fff",fontWeight:600}}>{projectInfo.client||"—"}</span> · Engineer: <span style={{color:"#fff",fontWeight:600}}>{projectInfo.engineer||"—"}</span> · Date: <span style={{color:"#fff"}}>{projectInfo.date||today}</span></div>
              {seg&&<div style={{marginTop:12,display:"inline-flex",alignItems:"center",gap:7,background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:6,padding:"6px 14px"}}><span style={{fontSize:16}}>{seg.icon}</span><span style={{fontSize:12,color:"#ffffff",fontWeight:700}}>{seg.label} Segment</span></div>}
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{background:"rgba(255,255,255,0.2)",color:"#ffffff",fontWeight:700,fontSize:11,padding:"5px 14px",borderRadius:5,marginBottom:10,display:"inline-block",fontFamily:"'JetBrains Mono',monospace",border:"1px solid rgba(255,255,255,0.3)"}}>{refNo}</div>
              <div style={{padding:"14px 18px",background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:10}}>
                <div style={{fontSize:9,color:"#93c5fd",textTransform:"uppercase",letterSpacing:1.5,fontFamily:"'JetBrains Mono',monospace",marginBottom:4}}>Grand Total (incl. 18% GST)</div>
                <div style={{fontSize:26,fontWeight:800,color:"#ffffff",fontFamily:"'JetBrains Mono',monospace"}}>{fmt(total)}</div>
                <div style={{fontSize:10,color:"#93c5fd",marginTop:2}}>{allLines.length} line items</div>
              </div>
            </div>
          </div>
        </div>

        {rec&&<div style={{padding:"14px 44px",background:"#eff6ff",borderBottom:"1px solid #bfdbfe"}}>
          <div style={{fontSize:11,color:"#1e40af",fontWeight:700,marginBottom:4}}>📌 Solution Rationale — {seg?.label}</div>
          <div style={{fontSize:11,color:"#3b82f6",lineHeight:1.7}}>{rec.rationale}</div>
        </div>}

        <div style={{padding:"18px 44px",background:"#f8faff",borderBottom:"1px solid #e0e7ff",display:"flex",gap:10,flexWrap:"wrap"}}>
          <div style={{padding:"10px 16px",background:"#fff",border:"1px solid #e0e7ff",borderTop:`3px solid ${seg?.color||"#1e40af"}`,borderRadius:8,minWidth:110}}>
            <div style={{fontSize:10,color:"#7aa3c0"}}>🖥️ Servers</div>
            <div style={{fontSize:15,fontWeight:700,color:"#1e3a5f",fontFamily:"'JetBrains Mono',monospace"}}>{fmt(serverTotal)}</div>
          </div>
          {Object.entries(INFRA_CATALOGUE).map(([k,cat])=>{
            const items=infraSelections[k];if(!items||!Object.keys(items).length)return null;
            const t=Object.entries(items).reduce((a,[id,q])=>a+(cat.items.find(i=>i.id===id)?.unitPrice||0)*q,0);
            return<div key={k} style={{padding:"10px 16px",background:"#fff",border:"1px solid #e0e7ff",borderTop:`3px solid ${cat.color}`,borderRadius:8,minWidth:100}}><div style={{fontSize:10,color:"#7aa3c0"}}>{cat.icon} {cat.label}</div><div style={{fontSize:15,fontWeight:700,color:"#1e3a5f",fontFamily:"'JetBrains Mono',monospace"}}>{fmt(t)}</div></div>;
          })}
        </div>

        <div style={{padding:"28px 44px"}}>
          <h2 style={{fontWeight:800,fontSize:14,marginBottom:14,color:"#1e3a5f",borderBottom:"2px solid #1e40af",paddingBottom:7}}>Detailed Bill of Quantity</h2>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
            <thead><tr style={{background:"linear-gradient(135deg,#1e3a8a,#0369a1)",color:"#fff"}}>{["#","Category","Product / Model","Specifications","Unit Price","Qty","Total"].map(h=>(<th key={h} style={{padding:"10px 12px",textAlign:["Unit Price","Total","Qty"].includes(h)?"right":h==="#"?"center":"left",fontSize:10,fontWeight:700,letterSpacing:0.5}}>{h}</th>))}</tr></thead>
            <tbody>{allLines.map((li,i)=>(<tr key={i} style={{background:i%2===0?"#fff":"#f8faff",borderBottom:"1px solid #e0e7ff"}}>
              <td style={{padding:"8px 12px",textAlign:"center",color:"#93c5fd",fontSize:10,fontFamily:"'JetBrains Mono',monospace"}}>{i+1}</td>
              <td style={{padding:"8px 12px"}}><span style={{display:"inline-flex",alignItems:"center",gap:3,background:`${li.color}12`,border:`1px solid ${li.color}30`,borderRadius:4,padding:"2px 8px",fontSize:9,color:li.color,fontWeight:700}}>{li.icon} {li.category}</span></td>
              <td style={{padding:"8px 12px",fontWeight:600,color:"#1e3a5f",maxWidth:160}}>{li.name}</td>
              <td style={{padding:"8px 12px",color:"#7aa3c0",fontSize:10,maxWidth:260,lineHeight:1.4}}>{li.spec}</td>
              <td style={{padding:"8px 12px",textAlign:"right",color:"#1e3a5f",fontFamily:"'JetBrains Mono',monospace"}}>{fmt(li.unitPrice)}</td>
              <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:"#1e3a5f"}}>{li.qty}</td>
              <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:"#1e40af",fontFamily:"'JetBrains Mono',monospace"}}>{fmt(li.total)}</td>
            </tr>))}</tbody>
          </table>

          <div style={{display:"flex",justifyContent:"flex-end",marginTop:24}}>
            <div style={{minWidth:320}}>
              {[["Servers Subtotal",serverTotal],["Infrastructure Subtotal",infraTotal],["Total (excl. GST)",grandTotal],["GST @ 18%",tax]].map(([l,v])=>(<div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #e0e7ff"}}><span style={{color:"#7aa3c0",fontSize:12}}>{l}</span><span style={{fontWeight:600,color:"#1e3a5f",fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>{fmt(v)}</span></div>))}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 18px",background:"linear-gradient(135deg,#1e40af,#0369a1)",borderRadius:10,marginTop:10}}>
                <div>
                  <div style={{color:"#93c5fd",fontWeight:700,fontSize:11,letterSpacing:1}}>GRAND TOTAL</div>
                  <div style={{color:"#bfdbfe",fontSize:10,marginTop:2}}>incl. 18% GST</div>
                </div>
                <span style={{color:"#ffffff",fontWeight:800,fontSize:22,fontFamily:"'JetBrains Mono',monospace"}}>{fmt(total)}</span>
              </div>
            </div>
          </div>

          <div style={{marginTop:22,padding:14,background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:8}}>
            <div style={{fontSize:11,fontWeight:700,color:"#1e40af",marginBottom:6}}>Terms & Conditions</div>
            {["Prices are indicative in USD; confirmed upon Purchase Order issuance.","Lead time: 4–10 weeks based on model and component availability.","OEM warranty applies as specified; extended support per selected option.","Payment: 30% advance, 60% on delivery, 10% on acceptance.","BOQ validity: 30 days from date of issue.","OEM network recommendations are best-practice guidance; final selection subject to site survey."].map((t,i)=>(<div key={i} style={{fontSize:10,color:"#3b82f6",marginBottom:3,display:"flex",gap:6}}><span>•</span>{t}</div>))}
          </div>
          <div style={{marginTop:28,paddingTop:16,borderTop:"2px solid #e0e7ff",display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
            <div style={{fontSize:10,color:"#93c5fd",fontFamily:"'JetBrains Mono',monospace"}}><div>DC-BOQ Pro v9 · {refNo}</div><div>{today}</div></div>
            <div style={{textAlign:"center"}}><div style={{borderTop:"2px solid #1e40af",width:220,paddingTop:6,fontSize:10,color:"#7aa3c0"}}>Authorized Signature & Stamp</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIScreen({onBack,onResult}){
  const [req,setReq]=useState("");
  const [scale,setScale]=useState("Medium (50-500 users)");
  const [budget,setBudget]=useState("$500K - $2M");
  const [compliance,setCompliance]=useState("None specific");
  const [redundancy,setRedundancy]=useState("N+1 (standard HA)");
  const [chip,setChip]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const chips=[{label:"Retail",v:"Retail"},{label:"Healthcare",v:"Healthcare"},{label:"BFSI",v:"BFSI / Banking"},{label:"Education",v:"Education"},{label:"Manufacturing",v:"Manufacturing"},{label:"HPC / AI",v:"Research / HPC / AI"},{label:"Gaming",v:"Gaming"},{label:"Transport",v:"Transport"},{label:"SMB",v:"SMB"},{label:"Design / VFX",v:"Design / VFX"}];
  const inp={width:"100%",background:"#fff",border:"1.5px solid #bfdbfe",borderRadius:7,padding:"8px 12px",color:"#1e3a5f",fontSize:12,fontFamily:"inherit"};
  const generate=async()=>{
    if(!req.trim()){setError("Please describe your requirements.");return;}
    setError("");setLoading(true);
    const prompt=`You are a senior datacentre architect. Generate a detailed BOQ in strict JSON only — no markdown, no fences.\n\nREQUIREMENTS:\n${req}\n\nScale: ${scale}, Budget: ${budget}, Compliance: ${compliance}, Redundancy: ${redundancy}${chip?", Segment: "+chip:""}\n\n{"summary":"2-3 sentence overview","segment":"segment name","compute":[{"item":"name","spec":"brief spec","qty":1,"unitPrice":5000,"reason":"why for this customer"}],"storage":[...],"network":[...],"backup":[...],"monitoring":[...],"database":[...]}\n\nRules: realistic USD prices, 3-6 items per category, scale to needs, respect compliance.`;
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1500,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();
      const raw=data.content?.find(b=>b.type==="text")?.text||"";
      const boq=JSON.parse(raw.replace(/```json|```/g,"").trim());
      onResult(boq);
    }catch(e){setError("Failed to generate BOQ. Please try again.");}
    setLoading(false);
  };
  return(
    <div style={{fontFamily:"'Outfit',sans-serif",background:"linear-gradient(160deg,#e8f2fb,#f0f7ff)",minHeight:"100vh",color:"#1e3a5f"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <header style={{background:"#fff",borderBottom:"1px solid #bfdbfe",padding:"0 1.5rem",height:56,display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:200,boxShadow:"0 1px 8px #1e40af10"}}>
        <button onClick={onBack} style={{padding:"6px 14px",borderRadius:6,border:"1px solid #bfdbfe",background:"transparent",color:"#1e40af",cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:600}}>← Back</button>
        <div style={{width:30,height:30,background:"linear-gradient(135deg,#a855f7,#6366f1)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🤖</div>
        <span style={{fontWeight:700,fontSize:14,color:"#0c1f3d"}}>DC-BOQ Pro</span>
        <span style={{background:"#a855f715",border:"1px solid #a855f740",borderRadius:5,padding:"3px 10px",fontSize:10,color:"#a855f7",fontWeight:700}}>AI Requirements Engine</span>
      </header>
      <div style={{maxWidth:900,margin:"0 auto",padding:"2.5rem 1.5rem"}}>
        <div style={{marginBottom:32,textAlign:"center"}}>
          <h1 style={{fontWeight:800,fontSize:28,color:"#0c1f3d",marginBottom:10,letterSpacing:-0.5}}>Describe Your Infrastructure Needs</h1>
          <p style={{color:"#5a85a8",fontSize:13,lineHeight:1.9,maxWidth:560,margin:"0 auto"}}>AI will analyse your requirements and generate a complete BOQ covering Compute, Storage, Network, Backup, Monitoring & Database.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.5rem"}}>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div>
              <label style={{fontSize:10,color:"#7aa3c0",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:1.5,fontWeight:700}}>Your Requirements *</label>
              <textarea value={req} onChange={e=>setReq(e.target.value)} rows={10} placeholder={"Describe your infrastructure in detail...\n\nExample: We are a 500-bed hospital running Epic EHR and PACS imaging with 200TB of patient data. We need HA storage, HIPAA-compliant backup, and 24x7 uptime with DR capability."} style={{...inp,resize:"vertical",lineHeight:1.7,minHeight:190,fontSize:12}}/>
            </div>
            <div>
              <label style={{fontSize:10,color:"#7aa3c0",display:"block",marginBottom:8,textTransform:"uppercase",letterSpacing:1.5,fontWeight:700}}>Quick Segment</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {chips.map(c=>(<button key={c.v} onClick={()=>setChip(chip===c.v?"":c.v)} style={{padding:"5px 12px",borderRadius:20,border:`1.5px solid ${chip===c.v?"#a855f7":"#bfdbfe"}`,background:chip===c.v?"#a855f715":"#fff",color:chip===c.v?"#a855f7":"#4b7fa6",cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:chip===c.v?700:400,transition:"all 0.12s"}}>{c.label}</button>))}
              </div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {[["Scale",scale,setScale,["Small (up to 50 users)","Medium (50-500 users)","Large (500-2000 users)","Enterprise (2000+ users)"]],["Budget Range (USD)",budget,setBudget,["Under $100K","$100K - $500K","$500K - $2M","$2M+"]],["Compliance",compliance,setCompliance,["None specific","HIPAA","PCI-DSS","RBI / SEBI","ISO 27001","GDPR"]],["Redundancy",redundancy,setRedundancy,["N (basic)","N+1 (standard HA)","2N (full redundancy)","2N+1 (mission critical)"]]].map(([lbl,val,setter,opts])=>(
              <div key={lbl}>
                <label style={{fontSize:10,color:"#7aa3c0",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:1.5,fontWeight:700}}>{lbl}</label>
                <select value={val} onChange={e=>setter(e.target.value)} style={inp}>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select>
              </div>
            ))}
            {error&&<div style={{padding:"10px 14px",background:"#fff1f2",border:"1.5px solid #fecdd3",borderRadius:7,fontSize:12,color:"#be123c",fontWeight:500}}>{error}</div>}
            <button onClick={generate} disabled={loading} style={{padding:"13px",borderRadius:8,border:"none",background:loading?"#bfdbfe":"linear-gradient(135deg,#a855f7,#6366f1)",color:"#fff",cursor:loading?"not-allowed":"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:"auto",boxShadow:loading?"none":"0 4px 16px #a855f730"}}>
              {loading?<><span style={{width:15,height:15,border:"2px solid rgba(255,255,255,0.4)",borderTop:"2px solid #fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.8s linear infinite"}}/>Generating your BOQ...</>:"🤖 Generate AI BOQ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");

  const checkPassword = () => {
    if (password === "1234") {
      setLoggedIn(true);
    } else {
      alert("Wrong Password");
    }
  };

  if (!loggedIn) {
    return (
      <div style={{ fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "linear-gradient(160deg,#e8f2fb,#f0f7ff)" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: "40px 48px", boxShadow: "0 8px 32px #1e40af18", textAlign: "center", minWidth: 320 }}>
          <div style={{ width: 48, height: 48, background: "linear-gradient(135deg,#1e40af,#06b6d4)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px" }}>⚡</div>
          <h2 style={{ fontWeight: 800, fontSize: 20, color: "#0c1f3d", marginBottom: 6 }}>DC-BOQ Pro</h2>
          <p style={{ color: "#7aa3c0", fontSize: 12, marginBottom: 24 }}>Enter your password to continue</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && checkPassword()}
            placeholder="Password"
            style={{ width: "100%", padding: "10px 14px", borderRadius: 7, border: "1.5px solid #bfdbfe", fontSize: 14, fontFamily: "inherit", marginBottom: 12, outline: "none", color: "#1e3a5f" }}
          />
          <button onClick={checkPassword} style={{ width: "100%", padding: "11px", borderRadius: 7, border: "none", background: "linear-gradient(135deg,#1e40af,#06b6d4)", color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: "inherit", cursor: "pointer" }}>
            Login →
          </button>
        </div>
      </div>
    );
  }

  return <MainApp />;
}



function AIResultPanel({result,fmt,onRerun}){
  if(!result)return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:320,gap:14,color:"#7aa3c0"}}><div style={{fontSize:40}}>🤖</div><div style={{fontSize:14,fontWeight:500}}>No AI BOQ generated yet.</div><button onClick={onRerun} style={{padding:"9px 22px",borderRadius:7,border:"none",background:"linear-gradient(135deg,#a855f7,#6366f1)",color:"#fff",cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:700}}>Generate AI BOQ →</button></div>);
  const cats=[{key:"compute",label:"Compute",icon:"🖥️",color:"#1e40af"},{key:"storage",label:"Storage",icon:"💾",color:"#059669"},{key:"network",label:"Network",icon:"🔗",color:"#7c3aed"},{key:"backup",label:"Backup",icon:"🔒",color:"#d97706"},{key:"monitoring",label:"Monitoring",icon:"📊",color:"#e11d48"},{key:"database",label:"Database",icon:"🗄️",color:"#0ea5e9"}];
  let grandTotal=0;
  cats.forEach(c=>{(result[c.key]||[]).forEach(i=>{grandTotal+=i.unitPrice*i.qty;});});
  const gst=grandTotal*0.18;
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div>
          <h2 style={{fontWeight:700,fontSize:18,color:"#0f2644",marginBottom:5}}>🤖 AI-Generated BOQ</h2>
          {result.segment&&<span style={{background:"#a855f715",border:"1px solid #a855f740",borderRadius:5,padding:"3px 10px",fontSize:10,color:"#a855f7",fontWeight:700}}>{result.segment}</span>}
        </div>
        <button onClick={onRerun} style={{padding:"7px 16px",borderRadius:6,border:"none",background:"linear-gradient(135deg,#a855f7,#6366f1)",color:"#fff",cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:700}}>↺ Regenerate</button>
      </div>
      {result.summary&&<div style={{marginBottom:18,padding:"13px 16px",background:"#eff6ff",borderLeft:"4px solid #1e40af",borderRadius:"0 8px 8px 0",fontSize:12,color:"#1e3a5f",lineHeight:1.7,fontWeight:500}}>{result.summary}</div>}
      {cats.map(cat=>{
        const items=result[cat.key]||[];if(!items.length)return null;
        const catTotal=items.reduce((s,i)=>s+i.unitPrice*i.qty,0);
        return(<div key={cat.key} style={{marginBottom:16,border:`2px solid ${cat.color}25`,borderRadius:11,overflow:"hidden",boxShadow:"0 1px 4px #1e40af05"}}>
          <div style={{background:`linear-gradient(90deg,${cat.color}12,#f0f7ff)`,borderBottom:`1px solid ${cat.color}20`,padding:"10px 16px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:16}}>{cat.icon}</span>
            <span style={{fontWeight:700,fontSize:14,color:"#0f2644",flex:1}}>{cat.label}</span>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:cat.color,fontWeight:700}}>{fmt(catTotal)}</span>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
            <thead><tr style={{background:"#f0f7ff"}}>{["Item","Spec","Qty","Unit Price","Total"].map(h=>(<th key={h} style={{padding:"8px 12px",textAlign:["Qty","Unit Price","Total"].includes(h)?"right":"left",fontSize:9,color:"#7aa3c0",fontWeight:700,letterSpacing:0.5,textTransform:"uppercase"}}>{h}</th>))}</tr></thead>
            <tbody>{items.map((item,i)=>(<tr key={i} style={{background:i%2===0?"#f8faff":"#fff",borderBottom:"1px solid #e0e7ff"}}>
              <td style={{padding:"10px 12px"}}><div style={{fontWeight:700,color:"#0f2644",marginBottom:3}}>{item.item}</div><div style={{fontSize:10,color:"#3b82f6",lineHeight:1.5,borderLeft:`3px solid ${cat.color}`,paddingLeft:7}}>{item.reason}</div></td>
              <td style={{padding:"10px 12px",color:"#7aa3c0",maxWidth:180,lineHeight:1.5}}>{item.spec}</td>
              <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"'JetBrains Mono',monospace",color:"#1e3a5f",fontWeight:600}}>{item.qty}</td>
              <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"'JetBrains Mono',monospace",color:"#7aa3c0"}}>{fmt(item.unitPrice)}</td>
              <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:cat.color}}>{fmt(item.unitPrice*item.qty)}</td>
            </tr>))}</tbody>
          </table>
        </div>);
      })}
      <div style={{marginTop:8,padding:"16px 22px",background:"linear-gradient(135deg,#1e3a8a,#0369a1)",border:"none",borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"0 4px 16px #1e40af25"}}>
        <div>
          <div style={{fontSize:10,color:"#93c5fd",marginBottom:2}}>GST @ 18%: {fmt(gst)}</div>
          <div style={{fontSize:10,color:"#93c5fd"}}>Grand Total incl. GST: <span style={{fontWeight:700,color:"#fff"}}>{fmt(grandTotal+gst)}</span></div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:10,color:"#93c5fd",marginBottom:2}}>Grand Total (excl. GST)</div>
          <div style={{fontSize:26,fontWeight:800,color:"#ffffff",fontFamily:"'JetBrains Mono',monospace"}}>{fmt(grandTotal)}</div>
        </div>
      </div>
    </div>
  );
}
