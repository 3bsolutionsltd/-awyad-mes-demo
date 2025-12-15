export const mockData = {
    "thematicAreas": [
        {
            "id": "TA-001",
            "code": "RESULT 2",
            "name": "Local partners effectively respond to GBV and prot...",
            "description": "Local partners effectively respond to GBV and protection risks among new arrivals appropriate to their age, gender, and disability.",
            "indicators": [
                "IND-001",
                "IND-002",
                "IND-003",
                "IND-004",
                "IND-005"
            ]
        },
        {
            "id": "TA-002",
            "code": "RESULT 3",
            "name": "Local partners effectively respond to Child Protec...",
            "description": "Local partners effectively respond to Child Protection risks among new arrivals appropriate to their age, gender, and disability",
            "indicators": [
                "IND-006",
                "IND-007",
                "IND-008",
                "IND-009",
                "IND-010",
                "IND-011"
            ]
        }
    ],
    "projects": [
        {
            "id": "PRJ-001",
            "name": "GBV Response and Protection",
            "donor": "UNFPA",
            "thematicAreaId": "TA-001",
            "status": "Active",
            "startDate": "2024-01-15",
            "endDate": "2025-12-31",
            "budget": 500000,
            "expenditure": 312500,
            "burnRate": 62.5,
            "locations": [
                "Nakivale",
                "Kampala",
                "Nyakabande"
            ]
        },
        {
            "id": "PRJ-002",
            "name": "Child Protection Program",
            "donor": "UNICEF",
            "thematicAreaId": "TA-002",
            "status": "Active",
            "startDate": "2024-03-01",
            "endDate": "2026-02-28",
            "budget": 420000,
            "expenditure": 158200,
            "burnRate": 37.7,
            "locations": [
                "Nakivale",
                "Kampala"
            ]
        }
    ],
    "indicators": [
        {
            "id": "IND-001",
            "code": "I.2.1",
            "name": "Indicator 1 Number of survivors who receive an appropriate response to GBV",
            "thematicAreaId": "TA-001",
            "type": "Outcome",
            "baseline": 0,
            "baselineDate": "2024-01-01",
            "lopTarget": 550,
            "achieved": 467,
            "annualTarget": 550,
            "unit": "Individuals",
            "q1Target": 137,
            "q2Target": 137,
            "q3Target": 137,
            "q4Target": 137,
            "projectId": "PRJ-001"
        },
        {
            "id": "IND-002",
            "code": "I.2.2",
            "name": "Indicator 2  Number of participants showing an increased knowledge on the protection subject in focus",
            "thematicAreaId": "TA-001",
            "type": "Outcome",
            "baseline": 0,
            "baselineDate": "2024-01-01",
            "lopTarget": 130,
            "achieved": 97,
            "annualTarget": 130,
            "unit": "Individuals",
            "q1Target": 32,
            "q2Target": 32,
            "q3Target": 32,
            "q4Target": 32,
            "projectId": "PRJ-002"
        },
        {
            "id": "IND-003",
            "code": "I.2.3",
            "name": "Indicator 3 Number of persons effectively referred to other specialised service or assistance providers",
            "thematicAreaId": "TA-001",
            "type": "Outcome",
            "baseline": 0,
            "baselineDate": "2024-01-01",
            "lopTarget": 550,
            "achieved": 0,
            "annualTarget": 550,
            "unit": "Individuals",
            "q1Target": 137,
            "q2Target": 137,
            "q3Target": 137,
            "q4Target": 137,
            "projectId": "PRJ-002"
        },
        {
            "id": "IND-004",
            "code": "I.2.4",
            "name": "Indicator 4 Number of persons with increased/appropriate information on relevant rights and/or entitlements",
            "thematicAreaId": "TA-001",
            "type": "Outcome",
            "baseline": 0,
            "baselineDate": "2024-01-01",
            "lopTarget": 25,
            "achieved": 48,
            "annualTarget": 25,
            "unit": "Individuals",
            "q1Target": 6,
            "q2Target": 6,
            "q3Target": 6,
            "q4Target": 6,
            "projectId": "PRJ-002"
        },
        {
            "id": "IND-005",
            "code": "I.2.5",
            "name": "Indicator 5 Percentage of women and girls with specific protection needs (e.g., survivors of gender-based violence, persons with disabilities, pregnant or lactating women) who report feeling safe and supported after accessing services at the women and girls safe spaces.",
            "thematicAreaId": "TA-001",
            "type": "Outcome",
            "baseline": 0,
            "baselineDate": "2024-01-01",
            "lopTarget": 4500,
            "achieved": 0,
            "annualTarget": 4500,
            "unit": "Individuals",
            "q1Target": 1125,
            "q2Target": 1125,
            "q3Target": 1125,
            "q4Target": 1125,
            "projectId": "PRJ-001"
        },
        {
            "id": "IND-006",
            "code": "I.3.1",
            "name": "Indicator 1: Number of persons who receive an appropriate response",
            "thematicAreaId": "TA-002",
            "type": "Outcome",
            "baseline": 0,
            "baselineDate": "2024-01-01",
            "lopTarget": 1350,
            "achieved": 429,
            "annualTarget": 1350,
            "unit": "Individuals",
            "q1Target": 337,
            "q2Target": 337,
            "q3Target": 337,
            "q4Target": 337,
            "projectId": "PRJ-002"
        },
        {
            "id": "IND-007",
            "code": "I.3.2",
            "name": "Indicator 2: Number of unaccompanied and/or separated children who are reunited with their caregivers OR in appropriate protective  arrangements based on BIA.",
            "thematicAreaId": "TA-002",
            "type": "Outcome",
            "baseline": 0,
            "baselineDate": "2024-01-01",
            "lopTarget": 10,
            "achieved": 70,
            "annualTarget": 10,
            "unit": "Individuals",
            "q1Target": 2,
            "q2Target": 2,
            "q3Target": 2,
            "q4Target": 2,
            "projectId": "PRJ-002"
        },
        {
            "id": "IND-008",
            "code": "I.3.3",
            "name": "Indicator 3:  Number of participants showing an increased knowledge on the protection subject in focus.",
            "thematicAreaId": "TA-002",
            "type": "Outcome",
            "baseline": 0,
            "baselineDate": "2024-01-01",
            "lopTarget": 150,
            "achieved": 150,
            "annualTarget": 150,
            "unit": "Individuals",
            "q1Target": 37,
            "q2Target": 37,
            "q3Target": 37,
            "q4Target": 37,
            "projectId": "PRJ-002"
        },
        {
            "id": "IND-009",
            "code": "I.3.4",
            "name": "Indicator 4:  Number of parents, caregivers, foster families, and community stakeholders who receive training, guidance and support to address child protection concerns",
            "thematicAreaId": "TA-002",
            "type": "Outcome",
            "baseline": 0,
            "baselineDate": "2024-01-01",
            "lopTarget": 350,
            "achieved": 866,
            "annualTarget": 350,
            "unit": "Individuals",
            "q1Target": 87,
            "q2Target": 87,
            "q3Target": 87,
            "q4Target": 87,
            "projectId": "PRJ-002"
        },
        {
            "id": "IND-010",
            "code": "I.3.5",
            "name": "Indicator 5:  Number of functional community action plans developed by communities to address specific CP concerns in their communities.",
            "thematicAreaId": "TA-002",
            "type": "Outcome",
            "baseline": 0,
            "baselineDate": "2024-01-01",
            "lopTarget": 2,
            "achieved": 2,
            "annualTarget": 2,
            "unit": "Individuals",
            "q1Target": 0,
            "q2Target": 0,
            "q3Target": 0,
            "q4Target": 0,
            "projectId": "PRJ-002"
        },
        {
            "id": "IND-011",
            "code": "I.3.6",
            "name": "Indicator 6:  Number of children and parents/ caregiver who have been reached by environmental conservation initiatives by the end of the intervention compared to the beginning.",
            "thematicAreaId": "TA-002",
            "type": "Outcome",
            "baseline": 0,
            "baselineDate": "2024-01-01",
            "lopTarget": 2800,
            "achieved": 2168,
            "annualTarget": 2800,
            "unit": "Individuals",
            "q1Target": 700,
            "q2Target": 700,
            "q3Target": 700,
            "q4Target": 700,
            "projectId": "PRJ-002"
        }
    ],
    "activities": [
        {
            "id": "ACT-001",
            "activityCode": "3.2.1",
            "name": "Conduct SASA community Assessment to inform roll out of Support Phase",
            "indicatorId": "IND-001",
            "projectId": "PRJ-001",
            "target": 1,
            "achieved": 0,
            "status": "Pending",
            "date": "2025-01-15",
            "location": "Nakivale, Kampala",
            "reportedBy": "Field Officer",
            "approvalStatus": "Pending Review",
            "budget": 100,
            "expenditure": 0,
            "disaggregation": {
                "refugee": {
                    "male": {
                        "0-4": 0,
                        "5-17": 0,
                        "18-49": 0,
                        "50+": 0
                    },
                    "female": {
                        "0-4": 0,
                        "5-17": 0,
                        "18-49": 0,
                        "50+": 0
                    }
                },
                "host": {
                    "male": {
                        "0-4": 0,
                        "5-17": 0,
                        "18-49": 0,
                        "50+": 0
                    },
                    "female": {
                        "0-4": 0,
                        "5-17": 0,
                        "18-49": 0,
                        "50+": 0
                    }
                }
            },
            "beneficiaries": {
                "maleRefugee": 0,
                "femaleRefugee": 0,
                "maleHost": 0,
                "femaleHost": 0
            },
            "nationality": {
                "sudanese": 0,
                "congolese": 0,
                "southSudanese": 0,
                "others": 0
            }
        },
        {
            "id": "ACT-002",
            "activityCode": "3.2.3",
            "name": "Support selected CSOs and community structures in implementing evidence-based SASA approach",
            "indicatorId": "IND-002",
            "projectId": "PRJ-001",
            "target": 50,
            "achieved": 480,
            "status": "Completed",
            "date": "2025-01-15",
            "location": "Nakivale, Kampala",
            "reportedBy": "Field Officer",
            "approvalStatus": "Approved",
            "budget": 5000,
            "expenditure": 40800,
            "disaggregation": {
                "refugee": {
                    "male": {
                        "0-4": 28,
                        "5-17": 72,
                        "18-49": 144,
                        "50+": 43
                    },
                    "female": {
                        "0-4": 28,
                        "5-17": 86,
                        "18-49": 129,
                        "50+": 43
                    }
                },
                "host": {
                    "male": {
                        "0-4": 15,
                        "5-17": 42,
                        "18-49": 105,
                        "50+": 28
                    },
                    "female": {
                        "0-4": 15,
                        "5-17": 48,
                        "18-49": 99,
                        "50+": 28
                    }
                }
            },
            "beneficiaries": {
                "maleRefugee": 287,
                "femaleRefugee": 286,
                "maleHost": 190,
                "femaleHost": 190
            },
            "nationality": {
                "sudanese": 257,
                "congolese": 171,
                "southSudanese": 114,
                "others": 28
            }
        },
        {
            "id": "ACT-003",
            "activityCode": "3.2.4",
            "name": "Conduct social sensitization on positive masculinities and parenting",
            "indicatorId": "IND-004",
            "projectId": "PRJ-001",
            "target": 470,
            "achieved": 287,
            "status": "In Progress",
            "date": "2025-01-15",
            "location": "Nakivale, Kampala",
            "reportedBy": "Field Officer",
            "approvalStatus": "Pending Review",
            "budget": 47000,
            "expenditure": 24395,
            "disaggregation": {
                "refugee": {
                    "male": {
                        "0-4": 17,
                        "5-17": 43,
                        "18-49": 86,
                        "50+": 25
                    },
                    "female": {
                        "0-4": 17,
                        "5-17": 51,
                        "18-49": 77,
                        "50+": 25
                    }
                },
                "host": {
                    "male": {
                        "0-4": 9,
                        "5-17": 25,
                        "18-49": 62,
                        "50+": 17
                    },
                    "female": {
                        "0-4": 9,
                        "5-17": 28,
                        "18-49": 59,
                        "50+": 17
                    }
                }
            },
            "beneficiaries": {
                "maleRefugee": 171,
                "femaleRefugee": 170,
                "maleHost": 113,
                "femaleHost": 113
            },
            "nationality": {
                "sudanese": 153,
                "congolese": 102,
                "southSudanese": 68,
                "others": 17
            }
        },
        {
            "id": "ACT-004",
            "activityCode": "3.2.5",
            "name": "Engage and train refugee welfare committee members on GBV",
            "indicatorId": "IND-002",
            "projectId": "PRJ-001",
            "target": 201,
            "achieved": 58,
            "status": "Pending",
            "date": "2025-01-15",
            "location": "Nakivale, Kampala",
            "reportedBy": "Field Officer",
            "approvalStatus": "Pending Review",
            "budget": 20100,
            "expenditure": 4930,
            "disaggregation": {
                "refugee": {
                    "male": {
                        "0-4": 3,
                        "5-17": 8,
                        "18-49": 17,
                        "50+": 5
                    },
                    "female": {
                        "0-4": 3,
                        "5-17": 10,
                        "18-49": 15,
                        "50+": 5
                    }
                },
                "host": {
                    "male": {
                        "0-4": 1,
                        "5-17": 5,
                        "18-49": 12,
                        "50+": 3
                    },
                    "female": {
                        "0-4": 1,
                        "5-17": 5,
                        "18-49": 11,
                        "50+": 3
                    }
                }
            },
            "beneficiaries": {
                "maleRefugee": 33,
                "femaleRefugee": 33,
                "maleHost": 21,
                "femaleHost": 20
            },
            "nationality": {
                "sudanese": 29,
                "congolese": 19,
                "southSudanese": 13,
                "others": 3
            }
        },
        {
            "id": "ACT-005",
            "activityCode": "3.2.6",
            "name": "Engage and train religious and cultural leaders on GBV prevention",
            "indicatorId": "IND-004",
            "projectId": "PRJ-001",
            "target": 50,
            "achieved": 53,
            "status": "Completed",
            "date": "2025-01-15",
            "location": "Nakivale, Kampala",
            "reportedBy": "Field Officer",
            "approvalStatus": "Approved",
            "budget": 5000,
            "expenditure": 4505,
            "disaggregation": {
                "refugee": {
                    "male": {
                        "0-4": 3,
                        "5-17": 7,
                        "18-49": 15,
                        "50+": 4
                    },
                    "female": {
                        "0-4": 3,
                        "5-17": 9,
                        "18-49": 13,
                        "50+": 4
                    }
                },
                "host": {
                    "male": {
                        "0-4": 1,
                        "5-17": 4,
                        "18-49": 11,
                        "50+": 3
                    },
                    "female": {
                        "0-4": 1,
                        "5-17": 5,
                        "18-49": 10,
                        "50+": 3
                    }
                }
            },
            "beneficiaries": {
                "maleRefugee": 29,
                "femaleRefugee": 29,
                "maleHost": 19,
                "femaleHost": 19
            },
            "nationality": {
                "sudanese": 26,
                "congolese": 17,
                "southSudanese": 11,
                "others": 2
            }
        },
        {
            "id": "ACT-006",
            "activityCode": "3.2.7",
            "name": "Commemorate international events (IWD, World Refugee Day, 16 Days)",
            "indicatorId": "IND-001",
            "projectId": "PRJ-001",
            "target": 4,
            "achieved": 302,
            "status": "Completed",
            "date": "2025-01-15",
            "location": "Nakivale, Kampala",
            "reportedBy": "Field Officer",
            "approvalStatus": "Approved",
            "budget": 400,
            "expenditure": 25670,
            "disaggregation": {
                "refugee": {
                    "male": {
                        "0-4": 18,
                        "5-17": 45,
                        "18-49": 90,
                        "50+": 27
                    },
                    "female": {
                        "0-4": 18,
                        "5-17": 54,
                        "18-49": 81,
                        "50+": 27
                    }
                },
                "host": {
                    "male": {
                        "0-4": 9,
                        "5-17": 26,
                        "18-49": 66,
                        "50+": 18
                    },
                    "female": {
                        "0-4": 9,
                        "5-17": 30,
                        "18-49": 62,
                        "50+": 18
                    }
                }
            },
            "beneficiaries": {
                "maleRefugee": 180,
                "femaleRefugee": 180,
                "maleHost": 119,
                "femaleHost": 119
            },
            "nationality": {
                "sudanese": 162,
                "congolese": 108,
                "southSudanese": 72,
                "others": 18
            }
        },
        {
            "id": "ACT-007",
            "activityCode": "3.2.8",
            "name": "Strengthen community policing for women and girls safety",
            "indicatorId": "IND-003",
            "projectId": "PRJ-001",
            "target": 5,
            "achieved": 229,
            "status": "Completed",
            "date": "2025-01-15",
            "location": "Nakivale, Kampala",
            "reportedBy": "Field Officer",
            "approvalStatus": "Approved",
            "budget": 500,
            "expenditure": 19465,
            "disaggregation": {
                "refugee": {
                    "male": {
                        "0-4": 13,
                        "5-17": 34,
                        "18-49": 68,
                        "50+": 20
                    },
                    "female": {
                        "0-4": 13,
                        "5-17": 41,
                        "18-49": 61,
                        "50+": 20
                    }
                },
                "host": {
                    "male": {
                        "0-4": 7,
                        "5-17": 20,
                        "18-49": 50,
                        "50+": 13
                    },
                    "female": {
                        "0-4": 7,
                        "5-17": 22,
                        "18-49": 47,
                        "50+": 13
                    }
                }
            },
            "beneficiaries": {
                "maleRefugee": 135,
                "femaleRefugee": 135,
                "maleHost": 90,
                "femaleHost": 89
            },
            "nationality": {
                "sudanese": 121,
                "congolese": 81,
                "southSudanese": 54,
                "others": 13
            }
        },
        {
            "id": "ACT-008",
            "activityCode": "3.3.1",
            "name": "Support out-of-school girls with non-formal skills training",
            "indicatorId": "IND-005",
            "projectId": "PRJ-001",
            "target": 80,
            "achieved": 99,
            "status": "Completed",
            "date": "2025-01-15",
            "location": "Nakivale, Kampala",
            "reportedBy": "Field Officer",
            "approvalStatus": "Approved",
            "budget": 8000,
            "expenditure": 8415,
            "disaggregation": {
                "refugee": {
                    "male": {
                        "0-4": 5,
                        "5-17": 14,
                        "18-49": 29,
                        "50+": 8
                    },
                    "female": {
                        "0-4": 5,
                        "5-17": 17,
                        "18-49": 26,
                        "50+": 8
                    }
                },
                "host": {
                    "male": {
                        "0-4": 3,
                        "5-17": 8,
                        "18-49": 21,
                        "50+": 5
                    },
                    "female": {
                        "0-4": 3,
                        "5-17": 9,
                        "18-49": 20,
                        "50+": 5
                    }
                }
            },
            "beneficiaries": {
                "maleRefugee": 56,
                "femaleRefugee": 56,
                "maleHost": 37,
                "femaleHost": 37
            },
            "nationality": {
                "sudanese": 50,
                "congolese": 33,
                "southSudanese": 22,
                "others": 5
            }
        },
        {
            "id": "ACT-009",
            "activityCode": "4.1.1",
            "name": "Support case management response interventions (PEP, case conferencing)",
            "indicatorId": "IND-001",
            "projectId": "PRJ-001",
            "target": 300,
            "achieved": 48,
            "status": "Pending",
            "date": "2025-01-15",
            "location": "Nakivale, Kampala",
            "reportedBy": "Field Officer",
            "approvalStatus": "Pending Review",
            "budget": 30000,
            "expenditure": 4080,
            "disaggregation": {
                "refugee": {
                    "male": {
                        "0-4": 2,
                        "5-17": 7,
                        "18-49": 14,
                        "50+": 4
                    },
                    "female": {
                        "0-4": 2,
                        "5-17": 8,
                        "18-49": 12,
                        "50+": 4
                    }
                },
                "host": {
                    "male": {
                        "0-4": 1,
                        "5-17": 4,
                        "18-49": 10,
                        "50+": 2
                    },
                    "female": {
                        "0-4": 1,
                        "5-17": 4,
                        "18-49": 9,
                        "50+": 2
                    }
                }
            },
            "beneficiaries": {
                "maleRefugee": 27,
                "femaleRefugee": 26,
                "maleHost": 17,
                "femaleHost": 16
            },
            "nationality": {
                "sudanese": 23,
                "congolese": 15,
                "southSudanese": 10,
                "others": 2
            }
        },
        {
            "id": "ACT-010",
            "activityCode": "4.1.5",
            "name": "Provide multisectoral support to GBV survivors through referrals",
            "indicatorId": "IND-003",
            "projectId": "PRJ-001",
            "target": 300,
            "achieved": 51,
            "status": "Pending",
            "date": "2025-01-15",
            "location": "Nakivale, Kampala",
            "reportedBy": "Field Officer",
            "approvalStatus": "Pending Review",
            "budget": 30000,
            "expenditure": 4335,
            "disaggregation": {
                "refugee": {
                    "male": {
                        "0-4": 3,
                        "5-17": 7,
                        "18-49": 15,
                        "50+": 4
                    },
                    "female": {
                        "0-4": 3,
                        "5-17": 9,
                        "18-49": 13,
                        "50+": 4
                    }
                },
                "host": {
                    "male": {
                        "0-4": 1,
                        "5-17": 4,
                        "18-49": 11,
                        "50+": 3
                    },
                    "female": {
                        "0-4": 1,
                        "5-17": 5,
                        "18-49": 10,
                        "50+": 3
                    }
                }
            },
            "beneficiaries": {
                "maleRefugee": 29,
                "femaleRefugee": 29,
                "maleHost": 19,
                "femaleHost": 19
            },
            "nationality": {
                "sudanese": 26,
                "congolese": 17,
                "southSudanese": 11,
                "others": 2
            }
        }
    ],
    "caseManagement": [
        {
            "id": "CASE-001",
            "caseNumber": "GBV-NK-2025-001",
            "type": "Sexual Assault",
            "projectId": "PRJ-001",
            "dateReported": "2025-01-10",
            "followUpDate": "2025-02-15",
            "status": "Active",
            "location": "Nakivale",
            "beneficiaryGender": "Female",
            "beneficiaryAge": 28,
            "nationality": "Sudanese",
            "caseWorker": "Jane Doe",
            "services": [
                "Psychosocial Support",
                "Medical Care",
                "Legal Aid"
            ]
        },
        {
            "id": "CASE-002",
            "caseNumber": "GBV-KLA-2025-002",
            "type": "Domestic Violence",
            "projectId": "PRJ-001",
            "dateReported": "2025-01-12",
            "closedDate": "2025-01-20",
            "dateClosed": "2025-01-20",
            "status": "Closed",
            "location": "Kampala",
            "beneficiaryGender": "Female",
            "beneficiaryAge": 35,
            "nationality": "Congolese",
            "caseWorker": "John Smith",
            "services": [
                "Psychosocial Support",
                "Safety Planning"
            ]
        },
        {
            "id": "CASE-003",
            "caseNumber": "CP-NK-2025-003",
            "type": "Child Protection",
            "projectId": "PRJ-002",
            "dateReported": "2025-01-08",
            "followUpDate": "2025-02-10",
            "status": "Active",
            "location": "Nakivale",
            "beneficiaryGender": "Male",
            "beneficiaryAge": 12,
            "nationality": "South Sudanese",
            "caseWorker": "Sarah Johnson",
            "services": [
                "Case Management",
                "Family Reunification"
            ]
        }
    ],
    "users": [
        {
            "id": "USR-001",
            "name": "Admin User",
            "role": "Administrator",
            "email": "admin@awyad.org"
        }
    ]
};
