export const SEGMENTS = {
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
} as const;

export type SegmentKey = keyof typeof SEGMENTS;
