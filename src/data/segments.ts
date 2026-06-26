export const SEGMENTS = {
  retail:        { label:"Retail",              icon:"retail", color:"#f97316", description:"POS, e-commerce, inventory, omnichannel" },
  education:     { label:"Education",           icon:"education", color:"#3b82f6", description:"LMS, virtual labs, research, student portals" },
  healthcare:    { label:"Healthcare",          icon:"healthcare", color:"#10b981", description:"EMR/EHR, PACS imaging, clinical apps, HIPAA" },
  bfsi:          { label:"BFSI",                icon:"bfsi", color:"#6366f1", description:"Core banking, trading, risk analytics, compliance" },
  transport:     { label:"Transport",           icon:"transport", color:"#f59e0b", description:"Fleet mgmt, logistics, traffic analytics, IoT" },
  manufacturing: { label:"Manufacturing",       icon:"manufacturing", color:"#84cc16", description:"MES, SCADA, ERP/SAP HANA, predictive maintenance" },
  research:      { label:"Research / HPC",      icon:"research", color:"#a855f7", description:"AI/ML training, genomics, CFD simulation" },
  smb:           { label:"SMB",                 icon:"smb", color:"#06b6d4", description:"File/print, email, basic virtualization" },
  gaming:        { label:"Gaming",              icon:"gaming", color:"#ec4899", description:"Game servers, streaming, matchmaking, analytics" },
  design:        { label:"Design & Architecture",icon:"design", color:"#f43f5e", description:"CAD/BIM, rendering, VFX, visualization" },
} as const;

export type SegmentKey = keyof typeof SEGMENTS;
