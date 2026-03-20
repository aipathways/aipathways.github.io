const occupations = [
  {
    id: "bookkeeping-accounting-clerks",
    title: "Bookkeeping, Accounting, and Auditing Clerks",
    soc: "43-3031",
    exposure: "High",
    summary: "Routine clerical, reconciliation, and data-entry tasks create relatively high AI exposure.",
    laborMarket: {
      medianWage: "$48,300",
      annualOpenings: "1,240",
      employment: "18,600",
      projectedGrowth: "2%",
      typicalEducation: "High school diploma / some college"
    },
    relatedOccupationIds: ["payroll-timekeeping-clerks", "insurance-claims-clerks", "billing-posting-calculating-machines"],
    training: []
  },
  {
    id: "customer-service-representatives",
    title: "Customer Service Representatives",
    soc: "43-4051",
    exposure: "High",
    summary: "Scripted communications and information retrieval tasks may be heavily augmented by AI tools.",
    laborMarket: {
      medianWage: "$41,900",
      annualOpenings: "4,520",
      employment: "55,200",
      projectedGrowth: "1%",
      typicalEducation: "High school diploma"
    },
    relatedOccupationIds: ["sales-representatives-services-all-other", "eligibility-interviewers-government-programs", "training-development-specialists"],
    training: []
  },
  {
    id: "executive-secretaries",
    title: "Executive Secretaries and Executive Administrative Assistants",
    soc: "43-6011",
    exposure: "High",
    summary: "Scheduling, drafting, documentation, and meeting support activities are exposed to generative AI tools.",
    laborMarket: {
      medianWage: "$59,500",
      annualOpenings: "620",
      employment: "7,100",
      projectedGrowth: "-1%",
      typicalEducation: "High school diploma / associate degree"
    },
    relatedOccupationIds: ["project-management-specialists", "human-resources-specialists", "training-development-specialists"],
    training: []
  },
  {
    id: "payroll-timekeeping-clerks",
    title: "Payroll and Timekeeping Clerks",
    soc: "43-3051",
    exposure: "Medium",
    summary: "Processing tasks remain exposed, though compliance and exception handling create some resilience.",
    laborMarket: {
      medianWage: "$51,400",
      annualOpenings: "430",
      employment: "4,900",
      projectedGrowth: "3%",
      typicalEducation: "High school diploma / certificate"
    },
    relatedOccupationIds: [],
    training: [
      {
        provider: "Mesa Community College",
        program: "Accounting Certificate",
        cip: "52.0302",
        award: "Certificate",
        location: "Mesa, AZ"
      },
      {
        provider: "Pima Community College",
        program: "Bookkeeping Technician",
        cip: "52.0302",
        award: "Certificate",
        location: "Tucson, AZ"
      }
    ]
  },
  {
    id: "insurance-claims-clerks",
    title: "Insurance Claims and Policy Processing Clerks",
    soc: "43-9041",
    exposure: "Medium",
    summary: "Document review can be automated, but exception handling and regulated processes still require human review.",
    laborMarket: {
      medianWage: "$46,100",
      annualOpenings: "280",
      employment: "3,200",
      projectedGrowth: "2%",
      typicalEducation: "High school diploma / certificate"
    },
    relatedOccupationIds: [],
    training: [
      {
        provider: "Rio Salado College",
        program: "Insurance Studies",
        cip: "52.1701",
        award: "Certificate",
        location: "Tempe, AZ"
      }
    ]
  },
  {
    id: "billing-posting-calculating-machines",
    title: "Billing and Posting Clerks",
    soc: "43-3021",
    exposure: "Low",
    summary: "Still exposed to automation, but some roles shift into coordination and exception-based workflows.",
    laborMarket: {
      medianWage: "$45,700",
      annualOpenings: "710",
      employment: "9,100",
      projectedGrowth: "4%",
      typicalEducation: "High school diploma / certificate"
    },
    relatedOccupationIds: [],
    training: [
      {
        provider: "GateWay Community College",
        program: "Business Operations Support",
        cip: "52.0101",
        award: "Certificate",
        location: "Phoenix, AZ"
      }
    ]
  },
  {
    id: "sales-representatives-services-all-other",
    title: "Sales Representatives, Services, All Other",
    soc: "41-3099",
    exposure: "Medium",
    summary: "Human relationship-building and consultative communication can reduce direct replacement risk.",
    laborMarket: {
      medianWage: "$63,400",
      annualOpenings: "1,180",
      employment: "12,300",
      projectedGrowth: "6%",
      typicalEducation: "High school diploma / bachelor’s"
    },
    relatedOccupationIds: [],
    training: [
      {
        provider: "Estrella Mountain Community College",
        program: "Business and Organizational Management",
        cip: "52.0201",
        award: "Associate",
        location: "Avondale, AZ"
      }
    ]
  },
  {
    id: "eligibility-interviewers-government-programs",
    title: "Eligibility Interviewers, Government Programs",
    soc: "43-4061",
    exposure: "Low",
    summary: "The role blends administrative review with sensitive client interaction and case judgment.",
    laborMarket: {
      medianWage: "$49,800",
      annualOpenings: "350",
      employment: "4,000",
      projectedGrowth: "5%",
      typicalEducation: "High school diploma / associate degree"
    },
    relatedOccupationIds: [],
    training: [
      {
        provider: "Arizona Western College",
        program: "Human Services",
        cip: "44.0000",
        award: "Associate",
        location: "Yuma, AZ"
      }
    ]
  },
  {
    id: "training-development-specialists",
    title: "Training and Development Specialists",
    soc: "13-1151",
    exposure: "Low",
    summary: "AI can support content creation, but facilitation, employer engagement, and instructional adaptation remain human-centered.",
    laborMarket: {
      medianWage: "$64,700",
      annualOpenings: "840",
      employment: "9,800",
      projectedGrowth: "9%",
      typicalEducation: "Bachelor’s degree"
    },
    relatedOccupationIds: [],
    training: [
      {
        provider: "Arizona State University",
        program: "Learning Design and Technologies",
        cip: "13.0501",
        award: "Bachelor’s / Graduate",
        location: "Tempe, AZ"
      },
      {
        provider: "Northern Arizona University",
        program: "Workforce Development and Training",
        cip: "13.9999",
        award: "Certificate",
        location: "Flagstaff, AZ"
      }
    ]
  },
  {
    id: "project-management-specialists",
    title: "Project Management Specialists",
    soc: "13-1082",
    exposure: "Low",
    summary: "AI can streamline planning artifacts, but cross-functional coordination, stakeholder management, and judgment remain central.",
    laborMarket: {
      medianWage: "$79,200",
      annualOpenings: "2,100",
      employment: "24,900",
      projectedGrowth: "8%",
      typicalEducation: "Bachelor’s degree"
    },
    relatedOccupationIds: [],
    training: [
      {
        provider: "University of Arizona",
        program: "Project Management Certificate",
        cip: "52.0211",
        award: "Certificate",
        location: "Tucson, AZ"
      },
      {
        provider: "Scottsdale Community College",
        program: "Project Management",
        cip: "52.0211",
        award: "Certificate",
        location: "Scottsdale, AZ"
      }
    ]
  },
  {
    id: "human-resources-specialists",
    title: "Human Resources Specialists",
    soc: "13-1071",
    exposure: "Low",
    summary: "Administrative pieces can be automated, but employee relations, recruiting nuance, and compliance interpretation preserve demand.",
    laborMarket: {
      medianWage: "$62,900",
      annualOpenings: "1,020",
      employment: "11,200",
      projectedGrowth: "7%",
      typicalEducation: "Bachelor’s degree"
    },
    relatedOccupationIds: [],
    training: [
      {
        provider: "Phoenix College",
        program: "Human Resources Management",
        cip: "52.1001",
        award: "Certificate",
        location: "Phoenix, AZ"
      }
    ]
  }
];
